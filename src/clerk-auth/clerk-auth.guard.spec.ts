import { getAuth, clerkClient } from '@clerk/express';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { ClerkAuthGuard } from './clerk-auth.guard';
import { PrismaService } from 'src/prisma/prisma.service';

jest.mock('@clerk/express', () => ({
  getAuth: jest.fn(),
  clerkClient: {
    users: {
      getUser: jest.fn(),
    },
  },
}));

const mockGetUser = Reflect.get(clerkClient.users, 'getUser') as jest.Mock;

describe('ClerkAuthGuard', () => {
  let guard: ClerkAuthGuard;
  let mockReflector: { getAllAndOverride: jest.Mock };
  let userFindUnique: jest.Mock;
  let userCreate: jest.Mock;

  const createExecutionContext = (request: unknown): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    }) as ExecutionContext;

  beforeEach(() => {
    userFindUnique = jest.fn();
    userCreate = jest.fn();
    mockReflector = { getAllAndOverride: jest.fn().mockReturnValue(false) };

    guard = new ClerkAuthGuard(
      {
        user: { findUnique: userFindUnique, create: userCreate },
      } as unknown as PrismaService,
      mockReflector as unknown as Reflector,
    );

    jest.clearAllMocks();
  });

  it('should allow request when userId exists and user already in db', async () => {
    (getAuth as jest.Mock).mockReturnValue({ userId: 'user_123' });
    userFindUnique.mockResolvedValue({ id: 'user_123' });
    const request = {};
    const context = createExecutionContext(request);

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(getAuth).toHaveBeenCalledWith(request);
    expect(userFindUnique).toHaveBeenCalledWith({
      where: { id: 'user_123' },
      select: { id: true },
    });
    expect(mockGetUser).not.toHaveBeenCalled();
  });

  it('should create user from Clerk when userId exists but not in db', async () => {
    const mockClerkUser = {
      fullName: 'John Doe',
      username: 'johndoe',
      primaryEmailAddress: { emailAddress: 'john@example.com' },
      emailAddresses: [{ emailAddress: 'john@example.com' }],
    };

    (getAuth as jest.Mock).mockReturnValue({ userId: 'user_123' });
    userFindUnique.mockResolvedValue(null);
    mockGetUser.mockResolvedValue(mockClerkUser);
    const request = {};
    const context = createExecutionContext(request);

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(userCreate).toHaveBeenCalledWith({
      data: {
        id: 'user_123',
        name: 'John Doe',
        email: 'john@example.com',
      },
    });
  });

  it('should deny request when userId is null', async () => {
    (getAuth as jest.Mock).mockReturnValue({ userId: null });
    const request = {};
    const context = createExecutionContext(request);

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
    expect(getAuth).toHaveBeenCalledWith(request);
    expect(userFindUnique).not.toHaveBeenCalled();
  });

  it('should allow request when route is public', async () => {
    mockReflector.getAllAndOverride.mockReturnValue(true);
    const context = createExecutionContext({});

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(getAuth).not.toHaveBeenCalled();
    expect(userFindUnique).not.toHaveBeenCalled();
  });
});
