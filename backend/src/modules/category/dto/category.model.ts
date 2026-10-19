import { ObjectType, Field } from '@nestjs/graphql';
import { Category } from '../../../../prisma/generated/client';

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
}
