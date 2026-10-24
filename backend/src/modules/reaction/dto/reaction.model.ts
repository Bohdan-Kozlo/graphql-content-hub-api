import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class ContentReactionStateModel {
  @Field()
  contentId: string;

  @Field()
  liked: boolean;

  @Field()
  saved: boolean;

  @Field(() => Int)
  likeCount: number;
}
