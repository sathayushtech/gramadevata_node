import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/sequelize';
import { Op, QueryTypes } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Register as User } from '../auth/user.model';
import { Connect } from '../connect/connect.model';
import { Temple } from '../temple/temple.model';
import { Goshala } from '../goshalas/goshala.model';
import { Event } from '../events/event.model';
import { FavoriteTemple } from '../temple/favorite-temple.model';
import { VisitTemple } from '../temple/visit-temple.model';
import { Village } from '../villages/village.model';
import { Gender, MemberStatus } from '../../common/enums';
import { coerceList, toFileUrlList, toFileUrlString } from '../../common/utils/django-serializer';
import {
  saveImageToAzure,
  saveVideoToAzure,
  saveEntityImagesToAzure,
  saveEntityVideosToAzure,
  looksLikeStoredPath,
  coerceStringList,
} from '../../common/utils/gramadevata.utils';

const ACTIVE_THRESHOLD_MINUTES = 5;

const IMAGE_FIELDS = [
  'mfImage', 'fMfImage', 'mMfImage',
  'ffMfImage', 'fmMfImage', 'mfMfImage', 'mmMfImage',
] as const;

const ROOTS_FIELDS = [
  'fatherName', 'email', 'motherName',
  'paternalGrandmotherName', 'paternalGrandfatherName',
  'paternalGreatGrandfatherName', 'paternalGreatGrandmotherName',
  'paternalGrandmotherFatherName', 'paternalGrandmotherMotherName',
  'maternalGrandfatherName', 'maternalGrandmotherName',
  'maternalGreatGrandfatherName', 'maternalGreatGrandmotherName',
  'maternalGrandmotherFatherName', 'maternalGrandmotherMotherName',
  'maritalStatus', 'wife', 'husband', 'children', 'siblings', 'desc',
] as const;

const PROFILE_UPDATE_FIELDS = [
  'fullName', 'surname', 'gotram', 'gender', 'accountType',
  'fatherName', 'dob', 'contactNumber', 'workingTemple',
  'pujariDesignation', 'email',
  'motherName', 'paternalGrandmotherName', 'paternalGrandfatherName',
  'paternalGreatGrandfatherName', 'paternalGreatGrandmotherName',
  'paternalGrandmotherFatherName', 'paternalGrandmotherMotherName',
  'maternalGrandfatherName', 'maternalGrandmotherName',
  'maternalGreatGrandfatherName', 'maternalGreatGrandmotherName',
  'maternalGrandmotherFatherName', 'maternalGrandmotherMotherName',
  'maritalStatus', 'wife', 'husband', 'children', 'siblings',
  'voluntaryLevel', 'pujariExpertise', 'pujariIdType',
  'pujariCertificateType', 'issuedBy', 'pujariType', 'pujariDesignation', 'desc',
] as const;

@Injectable()
export class ProfileService {
  constructor(
    @InjectModel(User) private readonly userModel: typeof User,
    @InjectModel(Connect) private readonly connectModel: typeof Connect,
    @InjectModel(Temple) private readonly templeModel: typeof Temple,
    @InjectModel(Goshala) private readonly goshalaModel: typeof Goshala,
    @InjectModel(Event) private readonly eventModel: typeof Event,
    @InjectModel(FavoriteTemple) private readonly favoriteModel: typeof FavoriteTemple,
    @InjectModel(VisitTemple) private readonly visitModel: typeof VisitTemple,
    private readonly sequelize: Sequelize,
    private readonly configService: ConfigService,
  ) {}

