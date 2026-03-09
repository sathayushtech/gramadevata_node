import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { Register as User } from '../auth/user.model';
import { Connect } from '../connect/connect.model';
import { Temple } from '../temple/temple.model';
import { Goshala } from '../goshalas/goshala.model';
import { Event } from '../events/event.model';
import { FavoriteTemple } from '../temple/favorite-temple.model';
import { VisitTemple } from '../temple/visit-temple.model';
import { Village } from '../villages/village.model';

@Module({
  imports: [
    SequelizeModule.forFeature([
      User,
      Connect,
      Temple,
      Goshala,
      Event,
      FavoriteTemple,
      VisitTemple,
      Village,
    ]),
  ],
  controllers: [ProfileController],
  providers: [ProfileService],
})
export class ProfileModule {}
