import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class CreateTagInput {
  @Field()
  name: string;
}

@InputType()
export class UpdateTagInput {
  @Field({ nullable: true })
  name?: string;
}