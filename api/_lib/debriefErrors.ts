export type DebriefErrorCode =
  | 'method_not_allowed'
  | 'payload_too_large'
  | 'invalid_payload'
  | 'config_missing'
  | 'rate_limited'
  | 'debrief_unavailable';

export class DebriefApiError extends Error {
  readonly code: DebriefErrorCode;
  readonly httpStatus: number;

  constructor(code: DebriefErrorCode, httpStatus: number, message?: string) {
    super(message ?? code);
    this.code = code;
    this.httpStatus = httpStatus;
  }
}