  /* ------------------------------------------------------------------ */
  /*  PUT /profile/{id}  — updateprofile                                */
  /* ------------------------------------------------------------------ */
  async updateProfile(id: string, payload: Record<string, unknown>): Promise<Record<string, unknown>> {
    const instance = await this.userModel.findByPk(id);
    if (!instance) throw new NotFoundException('Object not found');

    // ── Apply simple text fields ──
    for (const field of PROFILE_UPDATE_FIELDS) {
      const snakeKey = this.camelToSnake(field);
      const value = payload[snakeKey] ?? payload[field];
      if (value !== undefined) {
        (instance as unknown as Record<string, unknown>)[field] = typeof value === 'string' ? value : String(value);
      }
    }
    instance.isMember = 'true';
    await instance.save();

    // ── Profile pic ──
    const profilePic = typeof payload.profile_pic === 'string' ? payload.profile_pic : null;
    if (profilePic && profilePic !== 'null') {
      if (!looksLikeStoredPath(profilePic, 'profile_pic')) {
        const saved = await saveImageToAzure({
          configService: this.configService,
          base64: profilePic,
          id: instance.id,
          name: instance.fullName || 'profile',
          entityType: 'profile_pic',
        });
        instance.profilePic = saved;
        await instance.save({ fields: ['profilePic'] });
      }
    }

    // ── Family images (append) ──
    const rawFamilyImages = this.coerceInputList(payload.family_images ?? payload.familyImages);
    if (rawFamilyImages.length) {
      const existing = coerceList(instance.familyImages);
      const saved = await saveEntityImagesToAzure({
        configService: this.configService,
        images: rawFamilyImages,
        id: instance.id,
        name: instance.fullName || 'profile',
        entityType: 'family_images',
      });
      instance.familyImages = [...existing, ...saved];
      await instance.save({ fields: ['familyImages'] });
    }

    // ── Pujari certificates (append) ──
    const rawCerts = this.coerceInputList(payload.pujari_certificate ?? payload.pujariCertificate);
    if (rawCerts.length) {
      const existing = coerceList(instance.pujariCertificate);
      const saved = await saveEntityImagesToAzure({
        configService: this.configService,
        images: rawCerts,
        id: instance.id,
        name: instance.fullName || 'profile',
        entityType: 'pujari_certificate',
      });
      instance.pujariCertificate = [...existing, ...saved];
      await instance.save({ fields: ['pujariCertificate'] });
    }

    // ── 7 mf_image fields (replace, max 2 each) ──
    for (const field of IMAGE_FIELDS) {
      const snakeKey = this.camelToSnake(field);
      const raw = this.coerceInputList(payload[snakeKey] ?? payload[field]).slice(0, 2);
      if (raw.length) {
        const saved = await saveEntityImagesToAzure({
          configService: this.configService,
          images: raw,
          id: instance.id,
          name: instance.fullName || 'profile',
          entityType: snakeKey,
        });
        if (saved.length) {
          (instance as unknown as Record<string, unknown>)[field] = saved;
          await instance.save({ fields: [field] });
        }
      }
    }

    // ── Pujari ID image ──
    const pujariIdImage = typeof payload.pujari_id_image === 'string' ? payload.pujari_id_image : null;
    if (pujariIdImage && pujariIdImage !== 'null') {
      if (!looksLikeStoredPath(pujariIdImage, 'pujari_id_image')) {
        const saved = await saveImageToAzure({
          configService: this.configService,
          base64: pujariIdImage,
          id: instance.id,
          name: instance.fullName || 'profile',
          entityType: 'pujari_id_image',
        });
        instance.pujariIdImage = saved;
        await instance.save({ fields: ['pujariIdImage'] });
      }
    }

    // ── Pujari videos (append) ──
    const rawVideos = this.coerceInputList(payload.pujari_video ?? payload.pujariVideo);
    if (rawVideos.length) {
      const existing = coerceList(instance.pujariVideo);
      const saved = await saveEntityVideosToAzure({
        configService: this.configService,
        videos: rawVideos,
        id: instance.id,
        name: instance.fullName || 'profile',
        entityType: 'pujari_video',
      });
      instance.pujariVideo = [...existing, ...saved];
      await instance.save({ fields: ['pujariVideo'] });
    }

    // ── Pujari M2M categories ──
    const categoryIds = this.coerceInputList(payload.pujari_category ?? payload.pujariCategory);
    if (categoryIds.length) {
      await this.setPujariCategories(instance.id, categoryIds);
    }
    const subCategoryIds = this.coerceInputList(payload.pujari_sub_category ?? payload.pujariSubCategory);
    if (subCategoryIds.length) {
      await this.setPujariSubCategories(instance.id, subCategoryIds);
    }

    // Reload for response
    await instance.reload();
    return await this.toProfileSerializerResponse(instance);
  }

