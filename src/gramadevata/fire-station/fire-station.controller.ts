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
import { ApiTags } from '@nestjs/swagger';
import { FireStationService } from './fire-station.service';

@ApiTags('Fire Stations')
@Controller('gramadevata/fire_station')
export class FireStationController {
	constructor(private readonly fireStationService: FireStationService) {}

	@Get()
	async list(@Query() query: Record<string, string | undefined>) {
		const result = await this.fireStationService.list(query);

		if ('status' in result && result.status === 404) {
			throw new HttpException(result.message, HttpStatus.NOT_FOUND);
		}

		return result;
	}

	@Get(':id')
	async getById(@Param('id') id: string) {
		const result = await this.fireStationService.getById(id);

		if (!result) {
			throw new HttpException('Fire station not found', HttpStatus.NOT_FOUND);
		}

		return result;
	}

	@Post()
	@HttpCode(HttpStatus.CREATED)
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
	async update(@Param('id') id: string, @Body() payload: Record<string, unknown>) {
		const result = await this.fireStationService.update(id, payload);

		if (!result) {
			throw new HttpException('Fire station not found', HttpStatus.NOT_FOUND);
		}

		return result;
	}

	@Patch(':id')
	async patch(@Param('id') id: string, @Body() payload: Record<string, unknown>) {
		const result = await this.fireStationService.update(id, payload);

		if (!result) {
			throw new HttpException('Fire station not found', HttpStatus.NOT_FOUND);
		}

		return result;
	}

	@Delete(':id')
	@HttpCode(HttpStatus.NO_CONTENT)
	async remove(@Param('id') id: string) {
		const result = await this.fireStationService.remove(id);

		if (!result) {
			throw new HttpException('Fire station not found', HttpStatus.NOT_FOUND);
		}

		return;
	}
}
