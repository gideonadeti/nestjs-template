import { Test, TestingModule } from '@nestjs/testing';

import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: {
    user: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get(UsersService);
    prisma = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('calls prisma.user.create with the DTO', async () => {
      const dto = {
        id: 'clerk_123',
        email: 'john@example.com',
        name: 'John Doe',
      };
      prisma.user.create.mockResolvedValue(dto);

      const result = await service.create(dto);

      expect(prisma.user.create).toHaveBeenCalledWith({ data: dto });
      expect(result).toEqual(dto);
    });
  });

  describe('findAll', () => {
    it('calls prisma.user.findMany and returns users', async () => {
      const users = [
        { id: 'clerk_123', email: 'john@example.com', name: 'John Doe' },
      ];
      prisma.user.findMany.mockResolvedValue(users);

      const result = await service.findAll();

      expect(prisma.user.findMany).toHaveBeenCalled();
      expect(result).toEqual(users);
    });
  });

  describe('findOne', () => {
    it('calls prisma.user.findUnique with the id', async () => {
      const user = {
        id: 'clerk_123',
        email: 'john@example.com',
        name: 'John Doe',
      };
      prisma.user.findUnique.mockResolvedValue(user);

      const result = await service.findOne('clerk_123');

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'clerk_123' },
      });
      expect(result).toEqual(user);
    });

    it('returns null when user is not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await service.findOne('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('calls prisma.user.update with id and DTO', async () => {
      const dto = { name: 'Jane' };
      const updated = {
        id: 'clerk_123',
        email: 'john@example.com',
        name: 'Jane',
      };
      prisma.user.update.mockResolvedValue(updated);

      const result = await service.update('clerk_123', dto);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'clerk_123' },
        data: dto,
      });
      expect(result).toEqual(updated);
    });
  });

  describe('remove', () => {
    it('calls prisma.user.delete with the id', async () => {
      const user = {
        id: 'clerk_123',
        email: 'john@example.com',
        name: 'John Doe',
      };
      prisma.user.delete.mockResolvedValue(user);

      const result = await service.remove('clerk_123');

      expect(prisma.user.delete).toHaveBeenCalledWith({
        where: { id: 'clerk_123' },
      });
      expect(result).toEqual(user);
    });
  });
});
