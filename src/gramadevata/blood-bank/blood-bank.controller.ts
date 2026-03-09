import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  NotFoundException,
  Param,
  Post,
  Put,
  Patch,
  Query,
  Req,
} from '@nestjs/common';
import { BloodBankService } from './blood-bank.service';
import { ApiTags } from '@nestjs/swagger';

@Controller('gramadevata')
@ApiTags('blood-bank')
export class BloodBankController {
  constructor(private readonly bloodBankService: BloodBankService) {}

  @Get('blood_bank')
  async list(@Query() query: Record<string, string | undefined>) {
    return this.bloodBankService.list(query);
  }

  @Get('blood_bank/:id')
  async getById(@Param('id') id: string) {
    const record = await this.bloodBankService.getById(id);
    if (!record) {
      throw new NotFoundException({ message: 'BloodBank not found', status: 404 });
    }
    return record;
  }

  @Post('blood_bank')
  async create(
    @Body() payload: Record<string, unknown>,
    @Req() req: { user?: Record<string, unknown> },
  ) {
    const result = await this.bloodBankService.create(payload, req.user);
    if (result.status !== 201) {
      throw new HttpException(result.body, result.status);
    }
    return result.body;
  }

  @Put('blood_bank/:id')
  async update(@Param('id') id: string, @Body() payload: Record<string, unknown>) {
    const updated = await this.bloodBankService.update(id, payload);
    if (!updated) {
      throw new NotFoundException({ message: 'BloodBank not found', status: 404 });
    }
    return updated;
  }

  @Patch('blood_bank/:id')
  async updatePartial(@Param('id') id: string, @Body() payload: Record<string, unknown>) {
    const updated = await this.bloodBankService.update(id, payload);
    if (!updated) {
      throw new NotFoundException({ message: 'BloodBank not found', status: 404 });
    }
    return updated;
  }

  @Delete('blood_bank/:id')
  @HttpCode(204)
  async remove(@Param('id') id: string) {
    const removed = await this.bloodBankService.remove(id);
    if (!removed) {
      throw new NotFoundException({ message: 'BloodBank not found', status: 404 });
    }
  }

  @Get('blood_banks_by_location')
  async listByLocation(@Query() query: Record<string, string | undefined>) {
    const result = await this.bloodBankService.listByLocation(query);
    if (result.status !== 200) {
      throw new HttpException(result.body, result.status);
    }
    return result.body;
  }

  @Put('bloodbank_merge/:blood_bank_id')
  async merge(
    @Param('blood_bank_id') id: string,
    @Body() payload: Record<string, unknown>,
  ) {
    const merged = await this.bloodBankService.merge(id, payload);
    if (!merged) {
      throw new NotFoundException({ message: 'Blood Bank not found', status: 404 });
    }
    return merged;
  }
}
