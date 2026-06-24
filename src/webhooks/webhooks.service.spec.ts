import { Test } from '@nestjs/testing';
import { Request, Response } from 'express';
import { clerkClient } from '@clerk/express';
import { verifyWebhook } from '@clerk/express/webhooks';

import { WebhooksService } from './webhooks.service';
import { PrismaService } from 'src/prisma/prisma.service';

jest.mock('@clerk/express', () => ({
  clerkClient: {
    users: {
      getUser: jest.fn(),
    },
  },
}));

jest.mock('@clerk/express/webhooks', () => ({
  verifyWebhook: jest.fn(),
}));

const mockVerifyWebhook = verifyWebhook as jest.Mock;
const mockGetUser = Reflect.get(clerkClient.users, 'getUser') as jest.Mock;

function createMockResponse(): { res: Response; sendStatus: jest.Mock } {
  const sendStatus = jest.fn();
  const res = { sendStatus } as unknown as Response;
  return { res, sendStatus };
}

describe('WebhooksService', () => {
  let service: WebhooksService;
  let prismaService: {
    user: {
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
      findUnique: jest.Mock;
    };
  };
  let mockUserCreate: jest.Mock;
  let mockUserUpdate: jest.Mock;
  let mockUserDelete: jest.Mock;
  let mockUserFindUnique: jest.Mock;

  const mockClerkUser = {
    fullName: 'John Doe',
    emailAddresses: [{ emailAddress: 'john@example.com' }],
  };

  const mockReq = () => ({}) as Request;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        WebhooksService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get(WebhooksService);
    prismaService = module.get(PrismaService);
    mockUserCreate = prismaService.user.create;
    mockUserUpdate = prismaService.user.update;
    mockUserDelete = prismaService.user.delete;
    mockUserFindUnique = prismaService.user.findUnique;

    jest.spyOn(service['logger'], 'error').mockImplementation(() => {});

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handleClerkWebhook', () => {
    describe('user.created', () => {
      it('creates the user in db and returns 204', async () => {
        const req = mockReq();
        const { res, sendStatus } = createMockResponse();

        mockVerifyWebhook.mockResolvedValue({
          type: 'user.created',
          data: { id: 'clerk_123' },
        });
        mockGetUser.mockResolvedValue(mockClerkUser);

        await service.handleClerkWebhook(req, res);

        expect(mockUserCreate).toHaveBeenCalledWith({
          data: {
            id: 'clerk_123',
            name: 'John Doe',
            email: 'john@example.com',
          },
        });
        expect(sendStatus).toHaveBeenCalledWith(204);
      });
    });

    describe('user.updated', () => {
      it('updates the user in db and returns 204 when user exists', async () => {
        const req = mockReq();
        const { res, sendStatus } = createMockResponse();

        mockVerifyWebhook.mockResolvedValue({
          type: 'user.updated',
          data: { id: 'clerk_123' },
        });
        mockGetUser.mockResolvedValue(mockClerkUser);
        mockUserFindUnique.mockResolvedValue({ id: 'clerk_123' });

        await service.handleClerkWebhook(req, res);

        expect(mockUserUpdate).toHaveBeenCalledWith({
          where: { id: 'clerk_123' },
          data: {
            name: 'John Doe',
            email: 'john@example.com',
          },
        });
        expect(sendStatus).toHaveBeenCalledWith(204);
      });

      it('returns 204 without updating when user does not exist', async () => {
        const req = mockReq();
        const { res, sendStatus } = createMockResponse();

        mockVerifyWebhook.mockResolvedValue({
          type: 'user.updated',
          data: { id: 'clerk_123' },
        });
        mockUserFindUnique.mockResolvedValue(null);

        await service.handleClerkWebhook(req, res);

        expect(mockGetUser).not.toHaveBeenCalled();
        expect(mockUserUpdate).not.toHaveBeenCalled();
        expect(sendStatus).toHaveBeenCalledWith(204);
      });
    });

    describe('user.deleted', () => {
      it('deletes the user and returns 204 when user exists', async () => {
        const req = mockReq();
        const { res, sendStatus } = createMockResponse();

        mockVerifyWebhook.mockResolvedValue({
          type: 'user.deleted',
          data: { id: 'clerk_123' },
        });
        mockUserFindUnique.mockResolvedValue({ id: 'clerk_123' });

        await service.handleClerkWebhook(req, res);

        expect(mockUserDelete).toHaveBeenCalledWith({
          where: { id: 'clerk_123' },
        });
        expect(sendStatus).toHaveBeenCalledWith(204);
      });

      it('returns 204 without deleting when user does not exist', async () => {
        const req = mockReq();
        const { res, sendStatus } = createMockResponse();

        mockVerifyWebhook.mockResolvedValue({
          type: 'user.deleted',
          data: { id: 'clerk_123' },
        });
        mockUserFindUnique.mockResolvedValue(null);

        await service.handleClerkWebhook(req, res);

        expect(mockUserDelete).not.toHaveBeenCalled();
        expect(sendStatus).toHaveBeenCalledWith(204);
      });
    });

    describe('error handling', () => {
      it('returns 400 when verifyWebhook throws', async () => {
        const req = mockReq();
        const { res, sendStatus } = createMockResponse();

        mockVerifyWebhook.mockRejectedValue(new Error('Invalid signature'));

        await service.handleClerkWebhook(req, res);

        expect(sendStatus).toHaveBeenCalledWith(400);
      });

      it('returns 400 when user id is missing from event data', async () => {
        const req = mockReq();
        const { res, sendStatus } = createMockResponse();

        mockVerifyWebhook.mockResolvedValue({
          type: 'user.created',
          data: {},
        });

        await service.handleClerkWebhook(req, res);

        expect(sendStatus).toHaveBeenCalledWith(400);
        expect(mockUserCreate).not.toHaveBeenCalled();
      });
    });
  });
});
