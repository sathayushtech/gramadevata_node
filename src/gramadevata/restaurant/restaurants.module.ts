import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Register as User } from '../auth/user.model';
import { AddRestaurantDetails } from './add-restaurant-details.model';
import { AddRestaurantDetailsController } from './add-restaurant-details.controller';
import { AddRestaurantDetailsService } from './add-restaurant-details.service';
import { RestaurantsController } from './restaurants.controller';
import { RestaurantsService } from './restaurants.service';
import { TempleNearbyRestaurant } from '../events/temple-nearby-restaurant.model';
import { RestaurantMergeController } from './restaurant-merge.controller';
import { RestaurantMergeService } from './restaurant-merge.service';
import { RestaurantsByLocationController } from './restaurants-by-location.controller';

@Module({
  imports: [
    SequelizeModule.forFeature([
      AddRestaurantDetails,
      User,
      TempleNearbyRestaurant,
    ]),
  ],
  controllers: [AddRestaurantDetailsController, RestaurantsController, RestaurantMergeController, 
    RestaurantsByLocationController
  ],
  providers: [AddRestaurantDetailsService, RestaurantsService, RestaurantMergeService],
})
export class RestaurantModule {}
