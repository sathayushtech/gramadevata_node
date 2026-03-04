import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/sequelize';
import { AddMoreBloodBank } from './add-more-blood-bank.model';
import { BloodBank } from './blood-bank.model';
import { Register } from '../auth/user.model';
import { Op } from 'sequelize';
import {
  formatDjangoDateTime,
  saveEntityImagesToAzure,
  sendAdminEmail,
} from '../../common/utils/gramadevata.utils';

export type AddMoreBloodBankResponse = Record<string, unknown>;

@Injectable()
export class AddMoreBloodBankService {
  constructor(
    @InjectModel(AddMoreBloodBank)
    private readonly addMoreModel: typeof AddMoreBloodBank,
    @InjectModel(BloodBank)
    private readonly bloodBankModel: typeof BloodBank,
    @InjectModel(Register)
    private readonly registerModel: typeof Register,
    private readonly configService: ConfigService,
  ) {}

  /* ------------------------------------------------------------------ */
  /*  LIST (GET /)                                                       */
  /* ------------------------------------------------------------------ */
  async list(): Promise<AddMoreBloodBankResponse[]> {
    const rows = await this.addMoreModel.findAll({
      order: [['createdAt', 'DESC']],
    });
    return rows.map((row) => this.toResponse(row));
  }

  /* ------------------------------------------------------------------ */
  /*  RETRIEVE (GET /:id)                                                */
  /* ------------------------------------------------------------------ */
  async getById(id: string): Promise<AddMoreBloodBankResponse | null> {
    const instance = await this.addMoreModel.findByPk(id);
    return instance ? this.toResponse(instance) : null;
  }

