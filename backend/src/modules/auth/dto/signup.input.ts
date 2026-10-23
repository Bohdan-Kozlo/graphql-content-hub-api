import { InputType, Field } from '@nestjs/graphql';
import { Transform } from 'class-transformer';
import type { TransformFnParams } from 'class-transformer';
import { IsEmail, IsString, Length, MinLength } from 'class-validator';

@InputType()
export class SignupInput {
  @Field()
  @Transform(
    ({ value }: TransformFnParams) => {
      const input: unknown = value;
      return typeof input === 'string' ? input.trim().toLowerCase() : input;
    },
    { toClassOnly: true },
  )
  @IsEmail()
  email: string;

  @Field()
  @Transform(
    ({ value }: TransformFnParams) => {
      const input: unknown = value;
      return typeof input === 'string' ? input.trim() : input;
    },
    { toClassOnly: true },
  )
  @IsString()
  @Length(2, 50)
  username: string;

  @Field()
  @IsString()
  @MinLength(8)
  password: string;
}
