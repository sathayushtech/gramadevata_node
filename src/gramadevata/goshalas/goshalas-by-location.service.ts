import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Village } from '../villages/village.model';
import { Block } from '../block/block.model';
import { District } from '../../common/models/district.model';
import { State } from '../../common/models/state.model';
import { Country } from '../../common/models/country.model';
import { Goshala } from './goshala.model';
import { GoshalaService } from './goshala.service';

@Injectable()
export class GoshalasByLocationService {
  constructor(
    @InjectModel(Goshala)
    private readonly goshalaModel: typeof Goshala,
		private readonly goshalaService: GoshalaService,
  ) {}

  async getByState(stateId: string): Promise<Record<string, unknown>[]> {
		const goshalas = await this.goshalaModel.findAll({
			include: [
				{
					model: Village,
					required: true,
					include: [
						{
							model: Block,
							required: true,
							include: [
								{
									model: District,
									required: true,
									where: { stateId },
									include: [
										{
											model: State,
											required: true,
											include: [{ model: Country, required: true }],
										},
									],
								},
							],
						},
					],
				},
			],
		});

		const results = [] as Record<string, unknown>[];
		for (const record of goshalas) {
			results.push(await this.goshalaService.toGoshalaResponse(record));
		}

		return results;
	}

	async getByDistrict(districtId: string): Promise<Record<string, unknown>[]> {
		const goshalas = await this.goshalaModel.findAll({
			include: [
				{
					model: Village,
					required: true,
					include: [
						{
							model: Block,
							required: true,
							where: { districtId },
							include: [
								{
									model: District,
									required: true,
									include: [
										{
											model: State,
											required: true,
											include: [{ model: Country, required: true }],
										},
									],
								},
							],
						},
					],
				},
			],
		});

		const results = [] as Record<string, unknown>[];
		for (const record of goshalas) {
			results.push(await this.goshalaService.toGoshalaResponse(record));
		}

		return results;
	}

	async getByBlock(blockId: string): Promise<Record<string, unknown>[]> {
		const goshalas = await this.goshalaModel.findAll({
			include: [
				{
					model: Village,
					required: true,
					where: { blockId },
					include: [
						{
							model: Block,
							required: true,
							include: [
								{
									model: District,
									required: true,
									include: [
										{
											model: State,
											required: true,
											include: [{ model: Country, required: true }],
										},
									],
								},
							],
						},
					],
				},
			],
		});

		const results = [] as Record<string, unknown>[];
		for (const record of goshalas) {
			results.push(await this.goshalaService.toGoshalaResponse(record));
		}

		return results;
	}

}