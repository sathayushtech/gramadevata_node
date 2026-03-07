import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/sequelize';
import type { CreationAttributes, WhereOptions } from 'sequelize';
import { TempleNearbyRestaurant } from '../events/temple-nearby-restaurant.model';
import * as GramadevataUtils from '../../common/utils/gramadevata.utils';

type ServiceResult = {
	status: number;
	body: Record<string, unknown>;
};

@Injectable()
export class RestaurantsService {
	constructor(
		@InjectModel(TempleNearbyRestaurant)
		private readonly restaurantModel: typeof TempleNearbyRestaurant,
		private readonly configService: ConfigService,
	) {}

	async list(query: Record<string, string | undefined>) {
		const where = this.buildFilters(query);
		const records = await this.restaurantModel.findAll({
			where,
			order: [['createdAt', 'DESC']],
		});

		if (!records.length) {
			return { status: 404, body: { message: 'Data not found', status: 404 } };
		}

		return records.map((record) => this.toResponse(record));
	}

	async getById(id: string): Promise<Record<string, unknown> | null> {
		const record = await this.restaurantModel.findOne({ where: { id, status: 'ACTIVE' } });
		if (!record) {
			return null;
		}

		return this.toResponse(record);
	}

	async create(payload: Record<string, unknown>, userPayload?: Record<string, unknown>): Promise<ServiceResult> {
		try {
			const imageList = this.parseList(payload.image_location ?? payload.imageLocation);

			const data = this.buildCreatePayload(payload, userPayload);
			data.imageLocation = 'null';

			const created = await this.restaurantModel.create(data as CreationAttributes<TempleNearbyRestaurant>);

			const savedImages = await this.saveImages(imageList, created.id, created.name ?? 'restaurant', 'restaurants');
			if (savedImages.length) {
				created.imageLocation = this.storeList(savedImages) ?? 'null';
				await created.save();
			}

			await this.sendNotificationEmail(created, userPayload);

			return {
				status: 201,
				body: { message: 'success', result: this.toResponse(created) },
			};
		} catch (error) {
			return {
				status: 500,
				body: {
					message: 'An error occurred.',
					error: error instanceof Error ? error.message : String(error),
				},
			};
		}
	}

	async update(id: string, payload: Record<string, unknown>): Promise<ServiceResult | null> {
		const record = await this.restaurantModel.findOne({ where: { id, status: 'ACTIVE' } });
		if (!record) {
			return null;
		}

		const updateData = this.buildUpdatePayload(payload);
		if (Object.keys(updateData).length) {
			await record.update(updateData as CreationAttributes<TempleNearbyRestaurant>);
		}

		const incomingImages = this.parseList(payload.image_location ?? payload.imageLocation);
		const existingImages = this.normalizeListValue(record.imageLocation);

		if (incomingImages.length && !incomingImages.includes('null')) {
			const savedImages = await this.saveImages(
				incomingImages,
				record.id,
				record.name ?? 'restaurant',
				'restaurants',
			);
			record.imageLocation = this.storeList([...existingImages, ...savedImages]) ?? record.imageLocation;
			await record.save();
		}

		return {
			status: 200,
			body: { message: 'Restaurant updated successfully', result: this.toResponse(record) },
		};
	}

	async remove(id: string): Promise<boolean> {
		const record = await this.restaurantModel.findByPk(id);
		if (!record) {
			return false;
		}

		await record.destroy();
		return true;
	}

	private buildFilters(query: Record<string, string | undefined>): WhereOptions<TempleNearbyRestaurant> {
		const filters: WhereOptions<TempleNearbyRestaurant> = { status: 'ACTIVE' };

		Object.entries(query).forEach(([key, value]) => {
			if (!value) {
				return;
			}
			if (['page', 'page_size', 'pageSize', 'page_no', 'ordering'].includes(key)) {
				return;
			}
			if (key === '_id' || key === 'id') {
				(filters as Record<string, unknown>).id = value;
				return;
			}
			if (key === 'temple_id') {
				(filters as Record<string, unknown>).templeId = value;
				return;
			}
			if (key === 'village_id') {
				(filters as Record<string, unknown>).villageId = value;
				return;
			}
			if (key === 'user_id') {
				(filters as Record<string, unknown>).userId = value;
				return;
			}
			if (key === 'event_id') {
				(filters as Record<string, unknown>).eventId = value;
				return;
			}
			if (key === 'tourism_places') {
				(filters as Record<string, unknown>).tourismPlaces = value;
				return;
			}
			(filters as Record<string, unknown>)[key] = value;
		});

		return filters;
	}

