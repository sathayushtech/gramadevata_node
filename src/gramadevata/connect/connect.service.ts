import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/sequelize';
import type { CreationAttributes, WhereOptions } from 'sequelize';
import { Op } from 'sequelize';
import { Connect } from './connect.model';
import { Register as User } from '../auth/user.model';
import { Temple } from '../temple/temple.model';
import { Village } from '../villages/village.model';
import { MemberType } from '../../common/enums/member-type.enum';

type CreateResult = {
  status: number;
  body: Record<string, unknown>;
};

@Injectable()
export class ConnectService {
  constructor(
    @InjectModel(Connect)
    private readonly connectModel: typeof Connect,
    @InjectModel(User)
    private readonly userModel: typeof User,
    @InjectModel(Temple)
    private readonly templeModel: typeof Temple,
    @InjectModel(Village)
    private readonly villageModel: typeof Village,
    private readonly configService: ConfigService,
  ) {}

  async list(query: Record<string, string | undefined>) {
    const filters = this.buildFilters(query);

    const connections = await this.connectModel.findAll({
      where: filters,
      include: [
        { model: User, as: 'user' },
        { model: Temple, as: 'temple' },
        { model: Village, as: 'village' },
      ],
    });

    const villageConnections = connections.filter((item) => !item.templeId);
    const templeConnections = connections.filter((item) => !item.villageId);

    if (!connections.length) {
      return { status: 404, body: { message: 'Data not found', status: 404 } };
    }

    return {
      status: 200,
      body: {
        village_data: villageConnections.length,
        village: villageConnections.map((item) => this.toExpandedResponse(item)),
        temple_count: templeConnections.length,
        temple: templeConnections.map((item) => this.toExpandedResponse(item)),
      },
    };
  }

  async getById(id: string) {
    const record = await this.connectModel.findByPk(id, {
      include: [
        { model: User, as: 'user' },
        { model: Temple, as: 'temple' },
        { model: Village, as: 'village' },
      ],
    });

    if (!record) {
      return null;
    }

    return this.toExpandedResponse(record);
  }

  async create(payload: Record<string, unknown>, userPayload?: Record<string, unknown>): Promise<CreateResult> {
    try {
      const user = await this.resolveUser(payload, userPayload);
      if (!user) {
        return { status: 404, body: { message: 'User not found.' } };
      }

      const templeId = this.getId(payload.temple ?? payload.temple_id ?? payload.templeId);
      const villageId = this.getId(payload.village ?? payload.village_id ?? payload.villageId);

      if (villageId) {
        const village = await this.villageModel.findByPk(villageId);
        if (!village) {
          return { status: 404, body: { message: 'Village not found.' } };
        }

        const existingVillageCount = await this.connectModel.count({
          where: {
            userId: user.id,
            villageId: { [Op.not]: null } as unknown as string,
          } as WhereOptions<Connect>,
        });

        if (existingVillageCount >= 10) {
          return { status: 400, body: { error: 'You can connect to a maximum of 10 villages.' } };
        }

        const exists = await this.connectModel.findOne({
          where: { userId: user.id, villageId },
        });

        if (exists) {
          return { status: 400, body: { error: 'You are already connected to this village.' } };
        }
      }

      if (templeId) {
        const temple = await this.templeModel.findByPk(templeId);
        if (!temple) {
          return { status: 404, body: { message: 'Temple not found.' } };
        }

        const exists = await this.connectModel.findOne({
          where: { userId: user.id, templeId },
        });

        if (exists) {
          return { status: 400, body: { error: 'You are already connected to this temple.' } };
        }
      }

      const data = this.mapPayload(payload, user.id);
      const created = await this.connectModel.create(data);

      if (created.connectedAs === 'PUJARI') {
        await user.update({ type: MemberType.PUJARI } as Partial<User>);
      }

      const hydrated = await this.connectModel.findByPk(created.id, {
        include: [
          { model: User, as: 'user' },
          { model: Temple, as: 'temple' },
          { model: Village, as: 'village' },
        ],
      });

      return {
        status: 201,
        body: hydrated ? this.toExpandedResponse(hydrated) : this.toExpandedResponse(created),
      };
    } catch (error) {
      return {
        status: 500,
        body: {
          message: 'An error occurred.',
          error: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }

  async update(id: string, payload: Record<string, unknown>) {
    const record = await this.connectModel.findByPk(id, {
      include: [
        { model: User, as: 'user' },
        { model: Temple, as: 'temple' },
        { model: Village, as: 'village' },
      ],
    });

    if (!record) {
      return null;
    }

    const updateData = this.mapUpdatePayload(payload);
    if (Object.keys(updateData).length) {
      await record.update(updateData as CreationAttributes<Connect>);
    }

    return this.toExpandedResponse(record);
  }

  async remove(id: string, userPayload?: Record<string, unknown>) {
    const record = await this.connectModel.findByPk(id);
    if (!record) {
      return { status: 404, body: { error: 'Connection not found' } };
    }

    const requestUserId = this.getId(userPayload?.id ?? userPayload?.user_id);
    if (!requestUserId || record.userId !== requestUserId) {
      return { status: 403, body: { error: 'You are not authorized to delete this connection.' } };
    }

    await record.destroy();
    return { status: 204, body: { message: 'Connection deleted successfully.' } };
  }

  private buildFilters(query: Record<string, string | undefined>) {
    const filters: Record<string, string> = {};

    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined) {
        return;
      }

      switch (key) {
        case '_id':
        case 'id':
          filters.id = value;
          break;
        case 'user':
        case 'user_id':
          filters.userId = value;
          break;
        case 'temple':
        case 'temple_id':
          filters.templeId = value;
          break;
        case 'village':
        case 'village_id':
          filters.villageId = value;
          break;
        case 'connected_as':
          filters.connectedAs = value;
          break;
        default:
          break;
      }
    });

    return filters;
  }

