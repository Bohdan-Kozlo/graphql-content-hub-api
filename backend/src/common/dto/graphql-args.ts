import { ArgsType, Field, Float } from '@nestjs/graphql';
import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

@ArgsType()
export class IdArgs {
  @Field()
  @IsString()
  @IsNotEmpty()
  id: string;
}

@ArgsType()
export class ContentIdArgs {
  @Field()
  @IsString()
  @IsNotEmpty()
  contentId: string;
}

@ArgsType()
export class NameArgs {
  @Field()
  @IsString()
  @IsNotEmpty()
  name: string;
}

@ArgsType()
export class LimitArgs {
  @Field(() => Float, { defaultValue: 10 })
  @IsInt()
  @Min(1)
  limit: number;
}
