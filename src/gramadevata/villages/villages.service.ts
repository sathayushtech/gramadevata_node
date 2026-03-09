import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ConfigService } from '@nestjs/config';
import { Village } from './village.model';
import { Op, col, fn, where, literal } from 'sequelize';
import type { CreationAttributes } from 'sequelize';
import { EntityStatus, ConnectedAs } from '../../common/enums';
import { coerceList, formatTimesinceAgo, toDjangoKeys, toFileUrlList, toFirstImageFileUrl, toMapUrlList, toVillageImageUrlList } from './village.serializer';
import { saveEntityImagesToAzure, saveEntityVideosToAzure } from '../../common/utils/gramadevata.utils';
import { Register } from '../auth/user.model';
import { Geographic } from './village-geographic.model';
import { VillageFamousPersonality } from './village-famous-personality.model';
import { VillageDevelopmentFacility } from './village-development-facility.model';
import { VillageSchool } from './village-school.model';
import { VillageBank } from './village-bank.model';
import { VillageCollege } from './village-college.model';
import { VillageCulturalProfile } from './village-cultural-profile.model';
import { VillageArtist } from './village-artist.model';
import { VillageMarket } from './village-market.model';
import { VillagePostOffice } from './village-post-office.model';
import { VillageSportsground } from './village-sportsground.model';
import { Connect } from '../connect/connect.model';
import { Temple } from '../temple/temple.model';
import { Block } from '../block/block.model';
import { District } from '../../common/models/district.model';
import { State } from '../../common/models/state.model';
import { Country } from '../../common/models/country.model';

@Injectable()
export class VillagesService {

  private static readonly locationCache = new Map<
    string,
    { expiresAt: number; payload: Record<string, unknown> }
  >();
  
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
    @InjectModel(VillageSchool)
    private readonly villageSchoolModel: typeof VillageSchool,
    @InjectModel(VillageBank)
    private readonly villageBankModel: typeof VillageBank,
    @InjectModel(VillageCollege)
    private readonly villageCollegeModel: typeof VillageCollege,
    @InjectModel(VillageCulturalProfile)
    private readonly villageCulturalProfileModel: typeof VillageCulturalProfile,
    @InjectModel(VillageArtist)
    private readonly villageArtistModel: typeof VillageArtist,
    @InjectModel(VillageMarket)
    private readonly villageMarketModel: typeof VillageMarket,
    @InjectModel(VillagePostOffice)
    private readonly villagePostOfficeModel: typeof VillagePostOffice,
    @InjectModel(VillageSportsground)
    private readonly villageSportsgroundModel: typeof VillageSportsground,
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

  private serializeSchoolSummary(instance: VillageSchool) {
    const plain = instance.get({ plain: true }) as unknown as Record<string, unknown>;
    const out = toDjangoKeys(plain);
    out.image_location = toFileUrlList(this.configService, plain.imageLocation);
    return {
      _id: out._id,
      name: out.name,
      address: out.address,
      map_location: out.map_location,
      desc: out.desc,
      image_location: out.image_location,
      contact_number: out.contact_number,
      email_id: out.email_id,
      school_type: out.school_type,
    };
  }

  private serializeBankSummary(instance: VillageBank) {
    const plain = instance.get({ plain: true }) as unknown as Record<string, unknown>;
    const out = toDjangoKeys(plain);
    out.image_location = toFileUrlList(this.configService, plain.imageLocation);
    return {
      _id: out._id,
      name: out.name,
      address: out.address,
      map_location: out.map_location,
      bank_type: out.bank_type,
      manager_name: out.manager_name,
      image_location: out.image_location,
      contact_number: out.contact_number,
      email_id: out.email_id,
    };
  }

