import { Controller, Get, Post, Body, UseGuards, Query, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from '@/common/decorator/customize';
import { CreateAuthDto } from './dto/create-auth.dto';
import { GoogleAuthGuard } from './guards/google-auth/google-auth.guard';
import { UseFilters } from '@nestjs/common';
import { UnauthorizedRedirectFilter } from './passport/unauthorized-exception.filter';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private jwtService: JwtService,
  ) {}

  @Post('login')
  @Public()
  async handleLogin(@Body() loginDto: LoginDto) {
    return await this.authService.login(loginDto);
  }

  @Post('register')
  @Public()
  register(@Body() registerDto: CreateAuthDto) {
    return this.authService.handleRegister(registerDto);
  }

  @Post('send-link')
  @Public()
  sendLink(@Body() registerDto: CreateAuthDto) {
    return this.authService.sendLink(registerDto);
  }

  @Post('verify-code')
  @Public()
  verifyCode(@Query() query: any) {
    return this.authService.verifyCode(query.codeId);
  }

  @Get('google/login')
  @Public()
  @UseGuards(GoogleAuthGuard)
  googleLogin() {}

  @Get('google/callback')
  @Public()
  @UseGuards(GoogleAuthGuard)
  @UseFilters(UnauthorizedRedirectFilter)
  async googleCallback(@Req() req, @Res() res) {
    console.log(req);
    if (!req.user) {
      console.log('Google authentication failed, redirecting to sign in...');
      return res.redirect(`${process.env.FE_URI}/auth/signin?error=default-account`);
    }
    const payload = { username: req.user.user.gmail, sub: req.user.user._id };
    const jwt = this.jwtService.sign(payload);
    console.log(`Redirecting to: ${process.env.FE_URI}/auth?token=${jwt}`);

    res.redirect(`${process.env.FE_URI}/auth/activate?token=${jwt}`);
  }
}
