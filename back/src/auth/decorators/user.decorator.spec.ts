import 'reflect-metadata';
import { ExecutionContext } from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { GetUser } from './user.decorator';
import { User } from '../../users/entities/user.entity';

type CustomParamMetadata = {
  index: number;
  factory: (data: keyof User | undefined, ctx: ExecutionContext) => unknown;
  data: keyof User | undefined;
  pipes: unknown[];
};

describe('GetUser decorator', () => {
  const user = {
    id: 'user-id',
    email: 'client@u.icesi.edu.co',
    roles: ['CLIENT'],
  } as User;

  class TestController {
    getUser(_user?: User) {}
    getEmail(_email?: string) {}
    getMissing(_missing?: unknown) {}
  }

  GetUser()(TestController.prototype, 'getUser', 0);
  GetUser('email')(TestController.prototype, 'getEmail', 0);
  GetUser('missing' as keyof User)(TestController.prototype, 'getMissing', 0);

  const createExecutionContext = (requestUser?: unknown): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({
          user: requestUser,
        }),
      }),
    }) as unknown as ExecutionContext;

  const executeDecoratorFactory = (
    methodName: string,
    ctx: ExecutionContext,
  ) => {
    const routeArgsMetadata = Reflect.getMetadata(
      ROUTE_ARGS_METADATA,
      TestController,
      methodName,
    ) as Record<string, CustomParamMetadata>;

    const metadata = Object.values(routeArgsMetadata)[0];

    return metadata.factory(metadata.data, ctx);
  };

  it('debe retornar todo el usuario cuando no se pasa data', () => {
    const result = executeDecoratorFactory(
      'getUser',
      createExecutionContext(user),
    );

    expect(result).toEqual(user);
  });

  it('debe retornar solo la propiedad solicitada cuando se pasa data', () => {
    const result = executeDecoratorFactory(
      'getEmail',
      createExecutionContext(user),
    );

    expect(result).toBe('client@u.icesi.edu.co');
  });

  it('debe retornar undefined si no hay user en request', () => {
    const result = executeDecoratorFactory(
      'getEmail',
      createExecutionContext(undefined),
    );

    expect(result).toBeUndefined();
  });

  it('debe retornar undefined si se solicita una propiedad inexistente', () => {
    const result = executeDecoratorFactory(
      'getMissing',
      createExecutionContext(user),
    );

    expect(result).toBeUndefined();
  });
});
