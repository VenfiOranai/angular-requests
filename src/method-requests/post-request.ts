import { BaseRequest } from '../base-request';
import { RequestMethod } from '../request-methods';
import { RequestStore } from '../request-store';

export abstract class PostRequest<Input, Output> extends BaseRequest<Input, Output> {
  protected requestMethod: RequestMethod = RequestMethod.post;

  public override send(input: Input, forceRequest: boolean = true): RequestStore<Input, Output> {
    return super.send(input, forceRequest);
  }
}
