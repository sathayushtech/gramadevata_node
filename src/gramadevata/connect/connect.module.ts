import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ConnectController } from './connect.controller';
import { ConnectService } from './connect.service';
import { Connect } from './connect.model';
import { Register as User } from '../auth/user.model';
import { Temple } from '../temple/temple.model';
import { Village } from '../villages/village.model';

@Module({
  imports: [SequelizeModule.forFeature([Connect, User, Temple, Village])],
  controllers: [ConnectController],
  providers: [ConnectService],
})
export class ConnectModule {}
