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
import { PoliceStationService } from './police-station.service';

@Controller('gramadevata/police_station')
@ApiTags('Police Station')
export class PoliceStationController {
  constructor(private readonly policeStationService: PoliceStationService) {}

  @Get()
  async list(@Query() query: Record<string, string | undefined>) {
    return this.policeStationService.listActive(query);
  }

  @Post()
  async create(@Body() payload: Record<string, unknown>) {
    try {
      const result = await this.policeStationService.create(payload);
      return { message: 'success', result };
    } catch (error: any) {
      throw new HttpException(
        {
          message: 'An error occurred.',
          error: error?.message ? String(error.message) : String(error),
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const station = await this.policeStationService.getActiveById(id);
    if (!station) {
      throw new HttpException(
        { message: 'police station not found', status: 404 },
        HttpStatus.NOT_FOUND,
      );
    }
    return station;
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() payload: Record<string, unknown>,
  ) {
    try {
      const updated = await this.policeStationService.update(id, payload);
      if (!updated) {
        throw new NotFoundException('Object not found');
      }
      return updated;
    } catch (error: any) {
      if (error instanceof NotFoundException) throw error;
      throw new HttpException(
        {
          message: 'An error occurred.',
          error: error?.message ? String(error.message) : String(error),
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch(':id')
  async patch(
    @Param('id') id: string,
    @Body() payload: Record<string, unknown>,
  ) {
    try {
      const updated = await this.policeStationService.update(id, payload);
      if (!updated) {
        throw new NotFoundException('Object not found');
      }
      return updated;
    } catch (error: any) {
      if (error instanceof NotFoundException) throw error;
      throw new HttpException(
        {
          message: 'An error occurred.',
          error: error?.message ? String(error.message) : String(error),
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string) {
    const deleted = await this.policeStationService.remove(id);
    if (!deleted) {
      throw new NotFoundException('Object not found');
    }
  }
}
