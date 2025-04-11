import { InputType, Field, ID } from '@nestjs/graphql';

@InputType()
export class CreateCategoryInput {
  @Field()
  name: string;

  @Field(() => ID, { nullable: true })
  parentId?: string;
}
