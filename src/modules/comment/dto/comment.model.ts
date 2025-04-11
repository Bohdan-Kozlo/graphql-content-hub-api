import { ObjectType, Field } from '@nestjs/graphql';
import { Comment, Content, User } from 'prisma/generated';
import { ContentModel } from 'src/modules/content/dto/content.model';
import { UserModel } from 'src/modules/user/dto/user.output';

@ObjectType()
export class CommentModel {
  @Field()
  id: string;

  @Field(() => ContentModel)
  content: Content;

  @Field(() => UserModel)
  user: User;

  @Field(() => CommentModel, { nullable: true })
  perent?: Comment;

  @Field(() => [CommentModel], { nullable: true })
  replies?: Comment[];

  @Field(() => Date)
  createdAt: Date;
}
