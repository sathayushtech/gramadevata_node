import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  Put,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ApiTags } from '@nestjs/swagger';

@Controller('gramadevata/comments')
@ApiTags('Comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() payload: Record<string, unknown>) {
    return this.commentsService.create(payload);
  }

  @Get()
  async list(@Query() query: Record<string, string | undefined>) {
    return this.commentsService.list(query);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const comment = await this.commentsService.getById(id);
    if (!comment) {
      throw new NotFoundException('Comment not found.');
    }
    return comment;
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async update(@Param('id') id: string, @Body() payload: Record<string, unknown>) {
    const comment = await this.commentsService.update(id, payload);
    if (!comment) {
      throw new NotFoundException('Comment not found.');
    }
    return comment;
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async updatePartial(@Param('id') id: string, @Body() payload: Record<string, unknown>) {
    const comment = await this.commentsService.update(id, payload);
    if (!comment) {
      throw new NotFoundException('Comment not found.');
    }
    return comment;
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string) {
    const deleted = await this.commentsService.remove(id);
    if (!deleted) {
      throw new NotFoundException('Comment not found.');
    }
  }

  @Post(':id/mark-as-inactive')
  @UseGuards(JwtAuthGuard)
  async markAsInactive(@Param('id') id: string) {
    const updated = await this.commentsService.markInactive(id);
    if (!updated) {
      throw new NotFoundException('Comment not found.');
    }
    return { detail: 'Comment status updated to INACTIVE.' };
  }
}
