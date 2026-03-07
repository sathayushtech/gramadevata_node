import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/sequelize';
import type { CreationAttributes, WhereOptions } from 'sequelize';
import { State } from '../../common/models/state.model';
import { Country } from '../../common/models/country.model';
import * as GramadevataUtils from '../../common/utils/gramadevata.utils';

type CreateResult = {
	status: number;
	body: Record<string, unknown>;
};

@Injectable()
export class StateService {
	constructor(
		@InjectModel(State)
		private readonly stateModel: typeof State,
		@InjectModel(Country)
		private readonly countryModel: typeof Country,
		private readonly configService: ConfigService,
	) {}

	async list(query: Record<string, string | undefined>): Promise<Record<string, unknown>[]> {
		const where: WhereOptions<State> = this.buildWhereClause(query);

		const states = await this.stateModel.findAll({
			where,
			include: [{ model: Country, as: 'country' }],
		});

		if (!states || states.length === 0) {
			return [];
		}

		return states.map((state) => this.toResponse(state));
	}

	async getById(id: string): Promise<Record<string, unknown> | null> {
		const state = await this.stateModel.findByPk(id, {
			include: [{ model: Country, as: 'country' }],
		});

		if (!state) {
			return null;
		}

		return this.toResponse(state);
	}

	async create(payload: Record<string, unknown>): Promise<CreateResult> {
		try {
			if (!payload.name || typeof payload.name !== 'string') {
				return { status: 400, body: { message: 'Name is required', status: 400 } };
			}

			const countryId = typeof payload.country === 'string'
				? payload.country
				: typeof payload.country_id === 'string'
					? payload.country_id
					: undefined;
			if (!countryId) {
				return { status: 400, body: { message: 'Country ID is required', status: 400 } };
			}

			const country = await this.countryModel.findByPk(countryId);
			if (!country) {
				return { status: 404, body: { message: 'Country not found', status: 404 } };
			}

			const imageList = GramadevataUtils.coerceStringList(payload.image_location ?? payload.imageLocation);
			const imageLocation = imageList.length ? JSON.stringify(imageList) : undefined;

			const createData: Partial<CreationAttributes<State>> = {
				name: payload.name as string,
				countryId,
				desc: typeof payload.desc === 'string' ? payload.desc : undefined,
				imageLocation,
				shortname: typeof payload.shortname === 'string' ? payload.shortname : undefined,
				capital: typeof payload.capital === 'string' ? payload.capital : undefined,
				type: typeof payload.type === 'string' ? payload.type : undefined,
			};

			const state = await this.stateModel.create(createData as CreationAttributes<State>);

			return { status: 201, body: this.toResponse(state) };
		} catch (error) {
			return { status: 500, body: { message: 'Internal server error', status: 500 } };
		}
	}

	async update(id: string, payload: Record<string, unknown>): Promise<Record<string, unknown> | null> {
		const state = await this.stateModel.findByPk(id);
		if (!state) {
			return null;
		}

		const updateData: Partial<State> = {};
		if (payload.name !== undefined) updateData.name = payload.name as string;
		if (payload.desc !== undefined) updateData.desc = payload.desc as string;
		if (payload.shortname !== undefined) updateData.shortname = payload.shortname as string;
		if (payload.capital !== undefined) updateData.capital = payload.capital as string;
		if (payload.type !== undefined) updateData.type = payload.type as string;

		if (payload.country !== undefined || payload.country_id !== undefined) {
			const countryId = typeof payload.country === 'string'
				? payload.country
				: typeof payload.country_id === 'string'
					? payload.country_id
					: undefined;
			if (countryId) {
				const country = await this.countryModel.findByPk(countryId);
				if (!country) {
					throw new NotFoundException('Country not found');
				}
				updateData.countryId = countryId;
			}
		}

		if (payload.image_location !== undefined || payload.imageLocation !== undefined) {
			const images = GramadevataUtils.coerceStringList(payload.image_location ?? payload.imageLocation);
			updateData.imageLocation = images.length ? JSON.stringify(images) : undefined;
		}

		await state.update(updateData);
		await state.reload({ include: [{ model: Country, as: 'country' }] });

		return this.toResponse(state);
	}

	async delete(id: string): Promise<boolean> {
		const state = await this.stateModel.findByPk(id);
		if (!state) {
			return false;
		}

		await state.destroy();
		return true;
	}

	private buildWhereClause(query: Record<string, string | undefined>): WhereOptions<State> {
		const where: WhereOptions<State> = {};

		const fieldMap: Record<string, string> = {
			_id: 'id',
			country: 'countryId',
			country_id: 'countryId',
			name: 'name',
			type: 'type',
			shortname: 'shortname',
			capital: 'capital',
		};

		for (const [key, value] of Object.entries(query)) {
			if (['page', 'page_size', 'pageSize', 'page_no', 'ordering'].includes(key)) {
				continue;
			}

			if (value === undefined || value === null || value === '') {
				continue;
			}

			const modelField = fieldMap[key] || key;
			(where as Record<string, unknown>)[modelField] = value;
		}

		return where;
	}

	private toResponse(state: State): Record<string, unknown> {
		const rawBaseUrl = this.configService.get<string>('File_path')
			|| this.configService.get<string>('FILE_URL')
			|| '';
		const baseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl;

		const imageLocation = this.mapFileList(state.imageLocation, baseUrl);

		return {
			_id: state.id,
			name: state.name,
			country: state.countryId,
			image_location: imageLocation,
			desc: state.desc ?? null,
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
}
