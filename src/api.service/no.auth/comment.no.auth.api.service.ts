/**
 * @author songxiwen
 * @date  2021/9/12 23:28
 */

import type { CommentEntityType } from 'edu-graph-constant';
import { ApiPathEnum } from '@/api.service/config/api.config';
import { RequestUtil } from '@/utils';
import type { PublicApiResponseType } from '@/utils';

// eslint-disable-next-line import/prefer-default-export
export class CommentNoAuthApiService {
  static async getCommentByEntityId(params: {
    entityType: CommentEntityType;
    entityId: string;
    pageIndex: number;
    pageSize: number;
  }): Promise<PublicApiResponseType<any>> {
    return RequestUtil.post<{
      entityType: CommentEntityType;
      entityId: string;
      pageIndex: number;
      pageSize: number;
    }, any>({
      apiPath: ApiPathEnum.GetNoAuthCommentByEntityId,
      requestBody: params
    });
  }
}