import { LoggingMiddleware } from './logging.middleware';
import type { Request, Response, NextFunction } from 'express';

describe('LoggingMiddleware', () => {
  let middleware: LoggingMiddleware;

  beforeEach(() => {
    middleware = new LoggingMiddleware();
  });

  it('should be defined', () => {
    expect(middleware).toBeDefined();
  });

  it('should call next() and register finish listener', async () => {
    const req = {
      method: 'GET',
      originalUrl: '/test',
      protocol: 'http',
      header: jest.fn().mockReturnValue(undefined),
    } as unknown as Request;

    const onSpy = jest.fn();
    const setHeaderSpy = jest.fn();
    const res = {
      setHeader: setHeaderSpy,
      on: onSpy,
      statusCode: 200,
    } as unknown as Response;

    const next = jest.fn() as NextFunction;

    await middleware.use(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(onSpy).toHaveBeenCalledWith('finish', expect.any(Function));
  });

  it('should set x-request-id header when none is provided', async () => {
    const req = {
      method: 'GET',
      originalUrl: '/test',
      protocol: 'http',
      header: jest.fn().mockReturnValue(undefined),
    } as unknown as Request;

    const setHeaderSpy = jest.fn();
    const res = {
      setHeader: setHeaderSpy,
      on: jest.fn(),
      statusCode: 200,
    } as unknown as Response;

    await middleware.use(req, res, jest.fn());

    expect(setHeaderSpy).toHaveBeenCalledWith(
      'x-request-id',
      expect.any(String),
    );
  });

  it('should preserve an existing x-request-id header', async () => {
    const req = {
      method: 'GET',
      originalUrl: '/test',
      protocol: 'http',
      header: jest.fn().mockReturnValue('existing-id'),
    } as unknown as Request;

    const setHeaderSpy = jest.fn();
    const res = {
      setHeader: setHeaderSpy,
      on: jest.fn(),
      statusCode: 200,
    } as unknown as Response;

    await middleware.use(req, res, jest.fn());

    expect(setHeaderSpy).toHaveBeenCalledWith('x-request-id', 'existing-id');
  });
});
