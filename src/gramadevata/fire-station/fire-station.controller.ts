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
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { FireStationService } from './fire-station.service';

@ApiTags('Fire Stations')
@Controller('gramadevata/fire_station')
export class FireStationController {
	constructor(private readonly fireStationService: FireStationService) {}

	@Get()
	@ApiOperation({ summary: 'List all active fire stations with optional filters' })
	@ApiQuery({ name: 'id', required: false })
	@ApiQuery({ name: 'name', required: false })
	@ApiQuery({ name: 'address', required: false })
	@ApiQuery({ name: 'temple_id', required: false })
	@ApiQuery({ name: 'village_id', required: false })
	@ApiQuery({ name: 'user_id', required: false })
	@ApiQuery({ name: 'status', required: false })
	@ApiQuery({ name: 'contact_number', required: false })
	@ApiResponse({ status: 200, description: 'List of fire stations' })
	@ApiResponse({ status: 404, description: 'Data not found' })
	async list(@Query() query: Record<string, string | undefined>) {
		const result = await this.fireStationService.list(query);

		if ('status' in result && result.status === 404) {
			throw new HttpException(result.message, HttpStatus.NOT_FOUND);
		}

		return result;
	}

	@Get(':id')
	@ApiOperation({ summary: 'Get a specific fire station by ID' })
	@ApiResponse({ status: 200, description: 'Fire station details' })
	@ApiResponse({ status: 404, description: 'Fire station not found' })
	async getById(@Param('id') id: string) {
		const result = await this.fireStationService.getById(id);

		if (!result) {
			throw new HttpException('Fire station not found', HttpStatus.NOT_FOUND);
		}

		return result;
	}

	@Post()
	@HttpCode(HttpStatus.CREATED)
	@ApiOperation({ summary: 'Create a new fire station' })
	@ApiResponse({ status: 201, description: 'Fire station created successfully' })
	@ApiResponse({ status: 500, description: 'Internal server error' })
	async create(@Body() payload: Record<string, unknown>, @Req() req?: any) {
		const userId = req?.user?.id;
		const result = await this.fireStationService.create(payload, userId);

		if (result.status === 500) {
			const errorMessage = typeof result.body.message === 'string' ? result.body.message : 'An error occurred';
			throw new HttpException(errorMessage, HttpStatus.INTERNAL_SERVER_ERROR);
		}

		return result.body;
	}

	@Put(':id')
	@ApiOperation({ summary: 'Fully update a fire station' })
	@ApiResponse({ status: 200, description: 'Fire station updated successfully' })
	@ApiResponse({ status: 404, description: 'Fire station not found' })
	async update(@Param('id') id: string, @Body() payload: Record<string, unknown>) {
		const result = await this.fireStationService.update(id, payload);

		if (!result) {
			throw new HttpException('Fire station not found', HttpStatus.NOT_FOUND);
		}

		return result;
	}

	@Patch(':id')
	@ApiOperation({ summary: 'Partially update a fire station' })
	@ApiResponse({ status: 200, description: 'Fire station updated successfully' })
	@ApiResponse({ status: 404, description: 'Fire station not found' })
	async patch(@Param('id') id: string, @Body() payload: Record<string, unknown>) {
		const result = await this.fireStationService.update(id, payload);

		if (!result) {
			throw new HttpException('Fire station not found', HttpStatus.NOT_FOUND);
		}

		return result;
	}

	@Delete(':id')
	@HttpCode(HttpStatus.NO_CONTENT)
	@ApiOperation({ summary: 'Delete a fire station' })
	@ApiResponse({ status: 204, description: 'Fire station deleted successfully' })
	@ApiResponse({ status: 404, description: 'Fire station not found' })
	async remove(@Param('id') id: string) {
		const result = await this.fireStationService.remove(id);

		if (!result) {
			throw new HttpException('Fire station not found', HttpStatus.NOT_FOUND);
		}

		return;
	}
}
