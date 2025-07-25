import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class SignupInput {
  @Field()
  email: string;

  @Field()
  username: string;

  @Field()
  password: string;
}
