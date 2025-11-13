import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { ForgetPasswordDto } from '../authen/dto/forget-password.dto';
import { JwtUser } from 'src/modules/authen/auth.service';

// mock service
const mockUsersService = {
  findOne: jest.fn(),
  update: jest.fn(),
  changeEmail: jest.fn(),
  verifyNewEmail: jest.fn(),
  uploadAvatar: jest.fn(),
};

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;
  const mockUserId = 'user-123';
  // mock req.user
  const mockReq = { user: { _id: mockUserId } } as { user: JwtUser };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();
    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // getMe
  describe('getMe', () => {
    it('should call service.findOne ', async () => {
      const mockUser = { _id: mockUserId, email: 'a@b.com' };
      mockUsersService.findOne.mockResolvedValue(mockUser);
      const result = await controller.getMe(mockReq);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.findOne).toHaveBeenCalledWith(mockUserId);
      expect(result).toEqual(mockUser);
    });
  });

  // updateMe
  describe('updateMe', () => {
    it('should call service.update', async () => {
      const updateDto = { name: 'newname' } as UpdateUserDto;
      const expectedResult = {
        message: 'update user successfully',
        data: 'newname@email.com',
      };
      mockUsersService.update.mockResolvedValue(expectedResult);
      const result = await controller.updateMe(mockReq, updateDto);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.update).toHaveBeenCalledWith(mockUserId, updateDto);
      expect(result).toEqual(expectedResult);
    });
  });

  // changeEmail
  describe('changeEmail', () => {
    it('should call service.changeEmail', async () => {
      const dto = { email: 'new@email.com' } as ForgetPasswordDto;
      const expectedResult = { message: 'link sent to new email' };
      mockUsersService.changeEmail.mockResolvedValue(expectedResult);
      const result = await controller.changeEmail(mockReq, dto);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.changeEmail).toHaveBeenCalledWith(mockUserId, dto);
      expect(result).toEqual(expectedResult);
    });
  });

  // -verifyEmail
  describe('verifyEmail', () => {
    it('should call service.verifyNewEmail with token', async () => {
      const mockToken = 'abc123xyz';
      const expectedResult = {
        message: 'Email updated successfully',
        data: 'new@email.com',
      };
      mockUsersService.verifyNewEmail.mockResolvedValue(expectedResult);
      const result = await controller.verifyEmail(mockToken);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.verifyNewEmail).toHaveBeenCalledWith(mockToken);
      expect(result).toEqual(expectedResult);
    });
  });

  // uploadAvatar
  describe('uploadAvatar', () => {
    it('should call service.uploadAvatar', async () => {
      const mockFile = {
        buffer: Buffer.from('fake-image-data'),
      } as Express.Multer.File;
      const expectedResult = {
        message: 'upload avatar successfully',
        url: 'http://.../avatar.jpg',
      };
      mockUsersService.uploadAvatar.mockResolvedValue(expectedResult);
      const result = await controller.uploadAvatar(mockFile, mockReq);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.uploadAvatar).toHaveBeenCalledWith(mockFile, mockUserId);
      expect(result).toEqual(expectedResult);
    });
  });
});
