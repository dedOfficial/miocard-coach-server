import { Operator } from './../modules/operator/models/operator.model';

declare module 'express' {
  interface Request {
    user: Operator & { phone: string };
  }
}

type Dictionary<T> = Record<string, T>;
