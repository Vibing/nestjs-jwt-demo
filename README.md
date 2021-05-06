<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo_text.svg" width="320" alt="Nest Logo" /></a>
</p>

一般业务流程是：验证用户登录信息没问题后，会签发一个 token 给用户，用户之后的接口请求。

## 给用户签发 JWT

nest 中使用 @nestjs/jwt 来给用户签发 jwt

```shell
yarn add @nestjs/jwt
```

在 auth 模块中引入 jwt 模块

```typescript
// auth/auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

@Module({
  imports: [
    UsersModule,
    // 引入 Jwt 模块并配置秘钥和有效时长
    JwtModule.register({
      secretOrPrivateKey: 'll@feifei',
      signOptions: { expiresIn: '60s' }
    }),
  ],
  providers: [AuthService],
  exports: [AuthService],
  controllers: [AuthController]
})
export class AuthModule {}

```

在 auth.controller 中新建一个 login 路由用于用户登录

```typescript
import { Body, Controller, Post, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './auth.dto'

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/login')
  async getHello(@Body() data: LoginDto) {
    return await this.authService.login(data);
  }
}
```

再看看 service 中怎么使用 jwt

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
     // 引入 JwtService
    private readonly jwtService: JwtService,
  ) {}

  async login(data) {
    const { username, password } = data;
    const user = (await this.usersService.findOne(username))[0];
    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    if (user.password !== password) {
      throw new UnauthorizedException('密码不匹配');
    }

    const { id } = user;
    const payload = { id, username };
    // 生成token
    const token = this.signToken(payload);

    return {
      ...payload,
      token,
    };
  }

	signToken(data) {
    return this.jwtService.sign(data);
  }
}
```

现在使用请求`localhost:3000/login`

![](https://tva1.sinaimg.cn/large/008i3skNly1gq1r14hpkmj313d0f1760.jpg)

正常返回了当期登录信息 token,

接下来，按照登录流程，成功发放了 token 给前端后，前端在请求其他数据时需要把 token 给后端，后端经过审核 token 有效才会正常返回接口数据。

## 使用 Jwt 审核 token

一般情况下，前端把 token 放在请求头的 Authorization 字段中，使用 `Authorization = 'Bearer tokenString'`的方式请求数据

passport 是一个非常好的处理 jwt 的包，在 nestjs 中使用 passport-jwt 策略来完成 token 的安检，现在我们来添加这个策略：

在 auth/jwt.strategy.ts 中添加 JwtStrategy 策略，需要继承 PassportStrategy(Strategy) ，注意：Strategy 是 passport-jwt 包里的

```typescript
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy, VerifiedCallback } from 'passport-jwt';
import { SECRET } from './secret';

export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      // 配置从头信息里获取token
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // 忽略过期: false
      ignoreExpiration: false,
      // secret必须与签发jwt的secret一样
      secretOrKey: SECRET,
    });
  }

  // 实现 validate，在该方法中验证 token 是否合法
  async validate(payload: any) {
    console.log('payload:', payload);
    return payload;
  }
}
```

写好 jwt 策略后，需要在模块中引入 PassportModule，在 providers 中加入 JwtStrategy，否则无法使用策略：

```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from '../users/users.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { SECRET } from './secret';

@Module({
  imports: [
    UsersModule,
    JwtModule.register({
      secret: SECRET,
      signOptions: { expiresIn: '60s' },
    }),
    // 引入并配置PassportModule
    PassportModule.register({
      defaultStrategy: 'jwt',
    }),
  ],
  controllers: [AuthController],
  // 引入JwtStrategy
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
```

现在添加一个路由来验证一下

```typescript
import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async getHello(@Body() data) {
    return await this.authService.login(data);
  }

  @Get('test')
  // 使用路由级守卫
  @UseGuards(AuthGuard())
  async test() {
    return 'test';
  }
}
```

需要注意的是，在路由中需要添加 @nestjs/passport 中的 AuthGuard 守卫，否则会直接请求到控制器里面，需要 AuthGuard 守卫来检测 jwt 是否合法，如果合法会放行到控制器中

看看结果：

![](https://tva1.sinaimg.cn/large/008i3skNly1gq1t129mmnj317p0c2402.jpg)

请求成功了，控制台也成功打印了 payload 信息：

```typescript
payload: { id: 2, username: 'admin', iat: 1619766245, exp: 1619766305 }
```

## 使用全局守卫处理 JWT

上文使用的是路由级别的守卫 使用 AuthGuard 来处理 JWT，但一般项目中，绝大多数接口都是要处理 JWT 的，如果每个接口都写上一遍无疑是一个较大的工程

所以我要使用全局的 AuthGuard 来完成这个功能，但也有些接口不需要 jwt 验证(比如 login、register)，所以我们不直接使用全局的 AuthGuard，而是创建一个新的守卫：

```typescript
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';import { Observable } from 'rxjs';@Injectable()export class JwtAuthGuard implements CanActivate {  canActivate(    context: ExecutionContext,  ): boolean | Promise<boolean> | Observable<boolean> {    return true;  }}
```

新建的守卫需要实现 CanActivate，这就遇到一个麻烦，怎么把 AuthGuard 拿进来使用呢？

仔细一想， AuthGuard 也是守卫，它内部已经实现了 CanActivate，现在我要用 AuthGuard 的功能，只需要让 JwtAuthGuard 来继承 AuthGuard() 就好了

```typescript
import { ExecutionContext, Injectable } from '@nestjs/common';import { AuthGuard } from '@nestjs/passport';import { Observable } from 'rxjs';@Injectable()export class JwtAuthGuard extends AuthGuard('jwt') {  canActivate(    context: ExecutionContext,  ): boolean | Promise<boolean> | Observable<boolean> {    const request = context.switchToHttp().getRequest();    const whitelist = ['/login'];    if (whitelist.find((url) => url === request.url)) {      return true;    }    return super.canActivate(context);  }}
```

代码中通过 request 拿到当前请求的 url，通过与白名单(whitelist)对比达到排除不需要 jwt 认证的接口，非白名单内的接口仍需要通过 super.canActivate(context)。 ps: 这里白名单的处理不全面，建议配合 [ path-to-regexp](https://github.com/pillarjs/path-to-regexp) 来使用

全局使用 JwtAuthGuard 有两种方式，一种在 app.module.ts 中通过 providers 注册全局提供者：

```json
providers: [    {      provide: APP_GUARD,      useClass: JwtAuthGuard,    }]
```

还有一种是在 main.js 中添加全局使用：

```typescript
app.useGlobalGuards(new JwtAuthGuard());
```

对于两种方式，官网上是这么说的：

![](https://tva1.sinaimg.cn/large/008i3skNly1gq1x3xmti5j310p0ojq6v.jpg)

相关链接：https://docs.nestjs.com/guards 

这里我们随便用哪种方式都能满足 ， Ps: 记得把路由级别的 AuthGuard 去掉~

## Installation

```bash
$ npm install
```
## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## License

Nest is [MIT licensed](LICENSE).
