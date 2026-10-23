import { Field, InputType, Int } from '@nestjs/graphql';
import { ContentType } from '../../../../prisma/generated/client';
import { IsArray, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

@InputType()
export class CreateContentInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  title: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  description: string;

  @Field(() => ContentType)
  @IsEnum(ContentType)
  type: ContentType;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  body?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  mediaUrl?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  duration?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  thumbnail?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  readTime?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  sourceId?: string;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tagIds?: string[];

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  categoryId?: string;
}
