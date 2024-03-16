import { BaseRequest } from '../base-request';
import { RequestMethod } from '../request-methods';

export abstract class HeadRequest<Input, Output> extends BaseRequest<Input, Output> {
  protected requestMethod: RequestMethod = RequestMethod.head;
}
