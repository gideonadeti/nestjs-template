# Testing

## Overview

The template uses [Jest](https://jestjs.io/) for both unit tests (`*.spec.ts`) and e2e tests (`*.e2e-spec.ts`). Unit tests use `ts-jest` to compile TypeScript; e2e tests use a separate Jest config.

---

## Running tests

```bash
# Unit tests
pnpm test

# Unit tests with coverage
pnpm test:cov

# E2E tests
pnpm test:e2e

# Unit tests in watch mode
pnpm test:watch
```

## Unit tests

### Configuration (in `package.json`)

```json
{
  "jest": {
    "moduleNameMapper": {
      "^src/(.*)$": "<rootDir>/$1",
      "^(\\.{1,2}/.*)\\.js$": "$1"
    },
    "rootDir": "src",
    "testRegex": ".*\\.spec\\.ts$",
    "transform": { "^.+\\.ts$": "ts-jest" },
    "testEnvironment": "node"
  }
}
```

Note: the `.js` extension mapper is required because TypeScript's `nodenext` module resolution uses explicit `.js` extensions in imports, but Jest's resolver doesn't strip them automatically.

### Patterns

#### Mocking PrismaService

Use a mock object that mimics the Prisma client interface:

```ts
const mockPrismaService = {
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};
```

Pass it via the module's `providers` override:

```ts
const module = await Test.createTestingModule({
  providers: [
    UsersService,
    { provide: PrismaService, useValue: mockPrismaService },
  ],
}).compile();
```

#### Testing services

```ts
describe('UsersService', () => {
  let service: UsersService;
  let prisma: typeof mockPrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get(UsersService);
    prisma = module.get(PrismaService);
  });

  it('should create a user', async () => {
    const dto = { id: '1', name: 'Test', email: 'test@test.com' };
    mockPrismaService.user.create.mockResolvedValue(dto);
    expect(await service.create(dto)).toEqual(dto);
  });
});
```

#### Testing controllers

Mock the service and inject it:

```ts
const mockUsersService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

beforeEach(async () => {
  const module = await Test.createTestingModule({
    controllers: [UsersController],
    providers: [{ provide: UsersService, useValue: mockUsersService }],
  }).compile();

  controller = module.get(UsersController);
});
```

#### Testing guards

`ClerkAuthGuard` and `RolesGuard` both use the `Reflector` to check decorator metadata. Provide a mock execution context:

```ts
const mockReflector = {
  get: jest.fn(),
  getAllAndOverride: jest.fn(),
};

beforeEach(async () => {
  const module = await Test.createTestingModule({
    providers: [
      ClerkAuthGuard,
      RolesGuard,
      { provide: Reflector, useValue: mockReflector },
      { provide: PrismaService, useValue: mockPrismaService },
    ],
  }).compile();

  guard = module.get(ClerkAuthGuard);
});
```

For testing guard logic, create a mock `ExecutionContext`:

```ts
const mockContext = (userId: string | null) =>
  ({
    switchToHttp: () => ({
      getRequest: () => ({ auth: { userId } }),
    }),
    getHandler: () => null,
    getClass: () => null,
  }) as unknown as ExecutionContext;
```

## E2E tests

### Configuration (`test/jest-e2e.json`)

```json
{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": ".",
  "testEnvironment": "node",
  "testRegex": ".e2e-spec.ts$",
  "transform": { "^.+\\.(t|j)s$": "ts-jest" }
}
```

### Patterns

Create the app using `Test.createTestingModule` and override providers to avoid real database connections:

```ts
beforeAll(async () => {
  const moduleFixture = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(PrismaService)
    .useValue({})
    .compile();

  app = moduleFixture.createNestApplication();
  app.setGlobalPrefix('api/v1');
  await app.init();
});
```

Use Supertest for HTTP assertions:

```ts
it('GET /api/v1', () => {
  return request(app.getHttpServer())
    .get('/api/v1')
    .expect(200)
    .expect('Hello World!');
});
```

### Tips

- Always call `await app.close()` in `afterAll` to clean up
- Override any provider that makes external connections (database, Clerk API)
- Set up the global prefix in tests if the app uses one, or the routes will 404
