import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TempleCategoryService } from './temple-category.service';

@Controller('gramadevata/templeCategeory')
@ApiTags('templeCategeory')
export class TempleCategoryController {
  constructor(private readonly templeCategoryService: TempleCategoryService) {}

  @Get()
  async list(@Query() query: Record<string, string | undefined>): Promise<any> {
    return this.templeCategoryService.list(query);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: Record<string, any>): Promise<any> {
    return this.templeCategoryService.create(body);
  }

  @Get(':id')
  async retrieve(@Param('id') id: string): Promise<any> {
    return this.templeCategoryService.retrieve(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: Record<string, any>): Promise<any> {
    return this.templeCategoryService.update(id, body);
  }

  @Patch(':id')
  async partialUpdate(@Param('id') id: string, @Body() body: Record<string, any>): Promise<any> {
    return this.templeCategoryService.update(id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async destroy(@Param('id') id: string): Promise<void> {
    await this.templeCategoryService.remove(id);
  }
}
