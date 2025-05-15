import { Controller, Get, Res } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './common/decorator/customize';
import * as path from 'path';
import * as fs from 'fs';
import { Response } from 'express';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Public()
  getPDF(@Res() res: Response) {
  }
}
