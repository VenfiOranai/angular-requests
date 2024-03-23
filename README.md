# Angular Requests
Angular requests is a class based helper to manage & cache HTTP 
requests using RXJS in Angular.

## Installation
In order to install Angular Requests you must simply run the following command:
```
npm install angular-requests
```

## Minimal Usage
In order to use the Angular Requests package, you must create a class that
inherits from the package's BaseRequest class. This new class must be marked as an @Injectable()
and it is recommended to provide it in root unless you have a specific reason to provide it elsewhere.
You will then need to implement the three abstract functions/properties within the class, 
that being the request method, the url, and the body. 

```typescript
@Injectable({ providedIn: 'root' })
export class ExampleRequest extends BaseRequest<MyInputType, MyOutputType> {
  protected readonly requestMethod: RequestMethod = RequestMethod.post;
  
  protected getUrl(store: RequestStore<MyInputType, MyOutputType>): string {
    return `https://address.com/${ store.latestRequest.parameter }`
  }
  
  protected getBody(store: RequestStore<MyInputType, MyOutputType>): object {
    return {
      key: store.latestRequest.someValue,
      secondKey: store.latestRequest.otherValue
    };
  }
}
```

Once you have your class, simply provide it a component (or wherever else the request is relevant) and
call the `send()` method. This method takes two parameters, the first being the input to the request,
the second being `forceRequest`, which indicates whether a request should be sent regardless
of if it is stale/active or not (defaults to false).

## Additional Parameters

In addition to the above three abstract functions/properties that must be supplied, there are
additional functions that can be overridden to enrich your request:
1. `staleTimer` - The amount of time that a cached request is considered fresh,
after which a new request to the server will be sent upon the request being called. 
This defaults to 30 seconds.
2. `getParams` - The query parameters that will be sent to the request. These come in the form
of `HttpParams` as supplied by `@angular/common/http`. This defaults to no query params.
3. `getHeaders` - The headers that will be sent to the request. These come in
the form of `HttpHeaders` as supplied by `@angular/common/http`. This defaults
to no headers.
4. `parseMethod` - A function that parses the response from the server into the Request's output
typing (as indicated by the second generic parameter). By default, this will simply cast
response from `unknown` to the output type.
5. `handleError` - A function that allows for parsing of an error into the Request's output type.
By default, the error will simply be thrown as is.
6. `onRequestSuccess` - A function that is called when the request has completed successfully.
This allows for additional, custom logic to be added to such an event. If you override this function,
it is very important to call `super()` since this function contains logic imperative to the base's functionality.

## Global Listening

The base request class that is provided by this package extends RXJS's Subject class.
This enables global listening to a request as a sort of event notifier.

Let's assume that you have a component which contains a small sub-hierarchy of components.
This component contains a list of entities, each row within the list marks a specific entity,
and within each row we have a delete button. Logically, if the delete button is pressed,
we want to send a delete request and upon its return, remove the row from the list.

One possible option is to chain Outputs, but in many cases, more complex than the example,
this is rather uncomfortable. Another option is to have a service which manages the full state
of all the components, but given a situation where we have a lot of functionality,
this will lead the state service to be rather bloated.

Instead, by simply subscribing to the delete request class within the list component,
we can immediately be notified of any delete requests that occur and act accordingly.

```typescript
class DeleteButtonComponent {
  @Input() entityId: string;

  constructor(private deleteRequest: DeleteEntityRequest) {  }

  public sendDelete() {
    this.deleteRequest.send({entityId: this.entityId});
  }
}

class ListComponent implements OnInit {
  constructor(private deleteRequest: DeleteEntityRequest) {  }
  
  ngOnInit() {
    this.deleteRequest.subscribe(store => {
      // Remove object from display logic goes here.
    });
  }
}
```

## Supplying Custom Abstractions

The primary goal of this package is not only to assist in caching and making requests,
but to help minimize code and overhead when creating new requests.

For that reason it is highly recommended to supply additional abstract classes that stand between
the package's supplied abstract class and the actual requests themselves.

Let's assume for example, that all/most of the requests you make contain an authentication header, 
are sent to the same API gateway, and you'd prefer a default stale timeout of 60 seconds.
Creating a class like this would be very beneficial in helping to create new requests.

```typescript
@Injectable()
export abstract class CustomBaseRequest<Input, Output> extends BaseRequest<Input, Output> {
  protected abstract getRoute(_store: RequestStore<Input, Output>): string;

