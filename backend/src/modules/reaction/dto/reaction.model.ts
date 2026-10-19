import { ObjectType, Field } from '@nestjs/graphql';
import { Content, ReactionType } from '../../../../prisma/generated/client';
import { ContentModel } from '../../content/dto/content.model';
import { PublicAuthorModel } from '../../content/dto/public-author.model';

@ObjectType()
export class ReactionModel {
  @Field()
  id: string;

  @Field(() => PublicAuthorModel)
  user: PublicAuthorModel;

  @Field(() => ContentModel)
  content: Content;

  @Field(() => String)
  type: ReactionType;

  @Field(() => Date)
  createdAt: Date;
}
