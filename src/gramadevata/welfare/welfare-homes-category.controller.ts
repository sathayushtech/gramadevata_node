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
import { WelfareHomesCategoryService } from './welfare-homes-category.service';

@Controller('gramadevata/welfare_homes_category')
export class WelfareHomesCategoryController {
  constructor(private readonly categoryService: WelfareHomesCategoryService) {}

  @Get()
  async list() {
    return this.categoryService.list();
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const category = await this.categoryService.getById(id);
    if (!category) {
      throw new NotFoundException('Welfare home category not found.');
    }
    return category;
  }

  @Post()
  async create(@Body() payload: Record<string, unknown>) {
    return this.categoryService.create(payload);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() payload: Record<string, unknown>) {
    const category = await this.categoryService.update(id, payload);
    if (!category) {
      throw new NotFoundException('Welfare home category not found.');
    }
    return category;
  }

  @Patch(':id')
  async patch(@Param('id') id: string, @Body() payload: Record<string, unknown>) {
    const category = await this.categoryService.update(id, payload);
    if (!category) {
      throw new NotFoundException('Welfare home category not found.');
    }
    return category;
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string) {
    const deleted = await this.categoryService.remove(id);
    if (!deleted) {
      throw new NotFoundException('Welfare home category not found.');
    }
  }
}
