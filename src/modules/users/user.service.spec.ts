import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getModelToken } from '@nestjs/mongoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MailService } from '../mail/mail.service';
import { BadRequestException } from '@nestjs/common';
import { Model } from 'mongoose';
import { User } from './entities/user.schema';
import { Post } from '../post/entities/post.schema';
import { hashPswHelper } from 'src/ulti/helper'; // Đường dẫn alias

jest.mock('src/ulti/helper', () => ({
  hashPswHelper: jest.fn(),
}));

const mockSharpInstance = {
  resize: jest.fn().mockReturnThis(),
  jpeg: jest.fn().mockReturnThis(),
  toBuffer: jest.fn(),
};
jest.mock('sharp', () => jest.fn(() => mockSharpInstance));

//data
const mockUserDocument = {
  _id: 'newUserId',
  email: 'test@test.com',
  name: 'testname',
  isTwoFAenabled: false,
  twoFAsecret: 'some_secret',
  // Hàm save()
  save: jest.fn().mockResolvedValue({ _id: 'newUserId' }),
};

// mock User
const MockUserModel = jest.fn(() => mockUserDocument) as unknown as Model<User>;

Object.assign(MockUserModel, {
  exists: jest.fn(),
  find: jest.fn(),
  findById: jest.fn(),
  findOne: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  deleteOne: jest.fn(),
  updateMany: jest.fn(),
  create: jest.fn().mockResolvedValue(mockUserDocument),
});

// mock Post Model
const mockPostModel = {
  updateMany: jest.fn(),
};

const mockJwtService = {
  sign: jest.fn(),
  verify: jest.fn(),
};
const mockConfigService = {
  get: jest.fn(),
};
const mockMinioClient = {
  removeObject: jest.fn(),
  bucketExists: jest.fn(),
  makeBucket: jest.fn(),
  putObject: jest.fn(),
};
const mockCacheManager = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
};
const mockMailService = {
  sendEmailChangeEmail: jest.fn(),
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getModelToken(User.name), useValue: MockUserModel },
        { provide: getModelToken(Post.name), useValue: mockPostModel },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: 'MINIO_CLIENT', useValue: mockMinioClient },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
        { provide: MailService, useValue: mockMailService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);

    jest.clearAllMocks();
    (hashPswHelper as jest.Mock).mockClear();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  //create
  describe('create', () => {
    it('should create a new user successfully', async () => {
      // 1. Arrange: Giả lập email không tồn tại và password đã hash
      jest.spyOn(service, 'checkEmail').mockResolvedValue(false);
      (hashPswHelper as jest.Mock).mockResolvedValue('hashed_password');

      const createUserDto = {
        email: 'test@test.com',
        password: '123',
        name: 'newuser',
      };
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const result = await service.create(createUserDto as any);
      // Kiểm tra User Model đã được gọi đúng để tạo document
      expect(MockUserModel).toHaveBeenCalledWith({
        ...createUserDto,
        password: 'hashed_password',
      });
      expect(mockUserDocument.save).toHaveBeenCalled();
      expect(result.data).toEqual(mockUserDocument._id);
    });

    it('should throw Error if email existed', async () => {
      jest.spyOn(service, 'checkEmail').mockResolvedValue(true);
      const createUserDto = { email: 'test@test.com', password: '123' };
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await expect(service.create(createUserDto as any)).rejects.toThrow(
        BadRequestException,
      );
      expect(service.checkEmail).toHaveBeenCalledWith(createUserDto.email);
    });
  });

  // finOne
  describe('findOne', () => {
    const userId = '123';
    const cacheKey = `user_${userId}`;
    const fakeUser = { _id: userId, email: 'test@test.com' };

    it('should return user from cache', async () => {
      mockCacheManager.get.mockResolvedValue(fakeUser);
      const result = await service.findOne(userId);
      expect(result).toEqual(fakeUser);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(MockUserModel.findById).not.toHaveBeenCalled(); // Không gọi DB
    });

    it('should return user from db and set cache', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      (MockUserModel.findById as jest.Mock).mockResolvedValue(fakeUser);
      const result = await service.findOne(userId);
      expect(result).toEqual(fakeUser);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(MockUserModel.findById).toHaveBeenCalledWith(userId);
      expect(mockCacheManager.set).toHaveBeenCalledWith(cacheKey, fakeUser);
    });
  });

  // remove
  describe('remove', () => {
    it('should delete user and clear cache successfully', async () => {
      const userId = '123';
      (MockUserModel.deleteOne as jest.Mock).mockResolvedValue({
        deletedCount: 1,
      });
      const result = await service.remove(userId);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(MockUserModel.deleteOne).toHaveBeenCalledWith({ _id: userId });
      expect(mockCacheManager.del).toHaveBeenCalledWith(`user_${userId}`);
      expect(result).toEqual('delete this user successfully');
    });
  });

  // changeEmail
  describe('changeEmail', () => {
    const userId = '123';
    const dto = { email: 'new@email.com', language: 'en' };
    const user = { _id: userId, name: 'TestUser', email: 'old@email.com' };
    it('should send a link to new email successfully', async () => {
      // 1. Arrange
      (MockUserModel.findOne as jest.Mock).mockResolvedValue(null); // Email mới chưa tồn tại
      (MockUserModel.findById as jest.Mock).mockResolvedValue(user);

      mockJwtService.sign.mockReturnValue('mockToken');
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'JWT_CHANGEEMAIL_KEY') return 'JWT_SECRET';
        if (key === 'RESET_TOKEN_EXPIRED') return '1h';
      });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const result = await service.changeEmail(userId, dto as any);
      expect(mockJwtService.sign).toHaveBeenCalledWith(
        { _id: userId, email: dto.email },
        expect.any(Object),
      );
      expect(mockMailService.sendEmailChangeEmail).toHaveBeenCalled();
      expect(result.message).toEqual('link sent to new email');
    });

    it('should throw BadRequestException if new email already exists', async () => {
      (MockUserModel.findOne as jest.Mock).mockResolvedValue({});
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await expect(service.changeEmail(userId, dto as any)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
