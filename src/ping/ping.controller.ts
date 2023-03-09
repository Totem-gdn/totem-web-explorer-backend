import { Controller, Get } from '@nestjs/common';

@Controller()
export class PingController {
  @Get()
  async info() {
    return '0.4.0';
  }
}
