import { Field, ObjectType } from '@nestjs/graphql';
import { Role } from '../../../../prisma/generated/client';

@ObjectType()
export class Account {
  @Field()
  id: string;

  @Field()
  email: string;

  @Field()
  username: string;

  @Field(() => [Role])
  roles: Role[];

  @Field()
  hasPassword: boolean;
}
