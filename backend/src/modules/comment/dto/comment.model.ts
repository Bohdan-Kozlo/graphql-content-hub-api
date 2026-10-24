import { ObjectType, Field } from '@nestjs/graphql';
import { Comment, Content } from '../../../../prisma/generated/client';
import { ContentModel } from '../../content/dto/content.model';
import { PublicAuthorModel } from '../../content/dto/public-author.model';

@ObjectType()
export class CommentModel {
  @Field()
  id: string;

  @Field(() => ContentModel)
  content: Content;

  @Field(() => PublicAuthorModel)
  user: PublicAuthorModel;

  @Field(() => CommentModel, { nullable: true })
  parent?: Comment;

  @Field(() => [CommentModel], { nullable: true })
  replies?: Comment[];

  @Field()
  text: string;

  @Field()
  isDeleted: boolean;

  @Field(() => Date)
  createdAt: Date;
}
