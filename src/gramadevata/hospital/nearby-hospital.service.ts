import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/sequelize';
import type { CreationAttributes, WhereOptions } from 'sequelize';
import { Op } from 'sequelize';
import { NearbyHospital } from './nearby-hospital.model';
import { Village } from '../villages/village.model';
import { Block } from '../block/block.model';
import { District } from '../../common/models/district.model';
import { State } from '../../common/models/state.model';
import { Country } from '../../common/models/country.model';

import * as GramadevataUtils from '../../common/utils/gramadevata.utils';

type ServiceResult = {
	status: number;
	body: Record<string, unknown>;
};

@Injectable()
export class NearbyHospitalService {
	constructor(
		@InjectModel(NearbyHospital)
		private readonly nearbyHospitalModel: typeof NearbyHospital,
		private readonly configService: ConfigService,
	) {}

	async list(query: Record<string, string | undefined>) {
		const where = this.buildFilters(query);
		const records = await this.nearbyHospitalModel.findAll({
			where,
			order: [['createdAt', 'DESC']],
		});

		return records.map((record) => this.toResponse(record));
	}

	async getById(id: string) {
		const record = await this.nearbyHospitalModel.findByPk(id);
		if (!record || record.status !== 'ACTIVE') {
			return null;
		}

		return this.toResponse(record);
	}