  /* ------------------------------------------------------------------ */
  /*  GET /profile_get_by_id/{id}  — GetProfileById (MoreDetailsSerializer) */
  /* ------------------------------------------------------------------ */
  async getProfileById(id: string, requestUserId?: string): Promise<Record<string, unknown>> {
    const instance = await this.userModel.findByPk(id);
    if (!instance) throw new NotFoundException('Object not found');

    const isOwner = requestUserId === String(instance.id);

    // PRIVATE account: non-owner sees limited fields
    if (!isOwner && instance.accountType === 'PRIVATE') {
      return {
        full_name: instance.fullName ?? null,
        profile_pic: toFileUrlString(this.configService, instance.profilePic),
        is_member: instance.isMember ?? null,
        account_type: instance.accountType ?? null,
        type: instance.type ?? null,
        id: instance.id,
      };
    }

    return this.toMoreDetailsResponse(instance);
  }

  /* ------------------------------------------------------------------ */
  /*  PUT /profileimages/{id}  — ProfileUpdate (FamilyImageSerializer)  */
  /* ------------------------------------------------------------------ */
  async updateProfileImages(id: string, payload: Record<string, unknown>): Promise<Record<string, unknown>> {
    const instance = await this.userModel.findByPk(id);
    if (!instance) throw new NotFoundException('Object not found');

    const profilePic = typeof payload.profile_pic === 'string' ? payload.profile_pic : null;
    const rawFamilyImages = this.coerceInputList(payload.family_images ?? payload.familyImages);

    // Validate max 10
    const existingImages = coerceList(instance.familyImages);
    if (existingImages.length + rawFamilyImages.length > 10) {
      throw new BadRequestException('You can upload a maximum of 10 family images.');
    }

    // Profile pic
    if (profilePic && profilePic !== 'null') {
      if (!looksLikeStoredPath(profilePic, 'profile_pic')) {
        const saved = await saveImageToAzure({
          configService: this.configService,
          base64: profilePic,
          id: instance.id,
          name: instance.fullName || 'profile',
          entityType: 'profile_pic',
        });
        instance.profilePic = saved;
        await instance.save({ fields: ['profilePic'] });
      }
    }

    // Family images (append)
    if (rawFamilyImages.length) {
      const saved = await saveEntityImagesToAzure({
        configService: this.configService,
        images: rawFamilyImages,
        id: instance.id,
        name: instance.fullName || 'profile',
        entityType: 'family_images',
      });
      instance.familyImages = [...existingImages, ...saved];
      await instance.save({ fields: ['familyImages'] });
    }

    return {
      family_images: toFileUrlList(this.configService, instance.familyImages),
    };
  }

  /* ------------------------------------------------------------------ */
  /*  PUT /updateroots/{id}  — updateRoots (profileserializer1)         */
  /* ------------------------------------------------------------------ */
  async updateRoots(id: string, payload: Record<string, unknown>): Promise<{ message: string }> {
    const instance = await this.userModel.findByPk(id);
    if (!instance) throw new NotFoundException('Object not found');

    for (const field of ROOTS_FIELDS) {
      const snakeKey = this.camelToSnake(field);
      const value = payload[snakeKey] ?? payload[field];
      if (value !== undefined) {
        (instance as unknown as Record<string, unknown>)[field] = typeof value === 'string' ? value : value === null ? null : String(value);
      }
    }

    await instance.save();
    return { message: 'Updated Successfully' };
  }

