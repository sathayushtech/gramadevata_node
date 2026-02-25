import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags } from '@nestjs/swagger';

@Controller('gramadevata')
@ApiTags('Auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() payload: Record<string, unknown>): Promise<unknown> {
    return this.authService.requestOtp(payload);
  }

  @Post('verify')
  async verify(@Body() payload: Record<string, unknown>): Promise<unknown> {
    return this.authService.verifyOtp(payload);
  }
}
