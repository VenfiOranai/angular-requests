import { BaseRequest } from '../base-request';
import { RequestMethod } from '../request-methods';

export abstract class HeadRequest<Input, Output> extends BaseRequest<Input, Output> {
  protected get requestMethod(): RequestMethod {
    return RequestMethod.head;
  }
}
