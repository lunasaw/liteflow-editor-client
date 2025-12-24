/**
 * LiteFlow Editor API 类型定义
 * 基于 openapi.json 生成
 */

// ============ 通用类型 ============

/** API 通用响应 */
export interface ApiResponse {
  code: string;
  message: string;
}

/** EL JSON 结构属性 */
export interface ELJsonProperties {
  id?: string;
  tag?: string;
  data?: string;
}

/** EL JSON 结构对象 */
export interface ELJsonNode {
  id?: string;
  type?: string;
  properties?: ELJsonProperties;
  condition?: ELJsonNode;
  children?: ELJsonNode[];
}

/** EL 结构对象 */
export interface ELInfo {
  chainId?: string;
  elStr?: string;
}

// ============ 脚本节点相关类型 ============

/**
 * 脚本节点类型
 * - script: 普通脚本
 * - switch_script: 选择脚本
 * - boolean_script: 布尔脚本
 * - for_script: 循环次数脚本
 */
export type ScriptNodeType =
  | 'script'
  | 'switch_script'
  | 'boolean_script'
  | 'for_script';

/**
 * 脚本语言类型
 */
export type ScriptLanguage =
  | 'java'
  | 'groovy'
  | 'javascript'
  | 'python'
  | 'qlexpress'
  | 'lua'
  | 'aviator'
  | 'kotlin';

/**
 * 参数数据类型
 */
export type ParamDataType =
  | 'string'
  | 'int'
  | 'long'
  | 'double'
  | 'boolean'
  | 'object'
  | 'list';

/**
 * 节点参数定义
 */
export interface ScriptNodeParam {
  /** 参数键名（必填） */
  key: string;
  /** 参数名称/描述 */
  name?: string;
  /** 参数数据类型（必填） */
  type: ParamDataType;
  /** 是否必填 */
  required?: boolean;
  /** 默认值 */
  defaultValue?: string;
  /** 参数描述/备注 */
  description?: string;
}

/** 脚本节点信息 */
export interface ScriptNodeVO {
  /** 节点ID（必填） */
  nodeId: string;
  /** 节点名称 */
  nodeName?: string;
  /** 节点类型（必填） */
  nodeType: ScriptNodeType;
  /** 脚本语言（必填） */
  language: ScriptLanguage;
  /** 脚本内容（必填） */
  script: string;
  /** 参数定义列表 */
  params?: ScriptNodeParam[];
}

/** 删除脚本节点参数 */
export interface DeleteScriptNodeVO {
  /** 节点ID（必填） */
  nodeId: string;
}

// ============ Chain 执行相关类型 ============

/** Chain 执行请求 */
export interface ExecuteChainRequest {
  /** Chain ID（必填） */
  chainId: string;
  /** 请求参数（会放入Context中） */
  requestData?: Record<string, any>;
  /** 超时时间（毫秒），默认30000 */
  timeout?: number;
}

/** 节点执行步骤详情 */
export interface StepDetail {
  /** 节点ID */
  nodeId: string;
  /** 节点名称 */
  nodeName: string;
  /** 节点类型 */
  nodeType: string;
  /** 节点标签 */
  tag?: string;
  /** 执行顺序（从1开始） */
  stepIndex: number;
  /** 是否执行成功 */
  success: boolean;
  /** 执行耗时（毫秒） */
  timeSpent: number;
  /** 执行前的Context快照 */
  inputContext?: Record<string, any>;
  /** 执行后的Context快照 */
  outputContext?: Record<string, any>;
  /** 异常信息（如果有） */
  exception?: string;
}

/** Chain 执行响应 */
export interface ExecuteChainResponse {
  /** 处理结果编码（S=成功，E=失败） */
  code: string;
  /** 处理结果信息 */
  message: string;
  /** 是否执行成功 */
  success: boolean;
  /** 执行的Chain ID */
  chainId: string;
  /** 总执行耗时（毫秒） */
  executionTime: number;
  /** 执行的节点数量 */
  nodeCount: number;
  /** 执行结束后的Context数据 */
  responseData?: Record<string, any>;
  /** 各节点执行详情 */
  stepDetails: StepDetail[];
  /** 执行路径（节点ID列表） */
  executionPath: string[];
  /** 请求ID（用于追踪） */
  requestId: string;
  /** 异常堆栈信息（仅失败时返回） */
  exceptionStack?: string;
}

// ============ Chain 管理相关类型 ============

/** Chain 列表项 */
export interface ChainListItem {
  chainId: string;
  chainName?: string;
}

/** 创建 Chain 请求 */
export interface CreateChainVO {
  chainId: string;
  elJson: ELJsonNode;
}

