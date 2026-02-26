import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { TourOperator } from './tour-operator.model';
import { AddMoreTourOperator } from './add-more-tour-operator.model';
import { Register as User } from '../auth/user.model';
import { AddMoreTourOperatorController } from './add-more-tour-operator.controller';
import { AddMoreTourOperatorService } from './add-more-tour-operator.service';

@Module({
  imports: [
    SequelizeModule.forFeature([
      TourOperator,
      AddMoreTourOperator,
      User,
    ]),
  ],
  controllers: [AddMoreTourOperatorController],
  providers: [AddMoreTourOperatorService],
})
export class TourismModule {}
