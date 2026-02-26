import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import type { CreationAttributes } from 'sequelize';
import nodemailer from 'nodemailer';
import { AddTempleDetails } from './add-temple-details.model';
import { Register as User } from '../auth/user.model';
import * as GramadevataUtils from '../../common/utils/gramadevata.utils';

type CreateResult = {
	status: number;
	body: Record<string, unknown>;
};

type PaginatedResult = {
	count: number;
	next: number | null;
	previous: number | null;
	results: Record<string, unknown>[];
};

@Injectable()
export class AddTempleDetailsService {
	constructor(
		@InjectModel(AddTempleDetails)
		private readonly addTempleDetailsModel: typeof AddTempleDetails,
		@InjectModel(User)
		private readonly userModel: typeof User,
		private readonly configService: ConfigService
	) {}

	async list(query: Record<string, string | undefined>): Promise<Record<string, unknown>[] | PaginatedResult> {
		const where: Record<string, string> = {};
		if (query.temple_id) where.templeId = query.temple_id;
		if (query.user_id) where.userId = query.user_id;

		const page = this.parsePage(query.page ?? query.page_no);
		const pageSize = this.parsePageSize(query.page_size ?? query.pageSize);

		if (page !== null) {
			const limit = pageSize ?? 10;
			const offset = (page - 1) * limit;
			const { rows, count } = await this.addTempleDetailsModel.findAndCountAll({
				where,
				limit,
				offset,
			});

			const results = rows.map((record) => this.toResponse(record));
			const totalPages = Math.ceil(count / limit) || 1;

			return {
				count,
				next: page < totalPages ? page + 1 : null,
				previous: page > 1 ? page - 1 : null,
				results,
			};
		}

		const records = await this.addTempleDetailsModel.findAll({
			where,
		});

		return records.map((record) => this.toResponse(record));
	}

	async getById(id: string): Promise<Record<string, unknown> | null> {
		const record = await this.addTempleDetailsModel.findByPk(id);
		if (!record) {
			return null;
		}

		return this.toResponse(record);
	}

