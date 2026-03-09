import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RestaurantsService } from './restaurants.service';

@Controller('gramadevata')
export class RestaurantsByLocationController {
  constructor(
    private readonly restaurantsService: RestaurantsService
  ) {}

  @Get('restaurants_by_location')
  @ApiTags('restaurants_by_location')
  async getByLocation(@Query() query: Record<string, string | undefined>) {
    return this.restaurantsService.getByLocation(query);
  }
}