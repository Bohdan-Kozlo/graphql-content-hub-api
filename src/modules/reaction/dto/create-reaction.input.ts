import { Field, InputType } from '@nestjs/graphql';
import { ReactionType } from 'prisma/generated';

@InputType()
export class CreateReactionInput {
  @Field()
  contentId: string;

  @Field(() => String)
  type: ReactionType;
}

@InputType()
export class ToggleReactionInput {
  @Field()
  contentId: string;

  @Field(() => String)
  type: ReactionType;
}