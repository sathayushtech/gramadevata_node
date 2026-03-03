import { Body, Controller, Delete, Get, HttpException, NotFoundException, Param, Patch, Post, Put, Query, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TempleFestivalService } from './temple-festival.service';

@Controller('gramadevata/temple_festivals')
@ApiTags('temple_festivals')
export class TempleFestivalController {
  constructor(private readonly service: TempleFestivalService) {}

  @Get()
  async list(@Query() query: Record<string, string | undefined>) {
    return this.service.list(query);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const record = await this.service.getById(id);
    if (record === 'inactive' || record === null) {
      throw new NotFoundException({ message: 'Data not found', status: 404 });
    }
    return record;
  }

  @Post()
  async create(@Body() payload: Record<string, unknown>, @Req() req: { user?: Record<string, unknown> }): Promise<any> {
    const result = await this.service.create(payload, req.user);
    if (result.status !== 201) {
      throw new HttpException(result.body, result.status);
    }
    return result.body;
  }

  @Patch(':id')
  async patch(@Param('id') id: string, @Body() payload: Record<string, unknown>): Promise<any> {
    const result = await this.service.update(id, payload);
    if (result.status === 404) {
      throw new NotFoundException(result.body);
    }
    if (result.status !== 200) {
      throw new HttpException(result.body, result.status);
    }
    return result.body;
  }

  @Put(':id')
  async put(@Param('id') id: string, @Body() payload: Record<string, unknown>): Promise<any> {
    return this.patch(id, payload);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<any> {
    const result = await this.service.remove(id);
    if (result.status === 404) {
      throw new NotFoundException(result.body);
    }
    return result.body;
  }
}
