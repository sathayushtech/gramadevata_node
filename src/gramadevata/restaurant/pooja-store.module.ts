import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Register as User } from '../auth/user.model';
import { AddRestaurantDetails } from './add-restaurant-details.model';
import { AddRestaurantDetailsController } from './add-restaurant-details.controller';
import { AddRestaurantDetailsService } from './add-restaurant-details.service';

@Module({
  imports: [
    SequelizeModule.forFeature([
      AddRestaurantDetails,
      User,
    ]),
  ],
  controllers: [AddRestaurantDetailsController],
  providers: [AddRestaurantDetailsService],
})
export class RestaurantModule {}
