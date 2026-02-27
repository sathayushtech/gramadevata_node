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
  Res,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { VillageBanksService } from './village-banks.service';

@Controller('gramadevata/village-bank')
@ApiTags('Village Banks')
export class VillageBanksController {
  constructor(private readonly service: VillageBanksService) {}

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
  async create(@Res() res: any, @Body() payload: Record<string, unknown>) {
    try {
      const created = await this.service.create(payload);
      return res.status(201).json(created);
    } catch (e: any) {
      return res.status(400).json({ error: String(e?.message || e) });
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
      return res.status(400).json({ error: String(e?.message || e) });
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
