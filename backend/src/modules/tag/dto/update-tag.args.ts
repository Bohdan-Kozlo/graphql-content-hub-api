import { ArgsType, Field } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { IdArgs } from '../../../common/dto/graphql-args';
import { UpdateTagInput } from './create-tag.input';

@ArgsType()
export class UpdateTagArgs extends IdArgs {
  @Field(() => UpdateTagInput)
  @Type(() => UpdateTagInput)
  @ValidateNested()
  data: UpdateTagInput;
}
