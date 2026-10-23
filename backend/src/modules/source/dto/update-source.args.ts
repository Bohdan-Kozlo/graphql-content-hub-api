import { ArgsType, Field } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { IdArgs } from '../../../common/dto/graphql-args';
import { UpdateSourceInput } from './create-source.input';

@ArgsType()
export class UpdateSourceArgs extends IdArgs {
  @Field(() => UpdateSourceInput)
  @Type(() => UpdateSourceInput)
  @ValidateNested()
  data: UpdateSourceInput;
}
