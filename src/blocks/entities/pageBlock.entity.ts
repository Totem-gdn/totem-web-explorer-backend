import { ApiProperty } from '@nestjs/swagger';

export class PageBlockEntity {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  data: object;
}
