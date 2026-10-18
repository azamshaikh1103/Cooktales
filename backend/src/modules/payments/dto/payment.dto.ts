import { IsIn } from 'class-validator';

export class CreateCheckoutDto {
  @IsIn(['monthly', 'yearly', 'lifetime'])
  plan!: 'monthly' | 'yearly' | 'lifetime';
}