	async create(payload: Record<string, unknown>, userPayload?: Record<string, unknown>): Promise<ServiceResult> {
		try {
			const imageList = this.parseList(payload.image_location ?? payload.imageLocation);
			const licenseList = this.parseList(payload.license_copy ?? payload.licenseCopy);

			const data = this.buildCreatePayload(payload, userPayload);
			data.imageLocation = 'null';
			data.licenseCopy = 'null';

			const created = await this.nearbyHospitalModel.create(data as CreationAttributes<NearbyHospital>);

			const savedImages = await this.saveImages(imageList, created.id, created.name ?? 'hospital', 'nearby_hospital');
			const savedLicenses = await this.saveImages(
				licenseList,
				created.id,
				created.name ?? 'hospital',
				'license_copy',
			);

			if (savedImages.length) {
				created.imageLocation = this.storeList(savedImages) ?? 'null';
			}
			if (savedLicenses.length) {
				created.licenseCopy = this.storeList(savedLicenses) ?? 'null';
			}

			await created.save();
			await this.sendNotificationEmail(created, userPayload);

			return {
				status: 201,
				body: {
					message: 'success',
					result: this.toResponse(created),
				},
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
		const record = await this.nearbyHospitalModel.findByPk(id);
		if (!record) {
			return null;
		}

		if (record.status !== 'ACTIVE') {
			return { status: 404, body: { message: 'Data not found', status: 404 } };
		}

		const updateData = this.buildUpdatePayload(payload);
		if (Object.keys(updateData).length) {
			await record.update(updateData as CreationAttributes<NearbyHospital>);
		}

		const incomingImages = this.parseList(payload.image_location ?? payload.imageLocation);
		const incomingLicenses = this.parseList(payload.license_copy ?? payload.licenseCopy);

		const existingImages = this.normalizeListValue(record.imageLocation);
		const existingLicenses = this.normalizeListValue(record.licenseCopy);

		if (incomingImages.length && !incomingImages.includes('null')) {
			const savedImages = await this.saveImages(
				incomingImages,
				record.id,
				record.name ?? 'hospital',
				'nearby_hospital',
			);
			record.imageLocation = this.storeList([...existingImages, ...savedImages]) ?? record.imageLocation;
		}

		if (incomingLicenses.length && !incomingLicenses.includes('null')) {
			const savedLicenses = await this.saveImages(
				incomingLicenses,
				record.id,
				record.name ?? 'hospital',
				'license_copy',
			);
			record.licenseCopy = this.storeList([...existingLicenses, ...savedLicenses]) ?? record.licenseCopy;
		}

		await record.save();

		return {
			status: 200,
			body: {
				message: 'Nearby Hospital updated successfully',
				result: this.toResponse(record),
			},
		};
	}

	async remove(id: string): Promise<boolean> {
		const record = await this.nearbyHospitalModel.findByPk(id);
		if (!record) {
			return false;
		}

		await record.destroy();
		return true;
	}

	async getByLocation(query: Record<string, string | undefined>) {
		const inputValue = query.input_value;
		if (!inputValue) {
			throw new BadRequestException('input_value is required');
		}

		const searchQuery = (query.search ?? '').trim();
		const where: Record<string, unknown> & { [Op.and]?: unknown[]; [Op.or]?: unknown } = {
			status: 'ACTIVE',
			[Op.or]: [
				{ '$village.block.district.state.country.id$': inputValue },
				{ '$village.block.district.state.id$': inputValue },
				{ '$village.block.district.id$': inputValue },
				{ '$village.block.id$': inputValue },
				{ '$village.id$': inputValue },
			],
		};

		if (searchQuery) {
			where[Op.and] = [
				{
					[Op.or]: [
						{ name: { [Op.like]: `%${searchQuery}%` } },
						{ address: { [Op.like]: `%${searchQuery}%` } },
					],
				},
			];
		}

		let hospitals = await this.nearbyHospitalModel.findAll({
			where,
			include: this.getLocationInclude(),
		});

		if (!hospitals.length) {
			const fallbackWhere: Record<string, unknown> & { [Op.or]?: unknown } = {
				villageId: inputValue,
				status: 'ACTIVE',
			};
			if (searchQuery) {
				fallbackWhere[Op.or] = [
					{ name: { [Op.like]: `%${searchQuery}%` } },
					{ address: { [Op.like]: `%${searchQuery}%` } },
				];
			}
			hospitals = await this.nearbyHospitalModel.findAll({
				where: fallbackWhere,
				include: this.getLocationInclude(),
			});
		}

		return {
			nearby_hospitals: hospitals.map((hospital) => this.toLocationResponse(hospital)),
		};
	}

	private toLocationResponse(record: NearbyHospital): Record<string, unknown> {
		const baseUrl = this.getBaseUrl();
		const village = record.village as Village | undefined;
		return {
			_id: record.id,
			name: record.name ?? null,
			image_location: this.mapFileList(record.imageLocation, baseUrl),
			map_location: this.parseMapLocation(record.mapLocation),
			address: record.address ?? null,
			village_id: this.buildVillageHierarchy(village),
		};
	}

	private parseMapLocation(raw: unknown) {
		if (!raw) {
			return [];
		}
		if (Array.isArray(raw)) {
			return raw;
		}
		if (typeof raw === 'string') {
			const trimmed = raw.trim();
			if (!trimmed) {
				return [];
			}
			if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
				try {
					const parsed = JSON.parse(trimmed);
					return Array.isArray(parsed) ? parsed : [trimmed];
				} catch {
					return [trimmed];
				}
			}
			return [trimmed];
		}
		return [];
	}

	private buildVillageHierarchy(village?: Village | null) {
		if (!village) {
			return null;
		}
		const block = village.block as Block | undefined;
		const district = block?.district as District | undefined;
		const state = district?.state as State | undefined;
		const country = state?.country as Country | undefined;

		if (!block || !district || !state || !country) {
			return {
				_id: village.id,
				name: village.name,
			};
		}

		return {
			_id: village.id,
			name: village.name,
			block: {
				block_id: block.id,
				name: block.name,
				district: {
					district_id: district.id,
					name: district.name,
					state: {
						state_id: state.id,
						name: state.name,
						country: {
							country_id: country.id,
							name: country.name,
						},
					},
				},
			},
		};
	}

	private getLocationInclude() {
		return [
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
		];
	}

	private buildFilters(query: Record<string, string | undefined>): WhereOptions<NearbyHospital> {
		const filters: WhereOptions<NearbyHospital> = { status: 'ACTIVE' };

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
			if (key === 'map_location') {
				(filters as Record<string, unknown>).mapLocation = { [Op.like]: `%${value}%` };
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
			if (key === 'owner_name') {
				(filters as Record<string, unknown>).ownerName = { [Op.like]: `%${value}%` };
				return;
			}
			if (key === 'contact_number') {
				(filters as Record<string, unknown>).contactNumber = value;
				return;
			}
			(filters as Record<string, unknown>)[key] = value;
		});

		return filters;
	}

