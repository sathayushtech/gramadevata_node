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
import { WelfareHomesService } from './welfare-homes.service';
import { EntityStatus } from '../../common/enums';
import { ApiTags } from '@nestjs/swagger';

@Controller('gramadevata/welfare_home')
@ApiTags('Welfare Homes')
export class WelfareHomesController {
  constructor(private readonly welfareService: WelfareHomesService) {}

  @Get()
  async list(@Query() query: Record<string, string | undefined>, @Req() req: any) {
    return this.welfareService.listActive(query, req);
  }

  @Post()
  async create(@Body() payload: Record<string, unknown>) {
    try {
      const result = await this.welfareService.create(payload);
      return { message: 'success', result };
    } catch (error: any) {
      throw new HttpException(
        { message: 'An error occurred.', error: error?.message ? String(error.message) : String(error) },
        500,
      );
    }
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const welfareHome = await this.welfareService.getActiveById(id);
    if (!welfareHome) {
      throw new NotFoundException('Object not found');
    }
    return welfareHome;
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() payload: Record<string, unknown>) {
    try {
      const updated = await this.welfareService.updateActive(id, payload);
      if (!updated) {
        throw new NotFoundException('Object not found');
      }
      return { message: 'updated successfully', data: updated };
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new HttpException(
        { message: 'An error occurred.', error: error?.message ? String(error.message) : String(error) },
        500,
      );
    }
  }

  @Patch(':id')
  async patch(@Param('id') id: string, @Body() payload: Record<string, unknown>) {
    try {
      const updated = await this.welfareService.updateActive(id, payload);
      if (!updated) {
        throw new NotFoundException('Object not found');
      }
      return { message: 'updated successfully', data: updated };
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new HttpException(
        { message: 'An error occurred.', error: error?.message ? String(error.message) : String(error) },
        500,
      );
    }
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string) {
    const deleted = await this.welfareService.removeActive(id);
    if (!deleted) {
      throw new NotFoundException('Object not found');
    }
  }
}

@Controller('gramadevata')
@ApiTags('Welfare Homes')
export class WelfareHomesExtraController {
  constructor(private readonly welfareService: WelfareHomesService) {}

  @Get('welfare-homes_by-location')
  async listByLocation(@Query() query: Record<string, string | undefined>, @Req() req: any) {
    return this.welfareService.listByLocation(EntityStatus.ACTIVE, query, req);
  }

  @Get('inactive_welfare_homes_by_location')
  async listInactiveByLocation(@Query() query: Record<string, string | undefined>, @Req() req: any) {
    return this.welfareService.listByLocation(EntityStatus.INACTIVE, query, req);
  }

  @Get('welfarehomes_inactive')
  async inactiveFeed(@Query() query: Record<string, string | undefined>) {
    return this.welfareService.listInactiveFeed(query);
  }
}
