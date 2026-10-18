import { Extension } from '../domain-exceptions';
import { DomainExceptionCode } from '../domain-exception-codes';

export type ErrorResponseBody = {
  timestamp: string;
  path: string | null;
  message: string;
  extensions: Extension[];
  code: DomainExceptionCode;
};

//формат ошибки 400 из swagger домашки (APIErrorResult)
export type FieldError = {
  message: string;
  field: string;
};

export type APIErrorResult = {
  errorsMessages: FieldError[];
};
