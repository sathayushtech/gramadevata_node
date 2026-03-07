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
import { StateService } from './state.service';

@Controller('gramadevata/state')
@ApiTags('state')
export class StateController {
	constructor(private readonly stateService: StateService) {}

	@Get()
	async list(@Query() query: Record<string, string | undefined>) {
		const states = await this.stateService.list(query);

		if (!states || states.length === 0) {
			throw new NotFoundException({ message: 'Data not found', status: 404 });
		}

		return states;
	}

	@Get(':id')
	async getById(@Param('id') id: string) {
		const state = await this.stateService.getById(id);

		if (!state) {
			throw new NotFoundException(`State with id ${id} not found`);
		}

		return state;
	}

	@Post()
	async create(@Body() payload: Record<string, unknown>) {
		const result = await this.stateService.create(payload);
		if (result.status !== 201) {
			throw new HttpException(result.body, result.status);
		}
		return result.body;
	}

	@Put(':id')
	async update(@Param('id') id: string, @Body() payload: Record<string, unknown>) {
		const updated = await this.stateService.update(id, payload);
		if (!updated) {
			throw new NotFoundException(`State with id ${id} not found`);
		}
		return updated;
	}

	@Patch(':id')
	async patch(@Param('id') id: string, @Body() payload: Record<string, unknown>) {
		const updated = await this.stateService.update(id, payload);
		if (!updated) {
			throw new NotFoundException(`State with id ${id} not found`);
		}
		return updated;
	}

	@Delete(':id')
	@HttpCode(HttpStatus.NO_CONTENT)
	async delete(@Param('id') id: string) {
		const deleted = await this.stateService.delete(id);
		if (!deleted) {
			throw new NotFoundException(`State with id ${id} not found`);
		}
		return;
	}
}
