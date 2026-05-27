import { getAuth } from '@clerk/express';
import { ExecutionContext } from '@nestjs/common';

import { ClerkAuthGuard } from './clerk-auth.guard';

jest.mock('@clerk/express', () => ({
  getAuth: jest.fn(),
}));

describe('ClerkAuthGuard', () => {
  let guard: ClerkAuthGuard;

  const createExecutionContext = (request: unknown): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    }) as ExecutionContext;

  beforeEach(() => {
    guard = new ClerkAuthGuard();
    jest.clearAllMocks();
  });

  it('should allow request when userId exists', () => {
    (getAuth as jest.Mock).mockReturnValue({ userId: 'user_123' });
    const request = {};
    const context = createExecutionContext(request);

    const result = guard.canActivate(context);

    expect(result).toBe(true);
    expect(getAuth).toHaveBeenCalledWith(request);
  });

  it('should deny request when userId is null', () => {
    (getAuth as jest.Mock).mockReturnValue({ userId: null });
    const request = {};
    const context = createExecutionContext(request);

    const result = guard.canActivate(context);

    expect(result).toBe(false);
    expect(getAuth).toHaveBeenCalledWith(request);
  });
});
