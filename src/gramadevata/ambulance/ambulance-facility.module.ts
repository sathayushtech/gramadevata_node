import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { AmbulanceFacility } from './ambulance-facility.model';
import { AmbulanceFacilityController } from './ambulance-facility.controller';
import { AmbulanceFacilityService } from './ambulance-facility.service';

@Module({
  imports: [SequelizeModule.forFeature([AmbulanceFacility])],
  controllers: [AmbulanceFacilityController],
  providers: [AmbulanceFacilityService],
})
export class AmbulanceFacilityModule {}
