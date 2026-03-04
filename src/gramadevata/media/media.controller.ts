import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
  Put,
  Req,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MediaService } from './media.service';

@Controller('gramadevata/media')
@ApiTags('Media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Get()
  async list() {
    return this.mediaService.listActive();
  }

  @Post()
  async create(
    @Body() payload: Record<string, unknown>,
    @Req() req: { user?: Record<string, unknown> },
  ) {
    try {
      const userId =
        typeof payload.user_id === 'string'
          ? payload.user_id
          : req.user && typeof req.user.id === 'string'
            ? req.user.id
            : undefined;

      const result = await this.mediaService.create(payload, userId);
      return { message: 'Success', result };
    } catch (error: any) {
      throw new HttpException(
        {
          message: 'An error occurred.',
          error: error?.message ? String(error.message) : String(error),
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const media = await this.mediaService.getActiveById(id);
    if (!media) {
      throw new HttpException(
        { message: 'Media not found', status: 404 },
        HttpStatus.NOT_FOUND,
      );
    }
    return media;
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() payload: Record<string, unknown>,
    @Req() req: { user?: Record<string, unknown> },
  ) {
    try {
      const userId =
        typeof payload.user_id === 'string'
          ? payload.user_id
          : req.user && typeof req.user.id === 'string'
            ? req.user.id
            : undefined;

      const updated = await this.mediaService.update(id, payload, userId);
      if (!updated) {
        throw new NotFoundException('Object not found');
      }
      return { message: 'Updated successfully', result: updated };
    } catch (error: any) {
      if (error instanceof NotFoundException) throw error;
      throw new HttpException(
        {
          message: 'An error occurred.',
          error: error?.message ? String(error.message) : String(error),
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch(':id')
  async patch(
    @Param('id') id: string,
    @Body() payload: Record<string, unknown>,
    @Req() req: { user?: Record<string, unknown> },
  ) {
    try {
      const userId =
        typeof payload.user_id === 'string'
          ? payload.user_id
          : req.user && typeof req.user.id === 'string'
            ? req.user.id
            : undefined;

      const updated = await this.mediaService.update(id, payload, userId);
      if (!updated) {
        throw new NotFoundException('Object not found');
      }
      return { message: 'Updated successfully', result: updated };
    } catch (error: any) {
      if (error instanceof NotFoundException) throw error;
      throw new HttpException(
        {
          message: 'An error occurred.',
          error: error?.message ? String(error.message) : String(error),
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string) {
    const deleted = await this.mediaService.remove(id);
    if (!deleted) {
      throw new NotFoundException('Object not found');
    }
  }
}
