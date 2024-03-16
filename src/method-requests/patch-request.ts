import { BaseRequest } from '../base-request';
import { RequestMethod } from '../request-methods';
import { RequestStore } from '../request-store';

export abstract class PatchRequest<Input, Output> extends BaseRequest<Input, Output> {
  protected get requestMethod(): RequestMethod {
    return RequestMethod.patch;
  }

  public override send(input: Input, forceRequest: boolean = true): RequestStore<Input, Output> {
    return super.send(input, forceRequest);
  }
}