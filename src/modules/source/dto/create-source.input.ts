import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class CreateSourceInput {
  @Field()
  name: string;

  @Field()
  url: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  logoUrl?: string;
}

@InputType()
export class UpdateSourceInput {
  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  url?: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  logoUrl?: string;
}
