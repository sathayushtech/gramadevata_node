import { Module } from '@nestjs/common';
import { GramadevataController } from './gramadevata.controller';
import { AuthModule } from './auth/auth.module';
import { CommentsModule } from './comments/comments.module';
import { VillagesModule } from './villages/villages.module';

@Module({
  imports: [AuthModule, CommentsModule, VillagesModule],
  controllers: [GramadevataController],
})
export class GramadevataModule {}
