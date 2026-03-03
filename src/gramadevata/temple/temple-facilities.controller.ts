import { Body, Controller, Delete, Get, HttpCode, HttpStatus, NotFoundException, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TempleFacilitiesService } from './temple-facilities.service';

@Controller('gramadevata/temple_facilities')
@ApiTags('temple_facilities')
export class TempleFacilitiesController {
  constructor(private readonly service: TempleFacilitiesService) {}

  @Get()
  async list(@Query() query: Record<string, string | undefined>): Promise<any> {
    return this.service.list(query);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: Record<string, any>): Promise<any> {
    return this.service.create(body);
  }

  @Get(':id')
  async getById(@Param('id') id: string): Promise<any> {
    const record = await this.service.getById(id);
    if (record === 'inactive' || record === null) {
      throw new NotFoundException({ message: 'Data not found', status: 404 });
    }
    return record;
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: Record<string, any>): Promise<any> {
    return this.service.update(id, body);
  }

  @Patch(':id')
  async partialUpdate(@Param('id') id: string, @Body() body: Record<string, any>): Promise<any> {
    return this.service.update(id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async destroy(@Param('id') id: string): Promise<void> {
    await this.service.remove(id);
  }
}
