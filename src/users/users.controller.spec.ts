import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CreateUserDto } from './dtos/create-user.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import { RolesGuard } from 'src/roles/roles.guard';
import { PrismaService } from 'src/prisma/prisma.service';

describe('UsersController', () => {
  let controller: UsersController;
  let service: {
    create: jest.Mock;
    findAll: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
        RolesGuard,
        { provide: Reflector, useValue: { getAllAndOverride: jest.fn() } },
        {
          provide: PrismaService,
          useValue: { user: { findUnique: jest.fn() } },
        },
      ],
    }).compile();

    service = module.get(UsersService);
    controller = module.get(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('delegates to service.create with the DTO', () => {
      const dto: CreateUserDto = {
        id: 'clerk_123',
        email: 'john@example.com',
        name: 'John Doe',
      };
      service.create.mockReturnValue('result');

      const result = controller.create(dto);

      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toBe('result');
    });
  });

  describe('findAll', () => {
    it('delegates to service.findAll', () => {
      service.findAll.mockReturnValue('result');

      const result = controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toBe('result');
    });
  });

  describe('findOne', () => {
    it('delegates to service.findOne with the id param', () => {
      service.findOne.mockReturnValue('result');

      const result = controller.findOne('clerk_123');

      expect(service.findOne).toHaveBeenCalledWith('clerk_123');
      expect(result).toBe('result');
    });
  });

  describe('update', () => {
    it('delegates to service.update with id and DTO', () => {
      const dto: UpdateUserDto = { name: 'Jane' };
      service.update.mockReturnValue('result');

      const result = controller.update('clerk_123', dto);

      expect(service.update).toHaveBeenCalledWith('clerk_123', dto);
      expect(result).toBe('result');
    });
  });

  describe('remove', () => {
    it('delegates to service.remove with the id param', () => {
      service.remove.mockReturnValue('result');

      const result = controller.remove('clerk_123');

      expect(service.remove).toHaveBeenCalledWith('clerk_123');
      expect(result).toBe('result');
    });
  });
});
