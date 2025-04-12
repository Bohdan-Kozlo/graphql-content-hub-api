import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class CreateCommentInput {
  @Field()
  contentId: string;

  @Field()
  text: string;

  @Field({ nullable: true })
  parentId?: string;
}

@InputType()
export class UpdateCommentInput {
  @Field({ nullable: true })
  text?: string;
}
