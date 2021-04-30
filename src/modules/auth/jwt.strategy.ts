import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { SECRET } from './secret';

let a = 1;

export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: SECRET,
    });
  }

  async validate(payload: any) {
    a++;
    console.log('payload:', a, payload);
    return payload;
  }
}
