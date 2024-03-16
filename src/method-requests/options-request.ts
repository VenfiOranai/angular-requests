import { BaseRequest } from '../base-request';
import { RequestMethod } from '../request-methods';

export abstract class OptionsRequest<Input, Output> extends BaseRequest<Input, Output> {
  protected requestMethod: RequestMethod = RequestMethod.options;
}
