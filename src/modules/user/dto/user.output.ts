import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class UserModel {
  @Field()
  id: string;

  @Field()
  email: string;

  @Field()
  username: string;

  @Field({ nullable: true })
  bio?: string;

  @Field({ nullable: true })
  avatarUrl?: string;

  @Field()
  role: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
