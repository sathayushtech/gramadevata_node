import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/sequelize';
import type { CreationAttributes, WhereOptions } from 'sequelize';
import { Op } from 'sequelize';
import { BloodBank } from './blood-bank.model';
import { AddMoreBloodBank } from './add-more-blood-bank.model';
import { Village } from '../villages/village.model';
import { Block } from '../block/block.model';
import { District } from '../../common/models/district.model';
import { State } from '../../common/models/state.model';
import { Country } from '../../common/models/country.model';
import * as GramadevataUtils from '../../common/utils/gramadevata.utils';

type CreateResult = {
	status: number;
	body: Record<string, unknown>;
};

@Injectable()
export class BloodBankService {
	constructor(
		@InjectModel(BloodBank)
		private readonly bloodBankModel: typeof BloodBank,
		@InjectModel(AddMoreBloodBank)
		private readonly addMoreModel: typeof AddMoreBloodBank,
		private readonly configService: ConfigService,
	) {}

	async list(query: Record<string, string | undefined>) {
		const filters = this.buildFilters(query);
		filters.status = 'ACTIVE';

		const records = await this.bloodBankModel.findAll({
			where: filters,
			order: [['createdAt', 'DESC']],
		});

		if (!records.length) {
			return { message: 'Data not found', status: 404 };
		}

		return records.map((record) => this.toResponse(record));
	}

	async getById(id: string): Promise<Record<string, unknown> | null> {
		const record = await this.bloodBankModel.findOne({
			where: { id, status: 'ACTIVE' },
		});

		if (!record) {
			return null;
		}

		return this.toResponse(record);
	}

