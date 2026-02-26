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
  Query,
  Patch,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { VillagesService } from './villages.service';
import { ApiTags } from '@nestjs/swagger';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';

@Controller('gramadevata/village')
@ApiTags('Villages')
export class VillagesController {
  constructor(private readonly villagesService: VillagesService) {}

  @Post()
  async create(@Res() res: any, @Body() payload: Record<string, unknown>) {
    try {
      const result = await this.villagesService.create(payload);
      return res.status(201).json({ message: 'success', result });
    } catch (e: any) {
      return res.status(500).json({ message: 'An error occurred.', error: String(e?.message || e) });
    }
  }

  @Get()
  async list(@Query() query: Record<string, string | undefined>) {
    return this.villagesService.list(query);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  async getById(@Param('id') id: string, @Req() req: any) {
    const village = await this.villagesService.getById(id, { userId: req?.user?.user_id || req?.user?.id });
    if (!village) {
      throw new NotFoundException('Village not found.');
    }
    return village;
  }

  @Put(':id')
  async update(@Param('id') id: string, @Res() res: any, @Body() payload: Record<string, unknown>) {
    try {
      const village = await this.villagesService.update(id, payload);
      if (!village) {
        throw new NotFoundException('Village not found.');
      }
      return res.status(200).json({ message: 'success', result: village });
    } catch (e: any) {
      if (e instanceof NotFoundException) {
        return res.status(404).json({ message: 'Village not found.' });
      }
      return res.status(500).json({ message: 'An error occurred during update.', error: String(e?.message || e) });
    }
  }

  @Patch(':id')
  async patch(@Param('id') id: string, @Res() res: any, @Body() payload: Record<string, unknown>) {
    return this.update(id, res, payload);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string) {
    const deleted = await this.villagesService.remove(id);
    if (!deleted) {
      throw new NotFoundException('Village not found.');
    }
  }
}
