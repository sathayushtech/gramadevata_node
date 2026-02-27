import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ConfigService } from '@nestjs/config';
import type { CreationAttributes } from 'sequelize';
import { VillageCulturalProfile } from '../village-cultural-profile.model';
import { coerceList, normalizeSnakePayload, toDjangoKeys, toFileUrlList } from '../village.serializer';
import { saveEntityImagesToAzure } from '../../../common/utils/gramadevata.utils';

@Injectable()
export class VillageCulturalProfileService {
  constructor(
    @InjectModel(VillageCulturalProfile)
    private readonly model: typeof VillageCulturalProfile,
    private readonly configService: ConfigService,
  ) {}

  private serialize(instance: VillageCulturalProfile) {
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

  private looksLikeBase64(value: string) {
    return value.includes('base64,');
  }

  async list() {
    const records = await this.model.findAll({ order: [['createdAt', 'DESC']] });
    return records.map((r) => this.serialize(r));
  }

  async getById(id: string) {
    const record = await this.model.findByPk(id);
    return record ? this.serialize(record) : null;
  }

  async create(payload: Record<string, unknown>) {
    const religiosBeliefsImages = coerceList(payload.religios_beliefs_image);
    const traditionalFoodImages = coerceList(payload.traditional_food_image);
    const traditionalDressImages = coerceList(payload.traditional_dress_image);
    const traditionalOrnamentsImages = coerceList(payload.traditional_ornaments_image);
    const festivalsImages = coerceList(payload.festivals_image);
    const artFormsImages = coerceList(payload.art_forms_practiced_image);

    const requestData = normalizeSnakePayload(payload);
    // strip any image keys from request data
    delete (requestData as any).religiosBeliefsImage;
    delete (requestData as any).traditionalFoodImage;
    delete (requestData as any).traditionalDressImage;
    delete (requestData as any).traditionalOrnamentsImage;
    delete (requestData as any).festivalsImage;
    delete (requestData as any).artFormsPracticedImage;

    const created = await this.model.create({
      ...(requestData as CreationAttributes<VillageCulturalProfile>),
      religiousbeliefsImage: [],
      traditionalFoodImage: [],
      traditionalDressImage: [],
      traditionalOrnamentsImage: [],
      festivalsImage: [],
      artFormsPracticedImage: [],
    } as CreationAttributes<VillageCulturalProfile>);

    const name = String(created.famousFor || 'village_culture');
    const entityType = 'village_culture';

    const [savedReligios, savedFood, savedDress, savedOrnaments, savedFestivals, savedArtForms] = await Promise.all([
      saveEntityImagesToAzure({
        configService: this.configService,
        images: religiosBeliefsImages,
        id: created.id,
        name,
        entityType,
      }),
      saveEntityImagesToAzure({
        configService: this.configService,
        images: traditionalFoodImages,
        id: created.id,
        name,
        entityType,
      }),
      saveEntityImagesToAzure({
        configService: this.configService,
        images: traditionalDressImages,
        id: created.id,
        name,
        entityType,
      }),
      saveEntityImagesToAzure({
        configService: this.configService,
        images: traditionalOrnamentsImages,
        id: created.id,
        name,
        entityType,
      }),
      saveEntityImagesToAzure({
        configService: this.configService,
        images: festivalsImages,
        id: created.id,
        name,
        entityType,
      }),
      saveEntityImagesToAzure({
        configService: this.configService,
        images: artFormsImages,
        id: created.id,
        name,
        entityType,
      }),
    ]);

    await created.update({
      religiousbeliefsImage: savedReligios,
      traditionalFoodImage: savedFood,
      traditionalDressImage: savedDress,
      traditionalOrnamentsImage: savedOrnaments,
      festivalsImage: savedFestivals,
      artFormsPracticedImage: savedArtForms,
    } as CreationAttributes<VillageCulturalProfile>);

    return this.serialize(created);
  }

  async update(id: string, payload: Record<string, unknown>) {
    const instance = await this.model.findByPk(id);
    if (!instance) return null;

    const requestData = normalizeSnakePayload(payload);

    const incomingReligios = coerceList(payload.religios_beliefs_image);
    const incomingFood = coerceList(payload.traditional_food_image);
    const incomingDress = coerceList(payload.traditional_dress_image);
    const incomingOrnaments = coerceList(payload.traditional_ornaments_image);
    const incomingFestivals = coerceList(payload.festivals_image);
    const incomingArtForms = coerceList(payload.art_forms_practiced_image);

    delete (requestData as any).religiosBeliefsImage;
    delete (requestData as any).traditionalFoodImage;
    delete (requestData as any).traditionalDressImage;
    delete (requestData as any).traditionalOrnamentsImage;
    delete (requestData as any).festivalsImage;
    delete (requestData as any).artFormsPracticedImage;

    await instance.update(requestData as CreationAttributes<VillageCulturalProfile>);

    const name = String(instance.famousFor || 'village_culture');
    const entityType = 'village_culture';

    const processField = async (values: string[]) => {
      if (!values.length) return null;
      if (values.some((x) => this.looksLikeBase64(x))) {
        return saveEntityImagesToAzure({
          configService: this.configService,
          images: values,
          id: instance.id,
          name,
          entityType,
        });
      }
      return values;
    };

    const [savedReligios, savedFood, savedDress, savedOrnaments, savedFestivals, savedArtForms] = await Promise.all([
      processField(incomingReligios),
      processField(incomingFood),
      processField(incomingDress),
      processField(incomingOrnaments),
      processField(incomingFestivals),
      processField(incomingArtForms),
    ]);

    const updateData: Record<string, unknown> = {};
    if (savedReligios) updateData.religiousbeliefsImage = savedReligios;
    if (savedFood) updateData.traditionalFoodImage = savedFood;
    if (savedDress) updateData.traditionalDressImage = savedDress;
    if (savedOrnaments) updateData.traditionalOrnamentsImage = savedOrnaments;
    if (savedFestivals) updateData.festivalsImage = savedFestivals;
    if (savedArtForms) updateData.artFormsPracticedImage = savedArtForms;

    if (Object.keys(updateData).length) {
      await instance.update(updateData as CreationAttributes<VillageCulturalProfile>);
    }

    return this.serialize(instance);
  }

  async remove(id: string) {
    const instance = await this.model.findByPk(id);
    if (!instance) return false;
    await instance.destroy();
    return true;
  }
}
