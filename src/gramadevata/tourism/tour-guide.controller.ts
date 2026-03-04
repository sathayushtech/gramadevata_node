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
import { TourGuideService } from './tour-guide.service';

/* ─────────── CRUD: /gramadevata/tour_guides ─────────── */

@Controller('gramadevata/tour_guides')
@ApiTags('tour_guides')
export class TourGuideController {
  constructor(private readonly service: TourGuideService) {}

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
      throw new NotFoundException('Tour Guide not found');
    }
    return result;
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() payload: Record<string, unknown>) {
    const result = await this.service.update(id, payload);
    if (!result) {
      throw new NotFoundException('Tour Guide not found');
    }
    return { message: 'updated successfully', data: result };
  }

  @Patch(':id')
  async patch(@Param('id') id: string, @Body() payload: Record<string, unknown>) {
    const result = await this.service.update(id, payload);
    if (!result) {
      throw new NotFoundException('Tour Guide not found');
    }
    return { message: 'updated successfully', data: result };
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string) {
    const deleted = await this.service.removeActive(id);
    if (!deleted) {
      throw new NotFoundException('Tour Guide not found');
    }
  }
}

/* ─────── EXTRA: tour_guides_by_location ─────── */

@Controller('gramadevata')
@ApiTags('tour_guides')
export class TourGuideExtraController {
  constructor(private readonly service: TourGuideService) {}

  @Get('tour_guides_by_location')
  async byLocation(@Query() query: Record<string, string | undefined>) {
    return this.service.listByLocation(query);
  }
}
