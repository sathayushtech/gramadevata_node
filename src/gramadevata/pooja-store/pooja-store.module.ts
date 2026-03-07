import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { PoojaStore } from './pooja-store.model';
import { AddMorePoojaStore } from './add-pooja-store.model';
import { AddMorePoojaStoreController } from './add-more-pooja-store.controller';
import { AddMorePoojaStoreService } from './add-more-pooja-store.service';
import { Register as User } from '../auth/user.model';
import { PoojaStoreController } from './pooja-store.controller';
import { PoojaStoreService } from './pooja-store.service';

@Module({
  imports: [
    SequelizeModule.forFeature([
      PoojaStore,
      AddMorePoojaStore,
      User,
    ]),
  ],
  controllers: [AddMorePoojaStoreController, PoojaStoreController],
  providers: [AddMorePoojaStoreService, PoojaStoreService],
})
export class PoojaStoreModule {}
