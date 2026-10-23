import { ArgsType, Field } from '@nestjs/graphql';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { ReactionType } from '../../../../prisma/generated/client';

@ArgsType()
export class HasUserReactedArgs {
  @Field()
  @IsString()
  @IsNotEmpty()
  contentId: string;

  @Field(() => String)
  @IsEnum(ReactionType)
  type: ReactionType;
}
