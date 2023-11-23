import { Injectable } from '@nestjs/common';
import * as FacebookTokenStrategy from 'passport-facebook-token';
import { use } from 'passport';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FacebookStrategy {
  constructor(private readonly configService: ConfigService) {
    this.init();
  }
  init() {
    use(
      new FacebookTokenStrategy(
        {
          clientID: this.configService.get<string>('facebook.id'),
          clientSecret: this.configService.get<string>('facebook.secret'),
        },
        async (
          accessToken: string,
          refreshToken: string,
          profile: any,
          done: any,
        ) => {
          const user = {
            name: profile.name.givenName,
            email: profile.emails[0].value,
            roles: profile.roles,
          };
          return done(null, user);
        },
      ),
    );
  }
}
