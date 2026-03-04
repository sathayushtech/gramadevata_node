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
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TourismPlaceService } from './tourism-place.service';
import { EntityStatus } from '../../common/enums';

/* ─────────── CRUD: /gramadevata/tourism ─────────── */

@Controller('gramadevata/tourism')
@ApiTags('tourism')
export class TourismPlaceController {
  constructor(private readonly service: TourismPlaceService) {}

  @Get()
  async list(@Query() query: Record<string, string | undefined>) {
    return this.service.listActive(query);
  }

  @Post()
  async create(@Body() payload: Record<string, unknown>) {
    try {
      return await this.service.create(payload);
    } catch (error: any) {
      throw new HttpException(
        { message: 'An error occurred.', error: error?.message ?? String(error) },
        500,
      );
    }
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const result = await this.service.getActiveById(id);
    if (!result) {
      throw new NotFoundException('Tourism Place not found');
    }
    return result;
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() payload: Record<string, unknown>) {
    const result = await this.service.update(id, payload);
    if (!result) {
      throw new NotFoundException('Tourism Place not found');
    }
    return { message: 'updated successfully', data: result };
  }

  @Patch(':id')
  async patch(@Param('id') id: string, @Body() payload: Record<string, unknown>) {
    const result = await this.service.update(id, payload);
    if (!result) {
      throw new NotFoundException('Tourism Place not found');
    }
    return { message: 'updated successfully', data: result };
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string) {
    const deleted = await this.service.removeActive(id);
    if (!deleted) {
      throw new NotFoundException('Tourism Place not found');
    }
  }
}

/* ─────── EXTRA: tourism_bylocation, tourism_inactive, inactive_tourism_bylocation ─────── */

@Controller('gramadevata')
@ApiTags('tourism')
export class TourismPlaceExtraController {
  constructor(private readonly service: TourismPlaceService) {}

  @Get('tourism_bylocation')
  async byLocation(@Query() query: Record<string, string | undefined>) {
    return this.service.listByLocation(EntityStatus.ACTIVE, query);
  }

  @Get('inactive_tourism_bylocation')
  async inactiveByLocation(@Query() query: Record<string, string | undefined>) {
    return this.service.listByLocation(EntityStatus.INACTIVE, query);
  }

  @Get('tourism_inactive')
  async inactive(@Query() query: Record<string, string | undefined>) {
    return this.service.listInactive(query);
  }
}
