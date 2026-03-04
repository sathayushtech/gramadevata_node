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
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PujariSubCategoryService } from './pujari-subcategory.service';

@Controller('gramadevata/pujari-subcategories')
@ApiTags('Pujari Subcategory')
export class PujariSubCategoryController {
  constructor(
    private readonly pujariSubCategoryService: PujariSubCategoryService,
  ) {}

  @Get()
  async list(@Query() query: Record<string, string | undefined>) {
    return this.pujariSubCategoryService.list(query);
  }

  @Post()
  async create(@Body() payload: Record<string, unknown>) {
    return this.pujariSubCategoryService.create(payload);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const instance = await this.pujariSubCategoryService.getById(id);
    if (!instance) {
      throw new NotFoundException('Object not found');
    }
    return instance;
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() payload: Record<string, unknown>) {
    const updated = await this.pujariSubCategoryService.update(id, payload);
    if (!updated) {
      throw new NotFoundException('Object not found');
    }
    return updated;
  }

  @Patch(':id')
  async patch(@Param('id') id: string, @Body() payload: Record<string, unknown>) {
    const updated = await this.pujariSubCategoryService.update(id, payload);
    if (!updated) {
      throw new NotFoundException('Object not found');
    }
    return updated;
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string) {
    const deleted = await this.pujariSubCategoryService.remove(id);
    if (!deleted) {
      throw new NotFoundException('Object not found');
    }
  }
}
