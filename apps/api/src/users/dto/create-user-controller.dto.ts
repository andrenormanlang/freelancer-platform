import {
  isArray,
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Skill } from '../../skills/entities/skill.entity';
import { UserRole } from '../enums/user-role.enum';

export class CreateUserControllerDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'The email address of the user',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'freelancer',
    description: 'The role of the user (freelancer or employer)',
    enum: UserRole,
  })
  @IsEnum(UserRole, { message: 'Role must be either freelancer or employer' })
  role: UserRole;

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: 'Avatar image file',
  })
  @IsOptional()
  avatarUrl?: string;

  @ApiProperty({
    example: 'StrongPassword123!',
    description: 'The password for the user account',
  })
  @IsString({ message: 'Password must be a string' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(
    /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+[\]{};':"\\|,.<>/?`~])[A-Za-z\d!@#$%^&*()_+[\]{};':"\\|,.<>/?`~]{8,}$/,
    {
      message:
        'Password must be at least 8 characters long and contain at least one letter, one number, and one special character',
    }
  )
  password: string;

  @ApiPropertyOptional({
    type: 'array',
    items: { type: 'string', format: 'binary' },
    description: 'Array of image files',
  })
  @IsOptional()
  @IsArray()
  skillImageUrls?: string[];

  @ApiProperty({
    example: 'JohnDoe',
    description: 'The username of the user',
  })
  @IsString()
  username: string;

  @ApiPropertyOptional({
    example: false,
    description: 'Indicates whether the user has administrative privileges',
  })
  @IsBoolean()
  @IsOptional()
  isAdmin: boolean = false;

  @ApiProperty({
    type: () => Skill,
    description: 'Skills associated with the user',
    isArray: true,
  })
  @IsOptional()
  @IsArray({ message: 'Skills must be an array of SkillDto objects' })
  @ValidateNested({ each: true })
  @Type(() => Skill)
  skills: Skill[];
}
