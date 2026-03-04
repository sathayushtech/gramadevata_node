import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { PoliceStation } from './police-station.model';
import { PoliceStationController } from './police-station.controller';
import { PoliceStationService } from './police-station.service';

@Module({
  imports: [
    ConfigModule,
    SequelizeModule.forFeature([PoliceStation]),
  ],
  controllers: [PoliceStationController],
  providers: [PoliceStationService],
})
export class PoliceStationModule {}
