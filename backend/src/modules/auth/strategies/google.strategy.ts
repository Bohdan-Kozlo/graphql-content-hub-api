import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-google-oauth20';
import type { GoogleIdentity } from '../google-identity.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(config: ConfigService) {
    // The password flow remains available when a deployment has not configured Google.
    super({
      clientID: config.get<string>('GOOGLE_CLIENT_ID') || 'unconfigured',
      clientSecret: config.get<string>('GOOGLE_CLIENT_SECRET') || 'unconfigured',
      callbackURL: config.get<string>('GOOGLE_CALLBACK_URL') || 'http://127.0.0.1:3000/auth/google/callback',
    });
  }

  validate(_accessToken: string, _refreshToken: string, profile: Profile): GoogleIdentity {
    const email = profile.emails?.[0] as { value: string; verified?: boolean } | undefined;
    return {
      subject: profile.id,
      email: email?.value,
      verified: email?.verified === true,
      displayName: profile.displayName,
      avatarUrl: profile.photos?.[0]?.value,
    };
  }
}
