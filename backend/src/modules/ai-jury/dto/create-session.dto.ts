import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';

export class CreateSessionDto {
  @IsNotEmpty()
  @IsString()
  hackathonId: string;

  @IsOptional()
  @IsObject()
  eligibilityCriteria?: {
    submissionDeadline?: boolean;
    repositoryAccess?: boolean;
    repositoryPublic?: boolean;
  };
}
