import { Injectable, NotFoundException } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { PropertyRecord } from './interfaces/propertyRecord';
import { Properties, PropertyDocument } from './schemas/properties';

@Injectable()
export class PropertiesService {
  private limit = 10;
  constructor(
    @InjectModel(Properties.name)
    private readonly propertyModel: Model<PropertyDocument>,
  ) {}

  async getPropertyByKey(key: string): Promise<PropertyRecord> {
    const property = await this.propertyModel.findOne({ key: key });

    if (!property) {
      throw new NotFoundException('Not Found');
    }

    return this.toPropertyRecord(property);
  }

  private async toPropertyRecord(payload: PropertyDocument): Promise<PropertyRecord> {
    return {
      key: payload.key,
      value: payload.value,
    };
  }
}
