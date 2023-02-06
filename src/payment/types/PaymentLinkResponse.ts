import { ApiProperty } from '@nestjs/swagger';

export class PaymentLinkResponse {
  @ApiProperty()
  url: string;

  @ApiProperty()
  order: string;
}
