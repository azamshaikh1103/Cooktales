import { Transform } from 'class-transformer';
import { IsEmail } from 'class-validator';

const normalizeEmail = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

export class SubscribeNewsletterDto {
  @Transform(normalizeEmail)
  @IsEmail()
  email!: string;
}
