import { Module } from '@nestjs/common';
import { ContentService } from './content.service';
import { ContentResolver } from './content.resolver';
import { UserModule } from '../user/user.module';

@Module({
  providers: [ContentResolver, ContentService],
  imports: [UserModule],
})
export class ContentModule {}
