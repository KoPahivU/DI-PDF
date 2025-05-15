import { Test, TestingModule } from '@nestjs/testing';
import { PdfFilesService } from './pdf-files.service';

describe('PdfFilesService', () => {
  let service: PdfFilesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PdfFilesService],
    }).compile();

    service = module.get<PdfFilesService>(PdfFilesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
