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
import { NearbyHospitalService } from './nearby-hospital.service';
import { AddMoreHospitalService } from './add-more-hospital.service';

@ApiTags('Nearby Hospitals')
@Controller('gramadevata/nearby_hospitals')
export class NearbyHospitalController {
	constructor(
		private readonly nearbyHospitalService: NearbyHospitalService,
		private readonly addMoreHospitalService: AddMoreHospitalService,	
	) {}

	@Get()
	async list(@Query() query: Record<string, string | undefined>) {
		return this.nearbyHospitalService.list(query);
	}

	@Get(':id')
	async getById(@Param('id') id: string) {
		const result = await this.nearbyHospitalService.getById(id);
		if (!result) {
			throw new HttpException('Data not found', HttpStatus.NOT_FOUND);
		}
		return result;
	}

	@Post()
	@HttpCode(HttpStatus.CREATED)
	async create(@Body() payload: Record<string, unknown>, @Req() req?: any) {
		const result = await this.nearbyHospitalService.create(payload, req?.user);

		if (result.status === 500) {
			throw new HttpException(result.body.message ?? 'An error occurred', HttpStatus.INTERNAL_SERVER_ERROR);
		}

		return result.body;
	}

	@Put(':id')
	async update(@Param('id') id: string, @Body() payload: Record<string, unknown>) {
		const result = await this.nearbyHospitalService.update(id, payload);
		if (!result) {
			throw new HttpException('Nearby Hospital not found', HttpStatus.NOT_FOUND);
		}
		if (result.status === 404) {
			throw new HttpException(result.body, HttpStatus.NOT_FOUND);
		}
		return result.body;
	}

	@Patch(':id')
	async patch(@Param('id') id: string, @Body() payload: Record<string, unknown>) {
		const result = await this.nearbyHospitalService.update(id, payload);
		if (!result) {
			throw new HttpException('Nearby Hospital not found', HttpStatus.NOT_FOUND);
		}
		if (result.status === 404) {
			throw new HttpException(result.body, HttpStatus.NOT_FOUND);
		}
		return result.body;
	}

	@Delete(':id')
	@HttpCode(HttpStatus.NO_CONTENT)
	async remove(@Param('id') id: string) {
		const removed = await this.nearbyHospitalService.remove(id);
		if (!removed) {
			throw new HttpException('Nearby Hospital not found', HttpStatus.NOT_FOUND);
		}
		return;
	}

	@Put('nearby_hospital_merge/:hospital_id')
	async mergeNearbyHospital(
		@Param('hospital_id') hospitalId: string,
		@Body() payload: Record<string, unknown>
	) {
		const result = await this.addMoreHospitalService.mergeHospitalDetails(hospitalId, payload ?? {});
		if (result.status !== 200) {
		throw new HttpException(result.body, result.status);
		}
		return result.body;
	}

	@Get('hospitals_by_location')
	async getByLocation(@Query() query: Record<string, string | undefined>) {
		return this.nearbyHospitalService.getByLocation(query);
	}
}
