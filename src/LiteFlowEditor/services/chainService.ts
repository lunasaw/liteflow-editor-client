/**
 * Chain 管理相关 API 服务
 */
import { get, post } from './request';
import type {
  ApiResponse,
  ChainListItem,
  ChainDetailResponse,
  CreateChainVO,
  UpdateChainVO,
  DeleteChainVO,
  CmpListItem,
  ELJsonNode,
  ELInfo,
} from './types';

const chainService = {
  /**
   * 获取 Chain 列表
   * GET /api/getChainList
   */
  getList(): Promise<ChainListItem[]> {
    return get<ChainListItem[]>('/getChainList');
  },

  /**
   * 获取 Chain 详情
   * GET /api/getChainById
   */
  getById(chainId: string): Promise<ChainDetailResponse> {
    return get<ChainDetailResponse>('/getChainById', { chainId });
  },

  /**
   * 创建 Chain
   * POST /api/createChain
   */
  create(data: CreateChainVO): Promise<ApiResponse> {
    return post<ApiResponse>('/createChain', data);
  },

  /**
   * 更新 Chain
   * POST /api/updateChain
   */
  update(data: UpdateChainVO): Promise<ApiResponse> {
    return post<ApiResponse>('/updateChain', data);
  },

  /**
   * 删除 Chain
   * POST /api/deleteChain
   */
  delete(data: DeleteChainVO): Promise<ApiResponse> {
    return post<ApiResponse>('/deleteChain', data);
  },

  /**
   * 获取组件列表
   * GET /api/getCmpList
   */
  getCmpList(): Promise<CmpListItem[]> {
    return get<CmpListItem[]>('/getCmpList');
  },

  /**
   * 校验 EL 表达式
   * POST /api/verifyELExpression
   */
  verifyEL(jsonEl: ELJsonNode): Promise<ApiResponse> {
    return post<ApiResponse>('/verifyELExpression', jsonEl);
  },

  /**
   * JSON 结构转 EL 表达式
   * POST /api/generateEL
   */
  generateEL(jsonEl: ELJsonNode): Promise<ELInfo> {
    return post<ELInfo>('/generateEL', jsonEl);
  },

  /**
   * EL 表达式转 JSON 结构
   * POST /api/generateJsonEL
   */
  generateJsonEL(data: { chainId?: string; elStr?: string }): Promise<ELJsonNode> {
    return post<ELJsonNode>('/generateJsonEL', data);
  },
};

export default chainService;
