import { IsEmail, IsOptional, IsString, IsStrongPassword, MinLength } from 'class-validator';

export class SignupDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsEmail()
  email!: string;

  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 0,
    minNumbers: 1,
    minSymbols: 0,
  })
  password!: string;

  @IsOptional()
  @IsString()
  turnstileToken?: string;
}

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsOptional()
  @IsString()
  turnstileToken?: string;
}

export class RefreshTokenDto {
  @IsOptional()
  @IsString()
  refreshToken?: string;
}

export class VerifyEmailDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  code!: string;
}

export class ResendVerificationDto {
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  turnstileToken?: string;
}

export class ForgotPasswordDto {
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  turnstileToken?: string;
}

export class ResetPasswordDto {
  @IsEmail()
  email!: string;

  @IsString()
  token!: string;

  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 0,
    minNumbers: 1,
    minSymbols: 0,
  })
  password!: string;
}

export class AdminMagicLinkRequestDto {
  @IsEmail()
  email!: string;
}

export class AdminMagicLinkConsumeDto extends AdminMagicLinkRequestDto {
  @IsString()
  @MinLength(32)
  token!: string;
}
