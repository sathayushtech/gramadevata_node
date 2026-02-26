import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpException,
	NotFoundException,
	Param,
	Patch,
	Post,
	Put,
	Query,
	Req,
	UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AddTempleDetailsService } from './add-temple-details.service';

@Controller('gramadevata/add_more_temple_details')
@ApiTags('add_more_temple_details')
export class AddTempleDetailsController {
	constructor(private readonly addTempleDetailsService: AddTempleDetailsService) {}

	@Get()
	@UseGuards(JwtAuthGuard)
	async list(@Query() query: Record<string, string | undefined>) {
		return this.addTempleDetailsService.list(query);
	}

	@Get(':id')
	@UseGuards(JwtAuthGuard)
	async getById(@Param('id') id: string) {
		const record = await this.addTempleDetailsService.getById(id);
		if (!record) {
			throw new NotFoundException('Object not found');
		}
		return record;
	}

	@Post()
	@UseGuards(JwtAuthGuard)
	async create(
		@Body() payload: Record<string, unknown>,
		@Req() req: { user?: Record<string, unknown> }
	) {
		const result = await this.addTempleDetailsService.create(payload, req.user);
		if (result.status !== 201) {
			throw new HttpException(result.body, result.status);
		}
		return result.body;
	}

	@Patch(':id')
	async patchById(
		@Param('id') id: string,
		@Body() payload: Record<string, unknown>
	) {
		const updated = await this.addTempleDetailsService.update(id, payload);
		if (!updated) {
			throw new NotFoundException('Object not found');
		}
		return updated;
	}

	@Put(':id')
	@UseGuards(JwtAuthGuard)
	async putById(
		@Param('id') id: string,
		@Body() payload: Record<string, unknown>
	) {
		const updated = await this.addTempleDetailsService.update(id, payload);
		if (!updated) {
			throw new NotFoundException('Object not found');
		}
		return updated;
	}

	@Delete(':id')
	@HttpCode(204)
	async deleteById(@Param('id') id: string) {
		const removed = await this.addTempleDetailsService.remove(id);
		if (!removed) {
			throw new NotFoundException('Object not found');
		}
	}
}
