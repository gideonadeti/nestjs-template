# Adding a new resource

This guide walks through adding a **Posts** resource as an example — from schema to endpoint.

---

## 1. Add the model to Prisma schema

Edit `prisma/schema.prisma`:

```prisma
model Post {
  id        String   @id @default(cuid())
  title     String
  content   String?
  published Boolean  @default(false)
  authorId  String
  author    User     @relation(fields: [authorId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

Run the migration and regenerate the client:

```bash
pnpm prisma migrate dev --name add_post_model
pnpm prisma generate
```

---

## 2. Scaffold the module

```bash
nest g res posts
```

Choose **REST API** and **Y** to generate CRUD entry points.

This creates:

```
src/posts/
├── posts.module.ts
├── posts.controller.ts
├── posts.service.ts
├── posts.controller.spec.ts
├── posts.service.spec.ts
├── dtos/
│   ├── create-post.dto.ts
│   └── update-post.dto.ts
└── entities/
    └── post.entity.ts
```

---

## 3. Update DTOs with validation

**`src/posts/dtos/create-post.dto.ts`**

```ts
import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePostDto {
  @ApiProperty({ example: 'My First Post' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Some content', required: false })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiProperty({ example: false, required: false, default: false })
  @IsBoolean()
  @IsOptional()
  published?: boolean;

  @ApiProperty({ example: 'user_abc123' })
  @IsString()
  @IsNotEmpty()
  authorId: string;
}
```

**`src/posts/dtos/update-post.dto.ts`**

```ts
import { PartialType } from '@nestjs/swagger';
import { CreatePostDto } from './create-post.dto';

export class UpdatePostDto extends PartialType(CreatePostDto) {}
```

---

## 4. Update the service

**`src/posts/posts.service.ts`**

```ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto } from './dtos/create-post.dto';
import { UpdatePostDto } from './dtos/update-post.dto';

@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreatePostDto) {
    return this.prisma.post.create({ data: dto });
  }

  findAll() {
    return this.prisma.post.findMany();
  }

  async findOne(id: string) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) throw new NotFoundException(`Post ${id} not found`);
    return post;
  }

  update(id: string, dto: UpdatePostDto) {
    return this.prisma.post.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.post.delete({ where: { id } });
  }
}
```

---

## 5. Update the controller with auth guards

**`src/posts/posts.controller.ts`**

```ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dtos/create-post.dto';
import { UpdatePostDto } from './dtos/update-post.dto';
import { ClerkAuthGuard } from '../clerk-auth/clerk-auth.guard';
import { RolesGuard } from '../roles/roles.guard';
import { Roles } from '../roles/roles.decorator';
import { Public } from '../public/public.decorator';
import { UserRole } from '../generated/prisma/enums';

@UseGuards(ClerkAuthGuard, RolesGuard)
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  create(@Body() dto: CreatePostDto) {
    return this.postsService.create(dto);
  }

  @Get()
  @Public()
  findAll() {
    return this.postsService.findAll();
  }

  @Get(':id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.postsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePostDto) {
    return this.postsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.postsService.remove(id);
  }
}
```

---

## 6. Update the module

If `PrismaModule` is not already imported (it is `@Global()`, so skip this step — it is automatically available).

Make sure `PostsModule` is imported in `AppModule` (`src/app.module.ts`):

```ts
@Module({
  imports: [
    ConfigModule.forRoot({ ... }),
    ThrottlerModule.forRoot({ ... }),
    PrismaModule,
    UsersModule,
    WebhooksModule,
    PostsModule,          // ← add this line
  ],
  ...
})
export class AppModule {}
```

---

## 7. Write unit tests

**`src/posts/posts.service.spec.ts`**

```ts
import { Test, TestingModule } from '@nestjs/testing';
import { PostsService } from './posts.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrismaService = {
  post: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

describe('PostsService', () => {
  let service: PostsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<PostsService>(PostsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
```

**`src/posts/posts.controller.spec.ts`**

```ts
import { Test, TestingModule } from '@nestjs/testing';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';

const mockPostsService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('PostsController', () => {
  let controller: PostsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PostsController],
      providers: [{ provide: PostsService, useValue: mockPostsService }],
    }).compile();

    controller = module.get<PostsController>(PostsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
```

---

## 8. Add e2e test (optional)

```ts
// test/posts.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Posts (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        post: {
          findMany: jest.fn().mockResolvedValue([]),
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  it('GET /api/v1/posts', () => {
    return request(app.getHttpServer())
      .get('/api/v1/posts')
      .expect(200)
      .expect([]);
  });

  afterAll(async () => {
    await app.close();
  });
});
```

---

## Summary

```
Schema → Migrate → Scaffold → DTOs → Service → Controller → Module → Test
```

Run the full validation suite when done:

```bash
pnpm lint && pnpm format:check && pnpm typecheck && pnpm test && pnpm build
```
