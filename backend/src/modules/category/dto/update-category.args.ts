import { ArgsType, Field } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { IdArgs } from '../../../common/dto/graphql-args';
import { UpdateCategoryInput } from './update-category.input';

@ArgsType()
export class UpdateCategoryArgs extends IdArgs {
  @Field(() => UpdateCategoryInput)
  @Type(() => UpdateCategoryInput)
  @ValidateNested()
  data: UpdateCategoryInput;
}
