import { BaseRequest } from '../base-request';
import { RequestMethod } from '../request-methods';

export abstract class GetRequest<Input, Output> extends BaseRequest<Input, Output> {
  protected get requestMethod(): RequestMethod {
    return RequestMethod.get;
  }
}
