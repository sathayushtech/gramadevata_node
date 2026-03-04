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
import { PrayersAndBenefitsService } from './prayers-and-benefits.service';

@Controller('gramadevata/prayers_and_benefits')
@ApiTags('Prayers And Benefits')
export class PrayersAndBenefitsController {
  constructor(
    private readonly prayersService: PrayersAndBenefitsService,
  ) {}

  @Get()
  async list(@Query() query: Record<string, string | undefined>) {
    return this.prayersService.listActive(query);
  }

  @Post()
  async create(@Body() payload: Record<string, unknown>) {
    try {
      const result = await this.prayersService.create(payload);
      return { message: 'success', result };
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
    const instance = await this.prayersService.getActiveById(id);
    if (!instance) {
      return { message: 'Data not found', status: 404 };
    }
    return instance;
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() payload: Record<string, unknown>,
  ) {
    const updated = await this.prayersService.updateActive(id, payload);
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
    const updated = await this.prayersService.updateActive(id, payload);
    if (!updated) {
      throw new NotFoundException('Object not found');
    }
    return updated;
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string) {
    const deleted = await this.prayersService.removeActive(id);
    if (!deleted) {
      throw new NotFoundException('Object not found');
    }
  }
}
