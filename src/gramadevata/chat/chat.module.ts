import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { Chat } from './chat.model';
import { Register as User } from '../auth/user.model';
import { Temple } from '../temple/temple.model';
import { Village } from '../villages/village.model';

@Module({
  imports: [SequelizeModule.forFeature([Chat, User, Temple, Village])],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
