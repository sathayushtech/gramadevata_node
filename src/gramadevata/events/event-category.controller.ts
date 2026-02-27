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
import { EventCategoryService } from './event-category.service';

@Controller('gramadevata/eventcategory')
@ApiTags('eventcategory')
export class EventCategoryController {
  constructor(private readonly eventCategoryService: EventCategoryService) {}

  @Get()
  async list(@Query() query: Record<string, string | undefined>): Promise<unknown> {
    const result = await this.eventCategoryService.list(query);
    if ((result as { status?: number }).status === 404) {
      throw new NotFoundException({ message: 'No matching EventCategories found', status: 404 });
    }
    return result;
  }

  @Get(':id')
  async getById(@Param('id') id: string): Promise<unknown> {
    const category = await this.eventCategoryService.getById(id);
    if (!category) {
      throw new NotFoundException({ message: 'Object not found', status: 404 });
    }
    return category;
  }

  @Post()
  async create(@Body() payload: Record<string, unknown>): Promise<unknown> {
    const result = await this.eventCategoryService.create(payload);
    if (result.status !== 201) {
      throw new HttpException(result.body, result.status);
    }
    return result.body;
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() payload: Record<string, unknown>): Promise<unknown> {
    const updated = await this.eventCategoryService.update(id, payload);
    if (!updated) {
      throw new NotFoundException({ message: 'Object not found', status: 404 });
    }
    return updated;
  }

  @Patch(':id')
  async patch(@Param('id') id: string, @Body() payload: Record<string, unknown>): Promise<unknown> {
    const updated = await this.eventCategoryService.update(id, payload);
    if (!updated) {
      throw new NotFoundException({ message: 'Object not found', status: 404 });
    }
    return updated;
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string): Promise<void> {
    const removed = await this.eventCategoryService.delete(id);
    if (!removed) {
      throw new NotFoundException({ message: 'Object not found', status: 404 });
    }
  }
}
