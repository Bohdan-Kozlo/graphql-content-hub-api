import { Field, ObjectType } from '@nestjs/graphql';
import { ContentModel } from './content.model';

@ObjectType()
export class ContentPageModel {
  @Field(() => [ContentModel])
  items: ContentModel[];

  @Field(() => String, { nullable: true })
  endCursor: string | null;

  @Field()
  hasMore: boolean;
}
