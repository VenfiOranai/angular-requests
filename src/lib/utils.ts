import { Observable, of } from 'rxjs';

export function ensureObservation<T>(obj: T | Observable<T>): Observable<T> {
  return obj instanceof Observable ? obj : of(obj);
}
