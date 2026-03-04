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
import { PujariCategoryService } from './pujari-category.service';

@Controller('gramadevata/pujari_category')
@ApiTags('Pujari Category')
export class PujariCategoryController {
  constructor(private readonly pujariCategoryService: PujariCategoryService) {}

  @Get()
  async list(@Query() query: Record<string, string | undefined>) {
    return this.pujariCategoryService.list(query);
  }

  @Post()
  async create(@Body() payload: Record<string, unknown>) {
    try {
      return await this.pujariCategoryService.create(payload);
    } catch (error: any) {
      throw new HttpException(
        { message: `Error occurred: ${error?.message ?? String(error)}`, status: 400 },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const instance = await this.pujariCategoryService.getById(id);
    if (!instance) {
      throw new NotFoundException('Object not found');
    }
    return instance;
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() payload: Record<string, unknown>) {
    const updated = await this.pujariCategoryService.update(id, payload);
    if (!updated) {
      throw new NotFoundException('Object not found');
    }
    return updated;
  }

  @Patch(':id')
  async patch(@Param('id') id: string, @Body() payload: Record<string, unknown>) {
    const updated = await this.pujariCategoryService.update(id, payload);
    if (!updated) {
      throw new NotFoundException('Object not found');
    }
    return updated;
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string) {
    const deleted = await this.pujariCategoryService.remove(id);
    if (!deleted) {
      throw new NotFoundException('Object not found');
    }
  }
}