	private buildCreatePayload(payload: Record<string, unknown>, userPayload?: Record<string, unknown>) {
		const data: Partial<TempleNearbyRestaurant> = {
			name: this.parseString(payload.name),
			address: this.parseString(payload.address),
			mapLocation: this.parseString(payload.map_location ?? payload.mapLocation),
			templeId: this.parseString(payload.temple_id ?? payload.templeId),
			villageId: this.parseString(payload.village_id ?? payload.villageId),
			userId: this.parseString(payload.user_id ?? payload.userId),
			ownerName: this.parseString(payload.owner_name ?? payload.ownerName),
			contactNumber: this.parseString(payload.contact_number ?? payload.contactNumber),
			emailId: this.parseString(payload.email_id ?? payload.emailId),
			website: this.parseString(payload.website),
			eventId: this.parseString(payload.event_id ?? payload.eventId),
			tourismPlaces: this.parseString(payload.tourism_places ?? payload.tourismPlaces),
			status: this.parseString(payload.status),
		};

		const userId = typeof userPayload?.id === 'string' ? userPayload.id : undefined;
		if (!data.userId && userId) {
			data.userId = userId;
		}

		return data;
	}

	private buildUpdatePayload(payload: Record<string, unknown>) {
		const data: Partial<TempleNearbyRestaurant> = {};

		if (payload.name !== undefined) data.name = this.parseString(payload.name);
		if (payload.address !== undefined) data.address = this.parseString(payload.address);
		if (payload.map_location !== undefined || payload.mapLocation !== undefined) {
			data.mapLocation = this.parseString(payload.map_location ?? payload.mapLocation);
		}
		if (payload.temple_id !== undefined || payload.templeId !== undefined) {
			data.templeId = this.parseString(payload.temple_id ?? payload.templeId);
		}
		if (payload.village_id !== undefined || payload.villageId !== undefined) {
			data.villageId = this.parseString(payload.village_id ?? payload.villageId);
		}
		if (payload.user_id !== undefined || payload.userId !== undefined) {
			data.userId = this.parseString(payload.user_id ?? payload.userId);
		}
		if (payload.owner_name !== undefined || payload.ownerName !== undefined) {
			data.ownerName = this.parseString(payload.owner_name ?? payload.ownerName);
		}
		if (payload.contact_number !== undefined || payload.contactNumber !== undefined) {
			data.contactNumber = this.parseString(payload.contact_number ?? payload.contactNumber);
		}
		if (payload.email_id !== undefined || payload.emailId !== undefined) {
			data.emailId = this.parseString(payload.email_id ?? payload.emailId);
		}
		if (payload.website !== undefined) data.website = this.parseString(payload.website);
		if (payload.event_id !== undefined || payload.eventId !== undefined) {
			data.eventId = this.parseString(payload.event_id ?? payload.eventId);
		}
		if (payload.tourism_places !== undefined || payload.tourismPlaces !== undefined) {
			data.tourismPlaces = this.parseString(payload.tourism_places ?? payload.tourismPlaces);
		}
		if (payload.status !== undefined) data.status = this.parseString(payload.status);

		return data;
	}

