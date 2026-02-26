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
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';
import { VisitTempleService } from './visit-temple.service';

@Controller('gramadevata/visit_temples')
@ApiTags('visit_temples')
export class VisitTempleController {
  constructor(private readonly visitTempleService: VisitTempleService) {}

  @Get()
  async list() {
    return this.visitTempleService.list();
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const record = await this.visitTempleService.getById(id);
    if (!record) {
      throw new NotFoundException('Not found');
    }
    return record;
  }

  @Post()
  @UseGuards(OptionalJwtAuthGuard)
  async create(@Body() payload: Record<string, unknown>, @Req() req: { user?: any }) {
    return this.visitTempleService.create(payload, req.user);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() payload: Record<string, unknown>) {
    const updated = await this.visitTempleService.update(id, payload);
    if (!updated) {
      throw new NotFoundException('Not found');
    }
    return updated;
  }

  @Patch(':id')
  async patch(@Param('id') id: string, @Body() payload: Record<string, unknown>) {
    const updated = await this.visitTempleService.update(id, payload);
    if (!updated) {
      throw new NotFoundException('Not found');
    }
    return updated;
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string) {
    const deleted = await this.visitTempleService.remove(id);
    if (!deleted) {
      throw new NotFoundException('Not found');
    }
  }
}
