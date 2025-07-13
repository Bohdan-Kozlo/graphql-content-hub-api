import { ObjectType, Field, registerEnumType } from '@nestjs/graphql';
import { Content, Role, Comment } from 'prisma/generated';
import { CommentModel } from 'src/modules/comment/dto/comment.model';
import { ContentModel } from 'src/modules/content/dto/content.model';

@ObjectType()
export class UserModel {
  @Field()
  id: string;

  @Field()
  email: string;

  @Field()
  username: string;

  @Field({ nullable: true })
  bio?: string;

  @Field({ nullable: true })
  avatarUrl?: string;

  @Field(() => [Role])
  roles: Role[];

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field(() => [ContentModel])
  contents: Content[];

  @Field(() => [CommentModel])
  comments: Comment[];
}

registerEnumType(Role, { name: 'Role' });
