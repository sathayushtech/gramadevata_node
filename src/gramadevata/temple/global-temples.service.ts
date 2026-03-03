import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { Temple } from './temple.model';
import { Village } from '../villages/village.model';
import { Block } from '../block/block.model';
import { District } from '../../common/models/district.model';
import { State } from '../../common/models/state.model';
import { Country } from '../../common/models/country.model';

@Injectable()
export class GlobalTemplesService {
	constructor(
		@InjectModel(Temple)
		private readonly templeModel: typeof Temple,
		private readonly configService: ConfigService,
	) {}

	async list(query: Record<string, string | undefined>, baseUrl?: string) {
		const page = this.normalizePage(query.page ?? query.page_no);
		const pageSize = this.normalizePageSize(query.page_size ?? query.pageSize);
		const offset = (page - 1) * pageSize;

		const { count, rows } = await this.templeModel.findAndCountAll({
			where: {
				geoSite: { [Op.notIn]: ['S', 'D', 'B', 'V'] },
			},
			limit: pageSize,
			offset,
			order: [['createdAt', 'DESC']],
			include: [
				{
					model: Village,
					as: 'village',
					required: false,
					include: [
						{
							model: Block,
							as: 'block',
							required: false,
							include: [
								{
									model: District,
									as: 'district',
									required: false,
									include: [
										{
											model: State,
											as: 'state',
											required: false,
											include: [{ model: Country, as: 'country', required: false }],
										},
									],
								},
							],
						},
					],
				},
			],
		});

		const results = rows.map((temple) => this.toResponse(temple));

		return this.buildPaginatedResponse({
			count,
			page,
			pageSize,
			results,
			baseUrl,
			query,
		});
	}

	private toResponse(temple: Temple): Record<string, unknown> {
		const plain = temple.get({ plain: true }) as Temple;
		const baseUrl = this.getBaseUrl();

		return {
			_id: plain.id,
			category: plain.categoryId ?? null,
			priority: plain.priorityId ?? null,
			name: plain.name ?? null,
			is_navagraha_established: plain.isNavagrahaEstablished ?? null,
			construction_year: plain.constructionYear ?? null,
			era: plain.era ?? null,
			is_destroyed: plain.isDestroyed ?? null,
			animal_sacrifice_status: plain.animalSacrificeStatus ?? null,
			diety: plain.diety ?? null,
			style: plain.style ?? null,
			geo_site: plain.geoSite ?? null,
			object_id: plain.objectId ?? null,
			temple_map_location: plain.templeMapLocation ?? null,
			address: plain.address ?? null,
			contact_name: plain.contactName ?? null,
			contact_phone: plain.contactPhone ?? null,
			contact_email: plain.contactEmail ?? null,
			desc: plain.desc ?? null,
			sthala_puranam: plain.sthalaPuranam ?? null,
			image_location: this.mapFileList(plain.imageLocation, baseUrl),
			temple_video: this.mapFileListOrNull(plain.templeVideo, baseUrl),
			status: plain.status ?? null,
			created_at: plain.createdAt ?? null,
			old_temple_code: plain.oldTempleCode ?? null,
			user: plain.userId ?? null,
			can_connect: plain.canConnect ?? null,
			temple_area: plain.templeArea ?? null,
			temple_timings: plain.templeTimings ?? null,
			temple_official_website: plain.templeOfficialWebsite ?? null,
			other_dieties: plain.otherDieties ?? null,
			temple_management: plain.templeManagement ?? null,
			sthala_vriksha: plain.sthalaVriksha ?? null,
			river: plain.river ?? null,
			ratham: plain.ratham ?? null,
			other_speciality: plain.otherSpeciality ?? null,
			architecture: plain.architecture ?? null,
			longitude: plain.longitude ?? null,
			latitude: plain.latitude ?? null,
			dress_code: plain.dressCode ?? null,
			festivals: plain.festivals ?? null,
			country_name: plain.countryName ?? null,
			state_name: plain.stateName ?? null,
			district_name: plain.districtName ?? null,
			block_name: plain.blockName ?? null,
			village_name: plain.villageName ?? null,
			other_name: plain.otherName ?? null,
			country: plain.countryId ?? null,
			village: temple.village ?? null,
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
