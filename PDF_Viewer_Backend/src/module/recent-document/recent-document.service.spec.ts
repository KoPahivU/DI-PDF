import { Test, TestingModule } from '@nestjs/testing';
import { RecentDocumentService } from './recent-document.service';

describe('RecentDocumentService', () => {
  let service: RecentDocumentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RecentDocumentService],
    }).compile();

    service = module.get<RecentDocumentService>(RecentDocumentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
