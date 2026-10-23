import { ArgsType, Field } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { IdArgs } from '../../../common/dto/graphql-args';
import { UpdateContentInput } from './update-content.input';

@ArgsType()
export class UpdateContentArgs extends IdArgs {
  @Field(() => UpdateContentInput)
  @Type(() => UpdateContentInput)
  @ValidateNested()
  data: UpdateContentInput;
}
