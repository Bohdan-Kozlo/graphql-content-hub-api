import { ObjectType, Field } from '@nestjs/graphql';
import { Content } from '../../../../prisma/generated/client';
import { ContentModel } from '../../content/dto/content.model';

@ObjectType()
export class TagModel {
  @Field()
  id: string;

  @Field()
  name: string;

  @Field(() => [ContentModel])
  contents: Content[];
}
