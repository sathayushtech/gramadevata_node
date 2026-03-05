import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import type { CreationAttributes, WhereOptions } from 'sequelize';
import { CommentStatus } from '../../common/enums/comment-status.enum';
import { Comment } from '../comments/comment.model';
import { Register as User } from '../auth/user.model';
import { Village } from '../villages/village.model';
import { Block } from '../block/block.model';
import { District } from '../../common/models/district.model';
import { State } from '../../common/models/state.model';
import { Country } from '../../common/models/country.model';
import { Goshala } from './goshala.model';
import { GoshalaCategory } from './goshala-category.model';
import { Temple } from '../temple/temple.model';
import { Event } from '../events/event.model';
import { NearbyVeterinaryHospital } from '../hospital/nearby-veterinary-hospital.model';
import * as GramadevataUtils from '../../common/utils/gramadevata.utils';

type CreateResult = {
	status: number;
	body: Record<string, unknown>;
};

@Injectable()
export class GoshalaService {
	constructor(
		@InjectModel(Goshala)
		private readonly goshalaModel: typeof Goshala,
		@InjectModel(GoshalaCategory)
		private readonly goshalaCategoryModel: typeof GoshalaCategory,
		@InjectModel(Temple)
		private readonly templeModel: typeof Temple,
		@InjectModel(Event)
		private readonly eventModel: typeof Event,
		@InjectModel(Comment)
		private readonly commentModel: typeof Comment,
		@InjectModel(User)
		private readonly userModel: typeof User,
		@InjectModel(Village)
		private readonly villageModel: typeof Village,
		@InjectModel(Block)
		private readonly blockModel: typeof Block,
		@InjectModel(District)
		private readonly districtModel: typeof District,
		@InjectModel(State)
		private readonly stateModel: typeof State,
		@InjectModel(Country)
		private readonly countryModel: typeof Country,
		@InjectModel(NearbyVeterinaryHospital)
		private readonly vetHospitalModel: typeof NearbyVeterinaryHospital,
		private readonly configService: ConfigService,
	) {}

	async list(query: Record<string, string | undefined>) {
		const filters = this.buildFilters(query);
		const where: WhereOptions<Goshala> = { ...filters, status: 'ACTIVE' };

		const records = await this.goshalaModel.findAll({
			where,
			include: this.getLocationInclude(),
		});

		if (!records.length) {
			return { message: 'Data not found', status: 404 };
		}

		const results = [] as Record<string, unknown>[];
		for (const goshala of records) {
			const base = await this.toGoshalaResponse(goshala);
			const nearbyTemples = await this.getNearbyTemples(goshala);
			const nearbyEvents = await this.getNearbyEvents(goshala);
			results.push({
				...base,
				nearby_temples: nearbyTemples,
				nearby_events: nearbyEvents,
			});
		}

		return results;
	}

	async getById(id: string): Promise<Record<string, unknown> | null> {
		const record = await this.goshalaModel.findByPk(id, {
			include: this.getLocationInclude(),
		});

		if (!record) {
			return null;
		}

		const base = await this.toGoshalaResponse(record);
		const nearbyTemples = await this.getNearbyTemples(record);

		return {
			...base,
			nearby_temples: nearbyTemples,
		};
	}

