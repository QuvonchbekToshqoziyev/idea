export interface StandardResponse<T> {
  data: T;
  meta?: Record<string, any>;
  timestamp: string;
}
