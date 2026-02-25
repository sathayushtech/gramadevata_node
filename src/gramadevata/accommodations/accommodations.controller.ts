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
import { AccommodationsService } from './accommodations.service';
import { ApiTags } from '@nestjs/swagger';

@Controller('gramadevata/accommodation')
@ApiTags('Accommodations')
export class AccommodationsController {
  constructor(private readonly accommodationsService: AccommodationsService) {}

  @Get()
  async list(@Query() query: Record<string, string | undefined>) {
    return this.accommodationsService.list(query);
  }

  @Post()
  async create(@Body() payload: Record<string, unknown>) {
    return this.accommodationsService.create(payload);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const accommodation = await this.accommodationsService.getById(id);
    if (!accommodation) {
      throw new NotFoundException('Hotel not found');
    }
    return accommodation;
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() payload: Record<string, unknown>) {
    const accommodation = await this.accommodationsService.update(id, payload);
    if (!accommodation) {
      throw new NotFoundException('Hotel not found');
    }
    return accommodation;
  }

  @Patch(':id')
  async patch(@Param('id') id: string, @Body() payload: Record<string, unknown>) {
    const accommodation = await this.accommodationsService.update(id, payload);
    if (!accommodation) {
      throw new NotFoundException('Hotel not found');
    }
    return accommodation;
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string) {
    const deleted = await this.accommodationsService.remove(id);
    if (!deleted) {
      throw new NotFoundException('Hotel not found');
    }
  }
}
