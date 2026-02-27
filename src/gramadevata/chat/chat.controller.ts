import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  NotFoundException,
  Patch,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ChatService } from './chat.service';
import { ApiTags } from '@nestjs/swagger';

@Controller('gramadevata/chat')
@ApiTags('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async list(@Query() query: Record<string, string | undefined>) {
    const result = await this.chatService.list(query);
    if (result.status !== 200) {
      throw new HttpException(result.body, result.status);
    }
    return result.body;
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getById(@Param('id') id: string) {
    const record = await this.chatService.getById(id);
    if (!record) {
      throw new NotFoundException({ message: 'Chat message not found', status: 404 });
    }
    return record;
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @Body() payload: Record<string, unknown>,
    @Req() req: { user?: Record<string, unknown> },
  ) {
    const result = await this.chatService.create(payload, req.user);
    if (result.status !== 201) {
      throw new HttpException(result.body, result.status);
    }
    return result.body;
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async update(@Param('id') id: string, @Body() payload: Record<string, unknown>) {
    const updated = await this.chatService.update(id, payload);
    if (!updated) {
      throw new NotFoundException({ message: 'Chat message not found', status: 404 });
    }
    return updated;
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async patchById(@Param('id') id: string, @Body() payload: Record<string, unknown>) {
    const updated = await this.chatService.update(id, payload);
    if (!updated) {
      throw new NotFoundException({ message: 'Chat message not found', status: 404 });
    }
    return updated;
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string) {
    const removed = await this.chatService.remove(id);
    if (!removed) {
      throw new NotFoundException({ message: 'Chat message not found', status: 404 });
    }
  }
}
