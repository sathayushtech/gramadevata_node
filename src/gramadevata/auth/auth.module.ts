import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Register } from './user.model';

@Module({
  imports: [SequelizeModule.forFeature([Register])],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