	async create(payload: Record<string, unknown>, userPayload?: Record<string, unknown>): Promise<CreateResult> {
		try {
			const user = await this.findUser(userPayload);
			if (!user) {
				return { status: 404, body: { message: 'User not found.' } };
			}
			if ((user.isMember ?? '').toString().toLowerCase() === 'false') {
				return {
					status: 200,
					body: { message: 'Cannot add more details. Membership details are required.' },
				};
			}

			const imageList = this.parseList(payload.image_location ?? payload.imageLocation);
			const videoList = this.parseList(payload.video ?? payload.videoLocation ?? payload.video_location);

			const data = this.buildCreatePayload(payload, user.id);
			data.imageLocation = 'null' as unknown as AddTempleDetails['imageLocation'];
			data.video = 'null' as unknown as AddTempleDetails['video'];

			const created = await this.addTempleDetailsModel.create(data);

			const images = imageList.filter((img) => img && img !== 'null');
			const videos = videoList.filter((vid) => vid && vid !== 'null');

			let updated = false;
			const entityType = 'temple';

			const savedImages = await GramadevataUtils.saveEntityImagesToAzure({
				configService: this.configService,
				images,
				id: created.id,
				name: created.templeId ?? 'temple',
				entityType,
			});
			const savedVideos = await GramadevataUtils.saveEntityVideosToAzure({
				configService: this.configService,
				videos,
				id: created.id,
				name: created.templeId ?? 'temple',
				entityType,
			});

			if (savedImages.length) {
				created.imageLocation = savedImages;
				updated = true;
			}
			if (savedVideos.length) {
				created.video = savedVideos;
				updated = true;
			}

			if (updated) {
				await created.save();
			}

			const defaultEmail = this.configService.get<string>('DEFAULT_FROM_EMAIL');
			const recipients = [user.email, ...(defaultEmail ? [defaultEmail] : [])].filter((email): email is string => typeof email === 'string');
			await GramadevataUtils.sendAdminEmail(this.configService, { 
                subject: 'Added More Temple Details', 
                text: `User ID: ${user.id}\nCreated Time: ${new Date().toISOString()}\nAdded details ID: ${created.templeId}`, 
			    recipients 
            });

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
		const record = await this.addTempleDetailsModel.findByPk(id);
		if (!record) {
			return null;
		}

		const updateData = this.buildUpdatePayload(payload);
		if (Object.keys(updateData).length) {
			await record.update(updateData as CreationAttributes<AddTempleDetails>);
		}

		const imageLocations = payload.image_location ?? payload.imageLocation;
		const videos = payload.video ?? payload.videoLocation ?? payload.video_location;

		let updated = false;
		if (imageLocations !== undefined) {
			const imageList = this.parseList(imageLocations);
			const images = imageList.filter((img) => img && img !== 'null');
			const savedImages = await GramadevataUtils.saveEntityImagesToAzure({
				configService: this.configService,
				images,
				id: record.id,
				name: record.templeId ?? 'temple',
				entityType: 'temple',
			});
			if (savedImages.length) {
				record.imageLocation = savedImages;
				updated = true;
			}
		}

		if (videos !== undefined) {
			const videoList = this.parseList(videos);
			const cleaned = videoList.filter((vid) => vid && vid !== 'null');
			const savedVideos = await GramadevataUtils.saveEntityVideosToAzure({
				configService: this.configService,
				videos: cleaned,
				id: record.id,
				name: record.templeId ?? 'temple',
				entityType: 'temple',
			});
			if (savedVideos.length) {
				record.video = savedVideos;
				updated = true;
			}
		}

		if (updated) {
			await record.save();
		}

		return {
			message: 'Updated successfully',
			data: this.toResponse(record),
		};
	}

	async remove(id: string): Promise<boolean> {
		const record = await this.addTempleDetailsModel.findByPk(id);
		if (!record) {
			return false;
		}

		await record.destroy();
		return true;
	}

	private async findUser(userPayload?: Record<string, unknown>) {
		if (!userPayload) {
			return null;
		}

		const email = typeof userPayload.email === 'string' ? userPayload.email : undefined;
		const contactNumber = typeof userPayload.contact_number === 'string'
			? userPayload.contact_number
			: typeof userPayload.contactNumber === 'string'
				? userPayload.contactNumber
				: undefined;
		const userId = typeof userPayload.user_id === 'string'
			? userPayload.user_id
			: typeof userPayload.id === 'string'
				? userPayload.id
				: undefined;

		if (email || contactNumber) {
			const orConditions = [] as Record<string, string>[];
			if (email) {
				orConditions.push({ email });
			}
			if (contactNumber) {
				orConditions.push({ contactNumber });
			}

			const user = await this.userModel.findOne({
				where: {
					[Op.or]: orConditions,
				},
			});

			if (user) {
				return user;
			}
		}

		if (userId) {
			return this.userModel.findByPk(userId);
		}

		return null;
	}

	private buildCreatePayload(payload: Record<string, unknown>, fallbackUserId: string) {
		const id = typeof payload._id === 'string'
			? payload._id
			: typeof payload.id === 'string'
				? payload.id
				: undefined;

		const templeId = typeof payload.temple_id === 'string'
			? payload.temple_id
			: typeof payload.templeId === 'string'
				? payload.templeId
				: undefined;

		const userId = typeof payload.user_id === 'string'
			? payload.user_id
			: typeof payload.userId === 'string'
				? payload.userId
				: fallbackUserId;

		const createdAt = payload.created_at instanceof Date
			? payload.created_at
			: typeof payload.created_at === 'string'
				? new Date(payload.created_at)
				: new Date();

		const data: CreationAttributes<AddTempleDetails> = {
			id,
			templeId: templeId ?? null,
			userId: userId ?? null,
			desc: typeof payload.desc === 'string' ? payload.desc : null,
			mapLocation: typeof payload.map_location === 'string'
				? payload.map_location
				: typeof payload.mapLocation === 'string'
					? payload.mapLocation
					: null,
			templeWebsite: typeof payload.temple_website === 'string'
				? payload.temple_website
				: typeof payload.templeWebsite === 'string'
					? payload.templeWebsite
					: null,
			templeArea: typeof payload.temple_area === 'string'
				? payload.temple_area
				: typeof payload.templeArea === 'string'
					? payload.templeArea
					: null,
			templeTimings: typeof payload.temple_timings === 'string'
				? payload.temple_timings
				: typeof payload.templeTimings === 'string'
					? payload.templeTimings
					: null,
			constructionYear: typeof payload.construction_year === 'string'
				? payload.construction_year
				: typeof payload.constructionYear === 'string'
					? payload.constructionYear
					: null,
			otherDiety: typeof payload.other_diety === 'string'
				? payload.other_diety
				: typeof payload.otherDiety === 'string'
					? payload.otherDiety
					: null,
			imageLocation: payload.image_location ?? payload.imageLocation ?? [],
			video: payload.video ?? payload.videoLocation ?? payload.video_location ?? [],
			status: typeof payload.status === 'string' ? payload.status : null,
			createdAt,
		} as CreationAttributes<AddTempleDetails>;

		return data;
	}

	private buildUpdatePayload(payload: Record<string, unknown>) {
		const updateData: Partial<AddTempleDetails> = {};

		if (Object.prototype.hasOwnProperty.call(payload, 'desc')) {
			if (typeof payload.desc === 'string') {
				updateData.desc = payload.desc;
			}
		}

		if (Object.prototype.hasOwnProperty.call(payload, 'map_location')) {
			if (typeof payload.map_location === 'string') {
				updateData.mapLocation = payload.map_location;
			}
		} else if (Object.prototype.hasOwnProperty.call(payload, 'mapLocation')) {
			if (typeof payload.mapLocation === 'string') {
				updateData.mapLocation = payload.mapLocation;
			}
		}

		if (Object.prototype.hasOwnProperty.call(payload, 'temple_website')) {
			if (typeof payload.temple_website === 'string') {
				updateData.templeWebsite = payload.temple_website;
			}
		} else if (Object.prototype.hasOwnProperty.call(payload, 'templeWebsite')) {
			if (typeof payload.templeWebsite === 'string') {
				updateData.templeWebsite = payload.templeWebsite;
			}
		}

		if (Object.prototype.hasOwnProperty.call(payload, 'temple_area')) {
			if (typeof payload.temple_area === 'string') {
				updateData.templeArea = payload.temple_area;
			}
		} else if (Object.prototype.hasOwnProperty.call(payload, 'templeArea')) {
			if (typeof payload.templeArea === 'string') {
				updateData.templeArea = payload.templeArea;
			}
		}

		if (Object.prototype.hasOwnProperty.call(payload, 'temple_timings')) {
			if (typeof payload.temple_timings === 'string') {
				updateData.templeTimings = payload.temple_timings;
			}
		} else if (Object.prototype.hasOwnProperty.call(payload, 'templeTimings')) {
			if (typeof payload.templeTimings === 'string') {
				updateData.templeTimings = payload.templeTimings;
			}
		}

		if (Object.prototype.hasOwnProperty.call(payload, 'construction_year')) {
			if (typeof payload.construction_year === 'string') {
				updateData.constructionYear = payload.construction_year;
			}
		} else if (Object.prototype.hasOwnProperty.call(payload, 'constructionYear')) {
			if (typeof payload.constructionYear === 'string') {
				updateData.constructionYear = payload.constructionYear;
			}
		}

		if (Object.prototype.hasOwnProperty.call(payload, 'other_diety')) {
			if (typeof payload.other_diety === 'string') {
				updateData.otherDiety = payload.other_diety;
			}
		} else if (Object.prototype.hasOwnProperty.call(payload, 'otherDiety')) {
			if (typeof payload.otherDiety === 'string') {
				updateData.otherDiety = payload.otherDiety;
			}
		}

		if (Object.prototype.hasOwnProperty.call(payload, 'temple_id')) {
			if (typeof payload.temple_id === 'string') {
				updateData.templeId = payload.temple_id;
			}
		} else if (Object.prototype.hasOwnProperty.call(payload, 'templeId')) {
			if (typeof payload.templeId === 'string') {
				updateData.templeId = payload.templeId;
			}
		}

		if (Object.prototype.hasOwnProperty.call(payload, 'user_id')) {
			if (typeof payload.user_id === 'string') {
				updateData.userId = payload.user_id;
			}
		} else if (Object.prototype.hasOwnProperty.call(payload, 'userId')) {
			if (typeof payload.userId === 'string') {
				updateData.userId = payload.userId;
			}
		}

		if (Object.prototype.hasOwnProperty.call(payload, 'status')) {
			if (typeof payload.status === 'string') {
				updateData.status = payload.status;
			}
		}

		return updateData;
	}

	private toResponse(record: AddTempleDetails): Record<string, unknown> {
		const plain = record.get({ plain: true }) as AddTempleDetails & {
			templeId?: string;
			userId?: string;
			imageLocation?: unknown;
			video?: unknown;
			createdAt?: Date;
		};

		return {
			_id: plain.id,
			image_location: this.mapFileList(plain.imageLocation),
			desc: plain.desc ?? null,
			map_location: plain.mapLocation ?? null,
			temple_id: plain.templeId ?? null,
			user_id: plain.userId ?? null,
			created_at: plain.createdAt ?? null,
			temple_website: plain.templeWebsite ?? null,
			video: this.mapFileList(plain.video),
			temple_area: plain.templeArea ?? null,
			temple_timings: plain.templeTimings ?? null,
			construction_year: plain.constructionYear ?? null,
			other_diety: plain.otherDiety ?? null,
			status: plain.status ?? null,
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

	private mapFileList(raw: unknown) {
		const list = this.parseList(raw);
		const baseUrl = this.configService.get<string>('File_path')
			|| this.configService.get<string>('FILE_URL')
			|| '';
		if (!baseUrl) {
			return list;
		}

		return list.map((path) => `${baseUrl}${path.trim()}`);
	}

	private parsePage(value?: string) {
		if (!value) {
			return null;
		}
		const parsed = Number(value);
		if (!Number.isFinite(parsed) || parsed < 1) {
			return null;
		}
		return Math.floor(parsed);
	}

	private parsePageSize(value?: string) {
		if (!value) {
			return null;
		}
		const parsed = Number(value);
		if (!Number.isFinite(parsed) || parsed < 1) {
			return null;
		}
		return Math.floor(parsed);
	}
}
