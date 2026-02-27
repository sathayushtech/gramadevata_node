import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpException,
	HttpStatus,
	NotFoundException,
	Param,
	Patch,
	Post,
	Put,
	Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BlockService } from './block.service';

@Controller('gramadevata/block')
@ApiTags('block')
export class BlockController {
	constructor(private readonly blockService: BlockService) {}

	/**
	 * GET /gramadevata/block
	 * List blocks with optional filtering by query parameters.
	 */
	@Get()
	async list(@Query() query: Record<string, string | undefined>) {
		const blocks = await this.blockService.list(query);
		
		if (!blocks || blocks.length === 0) {
			throw new NotFoundException({
				message: 'Data not found',
				status: 404,
			});
		}

		return blocks;
	}

	/**
	 * GET /gramadevata/block/:id
	 * Retrieve a single block by ID.
	 */
	@Get(':id')
	async getById(@Param('id') id: string) {
		const block = await this.blockService.getById(id);
		
		if (!block) {
			throw new NotFoundException(`Block with id ${id} not found`);
		}

		return block;
	}

	/**
	 * POST /gramadevata/block
	 * Create a new block.
	 */
	@Post()
	async create(@Body() payload: Record<string, unknown>) {
		const result = await this.blockService.create(payload);
		
		if (result.status !== 201) {
			throw new HttpException(result.body, result.status);
		}

		return result.body;
	}

	/**
	 * PUT /gramadevata/block/:id
	 * Update a block (full update).
	 */
	@Put(':id')
	async update(
		@Param('id') id: string,
		@Body() payload: Record<string, unknown>
	) {
		const updated = await this.blockService.update(id, payload);
		
		if (!updated) {
			throw new NotFoundException(`Block with id ${id} not found`);
		}

		return updated;
	}

	/**
	 * PATCH /gramadevata/block/:id
	 * Partially update a block.
	 */
	@Patch(':id')
	async patch(
		@Param('id') id: string,
		@Body() payload: Record<string, unknown>
	) {
		const updated = await this.blockService.update(id, payload);
		
		if (!updated) {
			throw new NotFoundException(`Block with id ${id} not found`);
		}

		return updated;
	}

	/**
	 * DELETE /gramadevata/block/:id
	 * Delete a block by ID.
	 */
	@Delete(':id')
	@HttpCode(HttpStatus.NO_CONTENT)
	async delete(@Param('id') id: string) {
		const deleted = await this.blockService.delete(id);
		
		if (!deleted) {
			throw new NotFoundException(`Block with id ${id} not found`);
		}

		// Return no content on successful deletion
		return;
	}
}
