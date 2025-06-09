import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallBack } from 'passport-google-oauth20';
import googleOauthConfig from '../config/google-oauth.config';
import { ConfigType } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { CloudinaryService } from '@/common/cloudinary/cloudinary.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(googleOauthConfig.KEY) private googleConfiguration: ConfigType<typeof googleOauthConfig>,
    private authService: AuthService,
    private readonly cloudinaryService: CloudinaryService,
  ) {
    super({
      clientID: googleConfiguration.clientId,
      clientSecret: googleConfiguration.clientSecret,
      callbackURL: googleConfiguration.callbackURL,
      scope: ['email', 'profile'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any, done: VerifyCallBack) {
    try {
      const email = profile.emails[0].value;
      const fullName = profile.name?.givenName || '';
      const avatarUrlFromGoogle = profile.photos?.[0]?.value || '';

      let avatarCloudinaryUrl = '';

      if (avatarUrlFromGoogle) {
        const uploadResult = await this.cloudinaryService.uploadImageFromUrl(avatarUrlFromGoogle);
        avatarCloudinaryUrl = uploadResult.secure_url;
      }

      const user = await this.authService.validateGoogleUser({
        gmail: email,
        fullName,
        avatar: avatarCloudinaryUrl,
      });
      done(null, user);
    } catch (error) {
      console.log('Google Auth Error:', error.message);
      return done(null, false);
    }
  }
}
