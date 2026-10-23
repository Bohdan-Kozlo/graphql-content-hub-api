import { ArgsType, Field, Int } from '@nestjs/graphql';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { ContentType } from '../../../../prisma/generated/client';

@ArgsType()
export class PublishedContentsArgs {
  @Field(() => Int, { defaultValue: 12 })
  @IsInt()
  @Min(1)
  @Max(30)
  first: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  after?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  search?: string;

  @Field(() => ContentType, { nullable: true })
  @IsOptional()
  @IsEnum(ContentType)
  type?: ContentType;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  tagId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  authorId?: string;
}
