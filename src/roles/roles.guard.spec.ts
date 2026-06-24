import { Test } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { getAuth } from '@clerk/express';

import { RolesGuard } from './roles.guard';
import { PrismaService } from 'src/prisma/prisma.service';
import { IS_PUBLIC_KEY } from 'src/public/public.decorator';
import { UserRole } from '../generated/prisma/enums.js';
import { ROLES_KEY } from './roles.decorator';

jest.mock('@clerk/express', () => ({
  getAuth: jest.fn(),
}));

const mockGetAuth = getAuth as jest.Mock;

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let mockReflector: { getAllAndOverride: jest.Mock };
  let userFindUnique: jest.Mock;

  const mockExecutionContext = (request: object) =>
    ({
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    }) as ExecutionContext;

  beforeEach(async () => {
    mockReflector = { getAllAndOverride: jest.fn() };
    userFindUnique = jest.fn();

    const module = await Test.createTestingModule({
      providers: [
        RolesGuard,
        { provide: Reflector, useValue: mockReflector },
        {
          provide: PrismaService,
          useValue: { user: { findUnique: userFindUnique } },
        },
      ],
    }).compile();

    guard = module.get(RolesGuard);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('returns true when route is public', async () => {
    mockReflector.getAllAndOverride.mockImplementation((key: string) => {
      if (key === IS_PUBLIC_KEY) return true;
      return [UserRole.ADMIN];
    });

    const result = await guard.canActivate(mockExecutionContext({}));

    expect(result).toBe(true);
    expect(userFindUnique).not.toHaveBeenCalled();
    expect(mockGetAuth).not.toHaveBeenCalled();
  });

  it('returns true when no roles are required', async () => {
    mockReflector.getAllAndOverride.mockImplementation((key: string) => {
      if (key === IS_PUBLIC_KEY) return false;
      if (key === ROLES_KEY) return undefined;
      return undefined;
    });

    const result = await guard.canActivate(mockExecutionContext({}));

    expect(result).toBe(true);
    expect(userFindUnique).not.toHaveBeenCalled();
    expect(mockGetAuth).not.toHaveBeenCalled();
  });

  it('returns false when userId is null', async () => {
    mockReflector.getAllAndOverride.mockImplementation((key: string) => {
      if (key === IS_PUBLIC_KEY) return false;
      return [UserRole.ADMIN];
    });
    mockGetAuth.mockReturnValue({ userId: null });

    const result = await guard.canActivate(mockExecutionContext({}));

    expect(result).toBe(false);
    expect(userFindUnique).not.toHaveBeenCalled();
  });

  it('returns false when user does not exist', async () => {
    mockReflector.getAllAndOverride.mockImplementation((key: string) => {
      if (key === IS_PUBLIC_KEY) return false;
      return [UserRole.ADMIN];
    });
    mockGetAuth.mockReturnValue({ userId: 'clerk_123' });
    userFindUnique.mockResolvedValue(null);

    const result = await guard.canActivate(mockExecutionContext({}));

    expect(result).toBe(false);
    expect(userFindUnique).toHaveBeenCalledTimes(1);
    expect(userFindUnique).toHaveBeenCalledWith({
      where: { id: 'clerk_123' },
      select: { role: true },
    });
  });

  it('returns true when user role is allowed', async () => {
    mockReflector.getAllAndOverride.mockImplementation((key: string) => {
      if (key === IS_PUBLIC_KEY) return false;
      return [UserRole.ADMIN, UserRole.USER];
    });
    mockGetAuth.mockReturnValue({ userId: 'clerk_123' });
    userFindUnique.mockResolvedValue({ role: UserRole.USER });

    const result = await guard.canActivate(mockExecutionContext({}));

    expect(result).toBe(true);
  });

  it('returns false when user role is not allowed', async () => {
    mockReflector.getAllAndOverride.mockImplementation((key: string) => {
      if (key === IS_PUBLIC_KEY) return false;
      return [UserRole.ADMIN];
    });
    mockGetAuth.mockReturnValue({ userId: 'clerk_123' });
    userFindUnique.mockResolvedValue({ role: UserRole.USER });

    const result = await guard.canActivate(mockExecutionContext({}));

    expect(result).toBe(false);
  });
});
