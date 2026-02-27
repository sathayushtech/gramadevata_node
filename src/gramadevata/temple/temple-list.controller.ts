import {
	Controller,
	Get,
	NotFoundException,
	Param,
	Query,
} from '@nestjs/common';
import { ApiTags, ApiQuery } from '@nestjs/swagger';
import { TempleListService } from './temple-list.service';

@Controller('gramadevata/api/temples')
@ApiTags('/api/temples')
export class TempleListController {
	constructor(private readonly templeListService: TempleListService) {}

	/**
	 * GET /gramadevata/api/temples
	 * Filters temples by category and supports pagination.
	 */
	@Get()
	@ApiQuery({ name: 'category', required: false, description: 'Filter by category ID' })
	@ApiQuery({ name: 'page', required: false, description: 'Page number for pagination' })
	@ApiQuery({ name: 'page_size', required: false, description: 'Number of items per page' })
	@ApiQuery({ name: 'ordering', required: false, description: 'Comma-separated fields for ordering (prefix with - for DESC)' })
	async list(@Query() query: Record<string, string | undefined>) {
		return this.templeListService.list(query);
	}

	/**
	 * GET /gramadevata/api/temples/:id
	 * Retrieve a single temple by ID.
	 */
	@Get(':id')
	async getById(@Param('id') id: string) {
		const temple = await this.templeListService.getById(id);
		if (!temple) {
			throw new NotFoundException(`Temple with id ${id} not found`);
		}
		return temple;
	}
}
