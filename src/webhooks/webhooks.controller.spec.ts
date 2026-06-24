import { Test } from '@nestjs/testing';
import { Request, Response } from 'express';

import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';

describe('WebhooksController', () => {
  let controller: WebhooksController;
  let service: { handleClerkWebhook: jest.Mock };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [WebhooksController],
      providers: [
        {
          provide: WebhooksService,
          useValue: {
            handleClerkWebhook: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(WebhooksService);
    controller = module.get(WebhooksController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('clerk', () => {
    it('delegates handleClerkWebhook to WebhooksService', () => {
      const req = {} as Request;
      const res = {} as Response;

      service.handleClerkWebhook.mockReturnValue('ok');

      const result = controller.handleClerkWebhook(req, res);

      expect(service.handleClerkWebhook).toHaveBeenCalledTimes(1);
      expect(service.handleClerkWebhook).toHaveBeenCalledWith(req, res);
      expect(result).toBe('ok');
    });
  });
});
