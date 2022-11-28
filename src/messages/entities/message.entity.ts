import { ApiProperty } from '@nestjs/swagger';

export class MessageEntity {
  @ApiProperty({ example: 'Update 0.12.3 b', description: 'The subject of the message' })
  subject: string;

  @ApiProperty({
    example: 'alarm',
    description: 'The type of the message',
  })
  type: string;

  @ApiProperty({ example: 'Lorem ipsum...', description: 'The message text' })
  message: string;

  @ApiProperty({ example: '1669315864474', description: 'The timestamp of publication' })
  date: string;

  @ApiProperty({ example: true, description: 'Marker is message read' })
  isRead: boolean;
}
