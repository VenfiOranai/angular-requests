import { Subject } from 'rxjs';

export interface RequestStore<Input, Output> {
  key: string;
  latestRequest?: Input;
  latestResponse?: Output;
  listener: Subject<Output>;
  activeRequest?: Subject<Output>;
  isCacheStale: boolean;
  isCacheInvalid: boolean;
}
