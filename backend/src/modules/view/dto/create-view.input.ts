import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

@InputType()
export class CreateViewInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  contentId: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  requestId: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsNumber()
  duration?: number;
}
