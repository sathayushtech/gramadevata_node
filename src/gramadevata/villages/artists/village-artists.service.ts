import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ConfigService } from '@nestjs/config';
import type { CreationAttributes } from 'sequelize';
import { VillageArtist } from '../village-artist.model';
import { coerceList, normalizeSnakePayload, toDjangoKeys, toFileUrlList } from '../village.serializer';
import {
  formatDjangoDateTime,
  saveEntityAudiosToAzure,
  saveEntityImagesToAzure,
  saveEntityVideosToAzure,
  sendAdminEmail,
} from '../../../common/utils/gramadevata.utils';

@Injectable()
export class VillageArtistsService {
  constructor(
    @InjectModel(VillageArtist)
    private readonly model: typeof VillageArtist,
    private readonly configService: ConfigService,
  ) {}

  private serialize(instance: VillageArtist) {
    const plain = instance.get({ plain: true }) as unknown as Record<string, unknown>;
    const out = toDjangoKeys(plain);
    out.artist_image = toFileUrlList(this.configService, plain.artistImage);
    out.traditional_occupation_pics = toFileUrlList(this.configService, plain.traditionalOccupationPics);
    out.traditional_occupation_video = toFileUrlList(this.configService, plain.traditionalOccupationVideo);
    out.trained_under_pics = toFileUrlList(this.configService, plain.trainedUnderPics);
    out.audio_recordings = toFileUrlList(this.configService, plain.audioRecordings);
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

  async create(payload: Record<string, unknown>, opts: { userId?: string }) {
    const artistImages = coerceList(payload.artist_image);
    const occupationPics = coerceList(payload.traditional_occupation_pics);
    const occupationVideos = coerceList(payload.traditional_occupation_video);
    const trainedUnderPics = coerceList(payload.trained_under_pics);
    const audioRecordings = coerceList(payload.audio_recordings);

    const requestData = normalizeSnakePayload(payload);
    delete (requestData as any).artistImage;
    delete (requestData as any).traditionalOccupationPics;
    delete (requestData as any).traditionalOccupationVideo;
    delete (requestData as any).trainedUnderPics;
    delete (requestData as any).audioRecordings;

    const created = await this.model.create({
      ...(requestData as CreationAttributes<VillageArtist>),
      artistImage: [],
      traditionalOccupationPics: [],
      traditionalOccupationVideo: [],
      trainedUnderPics: [],
      audioRecordings: [],
    } as CreationAttributes<VillageArtist>);

    const entityRoot = 'village_artist';
    const artistName = String(created.artistName || 'Unknown');

    const [savedArtist, savedOccPics, savedOccVideos, savedTrained, savedAudio] = await Promise.all([
      saveEntityImagesToAzure({
        configService: this.configService,
        images: artistImages,
        id: created.id,
        name: artistName,
        entityType: `${entityRoot}/artist_image`,
      }),
      saveEntityImagesToAzure({
        configService: this.configService,
        images: occupationPics,
        id: created.id,
        name: artistName,
        entityType: `${entityRoot}/traditional_occupation_pics`,
      }),
      saveEntityVideosToAzure({
        configService: this.configService,
        videos: occupationVideos,
        id: created.id,
        name: artistName,
        entityType: `${entityRoot}/traditional_occupation_video`,
      }),
      saveEntityImagesToAzure({
        configService: this.configService,
        images: trainedUnderPics,
        id: created.id,
        name: artistName,
        entityType: `${entityRoot}/trained_under_pics`,
      }),
      saveEntityAudiosToAzure({
        configService: this.configService,
        audios: audioRecordings,
        id: created.id,
        name: artistName,
        entityType: `${entityRoot}/audio_recordings`,
      }),
    ]);

    await created.update({
      artistImage: savedArtist,
      traditionalOccupationPics: savedOccPics,
      traditionalOccupationVideo: savedOccVideos,
      trainedUnderPics: savedTrained,
      audioRecordings: savedAudio,
    } as CreationAttributes<VillageArtist>);

    const recipient = this.configService.get<string>('EMAIL_HOST_USER');
    await sendAdminEmail(this.configService, {
      subject: 'New Village Artist Added',
      text:
        `User ID: ${opts.userId ?? ''}\n` +
        `Created Time: ${formatDjangoDateTime(new Date())}\n` +
        `Artist ID: ${created.id}\n` +
        `Artist Name: ${created.artistName ?? ''}`,
      recipients: recipient ? [recipient] : [],
    });

    return { message: 'success', result: this.serialize(created) };
  }

  async update(id: string, payload: Record<string, unknown>) {
    const instance = await this.model.findByPk(id);
    if (!instance) return null;

    const requestData = normalizeSnakePayload(payload);

    const artistImages = coerceList(payload.artist_image);
    const occupationPics = coerceList(payload.traditional_occupation_pics);
    const occupationVideos = coerceList(payload.traditional_occupation_video);
    const trainedUnderPics = coerceList(payload.trained_under_pics);
    const audioRecordings = coerceList(payload.audio_recordings);

    delete (requestData as any).artistImage;
    delete (requestData as any).traditionalOccupationPics;
    delete (requestData as any).traditionalOccupationVideo;
    delete (requestData as any).trainedUnderPics;
    delete (requestData as any).audioRecordings;

    await instance.update(requestData as CreationAttributes<VillageArtist>);

    const entityRoot = 'village_artist';
    const artistName = String(instance.artistName || 'Unknown');

    const processImages = async (values: string[], entityType: string) => {
      if (!values.length) return null;
      if (values.some((x) => this.looksLikeBase64(x))) {
        return saveEntityImagesToAzure({
          configService: this.configService,
          images: values,
          id: instance.id,
          name: artistName,
          entityType,
        });
      }
      return values;
    };

    const processVideos = async (values: string[], entityType: string) => {
      if (!values.length) return null;
      if (values.some((x) => this.looksLikeBase64(x))) {
        return saveEntityVideosToAzure({
          configService: this.configService,
          videos: values,
          id: instance.id,
          name: artistName,
          entityType,
        });
      }
      return values;
    };

    const processAudios = async (values: string[], entityType: string) => {
      if (!values.length) return null;
      if (values.some((x) => this.looksLikeBase64(x))) {
        return saveEntityAudiosToAzure({
          configService: this.configService,
          audios: values,
          id: instance.id,
          name: artistName,
          entityType,
        });
      }
      return values;
    };

    const [savedArtist, savedOccPics, savedOccVideos, savedTrained, savedAudio] = await Promise.all([
      processImages(artistImages, `${entityRoot}/artist_image`),
      processImages(occupationPics, `${entityRoot}/traditional_occupation_pics`),
      processVideos(occupationVideos, `${entityRoot}/traditional_occupation_video`),
      processImages(trainedUnderPics, `${entityRoot}/trained_under_pics`),
      processAudios(audioRecordings, `${entityRoot}/audio_recordings`),
    ]);

    const updateData: Record<string, unknown> = {};
    if (savedArtist) updateData.artistImage = savedArtist;
    if (savedOccPics) updateData.traditionalOccupationPics = savedOccPics;
    if (savedOccVideos) updateData.traditionalOccupationVideo = savedOccVideos;
    if (savedTrained) updateData.trainedUnderPics = savedTrained;
    if (savedAudio) updateData.audioRecordings = savedAudio;

    if (Object.keys(updateData).length) {
      await instance.update(updateData as CreationAttributes<VillageArtist>);
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
