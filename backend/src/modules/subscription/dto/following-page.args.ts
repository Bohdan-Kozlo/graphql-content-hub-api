import { ArgsType, Field, Int } from '@nestjs/graphql';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

@ArgsType()
export class FollowingPageArgs {
  @Field(() => Int, { defaultValue: 12 })
  @IsInt()
  @Min(1)
  @Max(30)
  first: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  after?: string;
}
