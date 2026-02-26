import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  NotFoundException,
  Param,
  Post,
  Put,
  Patch,
  Query,
  Req,
} from '@nestjs/common';
import { AmbulanceFacilityService } from './ambulance-facility.service';
import { ApiTags } from '@nestjs/swagger';

@Controller('gramadevata/ambulance_facility')
@ApiTags('Ambulance Facilities')
export class AmbulanceFacilityController {
  constructor(private readonly ambulanceService: AmbulanceFacilityService) {}

  @Get()
  async list(@Query() query: Record<string, string | undefined>) {
    return this.ambulanceService.list(query);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const record = await this.ambulanceService.getById(id);
    if (!record) {
      throw new NotFoundException({ message: 'Facility not found', status: 404 });
    }
    return record;
  }

  @Post()
  async create(
    @Body() payload: Record<string, unknown>,
    @Req() req: { user?: Record<string, unknown> },
  ) {
    const result = await this.ambulanceService.create(payload, req.user);
    if (result.status !== 201) {
      throw new HttpException(result.body, result.status);
    }
    return result.body;
  }

  @Put(':id')
  async putById(@Param('id') id: string, @Body() payload: Record<string, unknown>) {
    const updated = await this.ambulanceService.update(id, payload);
    if (!updated) {
      throw new NotFoundException('Facility not found');
    }
    return updated;
  }

  @Patch(':id')
  async patchById(@Param('id') id: string, @Body() payload: Record<string, unknown>) {
    const updated = await this.ambulanceService.update(id, payload);
    if (!updated) {
      throw new NotFoundException('Facility not found');
    }
    return updated;
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string) {
    const removed = await this.ambulanceService.remove(id);
    if (!removed) {
      throw new NotFoundException('Facility not found');
    }
  }
}
