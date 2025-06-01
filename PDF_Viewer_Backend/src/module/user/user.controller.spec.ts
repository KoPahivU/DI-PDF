import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { CloudinaryService } from '@/common/cloudinary/cloudinary.service';
import { CreateUserDto } from './dto/create-user.dto';
import { mock } from 'node:test';
import { SearchFileDto } from './dto/search-file.dto';
import { PaginationDto } from '@/common/dto/pagination.dto';

describe('UserController', () => {
  let userController: UserController;
  let userService: UserService;

  const mockUserService = {
    create: jest.fn(),
    getProfile: jest.fn(),
    getUserInformation: jest.fn(),
    searchUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        { provide: UserService, useValue: mockUserService },
        { provide: CloudinaryService, useValue: {} },
      ],
    }).compile();

    userController = module.get<UserController>(UserController);
    userService = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(userController).toBeDefined();
  });

  describe('create', () => {
    it('should call userService.create and return created user', async () => {
      const dto: CreateUserDto = { gmail: 'test@gmail.com', fullName: 'Test User', password: '123456', avatar: '' };
      const mockResult = { user: { _id: '1', ...dto } };
      mockUserService.create.mockResolvedValue(mockResult);

      const result = await userController.create(dto);
      expect(result).toEqual(mockResult);
      expect(mockUserService.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('getProfile', () => {
    it('should call userService.getProfile and return user profile', async () => {
      const userId = '1';
      const req = { user: { _id: userId } };
      const mockUser = { _id: userId, gmail: 'user@gmail.com' };
      mockUserService.getProfile.mockResolvedValue(mockUser);

      const result = await userController.getProfile(req);
      expect(result).toEqual(mockUser);
      expect(mockUserService.getProfile).toHaveBeenCalledWith(userId);
    });
  });

  describe('getUserInformation', () => {
    it('should call userService.getUserInformation and return user information', async () => {
      const userId = '123';
      const mockUser = { _id: userId, gmail: 'user@gmail.com' };
      mockUserService.getUserInformation.mockResolvedValue(mockUser);
      const result = await userController.getUserInformation(userId);
      expect(result).toEqual(mockUser);
      expect(mockUserService.getUserInformation).toHaveBeenCalledWith(userId);
    });
  });

  describe('searchUser', () => {
    it('should call userService.searchUser and return one user item', async () => {
      const searchDto: SearchFileDto = { searchInput: 'test', fileId: 'file123' };
      const pagination: PaginationDto = { page: 1, limit: 10 };

      const mockResult = {
        user: [
          {
            _id: 'u1',
            gmail: 'test@example.com',
            fullName: 'Test User',
          },
        ],
        totalRecord: 1,
        totalPages: 1,
      };

      mockUserService.searchUser.mockResolvedValue(mockResult);

      const result = await userController.searchUser(searchDto, pagination);
      expect(result).toEqual(mockResult);
      expect(mockUserService.searchUser).toHaveBeenCalledWith(searchDto, pagination);
    });
  });
});
