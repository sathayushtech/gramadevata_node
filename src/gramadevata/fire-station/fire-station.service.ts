import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/sequelize';
import type { CreationAttributes, WhereOptions } from 'sequelize';
import { Op } from 'sequelize';
import { FireStation } from './fire-station.model';
import * as GramadevataUtils from '../../common/utils/gramadevata.utils';

type CreateResult = {
	status: number;
	body: Record<string, unknown>;
};

@Injectable()
export class FireStationService {
	constructor(
		@InjectModel(FireStation)
		private readonly fireStationModel: typeof FireStation,
		private readonly configService: ConfigService,
	) {}

	async list(query: Record<string, string | undefined>) {
		const filters = this.buildFilters(query);
		const where: WhereOptions<FireStation> = { ...filters, status: 'ACTIVE' };

		const records = await this.fireStationModel.findAll({
			where,
			order: [['createdAt', 'DESC']],
		});

		if (!records.length) {
			return { message: 'Data not found', status: 404 };
		}

		return records.map((record) => this.toResponse(record));
	}

	async getById(id: string): Promise<Record<string, unknown> | null> {
		const record = await this.fireStationModel.findOne({
			where: { id, status: 'ACTIVE' },
		});

		if (!record) {
			return null;
		}

		return this.toResponse(record);
	}

	async create(payload: Record<string, unknown>, userId?: string): Promise<CreateResult> {
		try {
			const data = this.parseCreatePayload(payload, userId);

			// Create record with imageLocation as null initially
			const record = await this.fireStationModel.create({
				...data,
				imageLocation: undefined,
			} as CreationAttributes<FireStation>);

			// Handle image uploads
			const imageList = this.parseList(payload.image_location ?? payload.imageLocation);
			if (imageList.length) {
				const savedImages = await GramadevataUtils.saveEntityImagesToAzure({
					configService: this.configService,
					images: imageList,
					id: record.id,
					name: record.name ?? 'firestation',
					entityType: 'firestation',
				});

				if (savedImages.length) {
					record.imageLocation = this.storeList(savedImages) ?? undefined;
					await record.save();
				}
			}

			// Send email notification
			await this.sendNotificationEmail(record, userId);

			return {
				status: 201,
				body: {
					message: 'success',
					result: this.toResponse(record),
				},
			};
		} catch (error) {
			console.error('Error creating fire station:', error);
			return {
				status: 500,
				body: {
					message: error instanceof Error ? error.message : 'An error occurred',
				},
			};
		}
	}

	async update(id: string, payload: Record<string, unknown>): Promise<Record<string, unknown> | null> {
		const record = await this.fireStationModel.findByPk(id);
		if (!record) {
			return null;
		}

		// Update basic fields
		if (typeof payload.name === 'string') {
			record.name = payload.name.trim() || undefined;
		}
		if (typeof payload.address === 'string') {
			record.address = payload.address.trim() || undefined;
		}
		if (typeof payload.map_location === 'string' || typeof payload.mapLocation === 'string') {
			const mapLoc = (payload.map_location ?? payload.mapLocation) as string;
			record.mapLocation = mapLoc.trim() || undefined;
		}
		if (typeof payload.temple_id === 'string' || typeof payload.templeId === 'string') {
			const templeId = (payload.temple_id ?? payload.templeId) as string;
			record.templeId = templeId.trim() || undefined;
		}
		if (typeof payload.village_id === 'string' || typeof payload.villageId === 'string') {
			const villageId = (payload.village_id ?? payload.villageId) as string;
			record.villageId = villageId.trim() || undefined;
		}
		if (typeof payload.contact_number === 'string' || typeof payload.contactNumber === 'string') {
			const contactNumber = (payload.contact_number ?? payload.contactNumber) as string;
			record.contactNumber = contactNumber.trim() || undefined;
		}
		if (typeof payload.status === 'string') {
			record.status = payload.status.trim();
		}

		// Handle image updates
		const newImages = this.parseList(payload.image_location ?? payload.imageLocation);
		const storedImages = this.normalizeListValue(record.imageLocation);

		const toUpload = newImages.filter((img) => !GramadevataUtils.looksLikeStoredPath(img, 'firestation'));

		if (toUpload.length) {
			const savedImages = await GramadevataUtils.saveEntityImagesToAzure({
				configService: this.configService,
				images: toUpload,
				id: record.id,
				name: record.name ?? 'firestation',
				entityType: 'firestation',
			});

			if (savedImages.length) {
				const reusedImages = newImages.filter((img) => GramadevataUtils.looksLikeStoredPath(img, 'firestation'));
				record.imageLocation = this.storeList([...reusedImages, ...savedImages]) ?? undefined;
			}
		} else if (newImages.length) {
			record.imageLocation = this.storeList(newImages) ?? undefined;
		}

		await record.save();

		return {
			message: 'FireStation updated successfully',
			result: this.toResponse(record),
		};
	}

	async remove(id: string): Promise<boolean> {
		const record = await this.fireStationModel.findByPk(id);
		if (!record) {
			return false;
		}

		await record.destroy();
		return true;
	}

