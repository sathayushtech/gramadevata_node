import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/sequelize';
import { Temple } from './temple.model';
import { AddTempleDetails } from './add-temple-details.model';
import { TempleNearbyHotel } from '../events/temple-nearby-hotel.model';
import { AddMoreHotel } from '../hotel/add-hotel.model';

@Injectable()
export class TempleMergeService {
  constructor(
    @InjectModel(Temple) private readonly templeModel: typeof Temple,
    @InjectModel(AddTempleDetails) private readonly addDetailsModel: typeof AddTempleDetails,
    @InjectModel(TempleNearbyHotel) private readonly hotelModel: typeof TempleNearbyHotel,
    @InjectModel(AddMoreHotel) private readonly addMoreHotelModel: typeof AddMoreHotel,
    private readonly configService: ConfigService,
  ) {}

  /**
   * PUT /templemerge/:templeId
   * Merges all AddTempleDetails into the parent Temple, sets status to ACTIVE,
   * replaces old details with a consolidated one.
   */
  async mergeTempleDetails(
    templeId: string,
    payload: Record<string, unknown>,
  ): Promise<{ status: number; body: Record<string, unknown> }> {
    try {
      const newDesc = typeof payload.desc === 'string' ? payload.desc.trim() : '';
      const newImages = this.parseImages(payload.image_location);

      const temple = await this.templeModel.findOne({ where: { id: templeId } });
      if (!temple) {
        return { status: 404, body: { message: 'Temple not found' } };
      }

      // Old data
      const oldDesc = (temple.desc ?? '').trim();
      const oldImgs = this.parseImages(temple.imageLocation);

      // Existing AddTempleDetails
      const allDetails = await this.addDetailsModel.findAll({ where: { templeId } });

      const allDescs: string[] = [];
      const allImgs: string[] = [];
      for (const d of allDetails) {
        if (d.desc) allDescs.push(d.desc.trim());
        allImgs.push(...this.parseImages(d.imageLocation));
      }

      // Merge (deduplicate, preserve order)
      const mergedDesc = [...new Set([oldDesc, ...allDescs, newDesc].filter(Boolean))].join(', ');
      const mergedPaths = [...new Set([...oldImgs, ...allImgs, ...newImages])];

      const fileUrl = this.getFileUrl();
      const fullUrls = mergedPaths.map((p) => `${fileUrl}${p}`);

      // Save to temple (auto-activate)
      temple.desc = mergedDesc;
      temple.imageLocation = mergedPaths;
      temple.status = 'ACTIVE';
      await temple.save();

      // Replace old AddTempleDetails
      await this.addDetailsModel.destroy({ where: { templeId } });
      await this.addDetailsModel.create({
        templeId,
        desc: mergedDesc,
        imageLocation: mergedPaths,
        status: 'ACTIVE',
      } as any);

      return {
        status: 200,
        body: {
          temple_id: temple.id,
          name: temple.name ?? null,
          desc: mergedDesc,
          image_location: fullUrls,
          status: 'ACTIVE',
        },
      };
    } catch (error) {
      return {
        status: 500,
        body: {
          message: 'Error occurred',
          details: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }

  /**
   * PUT /temple_hotel_merge/:hotelId
   * Merges all AddMoreHotel into the parent TempleNearbyHotel, sets status to ACTIVE.
   */
  async mergeHotelDetails(
    hotelId: string,
    payload: Record<string, unknown>,
  ): Promise<{ status: number; body: Record<string, unknown> }> {
    try {
      const hotel = await this.hotelModel.findOne({ where: { id: hotelId } });
      if (!hotel) {
        return { status: 404, body: { message: 'Hotel not found' } };
      }

      const newDesc = typeof payload.desc === 'string' ? payload.desc.trim() : '';
      const newImages = this.parseImages(payload.image_location);
      const newMapLocations = this.cleanMapLocations(payload.map_location);

      // Old hotel data
      const oldDesc = (hotel as any).desc ?? '';
      const oldImages = this.parseImages(hotel.imageLocation);
      const oldMapLocations = this.cleanMapLocations((hotel as any).mapLocation);

      // AddMoreHotel data
      const allDetails = await this.addMoreHotelModel.findAll({
        where: { hotelId },
      });

      const allDescs: string[] = [];
      const allImages: string[] = [];
      const allMapLocations: string[] = [];
      for (const d of allDetails) {
        if (d.desc) allDescs.push(d.desc.trim());
        allImages.push(...this.parseImages(d.imageLocation));
        allMapLocations.push(...this.cleanMapLocations(d.mapLocation));
      }

      // Merge (deduplicate)
      const mergedDesc = [...new Set([oldDesc, ...allDescs, newDesc].filter(Boolean))].join(', ');
      const mergedImages = [...new Set([...oldImages, ...allImages, ...newImages])];
      const mergedMapLocations = [...new Set([...oldMapLocations, ...allMapLocations, ...newMapLocations])];

      // Save to hotel (auto-activate)
      (hotel as any).desc = mergedDesc;
      hotel.imageLocation = mergedImages as any;
      (hotel as any).mapLocation = mergedMapLocations;
      hotel.status = 'ACTIVE';
      await hotel.save();

      // Replace AddMoreHotel
      await this.addMoreHotelModel.destroy({ where: { hotelId } });
      await this.addMoreHotelModel.create({
        hotelId,
        desc: mergedDesc,
        imageLocation: mergedImages,
        mapLocation: mergedMapLocations,
        status: 'ACTIVE',
      } as any);

      const fileUrl = this.getFileUrl();
      return {
        status: 200,
        body: {
          hotel_id: hotel.id,
          name: hotel.name ?? null,
          desc: mergedDesc,
          image_location: mergedImages.map((img) => `${fileUrl}${img}`),
          map_location: mergedMapLocations,
          status: 'ACTIVE',
        },
      };
    } catch (error) {
      return {
        status: 500,
        body: {
          message: 'Error occurred',
          error: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }

  // ──────────────── Helpers ────────────────

  private parseImages(raw: unknown): string[] {
    if (!raw) return [];
    if (Array.isArray(raw)) {
      return raw
        .filter((i): i is string => typeof i === 'string' && !!i.trim())
        .map((i) => i.trim().replace(/\\/g, '/').replace(/^\//, ''));
    }
    const str = String(raw).trim();
    if (!str || str === 'null') return [];
    try {
      const parsed = JSON.parse(str);
      if (Array.isArray(parsed)) return this.parseImages(parsed);
      if (typeof parsed === 'string') return parsed.split(',').map((s) => s.trim()).filter(Boolean);
    } catch { /* ignore */ }
    return str
      .replace(/^[\[\]"']+|[\[\]"']+$/g, '')
      .split(',')
      .map((s) => s.trim().replace(/["']/g, '').replace(/\\/g, '/').replace(/^\//, ''))
      .filter(Boolean);
  }

  private cleanMapLocations(raw: unknown): string[] {
    const results: string[] = [];
    const process = (item: unknown) => {
      if (!item) return;
      if (Array.isArray(item)) { item.forEach(process); return; }
      if (typeof item === 'string') {
        let val = item.trim();
        if (val.startsWith('[') && val.endsWith(']')) {
          try { process(JSON.parse(val)); return; } catch { /* ignore */ }
        }
        val = val.replace(/\\/g, '').replace(/^['"]|['"]$/g, '');
        const match = val.match(/https:\/\/maps\.app\.goo\.gl\/\S+/);
        if (match) results.push(match[0]);
      }
    };
    process(raw);
    return [...new Set(results)];
  }

  private getFileUrl(): string {
    const raw = this.configService.get<string>('FILE_URL') || '';
    return raw ? (raw.endsWith('/') ? raw : `${raw}/`) : '';
  }
}
