import { IsString, IsEnum, IsOptional, IsObject } from 'class-validator';

export class CreateNotificationDto {
  @IsEnum(['success', 'warning', 'error', 'info'])
  type: 'success' | 'warning' | 'error' | 'info';

  @IsEnum(['system', 'evaluation', 'hackathon', 'project', 'performance'])
  category: 'system' | 'evaluation' | 'hackathon' | 'project' | 'performance';

  @IsString()
  title: string;

  @IsString()
  message: string;

  @IsOptional()
  @IsEnum(['low', 'medium', 'high', 'urgent'])
  priority?: 'low' | 'medium' | 'high' | 'urgent';

  @IsOptional()
  @IsObject()
  actionable?: {
    label: string;
    href: string;
  };

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
