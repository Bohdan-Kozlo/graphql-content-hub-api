import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class TagModel {
  @Field()
  id: string;

  @Field()
  name: string;
}
