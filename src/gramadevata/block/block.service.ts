import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/sequelize';
import type { WhereOptions, CreationAttributes } from 'sequelize';
import { Block } from './block.model';
import { District } from '../../common/models/district.model';
import * as GramadevataUtils from '../../common/utils/gramadevata.utils';

type CreateResult = {
	status: number;
	body: Record<string, unknown>;
};

@Injectable()
export class BlockService {
	constructor(
		@InjectModel(Block)
		private readonly blockModel: typeof Block,
		@InjectModel(District)
		private readonly districtModel: typeof District,
		private readonly configService: ConfigService
	) {}

	/**
	 * List blocks with dynamic filtering by query parameters.
	 * Mimics Django's BlockView list behavior.
	 */
	async list(query: Record<string, string | undefined>): Promise<Record<string, unknown>[]> {
		const where: WhereOptions<Block> = this.buildWhereClause(query);

		const blocks = await this.blockModel.findAll({
			where,
			include: [
				{
					model: District,
					as: 'district',
				},
			],
			order: [['createdAt', 'DESC']],
		});

		if (!blocks || blocks.length === 0) {
			return [];
		}

		return blocks.map((block) => this.toResponse(block));
	}

	/**
	 * Get a single block by ID.
	 */
	async getById(id: string): Promise<Record<string, unknown> | null> {
		const block = await this.blockModel.findByPk(id, {
			include: [
				{
					model: District,
					as: 'district',
				},
			],
		});

		if (!block) {
			return null;
		}

		return this.toResponse(block);
	}

	/**
	 * Create a new block.
	 */
	async create(payload: Record<string, unknown>): Promise<CreateResult> {
		try {
			// Validate required fields
			if (!payload.name || typeof payload.name !== 'string') {
				return {
					status: 400,
					body: { message: 'Name is required', status: 400 },
				};
			}

			if (!payload.district_id || typeof payload.district_id !== 'string') {
				return {
					status: 400,
					body: { message: 'District ID is required', status: 400 },
				};
			}

			// Verify district exists
			const district = await this.districtModel.findByPk(payload.district_id as string);
			if (!district) {
				return {
					status: 404,
					body: { message: 'District not found', status: 404 },
				};
			}

			// Handle image uploads to Azure if provided
			let imageLocations: string[] = [];
			if (payload.image_location) {
				const images = GramadevataUtils.coerceStringList(payload.image_location);
				const tempId = `temp-${Date.now()}`;
				imageLocations = await this.saveImagesToAzure(images, tempId, payload.name as string);
			}

			// Prepare data for creation
			const createData: Partial<CreationAttributes<Block>> = {
				name: payload.name as string,
				districtId: payload.district_id as string,
				municipality: payload.municipality as string | undefined,
				population: payload.population as string | undefined,
				desc: payload.desc as string | undefined,
				type: (payload.type as string) || 'BLOCK',
				imageLocation: imageLocations.length > 0 ? JSON.stringify(imageLocations) : undefined,
			};

			const block = await this.blockModel.create(createData as CreationAttributes<Block>);

			// If we used a temp ID, update images with the real ID
			if (imageLocations.length > 0) {
				const updatedImages = await this.saveImagesToAzure(
					GramadevataUtils.coerceStringList(payload.image_location),
					block.id,
					block.name
				);
				await block.update({ imageLocation: JSON.stringify(updatedImages) });
			}

			return {
				status: 201,
				body: this.toResponse(block),
			};
		} catch (error) {
			console.error('Error creating block:', error);
			return {
				status: 500,
				body: { message: 'Internal server error', status: 500 },
			};
		}
	}

	/**
	 * Update an existing block.
	 */
	async update(id: string, payload: Record<string, unknown>): Promise<Record<string, unknown> | null> {
		const block = await this.blockModel.findByPk(id);

		if (!block) {
			return null;
		}

		// Handle image updates
		if (payload.image_location !== undefined) {
			const images = GramadevataUtils.coerceStringList(payload.image_location);
			const updatedImages = await this.saveImagesToAzure(images, block.id, block.name);
			payload.image_location = updatedImages.length > 0 ? JSON.stringify(updatedImages) : null;
		}

		// Prepare update data
		const updateData: Partial<Block> = {};
		if (payload.name !== undefined) updateData.name = payload.name as string;
		if (payload.municipality !== undefined) updateData.municipality = payload.municipality as string;
		if (payload.population !== undefined) updateData.population = payload.population as string;
		if (payload.desc !== undefined) updateData.desc = payload.desc as string;
		if (payload.type !== undefined) updateData.type = payload.type as string;
		if (payload.district_id !== undefined) {
			// Verify district exists
			const district = await this.districtModel.findByPk(payload.district_id as string);
			if (!district) {
				throw new NotFoundException('District not found');
			}
			updateData.districtId = payload.district_id as string;
		}
		if (payload.image_location !== undefined) updateData.imageLocation = (payload.image_location as string) || undefined;

		await block.update(updateData);
		await block.reload({
			include: [{ model: District, as: 'district' }],
		});

		return this.toResponse(block);
	}

	/**
	 * Delete a block by ID.
	 */
	async delete(id: string): Promise<boolean> {
		const block = await this.blockModel.findByPk(id);

		if (!block) {
			return false;
		}

		await block.destroy();
		return true;
	}

	/**
	 * Build WHERE clause from query parameters.
	 * Filters out pagination-related params.
	 */
	private buildWhereClause(query: Record<string, string | undefined>): WhereOptions<Block> {
		const where: WhereOptions<Block> = {};

		// Map of query param to model field
		const fieldMap: Record<string, string> = {
			_id: 'id',
			name: 'name',
			municipality: 'municipality',
			population: 'population',
			district: 'districtId',
			district_id: 'districtId',
			type: 'type',
		};

		for (const [key, value] of Object.entries(query)) {
			// Skip pagination and other meta params
			if (['page', 'page_size', 'pageSize', 'page_no', 'ordering'].includes(key)) {
				continue;
			}

			if (value === undefined || value === null || value === '') {
				continue;
			}

			const modelField = fieldMap[key] || key;

			// Add to where clause
			(where as any)[modelField] = value;
		}

		return where;
	}

	/**
	 * Serialize a Block instance into a response object.
	 */
	private toResponse(block: Block): Record<string, unknown> {
		const rawBaseUrl = this.configService.get<string>('File_path') || '';
		const baseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl;

		let imageLocations: string[] = [];
		if (block.imageLocation) {
			try {
				const parsed = typeof block.imageLocation === 'string' 
					? JSON.parse(block.imageLocation) 
					: block.imageLocation;
				imageLocations = Array.isArray(parsed) ? parsed : [parsed];
			} catch {
				imageLocations = [];
			}
		}

		// Convert image paths to full URLs (mimicking Django's image_path_to_binary behavior)
		const imageLocationUrls = imageLocations
			.filter(Boolean)
			.map((path) => {
				if (path.startsWith('http://') || path.startsWith('https://')) {
					return path;
				}
				return `${baseUrl}/${path}`;
			});

		return {
			_id: block.id,
			name: block.name,
			municipality: block.municipality,
			population: block.population,
			desc: block.desc,
			district: block.districtId,
			created_at: block.createdAt,
			type: block.type || 'BLOCK',
			image_location: imageLocationUrls,
		};
	}

	/**
	 * Save images to Azure Blob Storage.
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
			entityType: 'block',
		});
	}

	/**
	 * Send email notification (for future operations).
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
