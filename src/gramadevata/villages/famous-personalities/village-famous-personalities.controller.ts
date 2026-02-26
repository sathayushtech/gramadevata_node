import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Patch,
  Post,
  Put,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { OptionalJwtAuthGuard } from '../../../common/guards/optional-jwt-auth.guard';
import { VillageFamousPersonalitiesService } from './village-famous-personalities.service';

@Controller('gramadevata/village-famous-personalities')
@ApiTags('Village Famous Personalities')
export class VillageFamousPersonalitiesController {
  constructor(private readonly service: VillageFamousPersonalitiesService) {}

  @Get()
  async list() {
    return this.service.list();
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const record = await this.service.getById(id);
    if (!record) {
      throw new NotFoundException('Object not found');
    }
    return record;
  }

  @Post()
  @UseGuards(OptionalJwtAuthGuard)
  async create(@Req() req: any, @Res() res: any, @Body() payload: Record<string, unknown>) {
    try {
      const userId = (req as any).user?.user_id || (req as any).user?.id;
      const result = await this.service.create(payload, { userId });
      return res.status(201).json(result);
    } catch (e: any) {
      return res.status(500).json({ message: 'An error occurred.', error: String(e?.message || e) });
    }
  }

  @Put(':id')
  @UseGuards(OptionalJwtAuthGuard)
  async update(@Param('id') id: string, @Req() req: any, @Res() res: any, @Body() payload: Record<string, unknown>) {
    try {
      const userId = (req as any).user?.user_id || (req as any).user?.id;
      const fullName = (req as any).user?.full_name || (req as any).user?.fullName;
      const result = await this.service.update(id, payload, { userId, fullName });
      if (!result) {
        throw new NotFoundException('Object not found');
      }
      return res.json(result);
    } catch (e: any) {
      if (e instanceof NotFoundException) {
        return res.status(404).json({ message: 'Object not found' });
      }
      return res.status(500).json({ message: 'An error occurred.', error: String(e?.message || e) });
    }
  }

  @Patch(':id')
  @UseGuards(OptionalJwtAuthGuard)
  async patch(@Param('id') id: string, @Req() req: any, @Res() res: any, @Body() payload: Record<string, unknown>) {
    return this.update(id, req, res, payload);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string) {
    const deleted = await this.service.remove(id);
    if (!deleted) {
      throw new NotFoundException('Object not found');
    }
  }
}
