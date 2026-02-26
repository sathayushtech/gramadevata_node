import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Temple } from './temple.model';
import { AddTempleDetails } from './add-temple-details.model';
import { Register as User } from '../auth/user.model';
import { AddTempleDetailsController } from './add-temple-details.controller';
import { AddTempleDetailsService } from './add-temple-details.service';

@Module({
  imports: [
    SequelizeModule.forFeature([
      Temple,
      AddTempleDetails,
      User,
    ]),
  ],
  controllers: [AddTempleDetailsController],
  providers: [AddTempleDetailsService],
})
export class TempleModule {}