  /* ------------------------------------------------------------------ */
  /*  GET /profile_get/  — GetProfile (profilegetSerializer + counts)   */
  /* ------------------------------------------------------------------ */
  async getProfiles(query: Record<string, string>): Promise<Record<string, unknown>> {
    const search = query.search?.trim() || '';
    const activity = query.activity?.toUpperCase() || '';

    const activeThreshold = new Date(Date.now() - ACTIVE_THRESHOLD_MINUTES * 60 * 1000);

    // Build where clause for profile list
    const where: Record<string, unknown> = {};
    if (search) {
      where[Op.or as unknown as string] = [
        { username: { [Op.like]: `%${search}%` } },
        { fullName: { [Op.like]: `%${search}%` } },
      ];
    }

    if (activity === 'ACTIVE') {
      where.lastSeen = { [Op.gte]: activeThreshold };
    } else if (activity === 'INACTIVE') {
      where[Op.or as unknown as string] = [
        { lastSeen: { [Op.lt]: activeThreshold } },
        { lastSeen: null },
      ];
      // merge with search if present
      if (search) {
        // Need to combine search + activity
        where[Op.and as unknown as string] = [
          {
            [Op.or]: [
              { username: { [Op.like]: `%${search}%` } },
              { fullName: { [Op.like]: `%${search}%` } },
            ],
          },
          {
            [Op.or]: [
              { lastSeen: { [Op.lt]: activeThreshold } },
              { lastSeen: null },
            ],
          },
        ];
        delete where[Op.or as unknown as string];
      }
    }

    const profiles = await this.userModel.findAll({
      where,
      order: [['dateJoined', 'DESC']],
    });

    // Global counts (unfiltered)
    const totalUsers = await this.userModel.count();
    const membersCount = await this.userModel.count({ where: { isMember: MemberStatus.true } });
    const nonMembersCount = await this.userModel.count({ where: { isMember: MemberStatus.false } });
    const maleCount = await this.userModel.count({ where: { gender: Gender.MALE } });
    const femaleCount = await this.userModel.count({ where: { gender: Gender.FEMALE } });
    const activeUsers = await this.userModel.count({ where: { lastSeen: { [Op.gte]: activeThreshold } } });
    const inactiveUsers = totalUsers - activeUsers;

    return {
      user_count: {
        total: totalUsers,
        members: membersCount,
        non_members: nonMembersCount,
        male: maleCount,
        female: femaleCount,
        active: activeUsers,
        inactive: inactiveUsers,
      },
      profiles: profiles.map((p) => this.toProfileGetResponse(p, activeThreshold)),
    };
  }

  /* ------------------------------------------------------------------ */
  /*  DELETE /profile_delete/{id}/  — DeleteProfileView                 */
  /* ------------------------------------------------------------------ */
  async deleteProfile(id: string, requestUserId: string): Promise<void> {
    if (String(requestUserId) !== String(id)) {
      throw new ForbiddenException({
        detail: "You are not allowed to delete another user's profile.",
        code: 'forbidden',
      });
    }

    const profile = await this.userModel.findByPk(id);
    if (!profile) throw new NotFoundException('Object not found');

    await profile.destroy();
  }

  /* ================================================================== */
  /*  SERIALIZERS                                                       */
  /* ================================================================== */

