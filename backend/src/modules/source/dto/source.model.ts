import { ObjectType, Field } from '@nestjs/graphql';
import { Content } from '../../../../prisma/generated/client';
import { ContentModel } from '../../content/dto/content.model';

@ObjectType()
export class SourceModel {
  @Field()
  id: string;

  @Field()
  name: string;

  @Field()
  url: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  logoUrl?: string;

  @Field(() => [ContentModel])
  content: [Content];
}
