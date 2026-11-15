export type SkyErrorCode =
  | 'method_not_allowed'
  | 'invalid_date'
  | 'config_missing'
  | 'rate_limited'
  | 'nasa_timeout'
  | 'nasa_unavailable'
  | 'malformed_response'
  | 'sky_unavailable';

export class SkyApiError extends Error {
  readonly code: SkyErrorCode;
  readonly httpStatus: number;

  constructor(code: SkyErrorCode, httpStatus: number, message?: string) {
    super(message ?? code);
    this.code = code;
    this.httpStatus = httpStatus;
  }
}