  private mapPayload(payload: Record<string, unknown>, fallbackUserId?: string) {
    const id = this.getId(payload._id ?? payload.id);
    const userId = this.getId(payload.user ?? payload.user_id ?? payload.userId) ?? fallbackUserId;
    const templeId = this.getId(payload.temple ?? payload.temple_id ?? payload.templeId);
    const villageId = this.getId(payload.village ?? payload.village_id ?? payload.villageId);

    const data: CreationAttributes<Connect> = {
      id,
      userId: userId ?? null,
      templeId: templeId ?? null,
      villageId: villageId ?? null,
      description: typeof payload.description === 'string' ? payload.description : null,
      connectedAs: typeof payload.connected_as === 'string'
        ? payload.connected_as
        : typeof payload.connectedAs === 'string'
          ? payload.connectedAs
          : null,
      belongsAs: payload.belongs_as ?? payload.belongsAs ?? [],
    } as CreationAttributes<Connect>;

    return data;
  }

  private mapUpdatePayload(payload: Record<string, unknown>) {
    const updateData: Partial<Connect> = {};

    if (Object.prototype.hasOwnProperty.call(payload, 'description') && typeof payload.description === 'string') {
      updateData.description = payload.description;
    }

    if (Object.prototype.hasOwnProperty.call(payload, 'connected_as') && typeof payload.connected_as === 'string') {
      updateData.connectedAs = payload.connected_as;
    } else if (Object.prototype.hasOwnProperty.call(payload, 'connectedAs')
      && typeof payload.connectedAs === 'string') {
      updateData.connectedAs = payload.connectedAs;
    }

    if (Object.prototype.hasOwnProperty.call(payload, 'belongs_as')) {
      updateData.belongsAs = payload.belongs_as as unknown;
    } else if (Object.prototype.hasOwnProperty.call(payload, 'belongsAs')) {
      updateData.belongsAs = payload.belongsAs as unknown;
    }

    return updateData;
  }

  private async resolveUser(payload: Record<string, unknown>, userPayload?: Record<string, unknown>) {
    const userId = this.getId(payload.user ?? payload.user_id ?? payload.userId)
      ?? this.getId(userPayload?.id ?? userPayload?.user_id);

    if (userId) {
      return this.userModel.findByPk(userId);
    }

    const email = typeof userPayload?.email === 'string' ? userPayload.email : undefined;
    const contactNumber = typeof userPayload?.contact_number === 'string'
      ? userPayload.contact_number
      : typeof userPayload?.contactNumber === 'string'
        ? userPayload.contactNumber
        : undefined;

    if (!email && !contactNumber) {
      return null;
    }

    const orConditions = [] as Record<string, string>[];
    if (email) {
      orConditions.push({ email });
    }
    if (contactNumber) {
      orConditions.push({ contactNumber });
    }

    return this.userModel.findOne({ where: { [Op.or]: orConditions } });
  }

  private getId(value: unknown) {
    return typeof value === 'string' ? value : undefined;
  }

  private toExpandedResponse(record: Connect): Record<string, unknown> {
    return {
      _id: record.id,
      user: this.mapUser(record.user),
      temple: this.mapTemple(record.temple),
      village: this.mapVillage(record.village),
      description: record.description ?? null,
      connected_as: record.connectedAs ?? null,
      belongs_as: record.belongsAs ?? [],
      created_at: record.createdAt ?? null,
    };
  }

  private mapUser(user?: User | null) {
    if (!user) {
      return null;
    }

    return {
      _id: user.id,
      name: user.fullName ?? null,
      father_name: user.fatherName ?? null,
      contact_number: user.contactNumber ?? null,
      dob: user.dob ?? null,
      type: user.type ?? null,
      username: user.username ?? null,
      account_type: user.accountType ?? null,
    };
  }

  private mapTemple(temple?: Temple | null) {
    if (!temple) {
      return null;
    }

    return {
      _id: temple.id,
      name: temple.name ?? null,
      image_location: this.mapEntityImage(temple.imageLocation),
    };
  }

  private mapVillage(village?: Village | null) {
    if (!village) {
      return null;
    }

    return {
      _id: village.id,
      name: village.name,
      image_location: this.mapEntityImage(village.imageLocation),
    };
  }

  private mapEntityImage(raw: unknown) {
    const first = this.getFirstImage(raw);
    if (!first) {
      return null;
    }

    const baseUrl = this.configService.get<string>('FILE_URL') || '';
    const normalized = first.replace(/\//g, '\\').replace(/\\\\/g, '\\');
    return `${baseUrl}${normalized}`;
  }

  private getFirstImage(raw: unknown) {
    if (!raw) {
      return null;
    }

    if (Array.isArray(raw)) {
      return raw.length ? String(raw[0]).trim() : null;
    }

    if (typeof raw === 'string') {
      const trimmed = raw.trim();
      if (!trimmed) {
        return null;
      }

      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        const cleaned = trimmed.replace(/[\[\]"]+/g, '');
        const first = cleaned.split(',')[0]?.trim();
        return first || null;
      }

      return trimmed;
    }

    return null;
  }
}
