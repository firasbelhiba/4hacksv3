import { IsInt, Min, Max } from 'class-validator';

export class ExecuteLayerDto {
  @IsInt()
  @Min(1)
  @Max(4)
  layer: number;
}
