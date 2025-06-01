import { Test, TestingModule } from '@nestjs/testing';
import { RecentDocumentController } from './recent-document.controller';
import { RecentDocumentService } from './recent-document.service';
import { CreateRecentDocumentDto } from './dto/create-recent-document.dto';
import { PaginationDto2 } from '@/common/dto/pagination2.dto';
import { UpdateRecentDocumentDto } from './dto/update-recent-document.dto';

describe('RecentDocumentController', () => {
  let controller: RecentDocumentController;
  let service: RecentDocumentService;

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RecentDocumentController],
      providers: [{ provide: RecentDocumentService, useValue: mockService }],
    }).compile();

    controller = module.get<RecentDocumentController>(RecentDocumentController);
    service = module.get<RecentDocumentService>(RecentDocumentService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call service.create with fileId and userId', async () => {
      const dto: CreateRecentDocumentDto = { fileId: 'abc123' };
      const req = { user: { _id: 'user123' } };
      const mockResult = { fileId: dto.fileId, userId: req.user._id };

      mockService.create.mockResolvedValue(mockResult);

      const result = await controller.create(dto, req);

      expect(result).toEqual(mockResult);
      expect(mockService.create).toHaveBeenCalledWith(dto.fileId, req.user._id);
    });
  });

  describe('findAll', () => {
    it('should return paginated recent documents', async () => {
      const pagination: PaginationDto2 = { page: 1, limit: 10, isDesc: 'true' };
      const req = { user: { _id: 'user123' } };
      const mockResult = {
        returnData: [],
        totalRecords: 0,
        totalPages: 0,
      };

      mockService.findAll.mockResolvedValue(mockResult);

      const result = await controller.findAll(pagination, req);

      expect(result).toEqual(mockResult);
      expect(mockService.findAll).toHaveBeenCalledWith(pagination, req.user._id);
    });
  });

  describe('findOne', () => {
    it('should return a recent document by id', async () => {
      const id = '1';
      const mockResult = `This action returns a #${id} recentDocument`;

      mockService.findOne.mockReturnValue(mockResult);

      const result = controller.findOne(id);

      expect(result).toBe(mockResult);
      expect(mockService.findOne).toHaveBeenCalledWith(+id);
    });
  });

  describe('update', () => {
    it('should update a recent document by id', async () => {
      const id = '1';
      const updateDto: UpdateRecentDocumentDto = {
        /* fields if any */
      };
      const mockResult = `This action updates a #${id} recentDocument`;

      mockService.update.mockReturnValue(mockResult);

      const result = controller.update(id, updateDto);

      expect(result).toBe(mockResult);
      expect(mockService.update).toHaveBeenCalledWith(+id, updateDto);
    });
  });

  describe('remove', () => {
    it('should remove a recent document by id', async () => {
      const id = '1';
      const mockResult = `This action removes a #${id} recentDocument`;

      mockService.remove.mockReturnValue(mockResult);

      const result = controller.remove(id);

      expect(result).toBe(mockResult);
      expect(mockService.remove).toHaveBeenCalledWith(+id);
    });
  });
});
