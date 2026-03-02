import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/sequelize';
import { Op, fn, col, where } from 'sequelize';
import { createHash } from 'crypto';
import { Village } from '../villages/village.model';
import { Block } from '../block/block.model';
import { District } from '../../common/models/district.model';
import { Temple } from '../temple/temple.model';
import { Event } from '../events/event.model';
import { TempleNearbyTourismPlace } from '../tourism/temple-nearby-tourism.model';
import { Goshala } from '../goshalas/goshala.model';
import { WelfareHomes } from '../welfare/welfare-homes.model';
import { State } from '../../common/models/state.model';

type CacheEntry = {
	status: number;
	body: Record<string, unknown>;
	expiresAt: number;
};

type SearchItem = {
	_id: string;
	name: string | null;
	image_location?: string[] | null;
	type: string;
};

const SEARCH_LIMIT = 3;
const CACHE_TTL_EMPTY = 60_000;
const CACHE_TTL_HIT = 120_000;

@Injectable()
export class GlobalSearchService {
	private static cache = new Map<string, CacheEntry>();

	constructor(
		@InjectModel(Village)
		private readonly villageModel: typeof Village,
		@InjectModel(Block)
		private readonly blockModel: typeof Block,
		@InjectModel(District)
		private readonly districtModel: typeof District,
		@InjectModel(Temple)
		private readonly templeModel: typeof Temple,
		@InjectModel(Event)
		private readonly eventModel: typeof Event,
		@InjectModel(TempleNearbyTourismPlace)
		private readonly tourismModel: typeof TempleNearbyTourismPlace,
		@InjectModel(Goshala)
		private readonly goshalaModel: typeof Goshala,
		@InjectModel(WelfareHomes)
		private readonly welfareHomesModel: typeof WelfareHomes,
		@InjectModel(State)
		private readonly stateModel: typeof State,
		private readonly configService: ConfigService,
	) {}

	async search(query: Record<string, string | undefined>) {
		const rawSearch = (query.search || '').trim();
		if (!rawSearch) {
			return {
				status: 400,
				body: { message: 'Search text is required' },
			};
		}

		const normalized = this.normalize(rawSearch);
		const key = this.cacheKey(normalized);
		const cached = this.getCache(key);
		if (cached) {
			return { status: cached.status, body: cached.body };
		}

		const data: SearchItem[] = [];
		const types = new Set<string>();

		await this.appendResults(this.villageModel, normalized, 'village', data, types);
		await this.appendResults(this.blockModel, normalized, 'block', data, types);
		await this.appendResults(this.districtModel, normalized, 'district', data, types);
		await this.appendResults(this.templeModel, normalized, 'temple', data, types);
		await this.appendResults(this.tourismModel, normalized, 'tourism_place', data, types, true);
		await this.appendResults(this.eventModel, normalized, 'event', data, types);
		await this.appendResults(this.goshalaModel, normalized, 'goshala', data, types);
		await this.appendResults(this.welfareHomesModel, normalized, 'welfare_home', data, types);
		await this.appendResults(this.stateModel, normalized, 'state', data, types);

		if (!data.length) {
			const body = { message: 'No matching data found' };
			this.setCache(key, { status: 404, body }, CACHE_TTL_EMPTY);
			return { status: 404, body };
		}

		const body = {
			type: Array.from(types),
			data,
		};
		this.setCache(key, { status: 200, body }, CACHE_TTL_HIT);

		return { status: 200, body };
	}

	private normalize(text: string): string {
		return text.replace(/\s+/g, '').toLowerCase();
	}

	private cacheKey(search: string): string {
		const hash = createHash('md5').update(search).digest('hex');
		return `gs:${hash}`;
	}

	private getCache(key: string): CacheEntry | null {
		const entry = GlobalSearchService.cache.get(key);
		if (!entry) return null;
		if (Date.now() > entry.expiresAt) {
			GlobalSearchService.cache.delete(key);
			return null;
		}
		return entry;
	}

	private setCache(key: string, entry: Omit<CacheEntry, 'expiresAt'>, ttlMs: number) {
		GlobalSearchService.cache.set(key, {
			...entry,
			expiresAt: Date.now() + ttlMs,
		});
	}

	private async appendResults(
		model: { findAll: (options: Record<string, unknown>) => Promise<any[]> },
		search: string,
		typeName: string,
		data: SearchItem[],
		types: Set<string>,
		includeImages = false,
	) {
		const normalizedName = fn('LOWER', fn('REPLACE', col('name'), ' ', ''));
		const results = await model.findAll({
			attributes: includeImages ? ['id', 'name', 'imageLocation'] : ['id', 'name'],
			where: where(normalizedName, { [Op.like]: `%${search}%` }),
			limit: SEARCH_LIMIT,
		});

		for (const record of results) {
			const baseItem: SearchItem = {
				_id: record.id,
				name: (record as { name?: string }).name ?? null,
				type: typeName,
			};

			if (includeImages) {
				const imageLocation = this.toImageUrls((record as TempleNearbyTourismPlace).imageLocation);
				baseItem.image_location = imageLocation.length ? imageLocation : null;
			}

			data.push(baseItem);
			types.add(typeName);
		}
	}

	private toImageUrls(imageLocation: string | null | undefined): string[] {
		if (!imageLocation) return [];
		const list = this.normalizeListValue(imageLocation);
		if (!list.length) return [];

		const basePath = this.configService.get<string>('File_path') ?? '';
		return list.map((loc) => {
			if (loc.startsWith('http://') || loc.startsWith('https://')) {
				return loc;
			}
			return `${basePath}${loc}`;
		});
	}

	private normalizeListValue(value: string): string[] {
		const trimmed = value.trim();
		if (!trimmed) return [];
		if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
			try {
				const parsed = JSON.parse(trimmed);
				return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
			} catch {
				return [];
			}
		}
		return [trimmed];
	}
}
