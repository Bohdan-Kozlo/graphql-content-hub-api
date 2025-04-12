import { Field, Int, ObjectType, registerEnumType } from '@nestjs/graphql';
import { ContentType } from 'prisma/generated';
import { CategoryModel } from 'src/modules/category/dto/category.model';
import { CommentModel } from 'src/modules/comment/dto/comment.model';
import { SourceModel } from 'src/modules/source/dto/source.model';
import { TagModel } from 'src/modules/tag/dto/tag.model';
import { UserModel } from 'src/modules/user/dto/user.output';

@ObjectType()
export class ContentModel {
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

  @Field(() => UserModel)
  user: UserModel;

  @Field(() => SourceModel, { nullable: true })
  source?: SourceModel;

  @Field(() => CategoryModel, { nullable: true })
  category?: CategoryModel;

  @Field(() => [TagModel])
  tags: TagModel[];

  @Field(() => [CommentModel])
  comments: CommentModel[];
}

registerEnumType(ContentType, { name: 'ContentType' });
