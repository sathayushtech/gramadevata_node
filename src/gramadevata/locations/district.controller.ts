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
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DistrictService } from './district.service';

@Controller('gramadevata/district')
@ApiTags('district')
export class DistrictController {
  constructor(private readonly districtService: DistrictService) {}

  @Get()
  async list(@Query() query: Record<string, string | undefined>) {
    const districts = await this.districtService.list(query);

    if (!districts || districts.length === 0) {
      throw new NotFoundException({
        message: 'Data not found',
        status: 404,
      });
    }

    return districts;
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const district = await this.districtService.getById(id);

    if (!district) {
      throw new NotFoundException(`District with id ${id} not found`);
    }

    return district;
  }

  @Post()
  async create(@Body() payload: Record<string, unknown>) {
    const result = await this.districtService.create(payload);

    if (result.status !== 201) {
      throw new HttpException(result.body, result.status);
    }

    return result.body;
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() payload: Record<string, unknown>) {
    const updated = await this.districtService.update(id, payload);

    if (!updated) {
      throw new NotFoundException(`District with id ${id} not found`);
    }

    return updated;
  }

  @Patch(':id')
  async patch(@Param('id') id: string, @Body() payload: Record<string, unknown>) {
    const updated = await this.districtService.update(id, payload);

    if (!updated) {
      throw new NotFoundException(`District with id ${id} not found`);
    }

    return updated;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string) {
    const deleted = await this.districtService.delete(id);

    if (!deleted) {
      throw new NotFoundException(`District with id ${id} not found`);
    }

    return;
  }
}