  protected override readonly staleTimer: number = 60000;

  constructor(http: HttpCLient, private auth: AuthService) {
    super(http);
  }

  protected override getUrl(_store: RequestStore<Input, Output>): string {
    return `https://my-gateway${this.route()}`
  }

  protected override getHeaders(_store: RequestStore<Input, Output>): HttpHeaders {
    return super.getHeaders(_store).set('Authorization', this.auth.getAuthToken());
  }
}
```

In addition, it is recommended to create abstract classes for each of the primary
HTTP request methods, for similar reasons as above.

```typescript
@Injectable()
export abstract class CustomDeleteRequest<Input, Output> extends BaseRequest<Input, Output> {
  protected override readonly requestMethod: RequestMethod = RequestMethod.delete;

  protected override getBody(_store: RequestStore<Input, Output>): object | undefined {
    return undefined;
  }

  public override send(input: Input, forceRequest: boolean = true): RequestStore<Input, Output> {
    return super.send(input, forceRequest);
  }
}
```

As can be seen in the example, not just the `requestMethod` is set, but the `getBody` (since
bodies are generally irrelevant in delete requests) and default value of `forceRequest` (since we
generally have no reason to cache a delete request) are overridden.

## Request Store

In order to fully utilize this package, we must become 
familiar with the primary interface this package uses, that being
the RequestStore interface.

The request store assumes that every request has an input (the 
parameters that are used to build the request) and an output (the
response that is received from the server). Each RequestStore
instance is meant to match a specific instance of a request, each
instance being differentiated by the input parameters given to it.

```typescript
interface RequestStore<Input, Output> {
  // The internal key used to identify the store. 
  // Generated using the input given by hashing it if it is an object
  // or stringifying it otherwise.
  key: string;
  // The most recent input given to create the request.
  latestRequest?: Input;
  // The most recent response from the server for the given request.
  // Serves as the primary caching mechanism.
  latestResponse?: Output;
  // An RXJS subject that can be used to listen for the server's response, 
  // as well as any future events emitted to the store, allowing for seamless
  // updates to any listening elements.
  // If there is a cached response and a request is made, the listener will
  // immediately emit the value saved in latestResponse.
  listener: Subject<Output>;
  // Contains a reference to any active request using the given input, used
  // automatically to help merge duplicate requests. 
  activeRequest?: Subject<Output>;
  // Indicates whether the cache is stale or not.
  // Its value is set automatically by the package.
  // If it is stale and an additional request is made, 
  // the listener will emit the cache's contents but also make a 
  // request in the background and emit to the listener once a response is 
  // received.
  isCacheStale: boolean;
  // Indicates whether the cache is valid or not.
  // Its value must be set manually by your code.
  // If it is invalid and an additional request is made,
  // the listener will not emit the cache's content but will make a request
  // whether the cache is stale or not.
  isCacheInvalid: boolean;
}
```

The return value of the `send` function as well as the emission sent when subscribing
to the class will return a `RequestStore`, making knowledge of its structure very relevant
to usage of this package.

## Refreshing Requests

Many if not all systems generally allow for objects to be changed, which inevitably leads
to caches being unsynced with the real data in your backend. This package provides two
methods to help avoid this issue. 

1. The first provided method is a delayed cache update. This means that any retrieved data
that is currently being displayed will stay as is, however, if the request is made again,
it will ignore any cached data and will instead opt to fetch fresh data from the backend.
This is done by setting the `isCacheInvalid` flag on a request store object to true.
This is primarily recommended for setting data that can be displayed while temporarily unsynced,
or for data that is not displayed at all and has received update requests via sockets and the like
(if opting for sockets, which is highly recommended, creating some central global service to
manage this is likely the optimal route rather than having it strewn about your project).
2. The second method is an immediate refresh. Since the `listener` property on the RequestStore
is a subject, any component/service/etc with an open `subscribe` will have its pipeline
run with the fresh data. This is done by calling the request's `refresh` function, which takes
a Request Store and immediately recreates its original request, overriding the cached data with
whatever fresh data is received. This is recommended for objects that can be edited on the page
to allow for an immediate visual update of said objects.

## Additional Notes

Hi, on a side note, I created this package primarily for personal and work related use,
so its current state is primarily built off of my needs out of it.

If you encounter any issues with the package or have additional feature requirements
that you'd like to see implemented, please feel free to open an issue at https://github.com/VenfiOranai/angular-requests/issues.

