import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class AddXpDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsInt()
  @Min(1)
  amount: number;

  @IsString()
  @IsNotEmpty()
  reason: string;
}