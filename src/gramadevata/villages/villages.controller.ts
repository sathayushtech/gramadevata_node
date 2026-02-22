import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { VillagesService } from './villages.service';

@Controller('gramadevata/village')
export class VillagesController {
  constructor(private readonly villagesService: VillagesService) {}

  @Post()
  async create(@Body() payload: Record<string, unknown>) {
    return this.villagesService.create(payload);
  }

  @Get()
  async list(@Query() query: Record<string, string | undefined>) {
    return this.villagesService.list(query);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const village = await this.villagesService.getById(id);
    if (!village) {
      throw new NotFoundException('Village not found.');
    }
    return village;
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() payload: Record<string, unknown>) {
    const village = await this.villagesService.update(id, payload);
    if (!village) {
      throw new NotFoundException('Village not found.');
    }
    return village;
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string) {
    const deleted = await this.villagesService.remove(id);
    if (!deleted) {
      throw new NotFoundException('Village not found.');
    }
  }
}
