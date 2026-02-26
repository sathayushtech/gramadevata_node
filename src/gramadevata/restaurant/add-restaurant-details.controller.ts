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
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AddRestaurantDetailsService } from './add-restaurant-details.service';

@Controller('gramadevata/add_more_restaurants')
@ApiTags('add_more_restaurants')
export class AddRestaurantDetailsController {
  constructor(private readonly addRestaurantDetailsService: AddRestaurantDetailsService) {}

  @Get()
  async list() {
    return this.addRestaurantDetailsService.list();
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const record = await this.addRestaurantDetailsService.getById(id);
    if (!record) {
      throw new NotFoundException('Object not found');
    }
    return record;
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @Body() payload: Record<string, unknown>,
    @Req() req: { user?: Record<string, unknown> }
  ) {
    const result = await this.addRestaurantDetailsService.create(payload, req.user);
    if (result.status !== 201) {
      throw new HttpException(result.body, result.status);
    }
    return result.body;
  }

  @Patch(':id')
  async patchById(
    @Param('id') id: string,
    @Body() payload: Record<string, unknown>
  ) {
    const updated = await this.addRestaurantDetailsService.update(id, payload);
    if (!updated) {
      throw new NotFoundException('Object not found');
    }
    return updated;
  }

  @Put(':id')
  async putById(
    @Param('id') id: string,
    @Body() payload: Record<string, unknown>
  ) {
    const updated = await this.addRestaurantDetailsService.update(id, payload);
    if (!updated) {
      throw new NotFoundException('Object not found');
    }
    return updated;
  }

  @Delete(':id')
  @HttpCode(204)
  async deleteById(@Param('id') id: string) {
    const removed = await this.addRestaurantDetailsService.remove(id);
    if (!removed) {
      throw new NotFoundException('Object not found');
    }
  }
}
