import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpException,
	HttpStatus,
	Param,
	Patch,
	Post,
	Put,
	Query,
	Req,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PoojaStoreService } from './pooja-store.service';

@ApiTags('Pooja Stores')
@Controller('gramadevata/pooja_stores')
export class PoojaStoreController {
	constructor(private readonly poojaStoreService: PoojaStoreService) {}

	@Get()
	async list(@Query() query: Record<string, string | undefined>) {
		const result = await this.poojaStoreService.list(query);
		if ('status' in result && result.status === 404) {
			throw new HttpException(result.body, HttpStatus.NOT_FOUND);
		}
		return result;
	}

	@Get(':id')
	async getById(@Param('id') id: string) {
		const result = await this.poojaStoreService.getById(id);
		if (!result) {
			throw new HttpException('pooja store not found', HttpStatus.NOT_FOUND);
		}
		return result;
	}

	@Post()
	@HttpCode(HttpStatus.CREATED)
	async create(@Body() payload: Record<string, unknown>, @Req() req?: { user?: Record<string, unknown> }) {
		const result = await this.poojaStoreService.create(payload, req?.user);
		if (result.status === 500) {
			throw new HttpException(result.body.message ?? 'An error occurred', HttpStatus.INTERNAL_SERVER_ERROR);
		}
		return result.body;
	}

	@Put(':id')
	async update(@Param('id') id: string, @Body() payload: Record<string, unknown>, @Req() req?: { user?: Record<string, unknown> }) {
		const result = await this.poojaStoreService.update(id, payload, req?.user);
		if (!result) {
			throw new HttpException('Pooja store not found', HttpStatus.NOT_FOUND);
		}
		return result.body;
	}

	@Patch(':id')
	async patch(@Param('id') id: string, @Body() payload: Record<string, unknown>, @Req() req?: { user?: Record<string, unknown> }) {
		const result = await this.poojaStoreService.update(id, payload, req?.user);
		if (!result) {
			throw new HttpException('Pooja store not found', HttpStatus.NOT_FOUND);
		}
		return result.body;
	}

	@Delete(':id')
	@HttpCode(HttpStatus.NO_CONTENT)
	async remove(@Param('id') id: string) {
		const removed = await this.poojaStoreService.remove(id);
		if (!removed) {
			throw new HttpException('Pooja store not found', HttpStatus.NOT_FOUND);
		}
		return;
	}
}
