/**
 * 脚本节点相关 API 服务
 */
import { get, post } from './request';
import type {
  ScriptNodeVO,
  DeleteScriptNodeVO,
  ApiResponse,
} from './types';

const scriptService = {
  /**
   * 保存或更新脚本节点
   * 如果节点已存在则更新，不存在则创建（支持修改语言和类型）
   * POST /api/saveOrUpdateScriptNode
   */
  saveOrUpdate(data: ScriptNodeVO): Promise<ApiResponse> {
    return post<ApiResponse>('/saveOrUpdateScriptNode', data);
  },

  /**
   * 创建脚本节点
   * POST /api/createScriptNode
   * @deprecated 使用 saveOrUpdate 替代
   */
  create(data: ScriptNodeVO): Promise<ApiResponse> {
    return post<ApiResponse>('/createScriptNode', data);
  },

  /**
   * 更新脚本节点
   * POST /api/updateScriptNode
   * @deprecated 使用 saveOrUpdate 替代
   */
  update(data: ScriptNodeVO): Promise<ApiResponse> {
    return post<ApiResponse>('/updateScriptNode', data);
  },

  /**
   * 删除脚本节点
   * POST /api/deleteScriptNode
   */
  delete(data: DeleteScriptNodeVO): Promise<ApiResponse> {
    return post<ApiResponse>('/deleteScriptNode', data);
  },

  /**
   * 获取脚本节点详情
   * GET /api/getScriptNodeById
   */
  getById(nodeId: string): Promise<ScriptNodeVO> {
    return get<ScriptNodeVO>('/getScriptNodeById', { nodeId });
  },

  /**
   * 获取脚本节点列表
   * GET /api/getScriptNodeList
   */
  getList(): Promise<ScriptNodeVO[]> {
    return get<ScriptNodeVO[]>('/getScriptNodeList');
  },

  /**
   * 验证脚本语法
   * POST /api/verifyScript
   */
  verify(data: ScriptNodeVO): Promise<ApiResponse> {
    return post<ApiResponse>('/verifyScript', data);
  },
};

export default scriptService;
