import { Observable, of } from 'rxjs';

export function sortObjectKeys(obj: Record<string, any>): Record<string, any> {
  const clone: Record<string, any> = {};
  const keys: string[] = Object.keys(obj);
  keys.sort().forEach((key: string) => clone[key] = obj[key]);
  return clone;
}

export function hashObject(obj: Record<string, any>): string {
  return JSON.stringify(sortObjectKeys(obj));
}

export function ensureObservation<T>(obj: T | Observable<T>): Observable<T> {
  return obj instanceof Observable ? obj : of(obj);
}
