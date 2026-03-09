import { Controller, HttpException, Param, Put, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RestaurantMergeService } from './restaurant-merge.service';

@Controller('gramadevata')
export class RestaurantMergeController {
  constructor(
    private readonly restaurantMergeService: RestaurantMergeService
  ) {}

  @Put('restaurant_merge/:restaurant_id')
  @ApiTags('restaurant_merge')
  async mergeRestaurant(
    @Param('restaurant_id') restaurantId: string,
    @Body() payload: Record<string, unknown>
  ) {
    const result = await this.restaurantMergeService.mergeRestaurantDetails(restaurantId, payload ?? {});
    if (result.status !== 200) {
      throw new HttpException(result.body, result.status);
    }
    return result.body;
  }
}