import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ConfigService } from '@nestjs/config';
import { Village } from './village.model';
import type { CreationAttributes } from 'sequelize';
import { EntityStatus, ConnectedAs } from '../../common/enums';
import { coerceList, formatTimesinceAgo, toDjangoKeys, toFileUrlList, toFirstImageFileUrl, toMapUrlList, toVillageImageUrlList } from './village.serializer';
import { saveEntityImagesToAzure, saveEntityVideosToAzure } from '../../common/utils/gramadevata.utils';
import { Register } from '../auth/user.model';
import { Geographic } from './village-geographic.model';
import { VillageFamousPersonality } from './village-famous-personality.model';
import { VillageDevelopmentFacility } from './village-development-facility.model';
import { Connect } from '../connect/connect.model';
import { Temple } from '../temple/temple.model';
import { Block } from '../block/block.model';
import { District } from '../../common/models/district.model';
import { State } from '../../common/models/state.model';
import { Country } from '../../common/models/country.model';

@Injectable()
export class VillagesService {
  constructor(
    @InjectModel(Village)
    private readonly villageModel: typeof Village,
    @InjectModel(Register)
    private readonly userModel: typeof Register,
    @InjectModel(Geographic)
    private readonly geographicModel: typeof Geographic,
    @InjectModel(VillageFamousPersonality)
    private readonly famousPersonalityModel: typeof VillageFamousPersonality,
    @InjectModel(VillageDevelopmentFacility)
    private readonly developmentFacilityModel: typeof VillageDevelopmentFacility,
    @InjectModel(Connect)
    private readonly connectModel: typeof Connect,
    @InjectModel(Temple)
    private readonly templeModel: typeof Temple,
    private readonly configService: ConfigService,
  ) {}

  private snakeToCamel(input: string): string {
    return input.replace(/_([a-z])/g, (_, c) => String(c).toUpperCase());
  }

