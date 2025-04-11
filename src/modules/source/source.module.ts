import { Module } from '@nestjs/common';
import { SourceService } from './source.service';
import { SourceResolver } from './source.resolver';

@Module({
  providers: [SourceResolver, SourceService],
})
export class SourceModule {}
