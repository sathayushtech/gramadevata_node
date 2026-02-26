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
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AddMoreVeterinaryHospitalService } from './add-more-veterinary-hospital.service';

@Controller('gramadevata/add_more_veterinary_hospital')
@ApiTags('add_more_veterinary_hospital')
export class AddMoreVeterinaryHospitalController {
  constructor(private readonly addMoreVeterinaryHospitalService: AddMoreVeterinaryHospitalService) {}

  @Get()
  async list(@Query() query: Record<string, string | undefined>) {
    return this.addMoreVeterinaryHospitalService.list(query);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const record = await this.addMoreVeterinaryHospitalService.getById(id);
    if (!record) {
      throw new NotFoundException('Object not found');
    }
    return record;
  }

  @Post()
  async create(
    @Body() payload: Record<string, unknown>,
    @Req() req: { user?: Record<string, unknown> }
  ) {
    const result = await this.addMoreVeterinaryHospitalService.create(payload, req.user);
    if (result.status !== 201) {
      throw new HttpException(result.body, result.status);
    }
    return result.body;
  }

  @Patch(':id')
  async patchById(
    @Param('id') id: string,
    @Body() payload: Record<string, unknown>
  ) {
    const updated = await this.addMoreVeterinaryHospitalService.update(id, payload);
    if (!updated) {
      throw new NotFoundException('Object not found');
    }
    return updated;
  }

  @Put(':id')
  async putById(
    @Param('id') id: string,
    @Body() payload: Record<string, unknown>
  ) {
    const updated = await this.addMoreVeterinaryHospitalService.update(id, payload);
    if (!updated) {
      throw new NotFoundException('Object not found');
    }
    return updated;
  }

  @Delete(':id')
  @HttpCode(204)
  async deleteById(@Param('id') id: string) {
    const removed = await this.addMoreVeterinaryHospitalService.remove(id);
    if (!removed) {
      throw new NotFoundException('Object not found');
    }
  }
}