/** 更新 Chain 请求 */
export interface UpdateChainVO {
  chainId: string;
  elJson: ELJsonNode;
}

/** 删除 Chain 请求 */
export interface DeleteChainVO {
  chainId: string;
}

/** Chain 详情响应 */
export interface ChainDetailResponse {
  elInfo?: ELInfo;
  elJson?: ELJsonNode;
}

// ============ 组件相关类型 ============

/** 组件列表项 */
export interface CmpListItem {
  /** 组件id */
  cmpId: string;
  /** 组件编码 */
  cmpName?: string;
  /** 节点类型 */
  nodeType?: string;
  /** 是否为脚本节点 */
  isScript?: boolean;
  /** 脚本语言 */
  language?: ScriptLanguage;
  /** 脚本内容 */
  script?: string;
}

// ============ EL 表达式转换相关类型 ============

/** JSON 转 EL 请求 */
export interface GenerateELRequest {
  jsonEl: ELJsonNode;
}

/** EL 转 JSON 请求 */
export interface GenerateJsonELRequest {
  chainId?: string;
  elStr?: string;
}

// ============ 脚本语言配置 ============

/** 脚本语言配置项 */
export interface ScriptLanguageConfig {
  value: ScriptLanguage;
  label: string;
  monacoLanguage: string;
  defaultTemplate: string;
}

/** 脚本节点类型配置 */
export interface ScriptNodeTypeConfig {
  value: ScriptNodeType;
  label: string;
  description: string;
}

// ============ 脚本节点类型推断工具 ============

/**
 * 根据节点在 EL 结构中的位置推断正确的脚本节点类型
 *
 * 脚本节点类型与 EL 结构的对应关系：
 * - boolean_script: IF/WHILE 的条件节点，AND/OR/NOT 的子节点（当用于条件时）
 * - switch_script: SWITCH 的选择器节点
 * - for_script: FOR 的循环次��节点
 * - script: 普通脚本节点（THEN/WHEN 等编排中的普通节点）
 *
 * @param model ELNode 模型对象
 * @returns 推断出的脚本节点类型
 */
export function inferScriptNodeType(model: any): ScriptNodeType {
  if (!model) {
    return 'script';
  }

  const parent = model.parent;
  if (!parent) {
    return 'script';
  }

  const parentType = parent.type;

  // 1. 检查当前节点是否是父节点的 condition
  // 直接比较引用，或者比较节点 ID
  const isCondition = parent.condition === model ||
    (parent.condition && parent.condition.id === model.id);

  if (isCondition) {
    switch (parentType) {
      case 'IF':
      case 'WHILE':
        return 'boolean_script';
      case 'SWITCH':
        return 'switch_script';
      case 'FOR':
        return 'for_script';
      default:
        return 'script';
    }
  }

  // 2. 如果父节点是 AND/OR/NOT（逻辑运算符），需要继续向上查找
  // 因为逻辑运算符的子节点也需要返回布尔值
  if (parentType === 'AND' || parentType === 'OR' || parentType === 'NOT') {
    // AND/OR/NOT 的子节点都需要是布尔类型
    // 检查这个逻辑运算符的最终用途
    return inferScriptTypeForLogicalOperator(parent);
  }

  // 3. 普通子节点（在 THEN/WHEN/CATCH 等编排中）使用普通脚本类型
  return 'script';
}

/**
 * 递归检查逻辑运算符（AND/OR/NOT）的最终用途
 * 如果最终用于 IF/WHILE 条件，则需要返回 boolean_script
 */
function inferScriptTypeForLogicalOperator(logicalOp: any): ScriptNodeType {
  if (!logicalOp || !logicalOp.parent) {
    return 'script';
  }

  const parent = logicalOp.parent;
  const parentType = parent.type;

  // 检查这个逻辑运算符是否是父节点的 condition
  const isCondition = parent.condition === logicalOp ||
    (parent.condition && parent.condition.id === logicalOp.id);

  if (isCondition) {
    if (parentType === 'IF' || parentType === 'WHILE') {
      return 'boolean_script';
    }
  }

  // 如果父节点也是逻辑运算符，继续递归
  if (parentType === 'AND' || parentType === 'OR' || parentType === 'NOT') {
    return inferScriptTypeForLogicalOperator(parent);
  }

  return 'script';
}

/**
 * 获取脚本节点类型的显示标签
 */
export function getScriptNodeTypeLabel(nodeType: ScriptNodeType): string {
  const labels: Record<ScriptNodeType, string> = {
    script: '普通脚本节点',
    switch_script: '选择脚本节点',
    boolean_script: '条件脚本节点',
    for_script: '循环次数脚本节点',
  };
  return labels[nodeType] || '脚本节点';
}