		private parseList(raw: unknown): string[] {
		if (raw === null || raw === undefined) {
			return [];
		}

		if (Array.isArray(raw)) {
			return raw.map((item) => String(item).trim()).filter((item) => item && item !== 'null');
		}

		if (typeof raw === 'string') {
			const trimmed = raw.trim();
			if (!trimmed || trimmed === 'null') {
				return [];
			}

			try {
				const parsed = JSON.parse(trimmed);
				if (Array.isArray(parsed)) {
					return parsed.map((item) => String(item).trim()).filter((item) => item && item !== 'null');
				}
			} catch {
				// ignore parsing error
			}

			return trimmed
				.replace(/^[\[]|[\]]$/g, '')
				.split(',')
				.map((item) => item.replace(/['"]+/g, '').trim())
				.filter((item) => item && item !== 'null');
		}

		return [];
	}

	private parseString(value: unknown): string | undefined {
		if (typeof value !== 'string') {
			return undefined;
		}
		const trimmed = value.trim();
		return trimmed ? trimmed : undefined;
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
				return [];
			}
		}
		return [trimmed];
	}

	private storeList(values: string[]): string | null {
		if (!values.length) {
			return null;
		}
		return JSON.stringify(values);
	}

	private async saveImages(images: string[], id: string, name: string, entityType: string): Promise<string[]> {
		if (!images.length) {
			return [];
		}

		return GramadevataUtils.saveEntityImagesToAzure({
			configService: this.configService,
			images,
			id,
			name,
			entityType,
		});
	}

	private toResponse(record: TempleNearbyRestaurant): Record<string, unknown> {
		const baseUrl = this.getBaseUrl();

		return {
			_id: record.id,
			name: record.name ?? null,
			temple_id: record.templeId ?? null,
			created_at: GramadevataUtils.formatDjangoDateTime(record.createdAt ?? new Date()),
			address: record.address ?? null,
			map_location: record.mapLocation ?? null,
			village_id: record.villageId ?? null,
			status: record.status ?? null,
			user_id: record.userId ?? null,
			image_location: this.mapFileList(record.imageLocation, baseUrl),
			owner_name: record.ownerName ?? null,
			contact_number: record.contactNumber ?? null,
			email_id: record.emailId ?? null,
			website: record.website ?? null,
			event_id: record.eventId ?? null,
			tourism_places: record.tourismPlaces ?? null,
		};
	}

	private parseRawList(raw: unknown): string[] {
		if (raw === null || raw === undefined) {
			return [];
		}

		if (Array.isArray(raw)) {
			return raw.filter((value): value is string => typeof value === 'string').filter(Boolean);
		}

		if (typeof raw === 'string') {
			const trimmed = raw.trim();
			if (!trimmed) {
				return [];
			}
			if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
				try {
					const parsed = JSON.parse(trimmed);
					if (Array.isArray(parsed)) {
						return parsed.filter((value): value is string => typeof value === 'string').filter(Boolean);
					}
				} catch {
					return [];
				}
			}
			return trimmed
				.replace(/[\[\]]/g, '')
				.split(',')
				.map((item) => item.replace(/['\"]+/g, '').trim())
				.filter(Boolean);
		}

		return [];
	}

	private mapFileList(raw: unknown, baseUrl: string): string[] {
		const list = this.parseRawList(raw);
		if (!baseUrl) {
			return list;
		}
		return list.map((path) => {
			if (path.startsWith('http://') || path.startsWith('https://')) {
				return path;
			}
			return `${baseUrl}/${path.replace(/^\/+/, '')}`;
		});
	}

	private getBaseUrl(): string {
		const raw = this.configService.get<string>('File_path');
		if (!raw) {
			return '';
		}
		return raw.endsWith('/') ? raw.slice(0, -1) : raw;
	}

	private async sendNotificationEmail(record: TempleNearbyRestaurant, userPayload?: Record<string, unknown>): Promise<void> {
		const emailHost = this.configService.get<string>('EMAIL_HOST_USER');
		if (!emailHost) {
			return;
		}

		const userId = typeof userPayload?.id === 'string' ? userPayload.id : 'Anonymous';
		const createdAt = GramadevataUtils.formatDjangoDateTime(record.createdAt ?? new Date());

		const text = `User ID: ${userId}\nCreated Time: ${createdAt}\nRestaurant ID: ${record.id}\nRestaurant Name: ${record.name ?? 'N/A'}`;

		await GramadevataUtils.sendAdminEmail(this.configService, {
			subject: 'New Temple Nearby Restaurant Added',
			text,
			recipients: [emailHost],
		});
	}
}