  /**
   * Matches Django `profileserializer` — used in PUT /profile/{id} response
   */
  private async toProfileSerializerResponse(user: User): Promise<Record<string, unknown>> {
    const [pujariCategoryDetail, pujariSubCategoryDetail] = await Promise.all([
      this.getPujariCategoryDetail(user.id),
      this.getPujariSubCategoryDetail(user.id),
    ]);

    return {
      id: user.id,
      full_name: user.fullName ?? null,
      surname: user.surname ?? null,
      gotram: user.gotram ?? null,
      gender: user.gender ?? null,
      account_type: user.accountType ?? null,
      father_name: user.fatherName ?? null,
      profile_pic: toFileUrlString(this.configService, user.profilePic),
      dob: user.dob ?? null,
      contact_number: user.contactNumber ?? null,
      working_temple: user.workingTemple ?? null,
      pujari_certificate: toFileUrlList(this.configService, user.pujariCertificate),
      pujari_designation: user.pujariDesignation ?? null,
      family_images: toFileUrlList(this.configService, user.familyImages),
      email: user.email ?? null,
      mother_name: user.motherName ?? null,
      paternal_grandmother_name: user.paternalGrandmotherName ?? null,
      paternal_grandfather_name: user.paternalGrandfatherName ?? null,
      paternal_great_grandfather_name: user.paternalGreatGrandfatherName ?? null,
      paternal_great_grandmother_name: user.paternalGreatGrandmotherName ?? null,
      paternal_grandmother_father_name: user.paternalGrandmotherFatherName ?? null,
      paternal_grandmother_mother_name: user.paternalGrandmotherMotherName ?? null,
      maternal_grandfather_name: user.maternalGrandfatherName ?? null,
      maternal_grandmother_name: user.maternalGrandmotherName ?? null,
      maternal_great_grandfather_name: user.maternalGreatGrandfatherName ?? null,
      maternal_great_grandmother_name: user.maternalGreatGrandmotherName ?? null,
      maternal_grandmother_father_name: user.maternalGrandmotherFatherName ?? null,
      maternal_grandmother_mother_name: user.maternalGrandmotherMotherName ?? null,
      marital_status: user.maritalStatus ?? null,
      wife: user.wife ?? null,
      husband: user.husband ?? null,
      children: user.children ?? null,
      siblings: user.siblings ?? null,
      voluntary_level: user.voluntaryLevel ?? null,
      pujari_expertise: user.pujariExpertise ?? null,
      pujari_id_type: user.pujariIdType ?? null,
      pujari_certificate_type: user.pujariCertificateType ?? null,
      pujari_id_image: toFileUrlString(this.configService, user.pujariIdImage),
      pujari_category_detail: pujariCategoryDetail,
      pujari_sub_category_detail: pujariSubCategoryDetail,
      issued_by: user.issuedBy ?? null,
      pujari_type: user.pujariType ?? null,
      pujari_video: this.resolvePujariVideoUrls(user.pujariVideo),
      mf_image: toFileUrlList(this.configService, user.mfImage),
      f_mf_image: toFileUrlList(this.configService, user.fMfImage),
      m_mf_image: toFileUrlList(this.configService, user.mMfImage),
      ff_mf_image: toFileUrlList(this.configService, user.ffMfImage),
      fm_mf_image: toFileUrlList(this.configService, user.fmMfImage),
      mf_mf_image: toFileUrlList(this.configService, user.mfMfImage),
      mm_mf_image: toFileUrlList(this.configService, user.mmMfImage),
      desc: user.desc ?? null,
    };
  }

