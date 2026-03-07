import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/sequelize';
import type { CreationAttributes, WhereOptions } from 'sequelize';
import { PoojaStore } from './pooja-store.model';
import * as GramadevataUtils from '../../common/utils/gramadevata.utils';

type ServiceResult = {
	status: number;
	body: Record<string, unknown>;
};

@Injectable()
export class PoojaStoreService {
	constructor(
		@InjectModel(PoojaStore)
		private readonly poojaStoreModel: typeof PoojaStore,
		private readonly configService: ConfigService,
	) {}

	async list(query: Record<string, string | undefined>) {
		const where = this.buildFilters(query);
		const records = await this.poojaStoreModel.findAll({
			where,
			order: [['createdAt', 'DESC']],
		});

		if (!records.length) {
			return { status: 404, body: { message: 'Data not found', status: 404 } };
		}

		return records.map((record) => this.toResponse(record));
	}

	async getById(id: string): Promise<Record<string, unknown> | null> {
		const record = await this.poojaStoreModel.findOne({ where: { id, status: 'ACTIVE' } });
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

			const created = await this.poojaStoreModel.create(data as CreationAttributes<PoojaStore>);

			const savedImages = await this.saveImages(imageList, created.id, created.name ?? 'pooja_store', 'pooja_store');
			if (savedImages.length) {
				created.imageLocation = this.storeList(savedImages) ?? 'null';
				await created.save();
			}

			await this.sendNotificationEmail(created, userPayload, true);

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

	async update(id: string, payload: Record<string, unknown>, userPayload?: Record<string, unknown>): Promise<ServiceResult | null> {
		const record = await this.poojaStoreModel.findOne({ where: { id, status: 'ACTIVE' } });
		if (!record) {
			return null;
		}

		const updateData = this.buildUpdatePayload(payload);
		if (Object.keys(updateData).length) {
			await record.update(updateData as CreationAttributes<PoojaStore>);
		}

		const incomingImages = this.parseList(payload.image_location ?? payload.imageLocation);
		if (incomingImages.length && !incomingImages.includes('null')) {
			const savedImages = await this.saveImages(
				incomingImages,
				record.id,
				record.name ?? 'pooja_store',
				'pooja_store',
			);
			if (savedImages.length) {
				record.imageLocation = this.storeList(savedImages) ?? record.imageLocation;
				await record.save();
			}
		}

		await this.sendNotificationEmail(record, userPayload, false);

		return {
			status: 200,
			body: { message: 'success', result: this.toResponse(record) },
		};
	}

	async remove(id: string): Promise<boolean> {
		const record = await this.poojaStoreModel.findByPk(id);
		if (!record) {
			return false;
		}

		await record.destroy();
		return true;
	}

	private buildFilters(query: Record<string, string | undefined>): WhereOptions<PoojaStore> {
		const filters: WhereOptions<PoojaStore> = { status: 'ACTIVE' };

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
			(filters as Record<string, unknown>)[key] = value;
		});

		return filters;
	}

	private buildCreatePayload(payload: Record<string, unknown>, userPayload?: Record<string, unknown>) {
		const data: Partial<PoojaStore> = {
			name: this.parseString(payload.name),
			address: this.parseString(payload.address),
			mapLocation: this.parseString(payload.map_location ?? payload.mapLocation),
			templeId: this.parseString(payload.temple_id ?? payload.templeId),
			villageId: this.parseString(payload.village_id ?? payload.villageId),
			userId: this.parseString(payload.user_id ?? payload.userId),
			ownerName: this.parseString(payload.owener_name ?? payload.owner_name ?? payload.ownerName),
			status: this.parseString(payload.status),
		};

		const userId = typeof userPayload?.id === 'string' ? userPayload.id : undefined;
		if (!data.userId && userId) {
			data.userId = userId;
		}

		return data;
	}

	private buildUpdatePayload(payload: Record<string, unknown>) {
		const data: Partial<PoojaStore> = {};

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
		if (payload.owener_name !== undefined || payload.owner_name !== undefined || payload.ownerName !== undefined) {
			data.ownerName = this.parseString(payload.owener_name ?? payload.owner_name ?? payload.ownerName);
		}
		if (payload.status !== undefined) data.status = this.parseString(payload.status);

		return data;
	}

	private parseList(value: unknown): string[] {
		return GramadevataUtils.coerceStringList(value);
	}

	private parseString(value: unknown): string | undefined {
		if (typeof value !== 'string') {
			return undefined;
		}
		const trimmed = value.trim();
		return trimmed ? trimmed : undefined;
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

	private toResponse(record: PoojaStore): Record<string, unknown> {
		const baseUrl = this.getBaseUrl();

		return {
			_id: record.id,
			name: record.name ?? null,
			temple_id: record.templeId ?? null,
			created_at: record.createdAt ? GramadevataUtils.formatDjangoDateTime(record.createdAt) : null,
			address: record.address ?? null,
			map_location: record.mapLocation ?? null,
			village_id: record.villageId ?? null,
			status: record.status ?? null,
			user_id: record.userId ?? null,
			image_location: this.mapFileList(record.imageLocation, baseUrl),
			owener_name: record.ownerName ?? null,
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
		const raw = this.configService.get<string>('File_path')
			|| this.configService.get<string>('FILE_URL')
			|| '';
		if (!raw) {
			return '';
		}
		return raw.endsWith('/') ? raw.slice(0, -1) : raw;
	}

	private async sendNotificationEmail(
		record: PoojaStore,
		userPayload: Record<string, unknown> | undefined,
		isCreate: boolean,
	): Promise<void> {
		const emailHost = this.configService.get<string>('EMAIL_HOST_USER');
		if (!emailHost) {
			return;
		}

		const userId = typeof userPayload?.id === 'string' ? userPayload.id : 'Anonymous';
		const timestamp = GramadevataUtils.formatDjangoDateTime(new Date());
		const subject = isCreate ? 'New pooja store Added' : 'Pooja Store Updated';
		const text = isCreate
			? `User ID: ${userId}\nCreated Time: ${timestamp}\nTourism Place ID: ${record.id}\nTourism Place Name: ${record.name ?? 'N/A'}`
			: `User ID: ${userId}\nUpdated Time: ${timestamp}\nPooja Store ID: ${record.id}\nPooja Store Name: ${record.name ?? 'N/A'}`;

		await GramadevataUtils.sendAdminEmail(this.configService, {
			subject,
			text,
			recipients: [emailHost],
		});
	}
}
