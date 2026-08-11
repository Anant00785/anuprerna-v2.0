// @ts-nocheck
import { Injectable } from '@nestjs/common';
import { simpleResponse, keyedResponse, paginatedResponse } from '../../../common/response/rain-response.js';

@Injectable()
export class ResponseBuilderService {
  buildSimpleResponse(success: boolean, message: string) {
    return simpleResponse(success, message);
  }

  buildKeyedResponse<T>(key: string, data: T) {
    return keyedResponse(key, data);
  }

  buildPaginatedResponse<T>(data: T[], total: number, page: number, size: number) {
    return paginatedResponse(data, total, page, size);
  }
}
// @ts-nocheck