	private buildFilters(query: Record<string, string | undefined>): WhereOptions<FireStation> {
		const filters: WhereOptions<FireStation> = {};

		if (query.id) filters.id = query.id;
		if (query.name) filters.name = { [Op.like]: `%${query.name}%` };
		if (query.address) filters.address = { [Op.like]: `%${query.address}%` };
		if (query.temple_id || query.templeId) filters.templeId = query.temple_id ?? query.templeId;
		if (query.village_id || query.villageId) filters.villageId = query.village_id ?? query.villageId;
		if (query.user_id || query.userId) filters.userId = query.user_id ?? query.userId;
		if (query.status) filters.status = query.status;
		if (query.contact_number || query.contactNumber) {
			filters.contactNumber = query.contact_number ?? query.contactNumber;
		}

		return filters;
	}

	private parseCreatePayload(payload: Record<string, unknown>, userId?: string): Partial<FireStation> {
		const data: Partial<FireStation> = {};

		if (typeof payload.name === 'string') {
			data.name = payload.name.trim() || undefined;
		}
		if (typeof payload.address === 'string') {
			data.address = payload.address.trim() || undefined;
		}
		if (typeof payload.map_location === 'string' || typeof payload.mapLocation === 'string') {
			const mapLoc = (payload.map_location ?? payload.mapLocation) as string;
			data.mapLocation = mapLoc.trim() || undefined;
		}
		if (typeof payload.temple_id === 'string' || typeof payload.templeId === 'string') {
			const templeId = (payload.temple_id ?? payload.templeId) as string;
			data.templeId = templeId.trim() || undefined;
		}
		if (typeof payload.village_id === 'string' || typeof payload.villageId === 'string') {
			const villageId = (payload.village_id ?? payload.villageId) as string;
			data.villageId = villageId.trim() || undefined;
		}
		if (typeof payload.contact_number === 'string' || typeof payload.contactNumber === 'string') {
			const contactNumber = (payload.contact_number ?? payload.contactNumber) as string;
			data.contactNumber = contactNumber.trim() || undefined;
		}
		if (typeof payload.status === 'string') {
			data.status = payload.status.trim();
		}
		if (userId) {
			data.userId = userId;
		} else if (typeof payload.user_id === 'string' || typeof payload.userId === 'string') {
			const uid = (payload.user_id ?? payload.userId) as string;
			data.userId = uid.trim() || undefined;
		}

		return data;
	}

	private parseList(value: unknown): string[] {
		return GramadevataUtils.coerceStringList(value);
	}

	private normalizeListValue(value: string | null | undefined): string[] {
		if (!value) return [];
		const trimmed = value.trim();
		if (!trimmed) return [];
		if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
			try {
				const parsed = JSON.parse(trimmed);
				return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
			} catch {
				const inner = trimmed.slice(1, -1).trim();
				if (!inner) return [];
				return inner
					.split(',')
					.map((entry) => entry.trim().replace(/^['"]|['"]$/g, ''))
					.filter(Boolean);
			}
		}
		return [trimmed];
	}

	private storeList(values: string[]): string | null {
		if (!values || !values.length) return null;
		return JSON.stringify(values);
	}

	private toResponse(record: FireStation): Record<string, unknown> {
		const basePath = this.configService.get<string>('File_path') ?? '';
		const normalizedBasePath = basePath.endsWith('/') ? basePath : `${basePath}/`;

		const imageLocationList = this.normalizeListValue(record.imageLocation);
		const imageUrls = imageLocationList
			.map((loc) => loc.trim().replace(/[\[\]]/g, '').replace(/^['"]|['"]$/g, ''))
			.filter(Boolean)
			.map((loc) => {
				if (loc.startsWith('http://') || loc.startsWith('https://')) {
					return loc;
				}
				const cleanLoc = loc.replace(/^\/+/, '').replace(/\\/g, '/');
				return `${normalizedBasePath}${cleanLoc}`;
			});

		return {
			_id: record.id,
			image_location: imageUrls.length ? imageUrls : null,
			name: record.name ?? null,
			address: record.address ?? null,
			map_location: record.mapLocation ?? null,
			temple_id: record.templeId ?? null,
			village_id: record.villageId ?? null,
			user_id: record.userId ?? null,
			
			created_at: GramadevataUtils.formatDjangoDateTime(record.createdAt),
			status: record.status,
			contact_number: record.contactNumber ?? null,
		};
	}

	private async sendNotificationEmail(record: FireStation, userId?: string): Promise<void> {
		const emailHost = this.configService.get<string>('DEFAULT_FROM_EMAIL');
		if (!emailHost) {
			return;
		}

		const userIdDisplay = userId ?? 'Anonymous';
		const createdAtDisplay = GramadevataUtils.formatDjangoDateTime(record.createdAt);

		const text = `User ID: ${userIdDisplay}\nCreated Time: ${createdAtDisplay}\nFirestation ID: ${record.id}\nFirestation Name: ${record.name ?? 'N/A'}`;

		await GramadevataUtils.sendAdminEmail(this.configService, {
			subject: 'New Firestation Added',
			text,
			recipients: [emailHost],
		});
	}
}
