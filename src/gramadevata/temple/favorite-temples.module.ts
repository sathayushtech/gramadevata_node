import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { User } from '../auth/user.model';
import { Event } from '../events/event.model';
import { Goshala } from '../goshalas/goshala.model';
import { Temple } from '../temples/temple.model';
import { FavoriteTemple } from './favorite-temple.model';
import { FavoriteTemplesController } from './favorite-temples.controller';
import { FavoriteTemplesService } from './favorite-temples.service';

@Module({
  imports: [SequelizeModule.forFeature([FavoriteTemple, User, Temple, Goshala, Event])],
  controllers: [FavoriteTemplesController],
  providers: [FavoriteTemplesService],
})
export class FavoriteTemplesModule {}
