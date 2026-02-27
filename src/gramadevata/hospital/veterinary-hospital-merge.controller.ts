import { Body, Controller, HttpException, NotFoundException, Param, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AddMoreVeterinaryHospitalService } from './add-more-veterinary-hospital.service';

@Controller('gramadevata')
@ApiTags('veterinary_hospital_merge')
export class VeterinaryHospitalMergeController {
  constructor(
    private readonly addMoreVeterinaryHospitalService: AddMoreVeterinaryHospitalService,
  ) {}

  @Put('veterinary_hospital_merge/:operator_id')
  async merge(
    @Param('operator_id') id: string,
    @Body() payload: Record<string, unknown>,
  ) {
    try {
      const merged = await this.addMoreVeterinaryHospitalService.merge(id, payload);
      if (!merged) {
        throw new NotFoundException({ message: 'Veterinary Hospital not found' });
      }
      return merged;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new HttpException(
        {
          message: 'Error occurred',
          error: error instanceof Error ? error.message : String(error),
        },
        500,
      );
    }
  }
}
