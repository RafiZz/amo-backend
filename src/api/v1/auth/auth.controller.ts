import { Controller, Get, Query } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('/api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('/code')
  async byCode(@Query('code') code?): Promise<any> {
    const response = await this.authService.auth({ code });
    return response;
  }

  @Get('/refresh')
  async login(@Query('refresh_token') refresh_token?): Promise<any> {
    const response = await this.authService.refresh({
      refresh_token,
    });
    return response;
  }
}
