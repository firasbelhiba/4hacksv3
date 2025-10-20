import { IsString, IsNotEmpty, IsOptional, IsDateString, IsArray, ValidateNested, IsNumber, Min, Max, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

class TrackDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsOptional()
  @IsString()
  prize?: string;

  @IsOptional()
  @IsNumber()
  order?: number;

  @IsOptional()
  @IsArray()
  eligibilityCriteria?: string[];
}

class BasicInfoDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  organizationName: string;

  @IsOptional()
  @IsString()
  prizePool?: string;

  @IsOptional()
  @IsString()
  bannerImage?: string;
}

class ScheduleDto {
  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsDateString()
  registrationDeadline?: string;

  @IsOptional()
  @IsDateString()
  evaluationPeriodEnd?: string;

  @IsOptional()
  @IsDateString()
  resultAnnouncementDate?: string;

  @IsOptional()
  @IsString()
  timezone?: string;
}

class TracksWrapperDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TrackDto)
  tracks: TrackDto[];
}

export class CreateHackathonDto {
  @ValidateNested()
  @Type(() => BasicInfoDto)
  basicInfo: BasicInfoDto;

  @ValidateNested()
  @Type(() => ScheduleDto)
  schedule: ScheduleDto;

  @ValidateNested()
  @Type(() => TracksWrapperDto)
  tracks: TracksWrapperDto;

  @IsOptional()
  @IsObject()
  settings?: any;
}

