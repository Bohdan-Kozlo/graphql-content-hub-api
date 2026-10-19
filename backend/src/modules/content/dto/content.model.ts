import { Field, Int, ObjectType, registerEnumType } from '@nestjs/graphql';
import { ContentStatus, ContentType } from '../../../../prisma/generated/client';
import { CategoryModel } from '../../category/dto/category.model';
import { SourceModel } from '../../source/dto/source.model';
import { TagModel } from '../../tag/dto/tag.model';
import { PublicAuthorModel } from './public-author.model';

@ObjectType()
export class ContentModel {
  @Field()
  id: string;

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

  @Field(() => ContentStatus)
  status: ContentStatus;

  @Field(() => Date, { nullable: true })
  publishedAt?: Date;

  @Field(() => PublicAuthorModel)
  author: PublicAuthorModel;

  @Field(() => SourceModel, { nullable: true })
  source?: SourceModel;

  @Field(() => CategoryModel, { nullable: true })
  category?: CategoryModel;

  @Field(() => [TagModel])
  tags: TagModel[];
}

registerEnumType(ContentType, { name: 'ContentType' });
registerEnumType(ContentStatus, { name: 'ContentStatus' });
