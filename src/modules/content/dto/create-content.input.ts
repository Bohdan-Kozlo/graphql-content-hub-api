import { Field, InputType, Int } from '@nestjs/graphql';
import { ContentType } from 'prisma/generated';

@InputType()
export class CreateContentInput {
  @Field()
  title: string;

  @Field()
  description: string;

  @Field(() => ContentType)
  type: ContentType;

  @Field({ nullable: true })
  body?: string;

  @Field({ nullable: true })
  mediaUrl?: string;

  @Field(() => Int, { nullable: true })
  duration?: number;

  @Field({ nullable: true })
  thumbnail?: string;

  @Field(() => Int, { nullable: true })
  readTime?: number;

  @Field({ nullable: true })
  sourceId?: string;

  @Field(() => [String], { nullable: true })
  tagIds?: string[];

  @Field(() => [String], { nullable: true })
  categoryIds?: string[];
}