  private serializeCollegeSummary(instance: VillageCollege) {
    const plain = instance.get({ plain: true }) as unknown as Record<string, unknown>;
    const out = toDjangoKeys(plain);
    out.image_location = toFileUrlList(this.configService, plain.imageLocation);
    return {
      _id: out._id,
      name: out.name,
      address: out.address,
      map_location: out.map_location,
      desc: out.desc,
      image_location: out.image_location,
      contact_number: out.contact_number,
      email_id: out.email_id,
      college_type: out.college_type,
    };
  }

  private serializeVillageArtist(instance: VillageArtist) {
    const plain = instance.get({ plain: true }) as unknown as Record<string, unknown>;
    const out = toDjangoKeys(plain);
    out.artist_image = toFileUrlList(this.configService, plain.artistImage);
    out.traditional_occupation_pics = toFileUrlList(this.configService, plain.traditionalOccupationPics);
    out.traditional_occupation_video = toFileUrlList(this.configService, plain.traditionalOccupationVideo);
    out.trained_under_pics = toFileUrlList(this.configService, plain.trainedUnderPics);
    out.audio_recordings = toFileUrlList(this.configService, plain.audioRecordings);
    return out;
  }

  private serializeVillageCulturalProfile(instance: VillageCulturalProfile) {
    const plain = instance.get({ plain: true }) as unknown as Record<string, unknown>;
    const out = toDjangoKeys(plain, {
      rename: {
        religiousbeliefsImage: 'religios_beliefs_image',
      },
    });

    out.religios_beliefs_image = toFileUrlList(this.configService, plain.religiousbeliefsImage);
    out.traditional_food_image = toFileUrlList(this.configService, plain.traditionalFoodImage);
    out.traditional_dress_image = toFileUrlList(this.configService, plain.traditionalDressImage);
    out.traditional_ornaments_image = toFileUrlList(this.configService, plain.traditionalOrnamentsImage);
    out.festivals_image = toFileUrlList(this.configService, plain.festivalsImage);
    out.art_forms_practiced_image = toFileUrlList(this.configService, plain.artFormsPracticedImage);

    return out;
  }

  private serializeMarketSummary(instance: VillageMarket) {
    const plain = instance.get({ plain: true }) as unknown as Record<string, unknown>;
    const out = toDjangoKeys(plain);
    out.image_location = toFileUrlList(this.configService, plain.imageLocation);
    return {
      _id: out._id,
      name: out.name,
      address: out.address,
      map_location: out.map_location,
      desc: out.desc,
      image_location: out.image_location,
      contact_number: out.contact_number,
      email_id: out.email_id,
    };
  }

  private serializePostOfficeSummary(instance: VillagePostOffice) {
    const plain = instance.get({ plain: true }) as unknown as Record<string, unknown>;
    const out = toDjangoKeys(plain);
    out.image_location = toFileUrlList(this.configService, plain.imageLocation);
    return {
      _id: out._id,
      name: out.name,
      branch_name: out.branch_name,
      address: out.address,
      map_location: out.map_location,
      desc: out.desc,
      image_location: out.image_location,
      contact_number: out.contact_number,
      email_id: out.email_id,
    };
  }

