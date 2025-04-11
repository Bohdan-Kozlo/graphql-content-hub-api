import { Resolver } from '@nestjs/graphql';
import { SourceService } from './source.service';

@Resolver()
export class SourceResolver {
  constructor(private readonly sourceService: SourceService) {}
}
