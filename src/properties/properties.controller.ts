import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { Web3AuthGuard } from '../auth/guards/web3auth.guard';
import { PropertyRecord } from './interfaces/propertyRecord';

@Controller()
export class PropertiesController {
  constructor(private readonly messagesService: PropertiesService) {}

  @Get(':key')
  @UseGuards(new Web3AuthGuard(true))
  async list(@Param('key') key: string): Promise<PropertyRecord> {
    return await this.messagesService.getPropertyByKey(key);
  }
}
