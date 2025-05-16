import { Test, TestingModule } from '@nestjs/testing';
import { RecentDocumentController } from './recent-document.controller';
import { RecentDocumentService } from './recent-document.service';

describe('RecentDocumentController', () => {
  let controller: RecentDocumentController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RecentDocumentController],
      providers: [RecentDocumentService],
    }).compile();

    controller = module.get<RecentDocumentController>(RecentDocumentController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
