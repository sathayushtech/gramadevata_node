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
import { TourOperatorService } from './tour-operator.service';

/* ─────────── CRUD: /gramadevata/tour-operators ─────────── */

@Controller('gramadevata/tour-operators')
@ApiTags('tour-operators')
export class TourOperatorController {
  constructor(private readonly service: TourOperatorService) {}

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
      throw new NotFoundException('Tour Operator not found');
    }
    return result;
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() payload: Record<string, unknown>) {
    const result = await this.service.update(id, payload);
    if (!result) {
      throw new NotFoundException('Tour Operator not found');
    }
    return { message: 'updated successfully', data: result };
  }

  @Patch(':id')
  async patch(@Param('id') id: string, @Body() payload: Record<string, unknown>) {
    const result = await this.service.update(id, payload);
    if (!result) {
      throw new NotFoundException('Tour Operator not found');
    }
    return { message: 'updated successfully', data: result };
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string) {
    const deleted = await this.service.removeActive(id);
    if (!deleted) {
      throw new NotFoundException('Tour Operator not found');
    }
  }
}

/* ─────── EXTRA: tour-operators_by_location, tour_operator_merge ─────── */

@Controller('gramadevata')
@ApiTags('tour-operators')
export class TourOperatorExtraController {
  constructor(private readonly service: TourOperatorService) {}

  @Get('tour-operators_by_location')
  async byLocation(@Query() query: Record<string, string | undefined>) {
    return this.service.listByLocation(query);
  }

  @Put('tour_operator_merge/:operator_id')
  async merge(
    @Param('operator_id') operatorId: string,
    @Body() payload: Record<string, unknown>,
  ) {
    const result = await this.service.merge(operatorId, payload);
    if (!result) {
      throw new NotFoundException('Tour Operator not found');
    }
    return result;
  }
}