  private normalizePayload(payload: Record<string, unknown>) {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(payload)) {
      if (key === '_id' || key === 'id') continue;
      out[this.snakeToCamel(key)] = value;
    }
    return out;
  }

  private serializeVillageSearch(v: Village) {
    const plain = v.get({ plain: true }) as unknown as Record<string, unknown>;
    const out = toDjangoKeys(plain);
    return { _id: out._id, name: out.name, block_id: out.block_id };
  }

  private async serializeVillageSerializer2(v: Village) {
    const plain = v.get({ plain: true }) as unknown as Record<string, unknown>;
    const out = toDjangoKeys(plain);
    out.image_location = toFileUrlList(this.configService, plain.imageLocation);
    out.relative_time = formatTimesinceAgo(v.createdAt ?? null);

    const userId = (plain.userId as string | undefined) ?? undefined;
    if (userId) {
      const user = await this.userModel.findByPk(userId);
      out.user_full_name = user?.fullName ?? null;
    } else {
      out.user_full_name = null;
    }

    return out;
  }

  private serializeTempleMini(t: Temple) {
    const plain = t.get({ plain: true }) as unknown as Record<string, unknown>;
    const out = toDjangoKeys(plain);
    out.image_location = toFileUrlList(this.configService, plain.imageLocation);
    return {
      _id: out._id,
      name: out.name,
      image_location: out.image_location,
      status: out.status,
    };
  }

  private serializeConnectForVillage(c: Connect) {
    const plain = c.get({ plain: true }) as unknown as Record<string, unknown>;
    const out = toDjangoKeys(plain);

    const user = (c as any).user as Register | undefined;
    const village = (c as any).village as Village | undefined;
    const temple = (c as any).temple as Temple | undefined;

    return {
      _id: out._id,
      description: out.description,
      connected_as: out.connected_as,
      belongs_as: out.belongs_as,
      created_at: out.created_at,
      village: village
        ? {
            _id: village.id,
            name: village.name,
            image_location: toFirstImageFileUrl(this.configService, (village as any).imageLocation),
          }
        : null,
      user: user
        ? {
            _id: user.id,
            name: user.fullName,
            father_name: user.fatherName,
            contact_number: user.contactNumber,
            dob: user.dob,
            type: user.type,
            username: user.username,
            account_type: user.accountType,
          }
        : null,
      temple: temple
        ? {
            _id: temple.id,
            name: temple.name,
            image_location: toFirstImageFileUrl(this.configService, (temple as any).imageLocation),
          }
        : null,
    };
  }

  async create(payload: Record<string, unknown>) {
    const images = coerceList((payload as any).image_location ?? (payload as any).imageLocation);
    const videos = coerceList((payload as any).village_video ?? (payload as any).villageVideo);

    const requestData = this.normalizePayload(payload);

    const created = await this.villageModel.create({
      ...(requestData as CreationAttributes<Village>),
      imageLocation: [],
      villageVideo: [],
    } as CreationAttributes<Village>);

    const savedImages = await saveEntityImagesToAzure({
      configService: this.configService,
      images,
      id: created.id,
      name: created.name,
      entityType: 'village',
    });

    const savedVideos = await saveEntityVideosToAzure({
      configService: this.configService,
      videos,
      id: created.id,
      name: created.name,
      entityType: 'village',
    });

    if (savedImages.length || savedVideos.length) {
      await created.update({
        ...(savedImages.length ? { imageLocation: savedImages } : {}),
        ...(savedVideos.length ? { villageVideo: savedVideos } : {}),
      } as CreationAttributes<Village>);
    }

    return this.serializeVillageSerializer2(created);
  }

  async list(query: Record<string, string | undefined>) {
    const filters: Record<string, unknown> = {
      status: EntityStatus.ACTIVE,
    };

    for (const [key, value] of Object.entries(query)) {
      if (value === undefined) continue;
      if (key === 'page' || key === 'page_size') continue;
      const attr = this.snakeToCamel(key);
      // Don't allow overriding the ACTIVE restriction.
      if (attr === 'status') continue;
      filters[attr] = value;
    }

    const records = await this.villageModel.findAll({ where: filters as any });

    if (!records.length) {
      return { message: 'Data not found', status: 404 };
    }

    return records.map((r) => this.serializeVillageSearch(r));
  }

  async getById(id: string, opts?: { userId?: string }) {
    const village = await this.villageModel.findByPk(id, {
      include: [
        {
          model: Block,
          include: [{ model: District, include: [{ model: State, include: [Country] }] }],
        },
      ],
    });
    if (!village) return null;

    const plain = village.get({ plain: true }) as unknown as Record<string, unknown>;
    const out = toDjangoKeys(plain);

    // SerializerMethodField parity
    out.image_location = toVillageImageUrlList(plain.imageLocation);
    out.village_video = toFileUrlList(this.configService, plain.villageVideo);

    delete (out as any).map_url;
    (out as any).mapUrl = toMapUrlList(plain.mapUrl);

    const userId = opts?.userId;
    (out as any).user_id = userId ?? null;

    const connections = await this.connectModel.findAll({
      where: { villageId: id },
      include: [{ model: Register }, { model: Village }, { model: Temple }],
      order: [['createdAt', 'DESC']],
    });

    (out as any).Connections = connections.map((c) => this.serializeConnectForVillage(c));

    if (userId) {
      const myConnection = connections.find((c) => (c as any).userId === userId);
      (out as any).connectionId = myConnection?.id ?? null;
      (out as any).isvillagemember = connections.some((c) => (c as any).userId === userId);
      (out as any).ismember = connections.some((c) => (c as any).userId === userId && c.connectedAs === ConnectedAs.MEMBER);
      (out as any).ispujari = connections.some((c) => (c as any).userId === userId && c.connectedAs === ConnectedAs.PUJARI);
      (out as any).isvolunteer = connections.some((c) => (c as any).userId === userId && c.connectedAs === ConnectedAs.VOLUNTARY);
    } else {
      (out as any).connectionId = null;
      (out as any).isvillagemember = false;
      (out as any).ismember = false;
      (out as any).ispujari = false;
      (out as any).isvolunteer = false;
    }

    const block = (village as any).block as Block | undefined;
    if (block && (block as any).district && ((block as any).district as any).state && (((block as any).district as any).state as any).country) {
      const district = (block as any).district as District;
      const state = (district as any).state as State;
      const country = (state as any).country as Country;
      (out as any).block = {
        id: block.id,
        name: block.name,
        district: {
          districtid: district.id,
          name: district.name,
          state: {
            stateid: state.id,
            name: state.name,
            country: {
              countryid: country.id,
              name: country.name,
            },
          },
        },
      };
    } else {
      (out as any).block = null;
    }

    const temples = await this.templeModel.findAll({
      where: {
        objectId: id,
        status: EntityStatus.ACTIVE,
      },
    });

    const ICONIC_PRIORITY = 'd7df749f-97e8-4635-a211-371c44b3c31f';
    const FAMOUS_PRIORITY = '630f3239-f515-47fb-be8d-db727b9f2174';
    const GRAMDEVATA_CATEGORY = '742ccfe6-d0b5-11ee-84bd-0242ac110002';

    const iconic = temples.filter((t) => t.priorityId === ICONIC_PRIORITY);
    const famous = temples.filter((t) => t.priorityId === FAMOUS_PRIORITY);
    const gramdevata = temples.filter(
      (t) => t.categoryId === GRAMDEVATA_CATEGORY && ![ICONIC_PRIORITY, FAMOUS_PRIORITY].includes(String(t.priority || '')),
    );
    const others = temples.filter(
      (t) =>
        t.categoryId !== GRAMDEVATA_CATEGORY &&
        ![ICONIC_PRIORITY, FAMOUS_PRIORITY].includes(String(t.priority || '')),
    );

    (out as any).iconictemples = iconic.map((t) => this.serializeTempleMini(t));
    (out as any).famoustemples = famous.map((t) => this.serializeTempleMini(t));
    (out as any).gramdeavatatemples = gramdevata.map((t) => this.serializeTempleMini(t));
    (out as any).othertemples = others.map((t) => this.serializeTempleMini(t));

    const geographic = await this.geographicModel.findAll({
      where: { villageId: id, status: EntityStatus.ACTIVE },
      order: [['createdAt', 'DESC']],
    });
    (out as any).geographic = geographic.map((g) => toDjangoKeys(g.get({ plain: true }) as any));

    const famousPerson = await this.famousPersonalityModel.findAll({
      where: { villageId: id, status: EntityStatus.ACTIVE },
      order: [['createdAt', 'DESC']],
    });
    (out as any).famous_personalities = famousPerson.map((fp) => {
      const p = fp.get({ plain: true }) as any;
      const obj = toDjangoKeys(p);
      obj.person_image = toFileUrlList(this.configService, p.personImage);
      return obj;
    });

    const devFacilities = await this.developmentFacilityModel.findAll({
      where: { villageId: id, status: EntityStatus.ACTIVE },
      order: [['createdAt', 'DESC']],
    });
    (out as any).village_development_facilities = devFacilities.map((df) => {
      const p = df.get({ plain: true }) as any;
      const obj = toDjangoKeys(p);
      obj.primarysource_of_livelihood_image = toFileUrlList(this.configService, p.primarysourceOfLivelihoodImage);
      return obj;
    });

    // Keep keys present even if not yet implemented.
    (out as any).goshalas ??= [];
    (out as any).events ??= [];
    (out as any).transport ??= [];
    (out as any).tourismplace ??= [];
    (out as any).welfare_homes ??= [];
    (out as any).nearby_hotels ??= [];
    (out as any).tour_guide ??= [];
    (out as any).touroperator ??= [];
    (out as any).media ??= [];
    (out as any).near_by_hospitals ??= [];
    (out as any).resturents ??= [];
    (out as any).ambulance_facility ??= [];
    (out as any).blood_bank ??= [];
    (out as any).fire_station ??= [];
    (out as any).police_station ??= [];
    (out as any).pooja_stores ??= [];
    (out as any).village_artists ??= [];
    (out as any).village_cultural_profile ??= [];
    (out as any).schools ??= [];
    (out as any).banks ??= [];
    (out as any).colleges ??= [];
    (out as any).markets ??= [];
    (out as any).postoffice ??= [];
    (out as any).sportsground ??= [];

    return out;
  }

  async update(id: string, payload: Record<string, unknown>) {
    const village = await this.villageModel.findByPk(id);
    if (!village) return null;

    const images = coerceList((payload as any).image_location ?? (payload as any).imageLocation);
    const videos = coerceList((payload as any).village_video ?? (payload as any).villageVideo);

    const requestData = this.normalizePayload(payload);
    delete (requestData as any).imageLocation;
    delete (requestData as any).villageVideo;
    await village.update(requestData as CreationAttributes<Village>);

    const savedImages = await saveEntityImagesToAzure({
      configService: this.configService,
      images,
      id: village.id,
      name: village.name,
      entityType: 'village',
    });

    const savedVideos = await saveEntityVideosToAzure({
      configService: this.configService,
      videos,
      id: village.id,
      name: village.name,
      entityType: 'village',
    });

    if (savedImages.length || savedVideos.length) {
      await village.update({
        ...(savedImages.length ? { imageLocation: savedImages } : {}),
        ...(savedVideos.length ? { villageVideo: savedVideos } : {}),
      } as CreationAttributes<Village>);
    }

    return this.serializeVillageSerializer2(village);
  }

  async remove(id: string) {
    const village = await this.villageModel.findByPk(id);
    if (!village) return false;
    await village.destroy();
    return true;
  }
}
