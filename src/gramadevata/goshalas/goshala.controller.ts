import {
	Controller,
	Get,
	Post,
	Put,
	Patch,
	Delete,
	Param,
	Query,
	Body,
	Req,
	HttpCode,
	HttpStatus,
	HttpException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { GoshalaService } from './goshala.service';

@ApiTags('Goshala')
@Controller('gramadevata/goshala')
export class GoshalaController {
	constructor(private readonly goshalaService: GoshalaService) {}

	@Get()
	async list(@Query() query: Record<string, string | undefined>) {
		const result = await this.goshalaService.list(query);
		if ('status' in result && result.status === 404) {
			throw new HttpException(result, HttpStatus.NOT_FOUND);
		}
		return result;
	}

	@Get(':id')
	async getById(@Param('id') id: string): Promise<Record<string, unknown>> {
		const result = await this.goshalaService.getById(id);
		if (!result) {
			throw new HttpException('Object not found', HttpStatus.NOT_FOUND);
		}
		return result;
	}

	@Post()
	@HttpCode(HttpStatus.CREATED)
	async create(@Body() payload: Record<string, unknown>, @Req() req?: any) {
		const result = await this.goshalaService.create(payload, req?.user);
		if (result.status !== 201) {
			throw new HttpException(result.body, result.status);
		}
		return result.body;
	}

	@Put(':id')
	async update(
		@Param('id') id: string,
		@Body() payload: Record<string, unknown>,
		@Req() req?: any,
	): Promise<Record<string, unknown>> {
		const result = await this.goshalaService.update(id, payload, req?.user);
		if (result.status !== 200) {
			throw new HttpException(result.body, result.status);
		}
		return result.body;
	}

	@Patch(':id')
	async patch(
		@Param('id') id: string,
		@Body() payload: Record<string, unknown>,
		@Req() req?: any,
	): Promise<Record<string, unknown>> {
		const result = await this.goshalaService.update(id, payload, req?.user);
		if (result.status !== 200) {
			throw new HttpException(result.body, result.status);
		}
		return result.body;
	}

	@Delete(':id')
	@HttpCode(HttpStatus.NO_CONTENT)
	async remove(@Param('id') id: string) {
		const result = await this.goshalaService.remove(id);
		if (!result) {
			throw new HttpException('Object not found', HttpStatus.NOT_FOUND);
		}
		return;
	}
}