  /**
   * Matches Django `MoreDetailsSerializer` — used in GET /profile_get_by_id/{id}/
   */
  private async toMoreDetailsResponse(user: User): Promise<Record<string, unknown>> {
    const userId = user.id;

    // Fetch related data in parallel
    const [connections, temples, goshalas, events, favorites, visitTemples, pujariCats, pujariSubCats] =
      await Promise.all([
        this.connectModel.findAll({
          where: { userId },
          include: [
            { model: Village, attributes: ['id', 'name', 'imageLocation'] },
            { model: Temple, attributes: ['id', 'name', 'imageLocation'] },
          ],
        }),
        this.templeModel.findAll({ where: { userId, status: 'ACTIVE' } }),
        this.goshalaModel.findAll({ where: { user: userId } }),
        this.eventModel.findAll({ where: { userId } }),
        this.favoriteModel.findAll({ where: { userId } }),
        this.visitModel.findAll({ where: { userId } }),
        this.getPujariCategoryDetail(userId),
        this.getPujariSubCategoryDetail(userId),
      ]);

    return {
      temples_count: temples.length,
      id: user.id,
      full_name: user.fullName ?? null,
      surname: user.surname ?? null,
      gotram: user.gotram ?? null,
      father_name: user.fatherName ?? null,
      profile_pic: toFileUrlString(this.configService, user.profilePic),
      contact_number: user.contactNumber ?? null,
      gender: user.gender ?? null,
      dob: user.dob ?? null,
      type: user.type ?? null,
      pujari_certificate: toFileUrlList(this.configService, user.pujariCertificate),
      working_temple: user.workingTemple ?? null,
      is_member: user.isMember ?? null,
      Connections: connections.map((c) => this.serializeConnection(c)),
      temples: temples.map((t) => this.serializeTempleForProfile(t)),
      goshalas: goshalas.map((g) => this.serializeGoshalaMinimal(g)),
      events: events.map((e) => this.serializeEventMinimal(e)),
      family_images: toFileUrlList(this.configService, user.familyImages),
      email: user.email ?? null,
      account_type: user.accountType ?? null,
      mother_name: user.motherName ?? null,
      paternal_grandmother_name: user.paternalGrandmotherName ?? null,
      paternal_grandfather_name: user.paternalGrandfatherName ?? null,
      paternal_great_grandfather_name: user.paternalGreatGrandfatherName ?? null,
      paternal_great_grandmother_name: user.paternalGreatGrandmotherName ?? null,
      paternal_grandmother_father_name: user.paternalGrandmotherFatherName ?? null,
      paternal_grandmother_mother_name: user.paternalGrandmotherMotherName ?? null,
      maternal_grandfather_name: user.maternalGrandfatherName ?? null,
      maternal_grandmother_name: user.maternalGrandmotherName ?? null,
      maternal_great_grandfather_name: user.maternalGreatGrandfatherName ?? null,
      maternal_great_grandmother_name: user.maternalGreatGrandmotherName ?? null,
      maternal_grandmother_father_name: user.maternalGrandmotherFatherName ?? null,
      maternal_grandmother_mother_name: user.maternalGrandmotherMotherName ?? null,
      marital_status: user.maritalStatus ?? null,
      wife: user.wife ?? null,
      husband: user.husband ?? null,
      children: user.children ?? null,
      siblings: user.siblings ?? null,
      favorite: favorites.map((f) => ({ _id: f.id, user_id: f.userId, temple_id: f.templeId, created_at: f.createdAt })),
      voluntary_level: user.voluntaryLevel ?? null,
      pujari_expertise: user.pujariExpertise ?? null,
      pujari_id_type: user.pujariIdType ?? null,
      pujari_certificate_type: user.pujariCertificateType ?? null,
      pujari_id_image: toFileUrlString(this.configService, user.pujariIdImage),
      pujari_category: [],
      pujari_sub_category: [],
      issued_by: user.issuedBy ?? null,
      pujari_type: user.pujariType ?? null,
      pujari_video: this.resolvePujariVideoUrls(user.pujariVideo),
      pujari_category_detail: pujariCats,
      pujari_sub_category_detail: pujariSubCats,
      pujari_designation: user.pujariDesignation ?? null,
      visit_temples: visitTemples.map((vt) => ({ _id: vt.id, user_id: vt.userId, temple_id: vt.templeId, created_at: vt.createdAt })),
      mf_image: toFileUrlList(this.configService, user.mfImage),
      f_mf_image: toFileUrlList(this.configService, user.fMfImage),
      m_mf_image: toFileUrlList(this.configService, user.mMfImage),
      ff_mf_image: toFileUrlList(this.configService, user.ffMfImage),
      fm_mf_image: toFileUrlList(this.configService, user.fmMfImage),
      mf_mf_image: toFileUrlList(this.configService, user.mfMfImage),
      mm_mf_image: toFileUrlList(this.configService, user.mmMfImage),
      desc: user.desc ?? null,
    };
  }

