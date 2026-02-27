import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Chat } from '../chat/chat.model';
import { Comment } from '../comments/comment.model';
import { Connect } from '../connect/connect.model';
import { Register as User } from '../auth/user.model';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [SequelizeModule.forFeature([Chat, Comment, Connect, User])],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
