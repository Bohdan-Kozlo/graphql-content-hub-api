import { ArgsType, Field } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

@ArgsType()
export class RequestPasswordResetArgs {
  @Field()
  @IsEmail()
  email: string;
}

@ArgsType()
export class ResetPasswordArgs {
  @Field()
  @IsString()
  @IsNotEmpty()
  token: string;

  @Field()
  @IsString()
  @MinLength(8)
  password: string;
}
