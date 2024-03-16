import { BaseRequest } from '../base-request';
import { RequestMethod } from '../request-methods';
import { RequestStore } from '../request-store';

export abstract class DeleteRequest<Input, Output> extends BaseRequest<Input, Output> {
  protected requestMethod: RequestMethod = RequestMethod.delete;

  public override send(input: Input, forceRequest: boolean = true): RequestStore<Input, Output> {
    return super.send(input, forceRequest);
  }
}