  /* ------------------------------------------------------------------ */
  /*  CREATE (POST /) — matches Django AddMoreBloodBankViewSet.create     */
  /* ------------------------------------------------------------------ */
  async create(
    payload: Record<string, unknown>,
    user?: { email?: string; contact_number?: string; id?: string; is_member?: string },
  ): Promise<{ status: number; body: Record<string, unknown> }> {
    try {
      // Resolve user by email or contact_number
      const email = user?.email;
      const contactNumber = user?.contact_number;
      const userId = typeof payload.user_id === 'string' ? payload.user_id : user?.id;

      if (email || contactNumber) {
        const conditions: any[] = [];
        if (email) conditions.push({ email });
        if (contactNumber) conditions.push({ contactNumber });

        const registerInstance = await this.registerModel.findOne({
          where: { [Op.or]: conditions },
        });

        if (!registerInstance) {
          return { status: 404, body: { message: 'User not found.' } };
        }

        const isMember = (registerInstance as any).isMember;
        if (isMember === 'false' || isMember === false) {
          return {
            status: 200,
            body: { message: 'Cannot add more details. Membership details are required.' },
          };
        }
      }

      // Parse image_location
      const imageLocations = this.parseList(payload.image_location);

      // Create record
      const created = await this.addMoreModel.create({
        ...(typeof payload._id === 'string' && payload._id.trim()
          ? { id: payload._id.trim() }
          : {}),
        ...(typeof payload.blood_bank_id === 'string'
          ? { bloodBankId: payload.blood_bank_id }
          : {}),
        ...(userId ? { userId } : {}),
        ...(typeof payload.desc === 'string' ? { desc: payload.desc } : {}),
        imageLocation: [],
        ...(typeof payload.license_copy === 'string'
          ? { licenseCopy: payload.license_copy }
          : {}),
        ...(typeof payload.status === 'string'
          ? { status: payload.status }
          : {}),
        createdAt: new Date(),
      } as any);

      // Upload images to Azure
      const bloodBankName = await this.resolveBloodBankName(created.bloodBankId);
      const savedImages: string[] = [];
      for (const image of imageLocations) {
        if (image && image !== 'null') {
          const saved = await saveEntityImagesToAzure({
            configService: this.configService,
            images: [image],
            id: String(created.id),
            name: bloodBankName,
            entityType: 'blood_bank',
          });
          savedImages.push(...saved);
        }
      }

      if (savedImages.length) {
        created.imageLocation = savedImages;
        await created.save();
      }

      // Send admin email
      await sendAdminEmail(this.configService, {
        subject: 'Added More Blood Bank Details',
        text:
          `User ID: ${userId ?? 'Anonymous'}\n` +
          `Created Time: ${formatDjangoDateTime(new Date())}\n` +
          `Blood Bank ID: ${created.bloodBankId ?? ''}`,
        recipients: [
          this.configService.get<string>('DEFAULT_FROM_EMAIL'),
        ].filter(
          (e): e is string => typeof e === 'string' && e.trim().length > 0,
        ),
      });

      return {
        status: 201,
        body: { message: 'success', result: this.toResponse(created) },
      };
    } catch (error: any) {
      return {
        status: 500,
        body: {
          message: 'An error occurred.',
          error: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }

  /* ------------------------------------------------------------------ */
  /*  UPDATE (PUT / PATCH /:id)                                          */
  /* ------------------------------------------------------------------ */
  async update(
    id: string,
    payload: Record<string, unknown>,
  ): Promise<AddMoreBloodBankResponse | null> {
    const instance = await this.addMoreModel.findByPk(id);
    if (!instance) return null;

    await instance.update({
      ...(typeof payload.blood_bank_id === 'string'
        ? { bloodBankId: payload.blood_bank_id }
        : {}),
      ...(typeof payload.user_id === 'string'
        ? { userId: payload.user_id }
        : {}),
      ...(typeof payload.desc === 'string' ? { desc: payload.desc } : {}),
      ...(typeof payload.license_copy === 'string'
        ? { licenseCopy: payload.license_copy }
        : {}),
      ...(typeof payload.status === 'string'
        ? { status: payload.status }
        : {}),
      ...(payload.image_location !== undefined
        ? { imageLocation: this.parseList(payload.image_location) }
        : {}),
    } as any);

    return this.toResponse(instance);
  }

  /* ------------------------------------------------------------------ */
  /*  DESTROY (DELETE /:id)                                              */
  /* ------------------------------------------------------------------ */
  async remove(id: string): Promise<boolean> {
    const deleted = await this.addMoreModel.destroy({ where: { id } });
    return deleted > 0;
  }

  /* ------------------------------------------------------------------ */
  /*  Serializer — matches Django to_representation with image URLs       */
  /* ------------------------------------------------------------------ */
  private toResponse(row: AddMoreBloodBank): AddMoreBloodBankResponse {
    const plain = row.get({ plain: true }) as any;
    const imageLocations = this.parseList(plain.imageLocation);
    const resolvedImages = this.resolveFileUrls(imageLocations);

    return {
      _id: String(plain.id),
      blood_bank_id: plain.bloodBankId ?? null,
      user_id: plain.userId ?? null,
      desc: plain.desc ?? null,
      image_location: resolvedImages,
      license_copy: plain.licenseCopy ?? null,
      status: plain.status ?? null,
      created_at: plain.createdAt ?? null,
    };
  }

  /* ------------------------------------------------------------------ */
  /*  Helpers                                                            */
  /* ------------------------------------------------------------------ */
  private resolveFileUrls(paths: string[]): string[] {
    if (!paths.length) return [];
    const fileUrl = this.configService.get<string>('FILE_URL');
    if (!fileUrl) return paths;
    const base = fileUrl.endsWith('/') ? fileUrl : `${fileUrl}/`;
    return paths.map((p) => `${base}${p.startsWith('/') ? p.slice(1) : p}`);
  }

  private parseList(raw: unknown): string[] {
    if (!raw) return [];
    if (Array.isArray(raw)) {
      return raw
        .map((item) => String(item).trim())
        .filter((item) => item && item !== 'null');
    }
    if (typeof raw === 'string') {
      const trimmed = raw.trim();
      if (!trimmed || trimmed === 'null') return [];
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed
            .map((item) => String(item).trim())
            .filter((item) => item && item !== 'null');
        }
      } catch {
        /* ignore */
      }
      return trimmed
        .replace(/^[\[]|[\]]$/g, '')
        .split(',')
        .map((item) => item.replace(/['"]+/g, '').trim())
        .filter((item) => item && item !== 'null');
    }
    return [];
  }

  private async resolveBloodBankName(
    bloodBankId?: string,
  ): Promise<string> {
    if (!bloodBankId) return 'blood_bank';
    const bank = await this.bloodBankModel.findByPk(bloodBankId, {
      attributes: ['name'],
    });
    return bank?.name ?? 'blood_bank';
  }
}
