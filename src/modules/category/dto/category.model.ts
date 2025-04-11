import { ObjectType, Field } from '@nestjs/graphql';
import { Category, Content } from 'prisma/generated';
import { ContentModel } from 'src/modules/content/dto/content.model';

@ObjectType()
export class CategoryModel {
  @Field()
  id: string;

  @Field()
  name: string;

  @Field(() => CategoryModel, { nullable: true })
  parent?: Category;

  @Field(() => [CategoryModel], { nullable: true })
  children?: Category[];

  @Field(() => [ContentModel])
  contents: Content[];
}
