import { BaseRequest } from '../base-request';
import { RequestMethod } from '../request-methods';

export abstract class GetRequest<Input, Output> extends BaseRequest<Input, Output> {
  protected requestMethod: RequestMethod = RequestMethod.get;
}
