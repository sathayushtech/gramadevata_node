import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { VillageGeographicService } from './village-geographic.service';

@Controller('gramadevata/village_geographic')
@ApiTags('Village Geographic')
export class VillageGeographicController {
  constructor(private readonly geographicService: VillageGeographicService) {}

  @Get()
  async list() {
    return this.geographicService.list();
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const record = await this.geographicService.getById(id);
    if (!record) {
      throw new NotFoundException('Village geographic record not found.');
    }
    return record;
  }

  @Post()
  async create(@Body() payload: Record<string, unknown>) {
    return this.geographicService.create(payload);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() payload: Record<string, unknown>) {
    const record = await this.geographicService.update(id, payload);
    if (!record) {
      throw new NotFoundException('Village geographic record not found.');
    }
    return record;
  }

  @Patch(':id')
  async patch(@Param('id') id: string, @Body() payload: Record<string, unknown>) {
    const record = await this.geographicService.update(id, payload);
    if (!record) {
      throw new NotFoundException('Village geographic record not found.');
    }
    return record;
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string) {
    const deleted = await this.geographicService.remove(id);
    if (!deleted) {
      throw new NotFoundException('Village geographic record not found.');
    }
  }
}