  /**
   * Matches Django `profilegetSerializer` — used in GET /profile_get/
   */
  private toProfileGetResponse(user: User, activeThreshold: Date): Record<string, unknown> {
    return {
      id: user.id,
      full_name: user.fullName ?? null,
      surname: user.surname ?? null,
      gotram: user.gotram ?? null,
      father_name: user.fatherName ?? null,
      profile_pic: toFileUrlString(this.configService, user.profilePic),
      contact_number: user.contactNumber ?? null,
      gender: user.gender ?? null,
      dob: user.dob ?? null,
      type: user.type ?? null,
      is_member: user.isMember ?? null,
      email: user.email ?? null,
      desc: user.desc ?? null,
      relative_time: this.relativeSince(user.dateJoined),
      activity_status: this.getActivityStatus(user, activeThreshold),
      last_seen_time: this.relativeSince(user.lastSeen),
    };
  }

  /* ================================================================== */
  /*  HELPERS                                                           */
  /* ================================================================== */

  private serializeConnection(conn: Connect): Record<string, unknown> {
    const plain = conn.get({ plain: true }) as unknown as Record<string, unknown>;
    const village = (conn as unknown as { village?: Village })?.village;
    const temple = (conn as unknown as { temple?: Temple })?.temple;
    const user = (conn as unknown as { user?: User })?.user;

    return {
      ...plain,
      _id: conn.id,
      village: village ? {
        _id: village.id,
        name: (village as unknown as Record<string, unknown>).name ?? null,
        image_location: toFileUrlString(this.configService, (village as unknown as Record<string, unknown>).imageLocation),
      } : null,
      temple: temple ? {
        _id: temple.id,
        name: temple.name ?? null,
        image_location: toFileUrlList(this.configService, temple.imageLocation),
      } : null,
      user: user ? {
        _id: user.id,
        name: user.fullName ?? null,
        father_name: user.fatherName ?? null,
        contact_number: user.contactNumber ?? null,
        dob: user.dob ?? null,
        type: user.type ?? null,
        username: user.username ?? null,
        account_type: user.accountType ?? null,
      } : null,
    };
  }

  private serializeTempleForProfile(temple: Temple): Record<string, unknown> {
    return {
      _id: temple.id,
      name: temple.name ?? null,
      image_location: toFileUrlList(this.configService, temple.imageLocation),
      status: temple.status ?? null,
    };
  }

  private serializeGoshalaMinimal(goshala: Goshala): Record<string, unknown> {
    const plain = goshala.get({ plain: true }) as unknown as Record<string, unknown>;
    return {
      _id: plain.id ?? goshala.id,
      ...plain,
    };
  }

  private serializeEventMinimal(event: Event): Record<string, unknown> {
    const plain = event.get({ plain: true }) as unknown as Record<string, unknown>;
    return {
      _id: plain.id ?? event.id,
      ...plain,
    };
  }

  private async getPujariCategoryDetail(userId: string): Promise<Record<string, unknown>[]> {
    try {
      const rows = await this.sequelize.query(
        `SELECT pc._id, pc.name FROM pujari_category pc
         INNER JOIN user_pujari_category upc ON upc.pujaricategory_id = pc._id
         WHERE upc.register_id = :userId`,
        { replacements: { userId }, type: QueryTypes.SELECT },
      );
      return (rows as Array<Record<string, unknown>>).map((r) => ({ _id: r._id, name: r.name }));
    } catch {
      return [];
    }
  }

