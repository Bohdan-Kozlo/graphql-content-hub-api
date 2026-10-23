import { ObjectType, Field } from '@nestjs/graphql';
import { Account } from './account.output';

@ObjectType()
export class AuthResponse {
  @Field()
  accessToken: string;

  @Field(() => Account)
  account: Account;
}
