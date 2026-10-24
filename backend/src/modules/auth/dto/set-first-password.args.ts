import { ArgsType, Field } from '@nestjs/graphql';
import { IsString, MinLength } from 'class-validator';

@ArgsType()
export class SetFirstPasswordArgs {
  @Field()
  @IsString()
  @MinLength(8)
  password: string;
}
