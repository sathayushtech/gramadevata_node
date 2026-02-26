import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Register as User } from '../auth/user.model';
import { AddMoreHotel } from './add-hotel.model';
import { AddMoreHotelController } from './add-more-hotel.controller';
import { AddMoreHotelService } from './add-more-hotel.service';

@Module({
  imports: [
    SequelizeModule.forFeature([
      AddMoreHotel,
      User,
    ]),
  ],
  controllers: [AddMoreHotelController],
  providers: [AddMoreHotelService],
})
export class HotelModule {}
