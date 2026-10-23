import { Field, InputType } from '@nestjs/graphql';
import { Transform } from 'class-transformer';
import type { TransformFnParams } from 'class-transformer';
import { IsOptional, IsString, IsUrl, Length, MaxLength, ValidateIf } from 'class-validator';

function trimOptionalText(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  return value.trim() || null;
}

@InputType()
export class UpdateOwnProfileInput {
  @Field(() => String, { nullable: true })
  @Transform(
    ({ value }: TransformFnParams) => {
      const input: unknown = value;
      return typeof input === 'string' ? input.trim() : input;
    },
    { toClassOnly: true },
  )
  @ValidateIf((_, value: unknown) => value !== undefined)
  @IsString()
  @Length(2, 50)
  username?: string;

  @Field(() => String, { nullable: true })
  @Transform(({ value }: TransformFnParams) => trimOptionalText(value), { toClassOnly: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string | null;

  @Field(() => String, { nullable: true })
  @Transform(({ value }: TransformFnParams) => trimOptionalText(value), { toClassOnly: true })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true, require_tld: false })
  avatarUrl?: string | null;
}
