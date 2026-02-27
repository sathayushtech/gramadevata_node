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
import { VillageArtistsService } from './village-artists.service';

@Controller('gramadevata/village-artists')
@ApiTags('Village Artists')
export class VillageArtistsController {
  constructor(private readonly service: VillageArtistsService) {}

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
  async update(@Param('id') id: string, @Res() res: any, @Body() payload: Record<string, unknown>) {
    try {
      const updated = await this.service.update(id, payload);
      if (!updated) {
        throw new NotFoundException('Object not found');
      }
      return res.json(updated);
    } catch (e: any) {
      if (e instanceof NotFoundException) {
        return res.status(404).json({ message: 'Object not found' });
      }
      return res.status(500).json({ message: 'An error occurred.', error: String(e?.message || e) });
    }
  }

  @Patch(':id')
  async patch(@Param('id') id: string, @Res() res: any, @Body() payload: Record<string, unknown>) {
    return this.update(id, res, payload);
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
