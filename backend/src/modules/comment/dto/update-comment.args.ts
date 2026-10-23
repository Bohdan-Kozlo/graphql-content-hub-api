import { ArgsType, Field } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { IdArgs } from '../../../common/dto/graphql-args';
import { UpdateCommentInput } from './create-comment.input';

@ArgsType()
export class UpdateCommentArgs extends IdArgs {
  @Field(() => UpdateCommentInput)
  @Type(() => UpdateCommentInput)
  @ValidateNested()
  data: UpdateCommentInput;
}
