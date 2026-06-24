import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  let service: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaService,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest
              .fn()
              .mockReturnValue('postgresql://localhost:5432/test'),
          },
        },
      ],
    }).compile();

    service = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should read DATABASE_URL from ConfigService on construction', () => {
    const configService = {
      getOrThrow: jest.fn().mockReturnValue('postgresql://localhost:5432/test'),
    };

    const s = new PrismaService(configService as unknown as ConfigService);

    expect(configService.getOrThrow).toHaveBeenCalledWith('DATABASE_URL');
    expect(s).toBeDefined();
  });
});
