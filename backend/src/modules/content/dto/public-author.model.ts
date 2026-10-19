import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class PublicAuthorModel {
  @Field()
  id: string;

  @Field()
  username: string;

  @Field({ nullable: true })
  bio?: string;

  @Field({ nullable: true })
  avatarUrl?: string;
}
