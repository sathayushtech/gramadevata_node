import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TempleTransportService } from './temple-transport.service';

@Controller('gramadevata/temple-transports')
@ApiTags('temple-transports')
export class TempleTransportController {
  constructor(private readonly service: TempleTransportService) {}

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
