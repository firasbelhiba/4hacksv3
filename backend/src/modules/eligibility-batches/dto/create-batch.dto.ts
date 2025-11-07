import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';

export class CreateBatchDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsNotEmpty()
  projectIds: string[];

  @IsOptional()
  criteria?: any;
}
