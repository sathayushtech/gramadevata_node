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
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { NearbyVeterinaryHospitalService } from './nearby-veterinary-hospital.service';

@Controller('gramadevata')
@ApiTags('veterinary_hospital')
export class NearbyVeterinaryHospitalController {
  constructor(private readonly veterinaryHospitalService: NearbyVeterinaryHospitalService) {}

  @Get('veterinary_hospital')
  async list(@Query() query: Record<string, string | undefined>) {
    return this.veterinaryHospitalService.list(query);
  }

  @Get('veterinary_hospital/:id')
  async getById(@Param('id') id: string) {
    const record = await this.veterinaryHospitalService.getById(id);
    if (!record) {
      throw new NotFoundException({ message: 'Data not found', status: 404 });
    }
    return record;
  }

  @Post('veterinary_hospital')
  async create(
    @Body() payload: Record<string, unknown>,
    @Req() req: { user?: Record<string, unknown> },
  ) {
    const result = await this.veterinaryHospitalService.create(payload, req.user);
    if (result.status !== 201) {
      throw new HttpException(result.body, result.status);
    }
    return result.body;
  }

  @Patch('veterinary_hospital/:id')
  async patch(@Param('id') id: string, @Body() payload: Record<string, unknown>) {
    const updated = await this.veterinaryHospitalService.update(id, payload);
    if (!updated) {
      throw new NotFoundException({ message: 'Data not found', status: 404 });
    }
    return updated;
  }

  @Put('veterinary_hospital/:id')
  async put(@Param('id') id: string, @Body() payload: Record<string, unknown>) {
    const updated = await this.veterinaryHospitalService.update(id, payload);
    if (!updated) {
      throw new NotFoundException({ message: 'Data not found', status: 404 });
    }
    return updated;
  }

  @Delete('veterinary_hospital/:id')
  @HttpCode(204)
  async remove(@Param('id') id: string) {
    const removed = await this.veterinaryHospitalService.remove(id);
    if (!removed) {
      throw new NotFoundException({ message: 'Veterinary Hospital not found', status: 404 });
    }
  }

  @Get('veterinary_hospitals_by_location')
  async listByLocation(@Query() query: Record<string, string | undefined>) {
    const result = await this.veterinaryHospitalService.listByLocation(query);
    if (result.status !== 200) {
      throw new HttpException(result.body, result.status);
    }
    return result.body;
  }
}
