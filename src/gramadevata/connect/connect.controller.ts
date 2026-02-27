import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  NotFoundException,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ConnectService } from './connect.service';
import { ApiTags } from '@nestjs/swagger';

@Controller('gramadevata/connect')
@ApiTags('connect')
export class ConnectController {
  constructor(private readonly connectService: ConnectService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async list(@Query() query: Record<string, string | undefined>) {
    const result = await this.connectService.list(query);
    if (result.status !== 200) {
      throw new HttpException(result.body, result.status);
    }
    return result.body;
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getById(@Param('id') id: string) {
    const record = await this.connectService.getById(id);
    if (!record) {
      throw new NotFoundException({ message: 'Connection not found', status: 404 });
    }
    return record;
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @Body() payload: Record<string, unknown>,
    @Req() req: { user?: Record<string, unknown> },
  ) {
    const result = await this.connectService.create(payload, req.user);
    if (result.status !== 201) {
      throw new HttpException(result.body, result.status);
    }
    return result.body;
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async update(@Param('id') id: string, @Body() payload: Record<string, unknown>) {
    const updated = await this.connectService.update(id, payload);
    if (!updated) {
      throw new NotFoundException({ message: 'Connection not found', status: 404 });
    }
    return updated;
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async patchById(@Param('id') id: string, @Body() payload: Record<string, unknown>) {
    const updated = await this.connectService.update(id, payload);
    if (!updated) {
      throw new NotFoundException({ message: 'Connection not found', status: 404 });
    }
    return updated;
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string, @Req() req: { user?: Record<string, unknown> }) {
    const result = await this.connectService.remove(id, req.user);
    if (result.status !== 204) {
      throw new HttpException(result.body, result.status);
    }
  }
}
