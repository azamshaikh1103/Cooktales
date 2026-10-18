import { IsEmail, IsString, Length, MaxLength } from 'class-validator';

export class SendContactMessageDto {
  @IsString()
  @Length(2, 80)
  name!: string;

  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsString()
  @Length(5, 160)
  subject!: string;

  @IsString()
  @Length(10, 5000)
  message!: string;
}
