import { Controller, Get, Res } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './common/decorator/customize';
import * as path from 'path';
import * as fs from 'fs';
import { Response } from 'express';

@Controller('uploads')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Public()
  getPDF(@Res() res: Response) {
    const decodedFilename = decodeURIComponent('Vu, Le Hoang - DSV406 - May 12, 2025 - NDA.docx.pdf');
    const filePath = path.join(__dirname, '..', 'uploads', decodedFilename);

    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).send('File not found');
    }
  }
}
