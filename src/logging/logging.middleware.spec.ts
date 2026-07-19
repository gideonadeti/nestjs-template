import { LoggingMiddleware } from './logging.middleware.js';
import type { Request, Response, NextFunction } from 'express';

describe('LoggingMiddleware', () => {
  let middleware: LoggingMiddleware;

  beforeEach(() => {
    middleware = new LoggingMiddleware();
  });

  it('should be defined', () => {
    expect(middleware).toBeDefined();
  });

  it('should call next()', () => {
    const req = {
      id: undefined,
    } as unknown as Request;

    const res = {
      setHeader: jest.fn(),
    } as unknown as Response;

    const next = jest.fn() as NextFunction;

    middleware.use(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('should set x-request-id header from req.id', () => {
    const req = {
      id: 'test-request-id',
    } as unknown as Request;

    const setHeaderSpy = jest.fn();
    const res = {
      setHeader: setHeaderSpy,
    } as unknown as Response;

    middleware.use(req, res, jest.fn());

    expect(setHeaderSpy).toHaveBeenCalledWith(
      'x-request-id',
      'test-request-id',
    );
  });

  it('should set empty x-request-id header when req.id is undefined', () => {
    const req = {
      id: undefined,
    } as unknown as Request;

    const setHeaderSpy = jest.fn();
    const res = {
      setHeader: setHeaderSpy,
    } as unknown as Response;

    middleware.use(req, res, jest.fn());

    expect(setHeaderSpy).toHaveBeenCalledWith('x-request-id', '');
  });
});
