import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { AddMoreHospitalController } from './add-more-hospital.controller';
import { AddMoreHospitalService } from './add-more-hospital.service';
import { AddMoreHospital } from './add-more-hospital.model';
import { Register as User } from '../auth/user.model';

@Module({
  imports: [
    SequelizeModule.forFeature([AddMoreHospital, User]),
  ],
  controllers: [AddMoreHospitalController],
  providers: [AddMoreHospitalService],
})
export class AddMoreHospitalsModule {}
