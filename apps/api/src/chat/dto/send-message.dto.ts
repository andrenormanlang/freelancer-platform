import { IsString, IsNotEmpty, IsOptional, IsUrl, ValidateIf } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendMessageDto {
  @ApiProperty({
    description: 'The message content',
    example: 'Hello, how are you?',
  })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({
    description: 'The unique ID for the message',
    example: 'uuid-1234',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  messageId: string;
  
  @ApiProperty({
    description: 'The URL of the attached file (if any)',
    example: 'https://res.cloudinary.com/example/image.jpg',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  @ValidateIf(o => o.fileUrl !== undefined)
  fileUrl?: string;
  
  @ApiProperty({
    description: 'The original name of the attached file',
    example: 'document.pdf',
    required: false,
  })
  @IsOptional()
  @IsString()
  @ValidateIf(o => o.fileName !== undefined)
  fileName?: string;
  
  @ApiProperty({
    description: 'The MIME type of the attached file',
    example: 'application/pdf',
    required: false,
  })
  @IsOptional()
  @IsString()
  @ValidateIf(o => o.fileType !== undefined)
  fileType?: string;
}
