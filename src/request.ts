import { Injectable } from '@angular/core';
import { RequestStore } from './request-store';
import { catchError, finalize, mergeMap, Observable, Subject, tap } from 'rxjs';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { RequestMethod } from './request-methods';
import { ensureObservation, hashObject } from './utils';

@Injectable()
export abstract class Request<Input, Output> extends Subject<RequestStore<Input, Output>> {
  private store: Map<string, RequestStore<Input, Output>> = new Map<string, RequestStore<Input, Output>>();

  private readonly staleTimer: number = 30000;

  protected constructor(private http: HttpClient) {
    super();
  }

  private fetchStore(dataKey: string): RequestStore<Input, Output> {
    if (!this.store.has(dataKey)) {
      this.store.set(dataKey, { key: dataKey, listener: new Subject<Output>(), isCacheInvalid: false, isCacheStale: true });
    }

    return this.store.get(dataKey)!;
  }

  protected abstract get requestMethod(): RequestMethod;
  protected abstract getUrl(_store: RequestStore<Input, Output>): string;
  protected abstract getBody(_store: RequestStore<Input, Output>): object | undefined;

  protected getParams(_store: RequestStore<Input, Output>): HttpParams {
    return new HttpParams();
  }

  protected getHeaders(_store: RequestStore<Input, Output>): HttpHeaders {
    return new HttpHeaders();
  }

  protected parseMethod(): (data: unknown) => Output | Observable<Output> {
    return (data: unknown) => data as Output;
  }

  protected handleError(err: HttpErrorResponse): Observable<Output> {
    throw err;
  }

  public send(input: Input, forceRequest: boolean = false): RequestStore<Input, Output> {
    const dataKey: string = typeof input === 'object' ? hashObject(input as Record<string, any>) : JSON.stringify(input);

    const store: RequestStore<Input, Output> = this.fetchStore(dataKey);
    store.latestRequest = input;

    if (!forceRequest && store.activeRequest) {
      return store;
    }

    if (store.latestResponse) {
      setTimeout(() => store.listener.next(store.latestResponse!));
    }

    if (forceRequest || store.isCacheStale) {
      this.makeRequest(store);
    }

    return store;
  }

  public refresh(store: RequestStore<Input, Output>) {
    if (store.latestRequest) {
      this.send(store.latestRequest, true);
    } else {
      throw Error('Unable to refresh store since it has never made a request.');
    }
  }

  protected makeRequest(store: RequestStore<Input, Output>) {
    this.http.request(this.requestMethod, this.getUrl(store), {
      body: this.getBody(store),
      headers: this.getHeaders(store),
      params: this.getParams(store)
    }).pipe(
      catchError(err => this.handleError(err)),
      mergeMap<unknown, Observable<Output>>((data: unknown) => ensureObservation(this.parseMethod()(data))),
      tap<Output>((result: Output) => store.latestResponse = result),
      finalize(() => this.onRequestSuccess(store))
    ).subscribe()
  }

  protected onRequestSuccess(store: RequestStore<Input, Output>) {
    this.next(store);
    store.listener.next(store.latestResponse!);
    store.isCacheStale = false;
    store.activeRequest = undefined;
    setTimeout(() => store.isCacheStale = true, this.staleTimer);
  }
}
