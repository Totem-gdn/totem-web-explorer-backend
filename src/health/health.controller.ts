import { Controller, Get, Header } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Info')
@Controller('health')
export class HealthController {
  @Get()
  @Header('Cache-Control', 'none')
  @ApiResponse({
    status: 200,
    description: 'Server available status',
  })
  @ApiOperation({ summary: 'Get server available status' })
  health() {
    return {};
  }
}
