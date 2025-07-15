import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateAdminStatusDto {
  @ApiProperty({
    description: 'Admin active status',
    example: true,
  })
  @IsBoolean()
  isActive: boolean;
}
