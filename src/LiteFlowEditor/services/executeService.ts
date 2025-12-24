/**
 * Chain 执行相关 API 服务
 */
import { post } from './request';
import type { ExecuteChainRequest, ExecuteChainResponse } from './types';

const executeService = {
  /**
   * 执行 Chain
   * POST /api/executeChain
   */
  execute(data: ExecuteChainRequest): Promise<ExecuteChainResponse> {
    // 超时时间留出网络延迟余量
    const timeout = (data.timeout || 30000) + 5000;
    return post<ExecuteChainResponse>('/executeChain', data, { timeout });
  },
};

export default executeService;
