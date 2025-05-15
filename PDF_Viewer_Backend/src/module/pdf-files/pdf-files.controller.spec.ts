import { Test, TestingModule } from '@nestjs/testing';
import { PdfFilesController } from './pdf-files.controller';
import { PdfFilesService } from './pdf-files.service';

describe('PdfFilesController', () => {
  let controller: PdfFilesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PdfFilesController],
      providers: [PdfFilesService],
    }).compile();

    controller = module.get<PdfFilesController>(PdfFilesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
