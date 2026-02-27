import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Block } from './block.model';
import { District } from '../../common/models/district.model';
import { BlockController } from './block.controller';
import { BlockService } from './block.service';

@Module({
  imports: [
    SequelizeModule.forFeature([
      Block,
      District,
    ]),
  ],
  controllers: [BlockController],
  providers: [BlockService],
})
export class BlocksModule {}
