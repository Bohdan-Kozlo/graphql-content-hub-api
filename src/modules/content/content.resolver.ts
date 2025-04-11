import { Resolver } from '@nestjs/graphql';
import { ContentService } from './content.service';

@Resolver()
export class ContentResolver {
  constructor(private readonly contentService: ContentService) {}
}