	private buildCreatePayload(payload: Record<string, unknown>, userPayload?: Record<string, unknown>) {
		const data: Partial<NearbyHospital> = {
			name: this.parseString(payload.name),
			address: this.parseString(payload.address),
			mapLocation: this.parseString(payload.map_location ?? payload.mapLocation),
			templeId: this.parseString(payload.temple_id ?? payload.templeId),
			villageId: this.parseString(payload.village_id ?? payload.villageId),
			userId: this.parseString(payload.user_id ?? payload.userId),
			eventId: this.parseString(payload.event_id ?? payload.eventId),
			tourismPlaces: this.parseString(payload.tourism_places ?? payload.tourismPlaces),
			ownerName: this.parseString(payload.owner_name ?? payload.ownerName),
			contactNumber: this.parseString(payload.contact_number ?? payload.contactNumber),
			status: this.parseString(payload.status),
		};

		const userId = typeof userPayload?.id === 'string' ? userPayload.id : undefined;
		if (!data.userId && userId) {
			data.userId = userId;
		}

		return data;
	}

	private buildUpdatePayload(payload: Record<string, unknown>) {
		const data: Partial<NearbyHospital> = {};

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
		if (payload.event_id !== undefined || payload.eventId !== undefined) {
			data.eventId = this.parseString(payload.event_id ?? payload.eventId);
		}
		if (payload.tourism_places !== undefined || payload.tourismPlaces !== undefined) {
			data.tourismPlaces = this.parseString(payload.tourism_places ?? payload.tourismPlaces);
		}
		if (payload.owner_name !== undefined || payload.ownerName !== undefined) {
			data.ownerName = this.parseString(payload.owner_name ?? payload.ownerName);
		}
		if (payload.contact_number !== undefined || payload.contactNumber !== undefined) {
			data.contactNumber = this.parseString(payload.contact_number ?? payload.contactNumber);
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

	private toResponse(record: NearbyHospital): Record<string, unknown> {
		const baseUrl = this.getBaseUrl();

		return {
			_id: record.id,
			name: record.name ?? null,
			address: record.address ?? null,
			map_location: record.mapLocation ?? null,
			temple_id: record.templeId ?? null,
			village_id: record.villageId ?? null,
			user_id: record.userId ?? null,
			image_location: this.mapFileList(record.imageLocation, baseUrl),
			created_at: record.createdAt ? GramadevataUtils.formatDjangoDateTime(record.createdAt) : null,
			status: record.status ?? null,
			event_id: record.eventId ?? null,
			tourism_places: record.tourismPlaces ?? null,
			owner_name: record.ownerName ?? null,
			contact_number: record.contactNumber ?? null,
			license_copy: this.mapFileList(record.licenseCopy, baseUrl),
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

	private async sendNotificationEmail(record: NearbyHospital, userPayload?: Record<string, unknown>): Promise<void> {
		if (!userPayload) {
			return;
		}

		const emailHost = this.configService.get<string>('EMAIL_HOST_USER');
		if (!emailHost) {
			return;
		}

		const userId = typeof userPayload.id === 'string' ? userPayload.id : 'Anonymous';
		const fullName = typeof userPayload.full_name === 'string'
			? userPayload.full_name
			: typeof userPayload.fullName === 'string'
				? userPayload.fullName
				: '';

		const createdAt = record.createdAt
			? GramadevataUtils.formatDjangoDateTime(record.createdAt)
			: GramadevataUtils.formatDjangoDateTime(new Date());

		const text = `User ID: ${userId}\nFull Name: ${fullName}\nCreated Time: ${createdAt}\nHospital ID: ${record.id}\nHospital Name: ${record.name ?? 'N/A'}`;

		await GramadevataUtils.sendAdminEmail(this.configService, {
			subject: 'New Nearby Hospital Added',
			text,
			recipients: [emailHost],
		});
	}
}
