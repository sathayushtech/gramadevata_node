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
  Req,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FavoriteTemplesService } from './favorite-temples.service';

@Controller('gramadevata/favorite-temples')
@ApiTags('favorite-temples')
export class FavoriteTemplesController {
  constructor(private readonly favoriteTemplesService: FavoriteTemplesService) {}

  @Get()
  async list(@Query() query: Record<string, string | undefined>) {
    return this.favoriteTemplesService.list(query);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const favorite = await this.favoriteTemplesService.getById(id);
    if (!favorite) {
      throw new NotFoundException({ message: 'Object not found', status: 404 });
    }
    return favorite;
  }

  @Post()
  async create(@Body() payload: Record<string, unknown>, @Req() req: { user?: Record<string, unknown> }) {
    return this.favoriteTemplesService.create(payload, req.user);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() payload: Record<string, unknown>) {
    const updated = await this.favoriteTemplesService.update(id, payload);
    if (!updated) {
      throw new NotFoundException({ message: 'Object not found', status: 404 });
    }
    return updated;
  }

  @Patch(':id')
  async patch(@Param('id') id: string, @Body() payload: Record<string, unknown>) {
    const updated = await this.favoriteTemplesService.update(id, payload);
    if (!updated) {
      throw new NotFoundException({ message: 'Object not found', status: 404 });
    }
    return updated;
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string) {
    const removed = await this.favoriteTemplesService.remove(id);
    if (!removed) {
      throw new NotFoundException({ message: 'Object not found', status: 404 });
    }
  }
}
