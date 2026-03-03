import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { Goshala } from './goshala.model';
import { Village } from '../villages/village.model';
import { Block } from '../block/block.model';
import { District } from '../../common/models/district.model';
import { State } from '../../common/models/state.model';
import { Country } from '../../common/models/country.model';

@Injectable()
export class GlobalGoshalasService {
	constructor(
		@InjectModel(Goshala)
		private readonly goshalaModel: typeof Goshala,
		private readonly configService: ConfigService,
	) {}

	async list(query: Record<string, string | undefined>, baseUrl?: string) {
		const page = this.normalizePage(query.page ?? query.page_no);
		const pageSize = this.normalizePageSize(query.page_size ?? query.pageSize);
		const offset = (page - 1) * pageSize;

		const { count, rows } = await this.goshalaModel.findAndCountAll({
			where: {
				geoSite: { [Op.notIn]: ['S', 'D', 'B', 'V'] },
			},
			limit: pageSize,
			offset,
			order: [['createdAt', 'DESC']],
			include: [
				{
					model: Village,
					required: false,
					include: [
						{
							model: Block,
							required: false,
							include: [
								{
									model: District,
									required: false,
									include: [
										{
											model: State,
											required: false,
											include: [{ model: Country, required: false }],
										},
									],
								},
							],
						},
					],
				},
			],
		});

		const results = rows.map((goshala) => this.toResponse(goshala));

		return this.buildPaginatedResponse({
			count,
			page,
			pageSize,
			results,
			baseUrl,
			query,
		});
	}

	private toResponse(goshala: Goshala): Record<string, unknown> {
		const plain = goshala.get({ plain: true }) as Goshala;
		const baseUrl = this.getBaseUrl();

		return {
			_id: plain.id,
			name: plain.name ?? null,
			reg_num: plain.regNum ?? null,
			geo_site: plain.geoSite ?? null,
			map_location: plain.mapLocation ?? null,
			contact_name: plain.contactName ?? null,
			contact_phone: plain.contactPhone ?? null,
			address: plain.address ?? null,
			email: plain.email ?? null,
			desc: plain.desc ?? null,
			regn_document: plain.regnDocument ?? null,
			status: plain.status ?? null,
			image_location: this.mapFileList(plain.imageLocation, baseUrl),
			goshala_video: this.mapFileListOrNull(plain.goshalaVideo, baseUrl),
			managed_by: plain.managedBy ?? null,
			timings: plain.timings ?? null,
			official_website: plain.officialWebsite ?? null,
			country_name: plain.countryName ?? null,
			state_name: plain.stateName ?? null,
			district_name: plain.districtName ?? null,
			block_name: plain.blockName ?? null,
			village_name: plain.villageName ?? null,
			other_name: plain.otherName ?? null,
			devotees_visiting: plain.devoteesVisiting ?? null,
			feeding_accessibility: plain.feedingAccessibility ?? null,
			inside_feeding_accessibility: plain.insideFeedingAccessibility ?? null,
			outside_feeding_accessibility: plain.outsideFeedingAccessibility ?? null,
			adoption_of_cow_or_bull_inside: plain.adoptionOfCowOrBullInside ?? null,
			adoption_of_cow_or_bull_outside: plain.adoptionOfCowOrBullOutside ?? null,
			festivals: plain.festivals ?? null,
			prayers: plain.prayers ?? null,
			social_activites: plain.socialActivites ?? null,
			other_services: plain.otherServices ?? null,
			created_at: plain.createdAt ?? null,
			category: plain.category ?? null,
			object_id: plain.objectId ?? null,
			temple: plain.temple ?? null,
			user: plain.user ?? null,
			country: plain.country ?? null,
		};
	}

	private parseList(raw: unknown): string[] {
		if (!raw) {
			return [];
		}

		if (Array.isArray(raw)) {
			return raw.map((item) => String(item).trim()).filter(Boolean);
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
				.replace(/[\[\]]/g, '')
				.split(',')
				.map((item) => item.replace(/['"]+/g, '').trim())
				.filter(Boolean);
		}

		return [];
	}

	private mapFileList(raw: unknown, baseUrl: string) {
		const list = this.parseList(raw);
		if (!baseUrl) {
			return list;
		}
		return list.map((path) => `${baseUrl}/${path.replace(/^\/+/, '')}`);
	}

	private mapFileListOrNull(raw: unknown, baseUrl: string) {
		if (raw === null || raw === undefined || raw === 'null' || raw === '"null"') {
			return null;
		}
		return this.mapFileList(raw, baseUrl);
	}

	private getBaseUrl() {
		const raw = this.configService.get<string>('File_path') || '';
		if (!raw) {
			return '';
		}
		return raw.endsWith('/') ? raw.slice(0, -1) : raw;
	}

	private buildPaginatedResponse(params: {
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

		const next = nextPage ? this.buildPageLink(baseUrl, query, nextPage, pageSize) : null;
		const previous = prevPage ? this.buildPageLink(baseUrl, query, prevPage, pageSize) : null;

		return {
			count,
			next,
			previous,
			results,
		};
	}

	private buildPageLink(
		baseUrl: string | undefined,
		query: Record<string, string | undefined>,
		page: number,
		pageSize: number
	) {
		if (!baseUrl) {
			return page;
		}

		const params = new URLSearchParams();
		Object.entries(query).forEach(([key, value]) => {
			if (value === undefined || value === null || value === '') {
				return;
			}
			if (key === 'page' || key === 'page_no') {
				return;
			}
			params.set(key, value);
		});

		params.set('page', String(page));
		params.set('page_size', String(pageSize));

		return `${baseUrl}?${params.toString()}`;
	}

	private normalizePage(value?: string) {
		const page = Number.parseInt(value ?? '1', 10);
		return Number.isNaN(page) || page < 1 ? 1 : page;
	}

	private normalizePageSize(value?: string) {
		const size = Number.parseInt(value ?? '50', 10);
		if (Number.isNaN(size) || size < 1) {
			return 50;
		}
		return Math.min(size, 90);
	}
}
