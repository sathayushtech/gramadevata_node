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
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SocialActivityService } from './social-activity.service';

@Controller('gramadevata/social_activities')
@ApiTags('Social Activities')
export class SocialActivityController {
  constructor(private readonly socialActivityService: SocialActivityService) {}

  @Get()
  async list(@Query() query: Record<string, string | undefined>) {
    return this.socialActivityService.listActive(query);
  }

  @Post()
  async create(@Body() payload: Record<string, unknown>) {
    try {
      const result = await this.socialActivityService.create(payload);
      return result;
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
    const activity = await this.socialActivityService.getActiveById(id);
    if (!activity) {
      throw new NotFoundException('Object not found');
    }
    return activity;
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() payload: Record<string, unknown>,
  ) {
    const updated = await this.socialActivityService.updateActive(id, payload);
    if (!updated) {
      throw new NotFoundException('Object not found');
    }
    return updated;
  }

  @Patch(':id')
  async patch(
    @Param('id') id: string,
    @Body() payload: Record<string, unknown>,
  ) {
    const updated = await this.socialActivityService.updateActive(id, payload);
    if (!updated) {
      throw new NotFoundException('Object not found');
    }
    return updated;
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string) {
    const deleted = await this.socialActivityService.removeActive(id);
    if (!deleted) {
      throw new NotFoundException('Object not found');
    }
  }
}