	async create(payload: Record<string, unknown>, userPayload?: Record<string, unknown>): Promise<CreateResult> {
		try {
			const imageLocations = this.parseList(payload.image_location ?? payload.imageLocation);
			const licenseCopies = this.parseList(payload.license_copy ?? payload.licenseCopy);

			const data = this.mapPayload(payload);
			data.imageLocation = this.storeList([]) ?? undefined;
			data.licenseCopy = this.storeList([]) ?? undefined;

			const created = await this.bloodBankModel.create(data);

			const savedImages = imageLocations.length
				? await GramadevataUtils.saveEntityImagesToAzure({
					configService: this.configService,
					images: imageLocations,
					id: created.id,
					name: created.name ?? 'bloodbank',
					entityType: 'bloodbank',
				})
				: [];

			const savedLicenses = licenseCopies.length
				? await GramadevataUtils.saveEntityImagesToAzure({
					configService: this.configService,
					images: licenseCopies,
					id: created.id,
					name: `${created.name ?? 'bloodbank'}_license`,
					entityType: 'bloodbank',
				})
				: [];

			if (savedImages.length) {
				created.imageLocation = this.storeList(savedImages) ?? undefined;
			}

			if (savedLicenses.length) {
				created.licenseCopy = this.storeList(savedLicenses) ?? undefined;
			}

			if (savedImages.length || savedLicenses.length) {
				await created.save();
			}

			const userId = this.resolveUserId(userPayload);
			await this.sendNotification(userId, created);

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

	async update(id: string, payload: Record<string, unknown>) {
		const record = await this.bloodBankModel.findOne({
			where: { id, status: 'ACTIVE' },
		});

		if (!record) {
			return null;
		}

		const updateData = this.mapUpdatePayload(payload);
		if (Object.keys(updateData).length) {
			await record.update(updateData as CreationAttributes<BloodBank>);
		}

		const newImages = this.parseList(payload.image_location ?? payload.imageLocation);
		const newLicenses = this.parseList(payload.license_copy ?? payload.licenseCopy);

		const storedImages = this.normalizeListValue(record.imageLocation);
		const storedLicenses = this.normalizeListValue(record.licenseCopy);

		if (newImages.length) {
			const savedImages = await GramadevataUtils.saveEntityImagesToAzure({
				configService: this.configService,
				images: newImages,
				id: record.id,
				name: record.name ?? 'bloodbank',
				entityType: 'bloodbank',
			});

			if (savedImages.length) {
				record.imageLocation = this.storeList([...storedImages, ...savedImages]) ?? undefined;
			}
		}

		if (newLicenses.length) {
			const savedLicenses = await GramadevataUtils.saveEntityImagesToAzure({
				configService: this.configService,
				images: newLicenses,
				id: record.id,
				name: `${record.name ?? 'bloodbank'}_license`,
				entityType: 'bloodbank',
			});

			if (savedLicenses.length) {
				record.licenseCopy = this.storeList([...storedLicenses, ...savedLicenses]) ?? undefined;
			}
		}

		await record.save();

		return {
			message: 'BloodBank updated successfully',
			result: this.toResponse(record),
		};
	}

	async remove(id: string) {
		const record = await this.bloodBankModel.findByPk(id);
		if (!record) {
			return false;
		}

		await record.destroy();
		return true;
	}

	async listByLocation(query: Record<string, string | undefined>) {
		const inputValue = query.input_value || query.inputValue;
		if (!inputValue) {
			return {
				status: 400,
				body: { message: 'input_value is required' },
			};
		}

		const search = (query.search || '').trim();

		const include = [
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
										include: [
											{
												model: Country,
												as: 'country',
												required: false,
											},
										],
									},
								],
							},
						],
					},
				],
			},
		];

		const orFilters: WhereOptions<BloodBank>[] = [
			{ '$village.block.district.state.country.id$': inputValue },
			{ '$village.block.district.state.id$': inputValue },
			{ '$village.block.district.id$': inputValue },
			{ '$village.block.id$': inputValue },
			{ '$village.id$': inputValue },
		];

		const searchFilters: WhereOptions<BloodBank>[] = [];
		if (search) {
			const pattern = `%${search}%`;
			searchFilters.push(
				{ name: { [Op.like]: pattern } },
				{ address: { [Op.like]: pattern } },
				{ bloodGroup: { [Op.like]: pattern } },
			);
		}

		const where: WhereOptions<BloodBank> = {
			status: 'ACTIVE',
			[Op.or]: orFilters,
			...(searchFilters.length ? { [Op.and]: [{ [Op.or]: searchFilters }] } : {}),
		};

		let records = await this.bloodBankModel.findAll({
			where,
			include,
		});

		if (!records.length) {
			const fallbackWhere: WhereOptions<BloodBank> = {
				status: 'ACTIVE',
				villageId: inputValue,
				...(searchFilters.length ? { [Op.or]: searchFilters } : {}),
			};

			records = await this.bloodBankModel.findAll({
				where: fallbackWhere,
				include,
			});
		}

		return {
			status: 200,
			body: { blood_banks: records.map((record) => this.toLocationResponse(record)) },
		};
	}

	async merge(id: string, payload: Record<string, unknown>) {
		const bloodBank = await this.bloodBankModel.findByPk(id);
		if (!bloodBank) {
			return null;
		}

		const newDesc = typeof payload.desc === 'string' ? payload.desc.trim() : '';
		const newImages = this.parseList(payload.image_location ?? payload.imageLocation);
		const newMapLocations = this.cleanMapLocation(payload.map_location ?? payload.mapLocation);

		const oldDesc = '';
		const oldImages = this.normalizeListValue(bloodBank.imageLocation);
		const oldMapLocations = this.cleanMapLocation(bloodBank.mapLocation);

		const additionalDetails = await this.addMoreModel.findAll({
			where: { bloodBankId: bloodBank.id },
		});

		const detailDescs: string[] = [];
		const detailImages: string[] = [];

		additionalDetails.forEach((detail) => {
			if (detail.desc) {
				detailDescs.push(detail.desc.trim());
			}
			detailImages.push(...this.normalizeListValue(detail.imageLocation));
		});

		const mergedDesc = this.mergeUnique([oldDesc, ...detailDescs, newDesc])
			.filter(Boolean)
			.join(', ');

		const mergedImages = this.mergeUnique([...oldImages, ...detailImages, ...newImages]);
		const mergedMapLocations = this.cleanMapLocation([...oldMapLocations, ...newMapLocations]);

		bloodBank.imageLocation = this.storeList(mergedImages) ?? undefined;
		bloodBank.mapLocation = mergedMapLocations.length ? JSON.stringify(mergedMapLocations) : undefined;
		bloodBank.status = 'ACTIVE';
		await bloodBank.save();

		await this.addMoreModel.destroy({ where: { bloodBankId: bloodBank.id } });
		await this.addMoreModel.create({
			bloodBankId: bloodBank.id,
			desc: mergedDesc || null,
			imageLocation: mergedImages,
			status: 'ACTIVE',
		} as CreationAttributes<AddMoreBloodBank>);

		return {
			blood_bank_id: bloodBank.id,
			name: bloodBank.name ?? null,
			desc: mergedDesc || null,
			image_location: this.mapFileList(mergedImages),
			map_location: mergedMapLocations,
			status: 'ACTIVE',
		};
	}

	private buildFilters(query: Record<string, string | undefined>) {
		const filters: Record<string, string> = {};

		Object.entries(query).forEach(([key, value]) => {
			if (value === undefined) {
				return;
			}

			switch (key) {
				case '_id':
				case 'id':
					filters.id = value;
					break;
				case 'name':
					filters.name = value;
					break;
				case 'address':
					filters.address = value;
					break;
				case 'blood_group':
					filters.bloodGroup = value;
					break;
				case 'map_location':
					filters.mapLocation = value;
					break;
				case 'temple_id':
					filters.templeId = value;
					break;
				case 'village_id':
					filters.villageId = value;
					break;
				case 'user_id':
					filters.userId = value;
					break;
				case 'organization_name':
					filters.organizationName = value;
					break;
				case 'contact_number':
					filters.contactNumber = value;
					break;
				case 'license_number':
					filters.licenseNumber = value;
					break;
				case 'whatsapp_number':
					filters.whatsappNumber = value;
					break;
				case 'owner_name':
					filters.ownerName = value;
					break;
				case 'status':
					filters.status = value;
					break;
				default:
					break;
			}
		});

		return filters;
	}

	private mapPayload(payload: Record<string, unknown>) {
		const id = typeof payload._id === 'string'
			? payload._id
			: typeof payload.id === 'string'
				? payload.id
				: undefined;

		const createdAt = this.parseDate(payload.created_at ?? payload.createdAt);

		const data: CreationAttributes<BloodBank> = {
			id,
			name: typeof payload.name === 'string' ? payload.name : null,
			address: typeof payload.address === 'string' ? payload.address : null,
			bloodGroup: typeof payload.blood_group === 'string'
				? payload.blood_group
				: typeof payload.bloodGroup === 'string'
					? payload.bloodGroup
					: null,
			mapLocation: typeof payload.map_location === 'string'
				? payload.map_location
				: typeof payload.mapLocation === 'string'
					? payload.mapLocation
					: null,
			templeId: typeof payload.temple_id === 'string'
				? payload.temple_id
				: typeof payload.templeId === 'string'
					? payload.templeId
					: null,
			villageId: typeof payload.village_id === 'string'
				? payload.village_id
				: typeof payload.villageId === 'string'
					? payload.villageId
					: null,
			userId: typeof payload.user_id === 'string'
				? payload.user_id
				: typeof payload.userId === 'string'
					? payload.userId
					: null,
			imageLocation: payload.image_location ?? payload.imageLocation ?? null,
			createdAt,
			status: typeof payload.status === 'string' ? payload.status : null,
			organizationName: typeof payload.organization_name === 'string'
				? payload.organization_name
				: typeof payload.organizationName === 'string'
					? payload.organizationName
					: null,
			contactNumber: typeof payload.contact_number === 'string'
				? payload.contact_number
				: typeof payload.contactNumber === 'string'
					? payload.contactNumber
					: null,
			licenseCopy: payload.license_copy ?? payload.licenseCopy ?? null,
			licenseNumber: typeof payload.license_number === 'string'
				? payload.license_number
				: typeof payload.licenseNumber === 'string'
					? payload.licenseNumber
					: null,
			whatsappNumber: typeof payload.whatsapp_number === 'string'
				? payload.whatsapp_number
				: typeof payload.whatsappNumber === 'string'
					? payload.whatsappNumber
					: null,
			ownerName: typeof payload.owner_name === 'string'
				? payload.owner_name
				: typeof payload.ownerName === 'string'
					? payload.ownerName
					: null,
		} as CreationAttributes<BloodBank>;

		return data;
	}

	private mapUpdatePayload(payload: Record<string, unknown>) {
		const updateData: Partial<BloodBank> = {};

		if (Object.prototype.hasOwnProperty.call(payload, 'name') && typeof payload.name === 'string') {
			updateData.name = payload.name;
		}

		if (Object.prototype.hasOwnProperty.call(payload, 'address') && typeof payload.address === 'string') {
			updateData.address = payload.address;
		}

		if (Object.prototype.hasOwnProperty.call(payload, 'blood_group') && typeof payload.blood_group === 'string') {
			updateData.bloodGroup = payload.blood_group;
		} else if (Object.prototype.hasOwnProperty.call(payload, 'bloodGroup') && typeof payload.bloodGroup === 'string') {
			updateData.bloodGroup = payload.bloodGroup;
		}

		if (Object.prototype.hasOwnProperty.call(payload, 'map_location') && typeof payload.map_location === 'string') {
			updateData.mapLocation = payload.map_location;
		} else if (Object.prototype.hasOwnProperty.call(payload, 'mapLocation') && typeof payload.mapLocation === 'string') {
			updateData.mapLocation = payload.mapLocation;
		}

		if (Object.prototype.hasOwnProperty.call(payload, 'temple_id') && typeof payload.temple_id === 'string') {
			updateData.templeId = payload.temple_id;
		} else if (Object.prototype.hasOwnProperty.call(payload, 'templeId') && typeof payload.templeId === 'string') {
			updateData.templeId = payload.templeId;
		}

		if (Object.prototype.hasOwnProperty.call(payload, 'village_id') && typeof payload.village_id === 'string') {
			updateData.villageId = payload.village_id;
		} else if (Object.prototype.hasOwnProperty.call(payload, 'villageId') && typeof payload.villageId === 'string') {
			updateData.villageId = payload.villageId;
		}

		if (Object.prototype.hasOwnProperty.call(payload, 'user_id') && typeof payload.user_id === 'string') {
			updateData.userId = payload.user_id;
		} else if (Object.prototype.hasOwnProperty.call(payload, 'userId') && typeof payload.userId === 'string') {
			updateData.userId = payload.userId;
		}

		if (Object.prototype.hasOwnProperty.call(payload, 'status') && typeof payload.status === 'string') {
			updateData.status = payload.status;
		}

		if (Object.prototype.hasOwnProperty.call(payload, 'organization_name')
			&& typeof payload.organization_name === 'string') {
			updateData.organizationName = payload.organization_name;
		} else if (Object.prototype.hasOwnProperty.call(payload, 'organizationName')
			&& typeof payload.organizationName === 'string') {
			updateData.organizationName = payload.organizationName;
		}

		if (Object.prototype.hasOwnProperty.call(payload, 'contact_number')
			&& typeof payload.contact_number === 'string') {
			updateData.contactNumber = payload.contact_number;
		} else if (Object.prototype.hasOwnProperty.call(payload, 'contactNumber')
			&& typeof payload.contactNumber === 'string') {
			updateData.contactNumber = payload.contactNumber;
		}

		if (Object.prototype.hasOwnProperty.call(payload, 'license_number')
			&& typeof payload.license_number === 'string') {
			updateData.licenseNumber = payload.license_number;
		} else if (Object.prototype.hasOwnProperty.call(payload, 'licenseNumber')
			&& typeof payload.licenseNumber === 'string') {
			updateData.licenseNumber = payload.licenseNumber;
		}

		if (Object.prototype.hasOwnProperty.call(payload, 'whatsapp_number')
			&& typeof payload.whatsapp_number === 'string') {
			updateData.whatsappNumber = payload.whatsapp_number;
		} else if (Object.prototype.hasOwnProperty.call(payload, 'whatsappNumber')
			&& typeof payload.whatsappNumber === 'string') {
			updateData.whatsappNumber = payload.whatsappNumber;
		}

		if (Object.prototype.hasOwnProperty.call(payload, 'owner_name')
			&& typeof payload.owner_name === 'string') {
			updateData.ownerName = payload.owner_name;
		} else if (Object.prototype.hasOwnProperty.call(payload, 'ownerName')
			&& typeof payload.ownerName === 'string') {
			updateData.ownerName = payload.ownerName;
		}

		return updateData;
	}

	private parseDate(value: unknown): Date | null {
		if (value instanceof Date) {
			return value;
		}
		if (typeof value === 'string') {
			const parsed = new Date(value);
			return isNaN(parsed.getTime()) ? null : parsed;
		}
		return null;
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

	private normalizeListValue(raw: unknown): string[] {
		return this.parseList(raw);
	}

	private storeList(list: string[]) {
		if (!list.length) {
			return null;
		}
		return JSON.stringify(list);
	}

	private mapFileList(list: string[]) {
		const baseUrl = this.getFileBaseUrl();
		if (!baseUrl) {
			return list;
		}
		return list.map((path) => `${baseUrl}${path}`);
	}

	private getFileBaseUrl() {
		const raw = this.configService.get<string>('File_path')
			|| this.configService.get<string>('FILE_URL')
			|| '';
		if (!raw) {
			return '';
		}
		return raw.endsWith('/') ? raw : `${raw}/`;
	}

	private resolveUserId(userPayload?: Record<string, unknown>) {
		if (!userPayload) {
			return 'Anonymous';
		}

		if (typeof userPayload.id === 'string') {
			return userPayload.id;
		}

		if (typeof userPayload.user_id === 'string') {
			return userPayload.user_id;
		}

		return 'Anonymous';
	}

	private async sendNotification(userId: string, record: BloodBank) {
		const recipient = this.configService.get<string>('DEFAULT_FROM_EMAIL');

		const text = `User ID: ${userId}\nCreated Time: ${GramadevataUtils.formatDjangoDateTime(new Date())}\nBloodBank ID: ${record.id}\nBloodBank Name: ${record.name ?? ''}`;

		await GramadevataUtils.sendAdminEmail(this.configService, {
			subject: 'New Blood Bank Added',
			text,
			recipients: recipient ? [recipient] : [],
		});
	}

	private toResponse(record: BloodBank): Record<string, unknown> {
		return {
			_id: record.id,
			name: record.name ?? null,
			address: record.address ?? null,
			blood_group: record.bloodGroup ?? null,
			map_location: record.mapLocation ?? null,
			temple_id: record.templeId ?? null,
			village_id: record.villageId ?? null,
			user_id: record.userId ?? null,
			image_location: this.mapFileList(this.normalizeListValue(record.imageLocation)),
			created_at: record.createdAt ?? null,
			status: record.status ?? null,
			organization_name: record.organizationName ?? null,
			contact_number: record.contactNumber ?? null,
			license_copy: this.mapFileList(this.normalizeListValue(record.licenseCopy)),
			license_number: record.licenseNumber ?? null,
			whatsapp_number: record.whatsappNumber ?? null,
			owner_name: record.ownerName ?? null,
		};
	}

	private toLocationResponse(record: BloodBank): Record<string, unknown> {
		return {
			_id: record.id,
			village_id: this.mapVillage(record.village),
			name: record.name ?? null,
			image_location: this.mapFileList(this.normalizeListValue(record.imageLocation)),
			map_location: record.mapLocation ?? null,
			address: record.address ?? null,
		};
	}

	private mapVillage(village?: Village | null) {
		if (!village) {
			return null;
		}

		const block = village.block;
		const district = block?.district;
		const state = district?.state;
		const country = state?.country;

		return {
			_id: village.id,
			name: village.name,
			block: {
				block_id: block?.id ?? null,
				name: block?.name ?? null,
				district: {
					district_id: district?.id ?? null,
					name: district?.name ?? null,
					state: {
						state_id: state?.id ?? null,
						name: state?.name ?? null,
						country: {
							country_id: country?.id ?? null,
							name: country?.name ?? null,
						},
					},
				},
			},
		};
	}

	private cleanMapLocation(raw: unknown): string[] {
		const results: string[] = [];
		const seen = new Set<string>();

		const addValue = (value: string) => {
			const match = value.match(/https:\/\/maps\.app\.goo\.gl\/\S+/);
			if (!match) {
				return;
			}
			const url = match[0];
			if (!seen.has(url)) {
				seen.add(url);
				results.push(url);
			}
		};

		const walk = (value: unknown) => {
			if (!value) {
				return;
			}

			if (Array.isArray(value)) {
				value.forEach((item) => walk(item));
				return;
			}

			if (typeof value === 'string') {
				const trimmed = value.trim();
				if (!trimmed) {
					return;
				}

				if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
					try {
						const parsed = JSON.parse(trimmed);
						walk(parsed);
						return;
					} catch {
						// continue
					}
				}

				const cleaned = trimmed.replace(/\\/g, '').replace(/^['"]|['"]$/g, '');
				addValue(cleaned);
			}
		};

		walk(raw);
		return results;
	}

	private mergeUnique(values: string[]) {
		const unique = new Map<string, string>();
		values.forEach((value) => {
			const trimmed = value?.trim();
			if (!trimmed) {
				return;
			}
			if (!unique.has(trimmed)) {
				unique.set(trimmed, trimmed);
			}
		});
		return Array.from(unique.values());
	}
}
