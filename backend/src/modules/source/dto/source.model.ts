import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class SourceModel {
  @Field()
  id: string;

  @Field()
  name: string;

  @Field()
  url: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  logoUrl?: string;
}
