import { ObjectType, Field } from '@nestjs/graphql';
import { Content, User, ReactionType } from 'prisma/generated';
import { ContentModel } from 'src/modules/content/dto/content.model';
import { UserModel } from 'src/modules/user/dto/user.output';

@ObjectType()
export class ReactionModel {
  @Field()
  id: string;

  @Field(() => UserModel)
  user: User;

  @Field(() => ContentModel)
  content: Content;

  @Field(() => String)
  type: ReactionType;

  @Field(() => Date)
  createdAt: Date;
}