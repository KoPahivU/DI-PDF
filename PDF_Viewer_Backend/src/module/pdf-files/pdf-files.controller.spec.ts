import { Test, TestingModule } from '@nestjs/testing';
import { PdfFilesController } from './pdf-files.controller';
import { PdfFilesService } from './pdf-files.service';
import { UserService } from '../user/user.service';
import { MailerService } from '@nestjs-modules/mailer';

describe('PdfFilesController', () => {
  let controller: PdfFilesController;
  let pdfFilesService: Partial<Record<keyof PdfFilesService, jest.Mock>>;
  let cacheManager: Partial<Cache>;
  let mailerService: Partial<MailerService>;

  const mockPdfFilesService = {
    uploadPdf: jest.fn(),
    getPdf: jest.fn(),
    setIsPublic: jest.fn(),
    addUserPermission: jest.fn(),
    addLinkPermission: jest.fn(),
    removeUserPermission: jest.fn(),
    removeLinkPermission: jest.fn(),
  };

  beforeEach(async () => {
    pdfFilesService = {
      uploadPdf: jest.fn(),
      getPdf: jest.fn(),
      setIsPublic: jest.fn(),
      addUserPermission: jest.fn(),
      addLinkPermission: jest.fn(),
      removeUserPermission: jest.fn(),
      removeLinkPermission: jest.fn(),
    };

    const mockCacheManager = {
      get: jest.fn(),
      set: jest.fn(),
    };

    mailerService = {
      sendMail: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PdfFilesController],
      providers: [
        { provide: PdfFilesService, useValue: pdfFilesService },
        { provide: 'CACHE_MANAGER', useValue: mockCacheManager },
        { provide: MailerService, useValue: mailerService },
      ],
    }).compile();

    controller = module.get<PdfFilesController>(PdfFilesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('uploadPdf', () => {});

  describe('getPdf', () => {
    it('should call pdfFiesService.getPdf and return file,owner,annotation,access permission data', async () => {
      const fileId = '1';
      const ownerId = '1';
      const annotationId = '1';
      const access = 'Owner';
      const req = {
        file: { _id: fileId },
        owner: { _id: ownerId },
        annotation: { _id: annotationId },
        access,
      };
      const mockPdfFile = {
        file: { _id: fileId, fileName: '123.pdf' },
        owner: { _id: ownerId, gmail: 'test@gmail.com' },
        annotation: { _id: annotationId, xfdf: '123testtest' },
        access,
      };
      mockPdfFilesService.getPdf.mockRejectedValue(mockPdfFile)

      // const result = await controller.getPdf(req)
    });
  });
});
