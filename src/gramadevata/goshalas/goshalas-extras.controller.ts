import { Body, Controller, Get, HttpException, Param, Post, Put, Query, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GoshalaService } from './goshala.service';
import { AddGoshalaDetailsService } from './add-goshala-details.service';

@Controller('gramadevata')
export class GoshalasExtrasController {
	constructor(
		private readonly goshalaService: GoshalaService,
		private readonly addGoshalaDetailsService: AddGoshalaDetailsService,
	) {}

	@Get('goshala_inactive')
	@ApiTags('goshala_inactive')
	async listInactive(@Query() query: Record<string, string | undefined>) {
		const result = await this.goshalaService.listInactive(query);
		if (result.status !== 200) {
			throw new HttpException(result.body, result.status);
		}
		return result.body;
	}

	@Get('goshala_inactive_get/:field_name/:input_value')
	@ApiTags('goshala_inactive_get')
	async getInactiveByField(
		@Param('field_name') fieldName: string,
		@Param('input_value') inputValue: string
	) {
		const result = await this.goshalaService.getInactiveByField(fieldName, inputValue);
		if (result.status !== 200) {
			throw new HttpException(result.body, result.status);
		}
		return result.body;
	}

	@Get('goshalamain')
	@ApiTags('goshalamain')
	async getGoshalaMain(): Promise<Record<string, unknown>> {
		return this.goshalaService.getGoshalaMain();
	}

	@Post('goshalapost')
	@ApiTags('goshalapost')
	async createPost(@Body() payload: Record<string, unknown>, @Req() req?: any) {
		const result = await this.goshalaService.createPost(payload, req?.user);
		if (result.status !== 201) {
			throw new HttpException(result.body, result.status);
		}
		return result.body;
	}

	@Put('goshalamerge/:goshala_id')
	@ApiTags('goshalamerge')
	async mergeGoshala(
		@Param('goshala_id') goshalaId: string,
		@Body() payload: Record<string, unknown>
	) {
		const result = await this.addGoshalaDetailsService.mergeGoshalaDetails(goshalaId, payload);
		if (result.status !== 200) {
			throw new HttpException(result.body, result.status);
		}
		return result.body;
	}
}
