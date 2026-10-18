import { ObjectType, Field } from '@nestjs/graphql';
import { Comment, Content, User } from '../../../../prisma/generated/client';
import { ContentModel } from '../../content/dto/content.model';
import { UserModel } from '../../user/dto/user.output';

@ObjectType()
export class CommentModel {
  @Field()
  id: string;

  @Field(() => ContentModel)
  content: Content;

  @Field(() => UserModel)
  user: User;

  @Field(() => CommentModel, { nullable: true })
  parent?: Comment;

  @Field(() => [CommentModel], { nullable: true })
  replies?: Comment[];

  @Field()
  text: string;

  @Field(() => Date)
  createdAt: Date;
}
