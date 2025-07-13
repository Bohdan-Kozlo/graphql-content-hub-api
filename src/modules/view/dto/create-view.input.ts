import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class CreateViewInput {
  @Field()
  contentId: string;

  @Field({ nullable: true })
  duration?: number;
}