import { ObjectType, Field } from '@nestjs/graphql';
import { Content, User } from '../../../../prisma/generated/client';
import { ContentModel } from '../../content/dto/content.model';
import { UserModel } from '../../user/dto/user.output';

@ObjectType()
export class ViewModel {
  @Field()
  id: string;

  @Field(() => UserModel, { nullable: true })
  user?: User;

  @Field(() => ContentModel)
  content: Content;

  @Field(() => Date)
  viewedAt: Date;

  @Field({ nullable: true })
  duration?: number;
}
