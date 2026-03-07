import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Register as User } from '../auth/user.model';
import { AddRestaurantDetails } from './add-restaurant-details.model';
import { AddRestaurantDetailsController } from './add-restaurant-details.controller';
import { AddRestaurantDetailsService } from './add-restaurant-details.service';
import { RestaurantsController } from './restaurants.controller';
import { RestaurantsService } from './restaurants.service';
import { TempleNearbyRestaurant } from '../events/temple-nearby-restaurant.model';

@Module({
  imports: [
    SequelizeModule.forFeature([
      AddRestaurantDetails,
      User,
      TempleNearbyRestaurant,
    ]),
  ],
  controllers: [AddRestaurantDetailsController, RestaurantsController],
  providers: [AddRestaurantDetailsService, RestaurantsService],
})
export class RestaurantModule {}
