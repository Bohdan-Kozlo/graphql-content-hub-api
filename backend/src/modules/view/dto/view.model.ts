import { ObjectType, Field } from '@nestjs/graphql';
import { Content } from '../../../../prisma/generated/client';
import { ContentModel } from '../../content/dto/content.model';
import { PublicAuthorModel } from '../../content/dto/public-author.model';

@ObjectType()
export class ViewModel {
  @Field()
  id: string;

  @Field(() => PublicAuthorModel, { nullable: true })
  user?: PublicAuthorModel;

  @Field(() => ContentModel)
  content: Content;

  @Field(() => Date)
  viewedAt: Date;

  @Field({ nullable: true })
  duration?: number;
}
