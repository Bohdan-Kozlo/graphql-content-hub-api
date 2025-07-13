import { ObjectType, Field } from '@nestjs/graphql';
import { Content, User } from 'prisma/generated';
import { ContentModel } from 'src/modules/content/dto/content.model';
import { UserModel } from 'src/modules/user/dto/user.output';

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
