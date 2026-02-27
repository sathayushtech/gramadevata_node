import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/sequelize';
import { Order } from 'sequelize';
import type { WhereOptions } from 'sequelize';
import { Temple } from './temple.model';
import { TempleCategory } from './temple-category.model';
import { TemplePriority } from './temple-priority.model';
import { Village } from '../villages/village.model';
import { Block } from '../block/block.model';
import { District } from '../../common/models/district.model';
import { State } from '../../common/models/state.model';
import { Country } from '../../common/models/country.model';
import * as GramadevataUtils from '../../common/utils/gramadevata.utils';

type PaginatedResult = {
	count: number;
	next: number | null;
	previous: number | null;
	results: Record<string, unknown>[];
};

@Injectable()
export class TempleListService {
	constructor(
		@InjectModel(Temple)
		private readonly templeModel: typeof Temple,
		private readonly configService: ConfigService
	) {}

	/**
	 * List temples with optional filtering by category and pagination.
	 * Mimics Django's filters_by_iteams view.
	 */
	async list(query: Record<string, string | undefined>): Promise<Record<string, unknown>[] | PaginatedResult> {
		const where: WhereOptions<Temple> = {};

		// Filter by category if provided
		if (query.category) {
			where.categoryId = query.category;
		}

		// Optional: filter by status (default to 'ACTIVE' if you need it)
		// if (!query.include_inactive) {
		//   where.status = 'ACTIVE';
		// }

		const page = this.parsePage(query.page ?? query.page_no);
		const pageSize = this.parsePageSize(query.page_size ?? query.pageSize);
		const ordering = this.parseOrdering(query.ordering);

		// If page is provided, return paginated results
		if (page !== null) {
			const limit = pageSize ?? 50; // Default page size matching Django CustomPagination
			const offset = (page - 1) * limit;

			const { rows, count } = await this.templeModel.findAndCountAll({
				where,
				limit,
				offset,
				order: ordering,
				include: [
					{ model: TempleCategory, as: 'category' },
					{ model: TemplePriority, as: 'priority' },
					{
						model: Village,
						as: 'village',
						include: [
							{
								model: Block,
								as: 'block',
								include: [
									{
										model: District,
										as: 'district',
										include: [
											{
												model: State,
												as: 'state',
												include: [{ model: Country, as: 'country' }],
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
			const totalPages = Math.ceil(count / limit) || 1;

			return {
				count,
				next: page < totalPages ? page + 1 : null,
				previous: page > 1 ? page - 1 : null,
				results,
			};
		}

		// If no page parameter, return all matching records
		const temples = await this.templeModel.findAll({
			where,
			order: ordering,
			include: [
				{ model: TempleCategory, as: 'category' },
				{ model: TemplePriority, as: 'priority' },
				{
					model: Village,
					as: 'village',
					include: [
						{
							model: Block,
							as: 'block',
							include: [
								{
									model: District,
									as: 'district',
									include: [
										{
											model: State,
											as: 'state',
											include: [{ model: Country, as: 'country' }],
										},
									],
								},
							],
						},
					],
				},
			],
		});

		return temples.map((temple) => this.toResponse(temple));
	}

	/**
	 * Get a single temple by ID.
	 */
	async getById(id: string): Promise<Record<string, unknown> | null> {
		const temple = await this.templeModel.findByPk(id, {
			include: [
				{ model: TempleCategory, as: 'category' },
				{ model: TemplePriority, as: 'priority' },
				{
					model: Village,
					as: 'village',
					include: [
						{
							model: Block,
							as: 'block',
							include: [
								{
									model: District,
									as: 'district',
									include: [
										{
											model: State,
											as: 'state',
											include: [{ model: Country, as: 'country' }],
										},
									],
								},
							],
						},
					],
				},
			],
		});

		if (!temple) {
			return null;
		}

		return this.toResponse(temple);
	}

	/**
	 * Serialize a Temple instance into a response object.
	 */
	private toResponse(temple: Temple): Record<string, unknown> {
		return {
			_id: temple.id,
			category: temple.category?.id,
			priority: temple.priority?.id,
			name: temple.name,
			is_navagraha_established: temple.isNavagrahaEstablished,
			construction_year: temple.constructionYear,
			era: temple.era,
			is_destroyed: temple.isDestroyed,
			animal_sacrifice_status: temple.animalSacrificeStatus,
			diety: temple.diety,
			style: temple.style,
			geo_site: temple.geoSite,
			object_id: temple.objectId,
			temple_map_location: temple.templeMapLocation,
			address: temple.address,
			contact_name: temple.contactName,
			contact_phone: temple.contactPhone,
			contact_email: temple.contactEmail,
			desc: temple.desc,
			sthala_puranam: temple.sthalaPuranam,
			image_location: temple.imageLocation,
			temple_video: temple.templeVideo,
			status: temple.status,
			created_at: temple.createdAt,
			old_temple_code: temple.oldTempleCode,
			user: temple.userId,
			can_connect: temple.canConnect,
			temple_area: temple.templeArea,
			temple_timings: temple.templeTimings,
			temple_official_website: temple.templeOfficialWebsite,
			other_dieties: temple.otherDieties,
			temple_management: temple.templeManagement,
			sthala_vriksha: temple.sthalaVriksha,
			river: temple.river,
			ratham: temple.ratham,
			other_speciality: temple.otherSpeciality,
			architecture: temple.architecture,
			longitude: temple.longitude,
			latitude: temple.latitude,
			dress_code: temple.dressCode,
			festivals: temple.festivals,
			country_name: temple.countryName,
			state_name: temple.stateName,
			district_name: temple.districtName,
			block_name: temple.blockName,
			village_name: temple.villageName,
			other_name: temple.otherName,
			country: temple.countryId,
			village: temple.village,
		};
	}

	private parsePage(value: string | undefined): number | null {
		if (!value) {
			return null;
		}
		const parsed = parseInt(value, 10);
		return isNaN(parsed) || parsed < 1 ? null : parsed;
	}

	private parsePageSize(value: string | undefined): number | null {
		if (!value) {
			return null;
		}
		const parsed = parseInt(value, 10);
		return isNaN(parsed) || parsed < 1 ? null : Math.min(parsed, 90); // Max 90 like CustomPagination
	}

	private parseOrdering(value: string | undefined): Order {
		if (!value) {
			return []; // Default order
		}

		const fields = value.split(',').map((f) => f.trim()).filter(Boolean);
		return fields.map((field) => {
			if (field.startsWith('-')) {
				return [field.substring(1), 'DESC'];
			}
			return [field, 'ASC'];
		});
	}

	/**
	 * Optional: Azure image/video upload helpers for future POST/PUT operations.
	 */
	async saveImagesToAzure(images: string[], id: string, name: string): Promise<string[]> {
		if (!images || images.length === 0) {
			return [];
		}
		return GramadevataUtils.saveEntityImagesToAzure({
			configService: this.configService,
			images,
			id,
			name,
			entityType: 'temple',
		});
	}

	async saveVideosToAzure(videos: string[], id: string, name: string): Promise<string[]> {
		if (!videos || videos.length === 0) {
			return [];
		}
		return GramadevataUtils.saveEntityVideosToAzure({
			configService: this.configService,
			videos,
			id,
			name,
			entityType: 'temple',
		});
	}

	/**
	 * Optional: Email notification helper for future operations.
	 */
	async sendNotificationEmail(subject: string, text: string, recipients: string[]): Promise<void> {
		if (!recipients || recipients.length === 0) {
			return;
		}
		await GramadevataUtils.sendAdminEmail(this.configService, {
			subject,
			text,
			recipients,
		});
	}
}
