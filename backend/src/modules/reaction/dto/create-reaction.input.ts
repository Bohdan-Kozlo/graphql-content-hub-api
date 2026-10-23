import { Field, InputType } from '@nestjs/graphql';
import { ReactionType } from '../../../../prisma/generated/client';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

@InputType()
export class CreateReactionInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  contentId: string;

  @Field(() => String)
  @IsEnum(ReactionType)
  type: ReactionType;
}

@InputType()
export class ToggleReactionInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  contentId: string;

  @Field(() => String)
  @IsEnum(ReactionType)
  type: ReactionType;
}
