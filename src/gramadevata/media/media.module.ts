import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { Media } from './media.model';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';

@Module({
  imports: [
    ConfigModule,
    SequelizeModule.forFeature([Media]),
  ],
  controllers: [MediaController],
  providers: [MediaService],
})
export class MediaModule {}
