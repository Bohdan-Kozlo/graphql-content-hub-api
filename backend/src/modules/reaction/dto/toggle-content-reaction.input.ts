import { Field, InputType, registerEnumType } from '@nestjs/graphql';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { ReactionType } from '../../../../prisma/generated/client';

registerEnumType(ReactionType, { name: 'ContentReactionType' });

@InputType()
export class ToggleContentReactionInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  contentId: string;

  @Field(() => ReactionType)
  @IsEnum(ReactionType)
  type: ReactionType;
}