	async create(payload: Record<string, unknown>, userPayload?: Record<string, unknown>): Promise<CreateResult> {
		try {
			const user = await this.resolveUser(userPayload);
			if (!user) {
				return { status: 404, body: { message: 'User not found.' } };
			}

			const isMember = (user.isMember ?? '').toString().toLowerCase();
			if (isMember === 'false') {
				return {
					status: 400,
					body: {
						message:
							'Cannot add Goshala. Membership details are required. Update your profile and become a member to add Temple.',
					},
				};
			}

			const imageList = this.parseList(payload.image_location ?? payload.imageLocation);
			const videoList = this.parseList(payload.goshala_video ?? payload.goshalaVideo);

			const createData = this.mapPayload(payload, user.id);
			createData.imageLocation = [];
			createData.goshalaVideo = [];

			const record = await this.goshalaModel.create(createData as CreationAttributes<Goshala>);

			const images = imageList.filter((img) => img && img !== 'null');
			const videos = videoList.filter((vid) => vid && vid !== 'null');

			if (images.length) {
				const savedImages = await GramadevataUtils.saveEntityImagesToAzure({
					configService: this.configService,
					images,
					id: record.id,
					name: record.name ?? 'goshala',
					entityType: 'Goshala',
				});
				if (savedImages.length) {
					record.imageLocation = savedImages;
				}
			}

			if (videos.length) {
				const savedVideos = await GramadevataUtils.saveEntityVideosToAzure({
					configService: this.configService,
					videos,
					id: record.id,
					name: record.name ?? 'goshala',
					entityType: 'Goshala',
				});
				if (savedVideos.length) {
					record.goshalaVideo = savedVideos;
				}
			}

			if (images.length || videos.length) {
				await record.save();
			}

			await this.sendNotificationEmail('New Goshala Added', user.id, record, 'Created Time');

			return {
				status: 201,
				body: {
					message: 'success',
					result: await this.toGoshalaResponse(record),
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

	async update(
		id: string,
		payload: Record<string, unknown>,
		userPayload?: Record<string, unknown>,
	): Promise<CreateResult> {
		try {
			const user = await this.resolveUser(userPayload);
			if (!user) {
				return { status: 404, body: { message: 'User not found.' } };
			}

			const isMember = (user.isMember ?? '').toString().toLowerCase();
			if (isMember === 'false') {
				return {
					status: 400,
					body: {
						message:
							'Cannot update Goshala. Membership details are required. Update your profile and become a member to update Goshala.',
					},
				};
			}

			const record = await this.goshalaModel.findByPk(id, { include: this.getLocationInclude() });
			if (!record) {
				return { status: 404, body: { message: 'Object not found' } };
			}

			const updateData = this.mapPayload(payload, record.user ?? undefined);
			await record.update(updateData as CreationAttributes<Goshala>);

			const imageList = this.parseList(payload.image_location ?? payload.imageLocation);
			const images = imageList.filter((img) => img && img !== 'null');

			if (images.length) {
				const savedImages = await GramadevataUtils.saveEntityImagesToAzure({
					configService: this.configService,
					images,
					id: record.id,
					name: record.name ?? 'goshala',
					entityType: 'Goshala',
				});
				if (savedImages.length) {
					record.imageLocation = savedImages;
					await record.save();
				}
			}

			await this.sendNotificationEmail('Goshala Updated', user.id, record, 'Updated Time');

			return {
				status: 200,
				body: {
					message: 'updated successfully',
					data: await this.toGoshalaResponse(record),
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

	async remove(id: string) {
		const record = await this.goshalaModel.findByPk(id);
		if (!record) {
			return false;
		}

		await record.destroy();
		return true;
	}

	async listInactive(query: Record<string, string | undefined>) {
		const searchQuery = typeof query.search === 'string' ? query.search.trim() : '';
		const filters = this.buildFilters(query);
		delete (filters as Record<string, unknown>).search;

		const where: Record<string, unknown> = {
			...filters,
			status: 'INACTIVE',
		};

		if (searchQuery) {
			(where as Record<string | symbol, unknown>)[Op.or] = [
				{ name: { [Op.like]: `%${searchQuery}%` } },
				{ address: { [Op.like]: `%${searchQuery}%` } },
			];
		}

		const records = await this.goshalaModel.findAll({
			where,
			order: [['createdAt', 'DESC']],
		});

		if (!records.length) {
			return { status: 404, body: { message: 'Data not found', status: 404 } };
		}

		const responses = await this.toInactiveResponses(records);

		return {
			status: 200,
			body: {
				count: responses.length,
				goshala: responses,
			},
		};
	}

	async getInactiveByField(fieldName: string, inputValue: string) {
		const resolvedField = this.resolveGoshalaFieldName(fieldName);
		if (!resolvedField || !this.isGoshalaField(resolvedField)) {
			return {
				status: 400,
				body: {
					message: `Invalid field name: '${fieldName}'`,
					status: 400,
				},
			};
		}

		const records = await this.goshalaModel.findAll({
			where: { [resolvedField]: inputValue, status: 'INACTIVE' },
			include: this.getLocationInclude(),
		});

		if (!records.length) {
			return { status: 404, body: { message: 'Data not found', status: 404 } };
		}

		const results = [] as Record<string, unknown>[];
		for (const record of records) {
			results.push(await this.toGoshalaResponse(record));
		}

		return { status: 200, body: results };
	}

	private async toInactiveResponses(records: Goshala[]) {
		const userIds = Array.from(
			new Set(records.map((goshala) => goshala.user).filter((id): id is string => Boolean(id)))
		);

		const users = userIds.length
			? await this.userModel.findAll({ where: { id: { [Op.in]: userIds } } })
			: [];

		const userMap = new Map(users.map((user) => [user.id, user.fullName ?? null]));

		return records.map((record) => this.toGoshalaInactiveResponse(record, userMap));
	}

	private toGoshalaInactiveResponse(record: Goshala, userMap: Map<string, string | null>) {
		const plain = record.get({ plain: true }) as Goshala;
		const baseUrl = this.getBaseUrl();

		return {
			_id: plain.id,
			name: plain.name ?? null,
			category: plain.category ?? null,
			reg_num: plain.regNum ?? null,
			status: plain.status ?? null,
			geo_site: plain.geoSite ?? null,
			object_id: plain.objectId ?? null,
			map_location: plain.mapLocation ?? null,
			temple_id: plain.temple ?? null,
			contact_name: plain.contactName ?? null,
			contact_phone: plain.contactPhone ?? null,
			address: plain.address ?? null,
			email: plain.email ?? null,
			desc: plain.desc ?? null,
			regn_document: plain.regnDocument ?? null,
			image_location: this.mapFileList(plain.imageLocation, baseUrl),
			goshala_video: this.mapFileListOrNull(plain.goshalaVideo, baseUrl),
			user: plain.user ?? null,
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
			country: plain.country ?? null,
			user_full_name: plain.user ? userMap.get(plain.user) ?? null : null,
			relative_time: plain.createdAt ? this.timeSince(plain.createdAt) : null,
		};
	}

	private resolveGoshalaFieldName(fieldName: string) {
		if (fieldName === '_id') {
			return 'id';
		}

		const mapping: Record<string, string> = {
			object_id: 'objectId',
			reg_num: 'regNum',
			geo_site: 'geoSite',
			map_location: 'mapLocation',
			temple_id: 'temple',
			contact_name: 'contactName',
			contact_phone: 'contactPhone',
			official_website: 'officialWebsite',
			regn_document: 'regnDocument',
			country_name: 'countryName',
			state_name: 'stateName',
			district_name: 'districtName',
			block_name: 'blockName',
			village_name: 'villageName',
			other_name: 'otherName',
			devotees_visiting: 'devoteesVisiting',
			feeding_accessibility: 'feedingAccessibility',
			inside_feeding_accessibility: 'insideFeedingAccessibility',
			outside_feeding_accessibility: 'outsideFeedingAccessibility',
			adoption_of_cow_or_bull_inside: 'adoptionOfCowOrBullInside',
			adoption_of_cow_or_bull_outside: 'adoptionOfCowOrBullOutside',
			social_activites: 'socialActivites',
			other_services: 'otherServices',
		};

		return mapping[fieldName] ?? fieldName;
	}

	private isGoshalaField(fieldName: string) {
		return Object.prototype.hasOwnProperty.call(this.goshalaModel.rawAttributes, fieldName);
	}

	private buildFilters(query: Record<string, string | undefined>): WhereOptions<Goshala> {
		const filters: WhereOptions<Goshala> = {};

		Object.entries(query).forEach(([key, value]) => {
			if (value === undefined || value === null || value === '') {
				return;
			}
			if (['page', 'page_size', 'pageSize', 'page_no', 'ordering'].includes(key)) {
				return;
			}

			if (key === '_id') {
				filters.id = value;
				return;
			}

			(filters as Record<string, unknown>)[key] = value;
		});

		return filters;
	}

	private mapPayload(payload: Record<string, unknown>, fallbackUserId?: string): Partial<Goshala> {
		const data: Partial<Goshala> = {};
		const mappings: Record<string, string> = {
			name: 'name',
			category: 'category',
			reg_num: 'regNum',
			status: 'status',
			geo_site: 'geoSite',
			object_id: 'objectId',
			map_location: 'mapLocation',
			temple_id: 'temple',
			contact_name: 'contactName',
			contact_phone: 'contactPhone',
			address: 'address',
			email: 'email',
			desc: 'desc',
			regn_document: 'regnDocument',
			managed_by: 'managedBy',
			timings: 'timings',
			official_website: 'officialWebsite',
			country_name: 'countryName',
			state_name: 'stateName',
			district_name: 'districtName',
			block_name: 'blockName',
			village_name: 'villageName',
			other_name: 'otherName',
			devotees_visiting: 'devoteesVisiting',
			feeding_accessibility: 'feedingAccessibility',
			inside_feeding_accessibility: 'insideFeedingAccessibility',
			outside_feeding_accessibility: 'outsideFeedingAccessibility',
			adoption_of_cow_or_bull_inside: 'adoptionOfCowOrBullInside',
			adoption_of_cow_or_bull_outside: 'adoptionOfCowOrBullOutside',
			festivals: 'festivals',
			prayers: 'prayers',
			social_activites: 'socialActivites',
			other_services: 'otherServices',
			country: 'country',
		};

		Object.entries(mappings).forEach(([inputKey, modelKey]) => {
			if (payload[inputKey] !== undefined) {
				(data as Record<string, unknown>)[modelKey] = payload[inputKey];
			}
		});

		const userId = typeof payload.user_id === 'string'
			? payload.user_id
			: typeof payload.userId === 'string'
				? payload.userId
				: fallbackUserId;
		if (userId) {
			data.user = userId;
		}

		return data;
	}

	private parseList(raw: unknown): string[] {
		return GramadevataUtils.coerceStringList(raw).filter((item) => item && item !== 'null');
	}

	private async resolveUser(userPayload?: Record<string, unknown>) {
		if (!userPayload) {
			return null;
		}

		const userId = typeof userPayload.user_id === 'string'
			? userPayload.user_id
			: typeof userPayload.id === 'string'
				? userPayload.id
				: undefined;

		if (userId) {
			const user = await this.userModel.findByPk(userId);
			if (user) {
				return user;
			}
		}

		const email = typeof userPayload.email === 'string' ? userPayload.email : undefined;
		const contactNumber = typeof userPayload.contact_number === 'string'
			? userPayload.contact_number
			: typeof userPayload.contactNumber === 'string'
				? userPayload.contactNumber
				: undefined;
		const username = typeof userPayload.username === 'string' ? userPayload.username : undefined;

		const orConditions: Record<string, string>[] = [];
		if (email) {
			orConditions.push({ email });
		}
		if (contactNumber) {
			orConditions.push({ contactNumber });
		}
		if (username) {
			orConditions.push({ username });
		}

		if (orConditions.length) {
			return this.userModel.findOne({ where: { [Op.or]: orConditions } });
		}

		return null;
	}

	private async sendNotificationEmail(subject: string, userId: string, record: Goshala, timeLabel: string) {
		const recipient = this.configService.get<string>('EMAIL_HOST_USER');
		if (!recipient) {
			return;
		}

		const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');

		await GramadevataUtils.sendAdminEmail(this.configService, {
			subject,
			text:
				`User ID: ${userId}\n` +
				`${timeLabel}: ${timestamp}\n` +
				`Goshala ID: ${record.id}\n` +
				`Goshala Name: ${record.name ?? ''}`,
			recipients: [recipient],
		});
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

	async toGoshalaResponse(record: Goshala) {
		const plain = record.get({ plain: true }) as Goshala & { village?: Village };
		const baseUrl = this.getBaseUrl();

		const comments = await this.commentModel.findAll({
			where: { goshalaId: plain.id, status: CommentStatus.ACTIVE },
			order: [['createdAt', 'DESC']],
		});

		const commentDetails = await this.mapComments(comments);
		const vetHospitals = await this.vetHospitalModel.findAll({
			where: { goshalaId: plain.id, status: 'ACTIVE' },
		});
		const nearbyGoshalas = await this.getNearbyGoshalas(record);

		return {
			_id: plain.id,
			comments: commentDetails,
			image_location: this.mapFileList(plain.imageLocation, baseUrl),
			goshala_video: this.mapFileListOrNull(plain.goshalaVideo, baseUrl),
			object_id: this.buildObjectId(plain.village),
			vetarnary_hospital: vetHospitals.map((hospital) => this.toVetHospitalResponse(hospital, baseUrl)),
			nearby_goshalas: nearbyGoshalas,
			name: plain.name ?? null,
			category: plain.category ?? null,
			reg_num: plain.regNum ?? null,
			status: plain.status ?? null,
			geo_site: plain.geoSite ?? null,
			map_location: plain.mapLocation ?? null,
			temple_id: plain.temple ?? null,
			contact_name: plain.contactName ?? null,
			contact_phone: plain.contactPhone ?? null,
			address: plain.address ?? null,
			email: plain.email ?? null,
			desc: plain.desc ?? null,
			regn_document: plain.regnDocument ?? null,
			user: plain.user ?? null,
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
			country: plain.country ?? null,
		};
	}

	private async mapComments(comments: Comment[]) {
		const userIds = Array.from(new Set(comments.map((c) => c.userId).filter((id): id is string => Boolean(id))));
		const templeIds = Array.from(new Set(comments.map((c) => c.templeId).filter((id): id is string => Boolean(id))));
		const eventIds = Array.from(new Set(comments.map((c) => c.eventId).filter((id): id is string => Boolean(id))));
		const goshalaIds = Array.from(new Set(comments.map((c) => c.goshalaId).filter((id): id is string => Boolean(id))));

		const [users, temples, events, goshalas] = await Promise.all([
			userIds.length ? this.userModel.findAll({ where: { id: { [Op.in]: userIds } } }) : [],
			templeIds.length ? this.templeModel.findAll({ where: { id: { [Op.in]: templeIds } } }) : [],
			eventIds.length ? this.eventModel.findAll({ where: { id: { [Op.in]: eventIds } } }) : [],
			goshalaIds.length ? this.goshalaModel.findAll({ where: { id: { [Op.in]: goshalaIds } } }) : [],
		]);

		const userMap = new Map(users.map((user) => [user.id, user]));
		const templeMap = new Map(temples.map((temple) => [temple.id, temple]));
		const eventMap = new Map(events.map((event) => [event.id, event]));
		const goshalaMap = new Map(goshalas.map((goshala) => [goshala.id, goshala]));

		return comments.map((comment) => {
			const user = comment.userId ? userMap.get(comment.userId) : undefined;
			const temple = comment.templeId ? templeMap.get(comment.templeId) : undefined;
			const event = comment.eventId ? eventMap.get(comment.eventId) : undefined;
			const goshala = comment.goshalaId ? goshalaMap.get(comment.goshalaId) : undefined;

			return {
				...comment.get({ plain: true }),
				user: user
					? {
							name: user.fullName ?? null,
							id: user.id,
							username: user.username,
						}
					: null,
				temple: temple
					? {
							name: temple.name ?? null,
							id: temple.id,
						}
					: null,
				event: event
					? {
							name: event.name ?? null,
							id: event.id,
						}
					: null,
				goshala: goshala
					? {
							name: goshala.name ?? null,
							id: goshala.id,
						}
					: null,
				posted_time_ago: this.timeSince(comment.createdAt),
			};
		});
	}

	private async getNearbyGoshalas(record: Goshala) {
		const village = record.village as Village | undefined;
		const blockId = village?.blockId;
		if (!blockId) {
			return [];
		}

		const goshalas = await this.goshalaModel.findAll({
			where: { status: 'ACTIVE' },
			include: [
				{
					model: Village,
					required: true,
					where: { blockId },
				},
			],
		});

		const baseUrl = this.getBaseUrl();
		return goshalas
			.filter((goshala) => goshala.id !== record.id)
			.map((goshala) => {
				const plain = goshala.get({ plain: true }) as Goshala;
				return {
					...plain,
					_id: plain.id,
					image_location: this.mapFileList(plain.imageLocation, baseUrl),
					goshala_video: this.mapFileListOrNull(plain.goshalaVideo, baseUrl),
				};
			});
	}

	private async getNearbyTemples(goshala: Goshala) {
		const ICONIC_ID = 'd7df749f-97e8-4635-a211-371c44b3c31f';
		const FAMOUS_ID = '630f3239-f515-47fb-be8d-db727b9f2174';
		const GRAMADEVATA_ID = '742ccfe6-d0b5-11ee-84bd-0242ac110002';

		const village = goshala.village as Village | undefined;
		const block = village?.block;

		let temples = await this.templeModel.findAll({
			include: this.getLocationInclude(),
		});

		if (village) {
			temples = temples.filter((temple) => temple.objectId === village.id);
		} else if (block) {
			temples = temples.filter((temple) => (temple.village as Village | undefined)?.blockId === block.id);
		}

		const iconic = temples.filter((temple) => temple.priorityId === ICONIC_ID);
		const famous = temples.filter((temple) => temple.priorityId === FAMOUS_ID);
		const gramadevata = temples.filter((temple) => temple.categoryId === GRAMADEVATA_ID);

		const excludeIds = new Set([
			...iconic.map((temple) => temple.id),
			...famous.map((temple) => temple.id),
			...gramadevata.map((temple) => temple.id),
		]);

		const other = temples.filter((temple) => !excludeIds.has(temple.id));
		const baseUrl = this.getBaseUrl();

		const mapTempleList = (list: Temple[]) =>
			list.map((temple) => {
				const plain = temple.get({ plain: true }) as Temple;
				return {
					_id: plain.id,
					name: plain.name ?? null,
					image_location: this.mapFileList(plain.imageLocation, baseUrl),
				};
			});

		return {
			iconic_temples: mapTempleList(iconic),
			famous_temples: mapTempleList(famous),
			gramadevata_temples: mapTempleList(gramadevata),
			other_temples: mapTempleList(other),
		};
	}

	private async getNearbyEvents(goshala: Goshala) {
		const village = goshala.village as Village | undefined;
		const block = village?.block;

		let events = await this.eventModel.findAll();
		if (village) {
			events = events.filter((event) => event.objectId === village.id);
		} else if (block) {
			events = events.filter((event) => (event.village as Village | undefined)?.blockId === block.id);
		}

		const baseUrl = this.getBaseUrl();
		return events.map((event) => {
			const plain = event.get({ plain: true }) as Event;
			return {
				_id: plain.id,
				name: plain.name ?? null,
				image_location: this.mapFileList(plain.imageLocation, baseUrl),
			};
		});
	}

	private toVetHospitalResponse(hospital: NearbyVeterinaryHospital, baseUrl: string) {
		const plain = hospital.get({ plain: true }) as NearbyVeterinaryHospital;

		return {
			_id: plain.id,
			name: plain.name ?? null,
			address: plain.address ?? null,
			map_location: plain.mapLocation ?? null,
			temple_id: plain.templeId ?? null,
			village_id: plain.villageId ?? null,
			user_id: plain.userId ?? null,
			image_location: this.mapFileList(plain.imageLocation, baseUrl),
			created_at: plain.createdAt ?? null,
			status: plain.status ?? null,
			doctor_name: plain.doctorName ?? null,
			goshala_id: plain.goshalaId ?? null,
			desc: plain.desc ?? null,
			contact_number: plain.contactNumber ?? null,
			license_copy: this.mapFileList(plain.licenseCopy, baseUrl),
		};
	}

	private buildObjectId(village?: Village) {
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

	private parseRawList(raw: unknown): string[] {
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
		const list = this.parseRawList(raw);
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

	private timeSince(date?: Date) {
		if (!date) {
			return null;
		}

		const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
		const minutes = Math.floor(seconds / 60);
		const hours = Math.floor(minutes / 60);
		const days = Math.floor(hours / 24);

		if (days > 0) {
			return `${days} days ago`;
		}
		if (hours > 0) {
			return `${hours} hours ago`;
		}
		if (minutes > 0) {
			return `${minutes} minutes ago`;
		}
		return `${seconds} seconds ago`;
	}

	async getGoshalaMain(): Promise<Record<string, unknown>> {
		const [categories, villages] = await Promise.all([
			this.goshalaCategoryModel.findAll({ limit: 4 }),
			this.villageModel.findAll(),
		]);

		const villageIds = villages.map((village) => village.id);

		const indianGoshalas = villageIds.length
			? await this.goshalaModel.findAll({
				where: { objectId: { [Op.in]: villageIds } },
				include: this.getLocationInclude(),
				limit: 4,
			})
			: [];

		const globalGoshalas = await this.goshalaModel.findAll({
			where: {
				...(villageIds.length ? { objectId: { [Op.notIn]: villageIds } } : {}),
				geoSite: { [Op.notIn]: ['D', 'B', 'V'] },
			},
			include: this.getLocationInclude(),
			limit: 4,
		});

		const categoriesResponse = categories.map((category) => this.toCategoryResponse(category));
		const indianResponses = [] as Record<string, unknown>[];
		for (const record of indianGoshalas) {
			indianResponses.push(await this.toGoshalaResponse(record));
		}
		const globalResponses = [] as Record<string, unknown>[];
		for (const record of globalGoshalas) {
			globalResponses.push(await this.toGoshalaResponse(record));
		}

		return {
			categories: categoriesResponse,
			indiangoshalas: indianResponses,
			globalgoshalas: globalResponses,
		};
	}

	async createPost(payload: Record<string, unknown>, userPayload?: Record<string, unknown>): Promise<CreateResult> {
		try {
			const user = await this.resolveUser(userPayload);
			if (!user) {
				return { status: 404, body: { message: 'User not found in Register.' } };
			}

			const memberFlag = (user.isMember ?? '').toString().toUpperCase();
			if (memberFlag === 'NO') {
				return {
					status: 400,
					body: {
						message:
							'Cannot add the temple. Membership details are required. Update your profile and become a member.',
					},
				};
			}

			const imageLocation = payload.image_location;
			const createData = this.mapPayload(payload, user.id);
			createData.imageLocation = 'null' as unknown as Goshala['imageLocation'];

			const record = await this.goshalaModel.create(createData as CreationAttributes<Goshala>);

			if (imageLocation && imageLocation !== 'null') {
				const baseDir =
					this.configService.get<string>('FILE_URL') ||
					this.configService.get<string>('File_path') ||
					'';
				const savedLocation = await GramadevataUtils.saveImageToFolder({
					baseDir,
					base64: String(imageLocation),
					id: record.id,
					name: record.name ?? 'goshala',
					entityType: 'goshala',
				});
				if (savedLocation) {
					record.imageLocation = savedLocation;
					await record.save();
				}
			}

			return {
				status: 201,
				body: {
					message: 'success',
					result: await this.toGoshalaResponse(record),
				},
			};
		} catch (error) {
			return {
				status: 500,
				body: { message: 'An error occurred.', error: error instanceof Error ? error.message : String(error) },
			};
		}
	}

	private toCategoryResponse(category: GoshalaCategory) {
		return {
			_id: category.id,
			name: category.name,
			desc: category.desc ?? null,
			created_at: category.createdAt ?? null,
			pic: this.mapPic(category.pic),
		};
	}

	private mapPic(pic?: string | null) {
		if (!pic) {
			return null;
		}
		if (pic.startsWith('http://') || pic.startsWith('https://')) {
			return pic;
		}
		const base = this.getBaseUrl();
		return base ? `${base}/${pic.replace(/^\/+/, '')}` : pic;
	}

}
