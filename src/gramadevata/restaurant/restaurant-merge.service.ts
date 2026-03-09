import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { AddRestaurantDetails } from './add-restaurant-details.model';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RestaurantMergeService {
  constructor(
    @InjectModel(AddRestaurantDetails)
    private readonly addRestaurantModel: typeof AddRestaurantDetails,
    private readonly configService: ConfigService,
  ) {}

  async mergeRestaurantDetails(restaurantId: string, payload: Record<string, unknown>): Promise<{ status: number; body: Record<string, unknown> }> {
    try {
      const restaurant = await this.addRestaurantModel.findByPk(restaurantId);
      if (!restaurant) {
        return { status: 404, body: { message: 'Restaurant not found' } };
      }

      const newDesc = typeof payload.desc === 'string' ? payload.desc.trim() : '';
      const newImages = this.parseListField(payload.image_location ?? payload.imageLocation);
      const newVideos = this.parseListField(payload.event_video ?? payload.eventVideo);
      const newMapLocation = this.cleanMapLocation(payload.map_location ?? payload.mapLocation);

      const oldDesc = '';
      const oldImages = this.parseListField(restaurant.imageLocation);
      const oldVideos = this.parseListField((restaurant as AddRestaurantDetails).eventVideo ?? []);
      const oldMapLocation = this.cleanMapLocation(restaurant.mapLocation);

      const duplicates = await this.addRestaurantModel.findAll({
        where: {
          name: { [Op.like]: restaurant.name ?? '' },
          id: { [Op.ne]: restaurant.id },
        },
      });

      const allDescs: string[] = [];
      const allImages: string[] = [];
      const allVideos: string[] = [];
      const allMapLocations: string[] = [];

      for (const detail of duplicates) {
        allImages.push(...this.parseListField(detail.imageLocation));
        allVideos.push(...this.parseListField((detail as AddRestaurantDetails).eventVideo ?? []));
        allMapLocations.push(...this.cleanMapLocation(detail.mapLocation));
      }

      const mergedDesc = this.uniqueStrings([oldDesc, ...allDescs, newDesc].filter(Boolean)).join(', ');
      const mergedImages = this.uniqueStrings([...oldImages, ...allImages, ...newImages]);
      const mergedVideos = this.uniqueStrings([...oldVideos, ...allVideos, ...newVideos]);
      const mergedMapLocation = this.uniqueStrings([
        ...oldMapLocation,
        ...allMapLocations,
        ...newMapLocation,
      ]);

      restaurant.imageLocation = mergedImages;
      restaurant.mapLocation = JSON.stringify(mergedMapLocation);
      restaurant.eventVideo = mergedVideos;
      restaurant.status = 'ACTIVE';
      await restaurant.save();

      if (duplicates.length) {
        await this.addRestaurantModel.destroy({ where: { id: { [Op.in]: duplicates.map((item) => item.id) } } });
      }

      const base = (this.configService.get<string>('FILE_URL')
        || this.configService.get<string>('File_path')
        || '').replace(/\/+$/, '');
      const baseUrl = base ? `${base}/` : '';

      return {
        status: 200,
        body: {
          restaurant_id: restaurant.id,
          name: restaurant.name,
          desc: mergedDesc,
          image_location: mergedImages.map((img) => `${baseUrl}${img}`),
          event_video: mergedVideos.map((vid) => `${baseUrl}${vid}`),
          map_location: mergedMapLocation,
          status: 'ACTIVE',
        },
      };
    } catch (error) {
      return {
        status: 500,
        body: { message: 'Error occurred', error: error instanceof Error ? error.message : String(error) },
      };
    }
  }

  private parseListField(raw: unknown): string[] {
    if (Array.isArray(raw)) {
      return raw.map((item) => String(item).trim()).filter(Boolean);
    }

    if (!raw) {
      return [];
    }

    if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.map((item) => String(item).trim()).filter(Boolean);
        }
      } catch {
        // ignore
      }

      return raw
        .replace(/\[|\]/g, '')
        .split(',')
        .map((item) => item.replace(/['\"]+/g, '').trim())
        .filter(Boolean);
    }

    return [];
  }

  private cleanMapLocation(raw: unknown): string[] {
    const results: string[] = [];

    const ingest = (value: unknown) => {
      if (!value) {
        return;
      }
      if (Array.isArray(value)) {
        value.forEach((item) => ingest(item));
        return;
      }
      if (typeof value !== 'string') {
        return;
      }

      const trimmed = value.trim();
      if (!trimmed) {
        return;
      }

      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        try {
          const parsed = JSON.parse(trimmed);
          ingest(parsed);
          return;
        } catch {
          // ignore
        }
      }

      const cleaned = trimmed.replace(/\\/g, '').replace(/^["']+|["']+$/g, '');
      const match = cleaned.match(/https:\/\/maps\.app\.goo\.gl\/\S+/);
      if (match) {
        results.push(match[0]);
      }
    };

    ingest(raw);

    return this.uniqueStrings(results);
  }

  private uniqueStrings(values: string[]) {
    const unique = new Set<string>();
    values.forEach((value) => {
      if (value) {
        unique.add(value);
      }
    });
    return Array.from(unique);
  }
}