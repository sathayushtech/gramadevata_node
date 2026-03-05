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
import { GoshalaCategoryService } from './goshala-category.service';

@Controller('gramadevata/goshalacategories')
@ApiTags('goshalacategories')
export class GoshalaCategoryController {
  constructor(private readonly goshalaCategoryService: GoshalaCategoryService) {}

  @Get()
  async list(@Query() query: Record<string, string | undefined>): Promise<Record<string, unknown>[] | Record<string, unknown>> {
    const result = await this.goshalaCategoryService.list(query);
    if ((result as { status?: number }).status === 404) {
      throw new NotFoundException({ message: 'Data not found', status: 404 });
    }
    return result;
  }

  @Get(':id')
  async getById(@Param('id') id: string): Promise<Record<string, unknown>> {
    const category = await this.goshalaCategoryService.getById(id);
    if (!category) {
      throw new NotFoundException({ message: 'Object not found', status: 404 });
    }
    return category;
  }

  @Post()
  async create(@Body() payload: Record<string, unknown>): Promise<Record<string, unknown>> {
    const result = await this.goshalaCategoryService.create(payload);
    if (result.status !== 201) {
      throw new HttpException(result.body, result.status);
    }
    return result.body;
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() payload: Record<string, unknown>): Promise<Record<string, unknown>> {
    const updated = await this.goshalaCategoryService.update(id, payload);
    if (!updated) {
      throw new NotFoundException({ message: 'Object not found', status: 404 });
    }
    return updated;
  }

  @Patch(':id')
  async patch(@Param('id') id: string, @Body() payload: Record<string, unknown>): Promise<Record<string, unknown>> {
    const updated = await this.goshalaCategoryService.update(id, payload);
    if (!updated) {
      throw new NotFoundException({ message: 'Object not found', status: 404 });
    }
    return updated;
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string): Promise<void> {
    const removed = await this.goshalaCategoryService.delete(id);
    if (!removed) {
      throw new NotFoundException({ message: 'Object not found', status: 404 });
    }
  }
}
