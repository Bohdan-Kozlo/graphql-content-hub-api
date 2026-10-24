import { Module } from '@nestjs/common';
import { ContentModule } from '../content/content.module';
import { SubscriptionResolver } from './subscription.resolver';
import { SubscriptionService } from './subscription.service';

@Module({ imports: [ContentModule], providers: [SubscriptionResolver, SubscriptionService] })
export class SubscriptionModule {}