  private serializeSportsgroundSummary(instance: VillageSportsground) {
    const plain = instance.get({ plain: true }) as unknown as Record<string, unknown>;
    const out = toDjangoKeys(plain);
    out.image_location = toFileUrlList(this.configService, plain.imageLocation);
    return {
      _id: out._id,
      image_location: out.image_location,
      desc: out.desc,
      map_location: out.map_location,
      address: out.address,
      name: out.name,
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

    const [artists, culturalProfiles, schools, banks, colleges, markets, postoffice, sportsground] = await Promise.all([
      this.villageArtistModel.findAll({
        where: { villageId: id, status: EntityStatus.ACTIVE },
        order: [['createdAt', 'DESC']],
      }),
      this.villageCulturalProfileModel.findAll({
        where: { villageId: id, status: EntityStatus.ACTIVE },
        order: [['createdAt', 'DESC']],
      }),
      this.villageSchoolModel.findAll({
        where: { villageId: id, status: EntityStatus.ACTIVE },
        order: [['createdAt', 'DESC']],
      }),
      this.villageBankModel.findAll({
        where: { villageId: id, status: EntityStatus.ACTIVE },
        order: [['createdAt', 'DESC']],
      }),
      this.villageCollegeModel.findAll({
        where: { villageId: id, status: EntityStatus.ACTIVE },
        order: [['createdAt', 'DESC']],
      }),
      this.villageMarketModel.findAll({
        where: { villageId: id, status: EntityStatus.ACTIVE },
        order: [['createdAt', 'DESC']],
      }),
      this.villagePostOfficeModel.findAll({
        where: { villageId: id, status: EntityStatus.ACTIVE },
        order: [['createdAt', 'DESC']],
      }),
      this.villageSportsgroundModel.findAll({
        where: { villageId: id, status: EntityStatus.ACTIVE },
        order: [['createdAt', 'DESC']],
      }),
    ]);

    (out as any).village_artists = artists.map((a) => this.serializeVillageArtist(a));
    (out as any).village_cultural_profile = culturalProfiles.map((cp) => this.serializeVillageCulturalProfile(cp));
    (out as any).schools = schools.map((s) => this.serializeSchoolSummary(s));
    (out as any).banks = banks.map((b) => this.serializeBankSummary(b));
    (out as any).colleges = colleges.map((c) => this.serializeCollegeSummary(c));
    (out as any).markets = markets.map((m) => this.serializeMarketSummary(m));
    (out as any).postoffice = postoffice.map((po) => this.serializePostOfficeSummary(po));
    (out as any).sportsground = sportsground.map((sg) => this.serializeSportsgroundSummary(sg));

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

  async searchVillage(query: Record<string, string | undefined>) {
    const villageName = query.village_name;
    if (!villageName) {
      return [];
    }

    const countryId = query.country_id;
    const stateId = query.state_id;
    const districtId = query.district_id;

    const nameWhere = where(fn('lower', col('Village.name')), String(villageName).toLowerCase());

    const include: any[] = [
      {
        model: Block,
        required: true,
        include: [
          {
            model: District,
            required: true,
            include: [
              {
                model: State,
                required: true,
                include: [
                  {
                    model: Country,
                    required: true,
                    ...(countryId ? { where: { id: countryId } } : {}),
                  },
                ],
                ...(stateId ? { where: { id: stateId } } : {}),
              },
            ],
            ...(districtId ? { where: { id: districtId } } : {}),
          },
        ],
      },
    ];

    const count = await this.villageModel.count({
      where: nameWhere as any,
      include,
      distinct: true,
    });

    if (count > 10 && !countryId) {
      const countries = await this.villageModel.findAll({
        attributes: [
          [col('block.district.state.country.id'), 'block__district__state__country__pk'],
          [col('block.district.state.country.name'), 'block__district__state__country__name'],
        ],
        where: nameWhere as any,
        include,
        group: ['block.district.state.country.id', 'block.district.state.country.name'],
        raw: true,
      });
      return {
        message: 'There are more than 10 exact matches. Please narrow your search by selecting a country.',
        countries,
      };
    }

    if (count > 10 && !stateId) {
      const states = await this.villageModel.findAll({
        attributes: [
          [col('block.district.state.id'), 'block__district__state__pk'],
          [col('block.district.state.name'), 'block__district__state__name'],
        ],
        where: nameWhere as any,
        include,
        group: ['block.district.state.id', 'block.district.state.name'],
        raw: true,
      });
      return {
        message: 'There are more than 10 exact matches. Please narrow your search by selecting a state.',
        states,
      };
    }

    if (count > 10 && !districtId) {
      const districts = await this.villageModel.findAll({
        attributes: [
          [col('block.district.id'), 'block__district__pk'],
          [col('block.district.name'), 'block__district__name'],
        ],
        where: nameWhere as any,
        include,
        group: ['block.district.id', 'block.district.name'],
        raw: true,
      });
      return {
        message: 'There are more than 10 exact matches. Please narrow your search by selecting a district.',
        districts,
      };
    }

    const villages = await this.villageModel.findAll({
      where: nameWhere as any,
      include,
    });

    return villages.map((v) => this.serializeVillageSearch(v));
  }

  async listInactiveVillages(query: Record<string, string | undefined>) {
    const filterKw: Record<string, unknown> = {};
    const search = query.search;

    for (const [key, value] of Object.entries(query)) {
      if (key === 'search') continue;
      if (key === 'page' || key === 'page_size') continue;
      if (value === undefined) continue;
      const attr = this.snakeToCamel(key);
      filterKw[attr] = value;
    }

    const whereClause: Record<string, unknown> = {
      ...filterKw,
      status: EntityStatus.INACTIVE,
    };

    if (search) {
      whereClause.name = { [Op.like]: `%${search}%` };
    }

    const villages = await this.villageModel.findAll({
      where: whereClause as any,
      order: [['createdAt', 'DESC']],
    });

    if (!villages.length) {
      return { message: 'Data not found', status: 404 };
    }

    const serialized = await Promise.all(villages.map((v) => this.serializeVillageSerializer2(v)));
    return { count: villages.length, villages: serialized };
  }

  async getInactiveVillagesByField(fieldName: string, inputValue: string) {
    try {
      const rawAttributes = (this.villageModel as any).rawAttributes || (this.villageModel as any).getAttributes?.() || {};
      const allowedFields = new Set(Object.keys(rawAttributes));

      const resolved = fieldName === '_id' ? 'id' : this.snakeToCamel(fieldName);
      if (!allowedFields.has(resolved)) {
        return { message: `Invalid field name: '${fieldName}'`, status: 400 };
      }

      const villages = await this.villageModel.findAll({
        where: { [resolved]: inputValue, status: EntityStatus.INACTIVE } as any,
      });

      if (!villages.length) {
        return { message: 'Village not found', status: 404 };
      }

      const detailed = await Promise.all(villages.map((v) => this.getById(v.id, {})));
      return detailed.filter(Boolean);
    } catch (e: any) {
      return {
        message: 'Something went wrong',
        error: String(e?.message || e),
        status: 500,
      };
    }
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

  async getByLocation(
    query: Record<string, string | undefined>,
    baseUrl?: string
  ): Promise<Record<string, unknown>> {
    const inputValue = query.input_value;
    const search = (query.search ?? '').trim();

    if (!inputValue) {
      throw new BadRequestException('input_value is required');
    }

    const cacheKey = this.buildCacheKey(baseUrl, query);
    const cached = VillagesService.locationCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.payload;
    }

    const page = this.normalizePage(query.page ?? query.page_no);
    const pageSize = 20;
    const offset = (page - 1) * pageSize;

    const where: Record<string, unknown> & { [Op.or]?: unknown; [Op.and]?: unknown } = {
      status: 'ACTIVE',
      [Op.or]: [
        { '$block.district.state.country.id$': inputValue },
        { '$block.district.state.id$': inputValue },
        { '$block.district.id$': inputValue },
        { '$block.id$': inputValue },
      ],
    };

    if (search) {
      if (search.length >= 4) {
        where[Op.and] = [
          literal(`MATCH(village.name) AGAINST ('${search.replace(/'/g, "''")}*' IN BOOLEAN MODE)`),
        ];
      } else {
        where.name = { [Op.like]: `%${search}%` };
      }
    }

    const { count, rows } = await this.villageModel.findAndCountAll({
      where,
      include: this.getLocationInclude(),
      attributes: ['id', 'name', 'imageLocation', 'blockId', 'precedence'],
      order: [
        [literal('CASE WHEN precedence IS NULL OR precedence = 0 THEN 9999 ELSE precedence END'), 'ASC'],
        ['name', 'ASC'],
      ],
      limit: pageSize,
      offset,
    });

    const results = rows.map((village) => this.toLocationResponse(village));

    const response = this.buildFastPaginationResponse({
      count,
      page,
      pageSize,
      results,
      baseUrl,
      query,
    });

    VillagesService.locationCache.set(cacheKey, {
      expiresAt: Date.now() + 600 * 1000,
      payload: response,
    });

    return response;
  }

  private getLocationInclude() {
    return [
      {
        model: Block,
        required: true,
        include: [
          {
            model: District,
            required: true,
            include: [
              {
                model: State,
                required: true,
                include: [{ model: Country, required: true }],
              },
            ],
          },
        ],
      },
    ];
  }

  private toLocationResponse(village: Village) {
    const plain = village.get({ plain: true }) as Village & { block?: Block };
    const block = plain.block as Block | undefined;
    const district = block?.district as District | undefined;
    const state = district?.state as State | undefined;
    const country = state?.country as Country | undefined;

    return {
      _id: plain.id,
      name: plain.name ?? null,
      image_location: this.mapFileList(plain.imageLocation),
      location_hierarchy: block && district && state && country
        ? {
            village_id: plain.id,
            village_name: plain.name ?? null,
            block: {
              block_id: block.id,
              block_name: block.name,
              district: {
                district_id: district.id,
                district_name: district.name,
                state: {
                  state_id: state.id,
                  state_name: state.name,
                  country: {
                    country_id: country.id,
                    country_name: country.name,
                  },
                },
              },
            },
          }
        : null,
    };
  }

  private mapFileList(raw: unknown) {
    const list = this.parseList(raw);
    const base = this.configService.get<string>('File_path')
      || this.configService.get<string>('FILE_URL')
      || '';
    if (!base) {
      return list;
    }
    const trimmed = base.endsWith('/') ? base : `${base}/`;
    return list.map((path) => `${trimmed}${path.replace(/^\/+/, '')}`);
  }

  private parseList(raw: unknown): string[] {
    if (!raw) {
      return [];
    }

    if (Array.isArray(raw)) {
      return raw.map((item) => String(item).trim()).filter(Boolean);
    }

    if (typeof raw === 'string') {
      return raw
        .replace(/\[|\]/g, '')
        .split(',')
        .map((item) => item.replace(/['\"]+/g, '').trim())
        .filter(Boolean);
    }

    return [];
  }

  private buildFastPaginationResponse(params: {
    count: number;
    page: number;
    pageSize: number;
    results: Record<string, unknown>[];
    baseUrl?: string;
    query: Record<string, string | undefined>;
  }) {
    const { count, page, pageSize, results, baseUrl, query } = params;
    const totalPages = Math.ceil(count / pageSize) || 1;
    const nextPage = page < totalPages ? page + 1 : null;
    const prevPage = page > 1 ? page - 1 : null;

    const next = nextPage ? this.buildPageLink(baseUrl, query, nextPage) : null;
    const previous = prevPage ? this.buildPageLink(baseUrl, query, prevPage) : null;

    return {
      next,
      previous,
      results,
    };
  }

  private buildPageLink(
    baseUrl: string | undefined,
    query: Record<string, string | undefined>,
    page: number
  ) {
    if (!baseUrl) {
      return page;
    }

    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (!value) {
        return;
      }
      if (key === 'page' || key === 'page_no') {
        return;
      }
      params.set(key, value);
    });

    params.set('page', String(page));
    return `${baseUrl}?${params.toString()}`;
  }

  private normalizePage(value?: string) {
    const page = Number.parseInt(value ?? '1', 10);
    return Number.isNaN(page) || page < 1 ? 1 : page;
  }

  private buildCacheKey(baseUrl: string | undefined, query: Record<string, string | undefined>) {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (!value) {
        return;
      }
      params.set(key, value);
    });
    return `${baseUrl ?? 'villages_by_location'}?${params.toString()}`;
  }
}