  private async getPujariSubCategoryDetail(userId: string): Promise<Record<string, unknown>[]> {
    try {
      const rows = await this.sequelize.query(
        `SELECT psc._id, psc.name, psc.category_id FROM pujari_sub_category psc
         INNER JOIN user_pujari_sub_category upsc ON upsc.pujarisubcategory_id = psc._id
         WHERE upsc.register_id = :userId`,
        { replacements: { userId }, type: QueryTypes.SELECT },
      );
      return (rows as Array<Record<string, unknown>>).map((r) => ({
        _id: r._id,
        name: r.name,
        category_id: r.category_id,
      }));
    } catch {
      return [];
    }
  }

  private async setPujariCategories(userId: string, categoryIds: string[]) {
    try {
      await this.sequelize.query(
        'DELETE FROM user_pujari_category WHERE register_id = :userId',
        { replacements: { userId }, type: QueryTypes.DELETE },
      );
      for (const catId of categoryIds) {
        await this.sequelize.query(
          'INSERT INTO user_pujari_category (register_id, pujaricategory_id) VALUES (:userId, :catId)',
          { replacements: { userId, catId }, type: QueryTypes.INSERT },
        );
      }
    } catch (err) {
      console.warn('Failed to set pujari categories', err);
    }
  }

  private async setPujariSubCategories(userId: string, subCategoryIds: string[]) {
    try {
      await this.sequelize.query(
        'DELETE FROM user_pujari_sub_category WHERE register_id = :userId',
        { replacements: { userId }, type: QueryTypes.DELETE },
      );
      for (const subCatId of subCategoryIds) {
        await this.sequelize.query(
          'INSERT INTO user_pujari_sub_category (register_id, pujarisubcategory_id) VALUES (:userId, :subCatId)',
          { replacements: { userId, subCatId }, type: QueryTypes.INSERT },
        );
      }
    } catch (err) {
      console.warn('Failed to set pujari sub-categories', err);
    }
  }

  private resolvePujariVideoUrls(value: unknown): string[] {
    const paths = coerceList(value).filter((p) => p && p.toLowerCase() !== 'null');
    const base = this.resolveFileBase();
    return paths.map((p) => {
      if (/^https?:\/\//i.test(p)) return p;
      return `${base}${p.replace(/\\/g, '/').replace(/^\//, '')}`;
    });
  }

  private resolveFileBase(): string {
    const raw = this.configService.get<string>('File_path')
      || this.configService.get<string>('FILE_URL')
      || '';
    if (!raw) return '';
    return raw.endsWith('/') ? raw : `${raw}/`;
  }

  private getActivityStatus(user: User, activeThreshold: Date): string {
    if (!user.lastSeen) return 'INACTIVE';
    return new Date(user.lastSeen) >= activeThreshold ? 'ACTIVE' : 'INACTIVE';
  }

  private relativeSince(date?: Date | null): string | null {
    if (!date) return null;
    const now = Date.now();
    const then = new Date(date).getTime();
    const diff = now - then;

    if (diff < 0) return '0 seconds ago';

    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return `${seconds} second${seconds !== 1 ? 's' : ''} ago`;

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;

    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} day${days !== 1 ? 's' : ''} ago`;

    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `${weeks} week${weeks !== 1 ? 's' : ''} ago`;

    const months = Math.floor(days / 30);
    if (months < 12) return `${months} month${months !== 1 ? 's' : ''} ago`;

    const years = Math.floor(days / 365);
    return `${years} year${years !== 1 ? 's' : ''} ago`;
  }

  private coerceInputList(value: unknown): string[] {
    if (value === null || value === undefined) return [];
    if (Array.isArray(value)) return value.filter((v): v is string => typeof v === 'string' && v.trim() !== '' && v !== 'null');
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed || trimmed === 'null') return [];
      return [trimmed];
    }
    return [];
  }

  private camelToSnake(input: string): string {
    return input.replace(/([a-z0-9])([A-Z])/g, '$1_$2').replace(/__/g, '_').toLowerCase();
  }
}
