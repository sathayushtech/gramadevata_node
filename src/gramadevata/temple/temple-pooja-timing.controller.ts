import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TemplePoojaTimingService } from './temple-pooja-timing.service';

@Controller('gramadevata/temple_pooja_timings')
@ApiTags('temple_pooja_timings')
export class TemplePoojaTimingController {
  constructor(private readonly service: TemplePoojaTimingService) {}

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
  async retrieve(@Param('id') id: string): Promise<any> {
    return this.service.retrieve(id);
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
