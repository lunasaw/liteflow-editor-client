# LiteFlow 脚本节点与 Chain 执行前端技术方案

## 一、需求概述

### 1.1 背景

基于 LiteFlow 可视化编辑器现有能力，后端新增了两大核心功能：

1. **节点脚本能力**：支持在可视化编辑器中创建、编辑、验证脚本节点
2. **Chain 执行能力**：支持在编辑器中直接执行 Chain 并查看执行结果

### 1.2 目标

- **所有组件节点都支持脚本编辑**：任何节点都可以通过脚本定义其执行逻辑
- 提供 Chain 执行调试界面（执行 + 结果可视化）
- 与现有编辑器架构无缝集成
- 良好的用户体验和交互设计

### 1.3 核心设计理念

**统一的节点脚本能力**：在 LiteFlow 中，每个节点本质上都需要执行某些逻辑。我们采用统一的设计理念：
- 所有组件节点（NodeOperator）都具备脚本编辑能力
- 脚本功能通过开关控制，用户可以选择是否启用
- 启用脚本后，节点的执行逻辑由脚本定义
- 这种设计让节点更加灵活，用户可以直接在编辑器中定义执行逻辑

---

## 二、后端 API 分析

### 2.1 脚本节点相关 API

| API 路径 | 方法 | 功能描述 |
|---------|------|---------|
| `/api/saveOrUpdateScriptNode` | POST | 保存或更新脚本节点（推荐） |
| `/api/createScriptNode` | POST | 创建脚本节点 |
| `/api/updateScriptNode` | POST | 更新脚本节点 |
| `/api/deleteScriptNode` | POST | 删除脚本节点 |
| `/api/getScriptNodeById` | GET | 获取脚本节点详情 |
| `/api/getScriptNodeList` | GET | 获取脚本节点列表 |
| `/api/verifyScript` | POST | 验证脚本语法 |

> **推荐**：使用 `/api/saveOrUpdateScriptNode` 接口，该接口会自动判断节点是否存在，存在则更新，不存在则创建，支持修改语言和类型。

#### 脚本节点数据结构

```typescript
interface ScriptNodeVO {
  nodeId: string;           // 节点ID（必填）
  nodeName?: string;        // 节点名称
  nodeType: ScriptNodeType; // 节点类型（必填）
  language: ScriptLanguage; // 脚本语言（必填）
  script: string;           // 脚本内容（必填）
}

// 脚本节点类型
type ScriptNodeType = 'script' | 'switch_script' | 'boolean_script' | 'for_script';

// 支持的脚本语言
type ScriptLanguage = 'java' | 'groovy' | 'javascript' | 'python' | 'qlexpress' | 'lua' | 'aviator' | 'kotlin';
```

### 2.2 Chain 执行相关 API

| API 路径 | 方法 | 功能描述 |
|---------|------|---------|
| `/api/executeChain` | POST | 执行 Chain |

#### 执行请求数据结构

```typescript
interface ExecuteChainRequest {
  chainId: string;                    // Chain ID（必填）
  requestData?: Record<string, any>;  // 请求参数（放入 Context）
  timeout?: number;                   // 超时时间（毫秒），默认 30000
}
```

#### 执行响应数据结构

```typescript
interface ExecuteChainResponse {
  code: string;                       // 结果编码（S=成功，E=失败）
  message: string;                    // 结果信息
  success: boolean;                   // 是否执行成功
  chainId: string;                    // 执行的 Chain ID
  executionTime: number;              // 总执行耗时（毫秒）
  nodeCount: number;                  // 执行的节点数量
  responseData?: Record<string, any>; // 执行后的 Context 数据
  stepDetails: StepDetail[];          // 各节点执行详情
  executionPath: string[];            // 执行路径（节点ID列表）
  requestId: string;                  // 请求ID（用于追踪）
  exceptionStack?: string;            // 异常堆栈（仅失败时返回）
}

interface StepDetail {
  nodeId: string;                     // 节点ID
  nodeName: string;                   // 节点名称
  nodeType: string;                   // 节点类型
  tag?: string;                       // 节点标签
  stepIndex: number;                  // 执行顺序（从1开始）
  success: boolean;                   // 是否执行成功
  timeSpent: number;                  // 执行耗时（毫秒）
  inputContext?: Record<string, any>; // 执行前的 Context 快照
  outputContext?: Record<string, any>;// 执行后的 Context 快照
  exception?: string;                 // 异常信息
}
```

---

## 三、整体架构设计

### 3.1 架构图

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           LiteFlow Editor Client                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───���─────────┐  ┌──────────────┐  ┌─────────────┐  ┌─────────────────┐   │
│  │   SideBar   │  │  FlowGraph   │  │ SettingBar  │  │    ToolBar      │   │
│  │  (物料区)   │  │  (画布区)    │  │  (设置区)   │  │   (工具栏)      │   │
│  ├─────────────┤  ├──────────────┤  ├─────────────┤  ├─────────────────┤   │
│  │ +脚本节点组 │  │              │  │ +脚本编辑器 │  │ +执行按钮      │   │
│  │  -script    │  │   现有画布   │  │ +执行结果   │  │ +调试面板开关  │   │
│  │  -switch    │  │              │  │             │  │                 │   │
│  │  -boolean   │  │              │  │             │  │                 │   │
│  │  -for       │  │              │  │             │  │                 │   │
│  └─────────────┘  └──────────────┘  └─────────────┘  └─────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────���───┐   │
│  │                        执行调试面板（新增）                          │   │
│  │  ┌─────────────┐  ┌─────────────────┐  ┌──────────────────────┐    │   │
│  │  │ 参数输入区  │  │   执行状态区    │  │    执行结果区        │    │   │
│  │  │             │  │                 │  │                      │    │   │
│  │  │ Context参数 │  │  执行进度       │  │  执行路径可视化      │    │   │
│  │  │ JSON编辑器  │  │  节点状态       │  │  节点执行详情        │    │   │
│  │  │ 超时设置    │  │  实时日志       │  │  Context变化对比     │    │   │
│  │  └─────────────┘  └─────────────────┘  └──────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                           API Service Layer                           │  │
│  │  ┌────────────────┐  ┌─────────────────┐  ┌─────────────────────┐   │  │
│  │  │ ScriptService  │  │ ExecuteService  │  │   ChainService      │   │  │
│  │  │                │  │                 │  │   (现有)            │   │  │
│  │  │ -create        │  │ -execute        │  │                     │   │  │
│  │  │ -update        │  │ -polling        │  │                     │   │  │
│  │  │ -delete        │  │                 │  │                     │   │  │
│  │  │ -getById       │  │                 │  │                     │   │  │
│  │  │ -getList       │  │                 │  │                     │   │  │
│  │  │ -verify        │  │                 │  │                     │   │  │
│  │  └────────────────┘  └─────────────────┘  └─────────────────────┘   │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 模块划分

| 模块 | 路径 | 职责 |
|------|------|------|
| **API 服务层** | `src/LiteFlowEditor/services/` | 封装后端 API 调用 |
| **脚本编辑器** | `src/LiteFlowEditor/panels/settingBar/script/` | 脚本编辑和验证界面 |
| **执行调试面板** | `src/LiteFlowEditor/panels/debugPanel/` | Chain 执行和结果展示 |
| **脚本节点物料** | `src/LiteFlowEditor/cells/` | 脚本节点类型定义 |
| **工具栏扩展** | `src/LiteFlowEditor/panels/toolBar/widgets/` | 执行按钮等工具 |

---

## 四、详细设计

### 4.1 API 服务层设计

#### 4.1.1 目录结构

```
src/LiteFlowEditor/services/
├── index.ts              # 统一导出
├── request.ts            # 请求封装（axios 实例）
├── types.ts              # TypeScript 类型定义
├── scriptService.ts      # 脚本节点相关 API
├── executeService.ts     # Chain 执行相关 API
└── chainService.ts       # Chain 相关 API（现有功能增强）
```

#### 4.1.2 请求封装

```typescript
// src/LiteFlowEditor/services/request.ts 
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { message } from 'antd';

const instance: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
instance.interceptors.request.use(
  (config) => {
    // 可添加 token 等认证信息
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器
instance.interceptors.response.use(
  (response: AxiosResponse) => {
    const { data } = response;
    if (data.code && data.code !== 'S') {
      message.error(data.message || '请求失败');
      return Promise.reject(new Error(data.message));
    }
    return data;
  },
  (error) => {
    message.error(error.message || '网络异常');
    return Promise.reject(error);
  }
);

export default instance;
```

#### 4.1.3 类型定义

```typescript
// src/LiteFlowEditor/services/types.ts

// ============ 脚本节点相关类型 ============

/** 脚本节点类型 */
export type ScriptNodeType = 'script' | 'switch_script' | 'boolean_script' | 'for_script';

/** 脚本语言类型 */
export type ScriptLanguage =
  | 'java'
  | 'groovy'
  | 'javascript'
  | 'python'
  | 'qlexpress'
  | 'lua'
  | 'aviator'
  | 'kotlin';

/** 脚本节点信息 */
export interface ScriptNodeVO {
  nodeId: string;
  nodeName?: string;
  nodeType: ScriptNodeType;
  language: ScriptLanguage;
  script: string;
}

/** 删除脚本节点参数 */
export interface DeleteScriptNodeVO {
  nodeId: string;
}

/** API 通用响应 */
export interface ApiResponse {
  code: string;
  message: string;
}

// ============ Chain 执行相关类型 ============

/** Chain 执行请求 */
export interface ExecuteChainRequest {
  chainId: string;
  requestData?: Record<string, any>;
  timeout?: number;
}

/** 节点执行步骤详情 */
export interface StepDetail {
  nodeId: string;
  nodeName: string;
  nodeType: string;
  tag?: string;
  stepIndex: number;
  success: boolean;
  timeSpent: number;
  inputContext?: Record<string, any>;
  outputContext?: Record<string, any>;
  exception?: string;
}

/** Chain 执行响应 */
export interface ExecuteChainResponse {
  code: string;
  message: string;
  success: boolean;
  chainId: string;
  executionTime: number;
  nodeCount: number;
  responseData?: Record<string, any>;
  stepDetails: StepDetail[];
  executionPath: string[];
  requestId: string;
  exceptionStack?: string;
}

// ============ 脚本语言配置 ============

/** 脚本语言配置项 */
export interface ScriptLanguageConfig {
  value: ScriptLanguage;
  label: string;
  icon?: string;
  monacoLanguage: string;  // Monaco Editor 语言标识
  defaultTemplate: string;  // 默认代码模板
}

/** 脚本节点类型配置 */
export interface ScriptNodeTypeConfig {
  value: ScriptNodeType;
  label: string;
  description: string;
  icon?: string;
}
```

#### 4.1.4 脚本服务

```typescript
// src/LiteFlowEditor/services/scriptService.ts
import request from './request';
import {
  ScriptNodeVO,
  DeleteScriptNodeVO,
  ApiResponse
} from './types';

const scriptService = {
  /** 保存或更新脚本节点（推荐使用） */
  saveOrUpdate(data: ScriptNodeVO): Promise<ApiResponse> {
    return request.post('/saveOrUpdateScriptNode', data);
  },

  /** 创建脚本节点 @deprecated 使用 saveOrUpdate 替代 */
  create(data: ScriptNodeVO): Promise<ApiResponse> {
    return request.post('/createScriptNode', data);
  },

  /** 更新脚本节点 @deprecated 使用 saveOrUpdate 替代 */
  update(data: ScriptNodeVO): Promise<ApiResponse> {
    return request.post('/updateScriptNode', data);
  },

  /** 删除脚本节点 */
  delete(data: DeleteScriptNodeVO): Promise<ApiResponse> {
    return request.post('/deleteScriptNode', data);
  },

  /** 获取脚本节点详情 */
  getById(nodeId: string): Promise<ScriptNodeVO> {
    return request.get('/getScriptNodeById', { params: { nodeId } });
  },

  /** 获取脚本节点列表 */
  getList(): Promise<ScriptNodeVO[]> {
    return request.get('/getScriptNodeList');
  },

  /** 验证脚本语法 */
  verify(data: ScriptNodeVO): Promise<ApiResponse> {
    return request.post('/verifyScript', data);
  },
};

export default scriptService;
```

#### 4.1.5 执行服务

```typescript
// src/LiteFlowEditor/services/executeService.ts
import request from './request';
import { ExecuteChainRequest, ExecuteChainResponse } from './types';

const executeService = {
  /** 执行 Chain */
  execute(data: ExecuteChainRequest): Promise<ExecuteChainResponse> {
    return request.post('/executeChain', data, {
      timeout: (data.timeout || 30000) + 5000, // 留出网络延迟余量
    });
  },
};

export default executeService;
```

---

### 4.2 脚本编辑器设计

#### 4.2.1 组件结构

```
src/LiteFlowEditor/panels/settingBar/script/
├── index.tsx               # 脚本编辑器主入口
├── ScriptEditor.tsx        # 代码编辑器组件（基于 Monaco）
├── ScriptToolbar.tsx       # 脚本工具栏（验证、格式化等）
├── LanguageSelector.tsx    # 语言选择器
├── ScriptNodeTypeInfo.tsx  # 节点类型说明
├── constants.ts            # 常量配置
└── styles.less             # 样式文件
```

#### 4.2.2 核心组件设计

```typescript
// src/LiteFlowEditor/panels/settingBar/script/index.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { Tabs, Button, Space, message, Spin } from 'antd';
import { PlayCircleOutlined, CheckOutlined, SaveOutlined } from '@ant-design/icons';
import ScriptEditor from './ScriptEditor';
import ScriptToolbar from './ScriptToolbar';
import LanguageSelector from './LanguageSelector';
import scriptService from '../../../services/scriptService';
import { ScriptNodeVO, ScriptLanguage, ScriptNodeType } from '../../../services/types';
import styles from './styles.less';

interface ScriptSettingProps {
  nodeId: string;
  nodeType: ScriptNodeType;
  initialData?: ScriptNodeVO;
  onChange?: (data: ScriptNodeVO) => void;
}

const ScriptSetting: React.FC<ScriptSettingProps> = ({
  nodeId,
  nodeType,
  initialData,
  onChange,
}) => {
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [saving, setSaving] = useState(false);
  const [language, setLanguage] = useState<ScriptLanguage>(
    initialData?.language || 'groovy'
  );
  const [script, setScript] = useState(initialData?.script || '');
  const [nodeName, setNodeName] = useState(initialData?.nodeName || '');

  // 加载脚本数据
  useEffect(() => {
    if (nodeId && !initialData) {
      setLoading(true);
      scriptService.getById(nodeId)
        .then((data) => {
          setLanguage(data.language);
          setScript(data.script);
          setNodeName(data.nodeName || '');
        })
        .catch(() => {
          // 新节点，使用默认值
        })
        .finally(() => setLoading(false));
    }
  }, [nodeId, initialData]);

  // 验证脚本
  const handleVerify = useCallback(async () => {
    setVerifying(true);
    try {
      const result = await scriptService.verify({
        nodeId,
        nodeType,
        language,
        script,
      });
      if (result.code === 'S') {
        message.success('语法验证通过');
      } else {
        message.error(result.message || '语法验证失败');
      }
    } catch (error) {
      // 错误已在拦截器中处理
    } finally {
      setVerifying(false);
    }
  }, [nodeId, nodeType, language, script]);

  // 保存脚本
  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const data: ScriptNodeVO = {
        nodeId,
        nodeName,
        nodeType,
        language,
        script,
      };

      // 判断是创建还是更新
      const isNew = !initialData;
      const result = isNew
        ? await scriptService.create(data)
        : await scriptService.update(data);

      if (result.code === 'S') {
        message.success(isNew ? '创建成功' : '保存成功');
        onChange?.(data);
      }
    } catch (error) {
      // 错误已在拦截器中处理
    } finally {
      setSaving(false);
    }
  }, [nodeId, nodeName, nodeType, language, script, initialData, onChange]);

  if (loading) {
    return <Spin spinning tip="加载中..." />;
  }

  return (
    <div className={styles.scriptSetting}>
      <div className={styles.header}>
        <LanguageSelector value={language} onChange={setLanguage} />
        <Space>
          <Button
            icon={<CheckOutlined />}
            onClick={handleVerify}
            loading={verifying}
          >
            验证语法
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSave}
            loading={saving}
          >
            保存
          </Button>
        </Space>
      </div>

      <ScriptToolbar
        language={language}
        onFormat={() => {/* 格式化逻辑 */}}
      />

      <ScriptEditor
        language={language}
        value={script}
        onChange={setScript}
      />
    </div>
  );
};

export default ScriptSetting;
```

#### 4.2.3 Monaco 编辑器集成

```typescript
// src/LiteFlowEditor/panels/settingBar/script/ScriptEditor.tsx
import React, { useRef, useEffect } from 'react';
import * as monaco from 'monaco-editor';
import { ScriptLanguage } from '../../../services/types';
import { LANGUAGE_MONACO_MAP } from './constants';
import styles from './styles.less';

interface ScriptEditorProps {
  language: ScriptLanguage;
  value: string;
  onChange: (value: string) => void;
  height?: number | string;
  readOnly?: boolean;
}

const ScriptEditor: React.FC<ScriptEditorProps> = ({
  language,
  value,
  onChange,
  height = 400,
  readOnly = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  useEffect(() => {
    if (containerRef.current && !editorRef.current) {
      editorRef.current = monaco.editor.create(containerRef.current, {
        value,
        language: LANGUAGE_MONACO_MAP[language] || 'plaintext',
        theme: 'vs-dark',
        readOnly,
        minimap: { enabled: false },
        automaticLayout: true,
        fontSize: 14,
        lineNumbers: 'on',
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        tabSize: 2,
      });

      editorRef.current.onDidChangeModelContent(() => {
        const newValue = editorRef.current?.getValue() || '';
        onChange(newValue);
      });
    }

    return () => {
      editorRef.current?.dispose();
      editorRef.current = null;
    };
  }, []);

  // 语言变更时更新编辑器
  useEffect(() => {
    if (editorRef.current) {
      const model = editorRef.current.getModel();
      if (model) {
        monaco.editor.setModelLanguage(model, LANGUAGE_MONACO_MAP[language] || 'plaintext');
      }
    }
  }, [language]);

  // 外部 value 变更时更新编辑器（避免光标跳动）
  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.getValue()) {
      const position = editorRef.current.getPosition();
      editorRef.current.setValue(value);
      if (position) {
        editorRef.current.setPosition(position);
      }
    }
  }, [value]);

  return (
    <div
      ref={containerRef}
      className={styles.editorContainer}
      style={{ height }}
    />
  );
};

export default ScriptEditor;
```

#### 4.2.4 常量配置

```typescript
// src/LiteFlowEditor/panels/settingBar/script/constants.ts
import {
  ScriptLanguage,
  ScriptNodeType,
  ScriptLanguageConfig,
  ScriptNodeTypeConfig,
} from '../../../services/types';

/** 语言到 Monaco Editor 语言的映射 */
export const LANGUAGE_MONACO_MAP: Record<ScriptLanguage, string> = {
  java: 'java',
  groovy: 'groovy',
  javascript: 'javascript',
  python: 'python',
  qlexpress: 'plaintext',  // QLExpress 无原生支持
  lua: 'lua',
  aviator: 'plaintext',    // Aviator 无原生支持
  kotlin: 'kotlin',
};

/** 脚本语言配置 */
export const SCRIPT_LANGUAGES: ScriptLanguageConfig[] = [
  {
    value: 'java',
    label: 'Java',
    monacoLanguage: 'java',
    defaultTemplate: `// Java Script
// 在这里编写你的脚本逻辑
// 可以使用 defaultContext 获取上下文
return null;`,
  },
  {
    value: 'groovy',
    label: 'Groovy',
    monacoLanguage: 'groovy',
    defaultTemplate: `// Groovy Script
def context = defaultContext
// 在这里编写你的脚本逻辑
return null`,
  },
  {
    value: 'javascript',
    label: 'JavaScript',
    monacoLanguage: 'javascript',
    defaultTemplate: `// JavaScript Script
const context = defaultContext;
// 在这里编写你的脚本逻辑
return null;`,
  },
  {
    value: 'python',
    label: 'Python',
    monacoLanguage: 'python',
    defaultTemplate: `# Python Script
context = defaultContext
# 在这里编写你的脚本逻辑
return None`,
  },
  {
    value: 'qlexpress',
    label: 'QLExpress',
    monacoLanguage: 'plaintext',
    defaultTemplate: `// QLExpress Script
// 在这里编写你的脚本逻辑`,
  },
  {
    value: 'lua',
    label: 'Lua',
    monacoLanguage: 'lua',
    defaultTemplate: `-- Lua Script
local context = defaultContext
-- 在这里编写你的脚本逻辑
return nil`,
  },
  {
    value: 'aviator',
    label: 'Aviator',
    monacoLanguage: 'plaintext',
    defaultTemplate: `## Aviator Script
## 在这里编写你的脚本逻辑`,
  },
  {
    value: 'kotlin',
    label: 'Kotlin',
    monacoLanguage: 'kotlin',
    defaultTemplate: `// Kotlin Script
val context = defaultContext
// 在这里编写你的脚本逻辑
return null`,
  },
];

/** 脚本节点类型配置 */
export const SCRIPT_NODE_TYPES: ScriptNodeTypeConfig[] = [
  {
    value: 'script',
    label: '普通脚本',
    description: '普通脚本节点，用于执行通用逻辑',
  },
  {
    value: 'switch_script',
    label: '选择脚本',
    description: '用于 SWITCH 分支的选择脚本，返回要执行的分支节点 ID',
  },
  {
    value: 'boolean_script',
    label: '布尔脚本',
    description: '用于 IF/WHILE 条件判断的布尔脚本，返回 true/false',
  },
  {
    value: 'for_script',
    label: '循环脚本',
    description: '用于 FOR 循环的次数脚本，返回循环次数',
  },
];
```

---

### 4.3 执行调试面板设计

#### 4.3.1 组件结构

```
src/LiteFlowEditor/panels/debugPanel/
├── index.tsx               # 调试面板主入口
├── ExecuteConfig.tsx       # 执行配置（参数输入、超时设置）
├── ExecuteStatus.tsx       # 执行状态展示
├── ExecuteResult.tsx       # 执行结果展示
├── ExecutionPath.tsx       # 执行路径可视化
├── StepDetailDrawer.tsx    # 步骤详情抽屉
├── ContextDiff.tsx         # Context 变化对比
├── hooks/
│   ├── useExecute.ts       # 执行逻辑 Hook
│   └── useExecutionHighlight.ts  # 执行路径高亮 Hook
├── constants.ts            # 常量配置
└── styles.less             # 样式文件
```

#### 4.3.2 核心组件设计

```typescript
// src/LiteFlowEditor/panels/debugPanel/index.tsx
import React, { useState, useCallback } from 'react';
import { Drawer, Tabs, Space, Button, Badge } from 'antd';
import {
  PlayCircleOutlined,
  StopOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import ExecuteConfig from './ExecuteConfig';
import ExecuteStatus from './ExecuteStatus';
import ExecuteResult from './ExecuteResult';
import ExecutionPath from './ExecutionPath';
import StepDetailDrawer from './StepDetailDrawer';
import { useExecute } from './hooks/useExecute';
import { useExecutionHighlight } from './hooks/useExecutionHighlight';
import { ExecuteChainRequest, StepDetail } from '../../services/types';
import styles from './styles.less';

interface DebugPanelProps {
  visible: boolean;
  chainId: string;
  onClose: () => void;
}

const DebugPanel: React.FC<DebugPanelProps> = ({
  visible,
  chainId,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState('config');
  const [selectedStep, setSelectedStep] = useState<StepDetail | null>(null);

  const {
    executing,
    result,
    error,
    execute,
    reset,
  } = useExecute();

  // 执行路径高亮
  useExecutionHighlight(result?.executionPath || []);

  // 执行 Chain
  const handleExecute = useCallback(async (config: Omit<ExecuteChainRequest, 'chainId'>) => {
    setActiveTab('status');
    await execute({ chainId, ...config });
    setActiveTab('result');
  }, [chainId, execute]);

  // 停止执行（暂不支持，预留接口）
  const handleStop = useCallback(() => {
    // TODO: 实现取消执行逻辑
  }, []);

  // 重置
  const handleReset = useCallback(() => {
    reset();
    setActiveTab('config');
    setSelectedStep(null);
  }, [reset]);

  return (
    <Drawer
      title={
        <Space>
          <span>Chain 执行调试</span>
          {executing && <Badge status="processing" text="执行中" />}
          {result?.success && <Badge status="success" text="成功" />}
          {result && !result.success && <Badge status="error" text="失败" />}
        </Space>
      }
      placement="bottom"
      height={400}
      open={visible}
      onClose={onClose}
      mask={false}
      extra={
        <Space>
          {!executing && (
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={() => {
                // 触发执行
                const configRef = document.querySelector('[data-config-submit]');
                if (configRef) {
                  (configRef as HTMLButtonElement).click();
                }
              }}
            >
              执行
            </Button>
          )}
          {executing && (
            <Button
              danger
              icon={<StopOutlined />}
              onClick={handleStop}
            >
              停止
            </Button>
          )}
          <Button onClick={handleReset}>重置</Button>
          <Button type="text" icon={<CloseOutlined />} onClick={onClose} />
        </Space>
      }
    >
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'config',
            label: '执行配置',
            children: (
              <ExecuteConfig
                chainId={chainId}
                onExecute={handleExecute}
                disabled={executing}
              />
            ),
          },
          {
            key: 'status',
            label: '执行状态',
            children: (
              <ExecuteStatus
                executing={executing}
                result={result}
                error={error}
              />
            ),
          },
          {
            key: 'result',
            label: '执行结果',
            children: (
              <ExecuteResult
                result={result}
                onStepClick={setSelectedStep}
              />
            ),
          },
          {
            key: 'path',
            label: '执行路径',
            children: (
              <ExecutionPath
                result={result}
                onStepClick={setSelectedStep}
              />
            ),
          },
        ]}
      />

      <StepDetailDrawer
        step={selectedStep}
        onClose={() => setSelectedStep(null)}
      />
    </Drawer>
  );
};

export default DebugPanel;
```

#### 4.3.3 执行逻辑 Hook

```typescript
// src/LiteFlowEditor/panels/debugPanel/hooks/useExecute.ts
import { useState, useCallback } from 'react';
import executeService from '../../../services/executeService';
import { ExecuteChainRequest, ExecuteChainResponse } from '../../../services/types';

interface UseExecuteResult {
  executing: boolean;
  result: ExecuteChainResponse | null;
  error: Error | null;
  execute: (request: ExecuteChainRequest) => Promise<void>;
  reset: () => void;
}

export function useExecute(): UseExecuteResult {
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<ExecuteChainResponse | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async (request: ExecuteChainRequest) => {
    setExecuting(true);
    setResult(null);
    setError(null);

    try {
      const response = await executeService.execute(request);
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setExecuting(false);
    }
  }, []);

  const reset = useCallback(() => {
    setExecuting(false);
    setResult(null);
    setError(null);
  }, []);

  return {
    executing,
    result,
    error,
    execute,
    reset,
  };
}
```

#### 4.3.4 执行路径高亮 Hook

```typescript
// src/LiteFlowEditor/panels/debugPanel/hooks/useExecutionHighlight.ts
import { useEffect } from 'react';
import { useGraph } from '../../../hooks/useGraph';

export function useExecutionHighlight(executionPath: string[]) {
  const graph = useGraph();

  useEffect(() => {
    if (!graph || executionPath.length === 0) {
      return;
    }

    // 获取所有节点
    const nodes = graph.getNodes();

    // 重置所有节点样式
    nodes.forEach((node) => {
      node.attr('body/stroke', '#d9d9d9');
      node.attr('body/strokeWidth', 1);
    });

    // 高亮执行路径上的节点
    executionPath.forEach((nodeId, index) => {
      const node = nodes.find((n) => {
        const data = n.getData();
        return data?.model?.id === nodeId;
      });

      if (node) {
        // 根据执行顺序设置不同的高亮颜色
        const isLast = index === executionPath.length - 1;
        node.attr('body/stroke', isLast ? '#52c41a' : '#1890ff');
        node.attr('body/strokeWidth', 3);
      }
    });

    // 清理函数：重置样式
    return () => {
      nodes.forEach((node) => {
        node.attr('body/stroke', '#d9d9d9');
        node.attr('body/strokeWidth', 1);
      });
    };
  }, [graph, executionPath]);
}
```

#### 4.3.5 执行配置组件

```typescript
// src/LiteFlowEditor/panels/debugPanel/ExecuteConfig.tsx
import React, { useState } from 'react';
import { Form, InputNumber, Button, Space } from 'antd';
import { PlayCircleOutlined } from '@ant-design/icons';
import { ExecuteChainRequest } from '../../services/types';
import JsonEditor from './JsonEditor';
import styles from './styles.less';

interface ExecuteConfigProps {
  chainId: string;
  onExecute: (config: Omit<ExecuteChainRequest, 'chainId'>) => void;
  disabled?: boolean;
}

const ExecuteConfig: React.FC<ExecuteConfigProps> = ({
  chainId,
  onExecute,
  disabled,
}) => {
  const [form] = Form.useForm();
  const [requestData, setRequestData] = useState<Record<string, any>>({});

  const handleSubmit = () => {
    const values = form.getFieldsValue();
    onExecute({
      requestData,
      timeout: values.timeout,
    });
  };

  return (
    <div className={styles.executeConfig}>
      <Form
        form={form}
        layout="vertical"
        initialValues={{ timeout: 30000 }}
      >
        <Form.Item label="Chain ID">
          <span className={styles.chainId}>{chainId}</span>
        </Form.Item>

        <Form.Item
          label="请求参数（Context）"
          help="输入 JSON 格式的请求参数，将放入执行上下文中"
        >
          <JsonEditor
            value={requestData}
            onChange={setRequestData}
            height={150}
          />
        </Form.Item>

        <Form.Item
          name="timeout"
          label="超时时间（毫秒）"
        >
          <InputNumber
            min={1000}
            max={300000}
            step={1000}
            style={{ width: 200 }}
          />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            onClick={handleSubmit}
            disabled={disabled}
            data-config-submit
          >
            开始执行
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default ExecuteConfig;
```

#### 4.3.6 执行结果组件

```typescript
// src/LiteFlowEditor/panels/debugPanel/ExecuteResult.tsx
import React from 'react';
import {
  Descriptions,
  Table,
  Tag,
  Typography,
  Space,
  Tooltip,
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { ExecuteChainResponse, StepDetail } from '../../services/types';
import styles from './styles.less';

interface ExecuteResultProps {
  result: ExecuteChainResponse | null;
  onStepClick?: (step: StepDetail) => void;
}

const ExecuteResult: React.FC<ExecuteResultProps> = ({
  result,
  onStepClick,
}) => {
  if (!result) {
    return <div className={styles.empty}>暂无执行结果</div>;
  }

  const columns = [
    {
      title: '序号',
      dataIndex: 'stepIndex',
      width: 60,
    },
    {
      title: '节点ID',
      dataIndex: 'nodeId',
      width: 120,
      ellipsis: true,
    },
    {
      title: '节点名称',
      dataIndex: 'nodeName',
      width: 120,
      ellipsis: true,
    },
    {
      title: '类型',
      dataIndex: 'nodeType',
      width: 100,
    },
    {
      title: '状态',
      dataIndex: 'success',
      width: 80,
      render: (success: boolean) => (
        success
          ? <Tag icon={<CheckCircleOutlined />} color="success">成功</Tag>
          : <Tag icon={<CloseCircleOutlined />} color="error">失败</Tag>
      ),
    },
    {
      title: '耗时',
      dataIndex: 'timeSpent',
      width: 100,
      render: (time: number) => (
        <Space>
          <ClockCircleOutlined />
          {time}ms
        </Space>
      ),
    },
    {
      title: '操作',
      width: 80,
      render: (_: any, record: StepDetail) => (
        <a onClick={() => onStepClick?.(record)}>详情</a>
      ),
    },
  ];

  return (
    <div className={styles.executeResult}>
      <Descriptions
        title="执行概览"
        column={4}
        size="small"
        bordered
      >
        <Descriptions.Item label="执行状态">
          {result.success
            ? <Tag color="success">成功</Tag>
            : <Tag color="error">失败</Tag>
          }
        </Descriptions.Item>
        <Descriptions.Item label="总耗时">
          {result.executionTime}ms
        </Descriptions.Item>
        <Descriptions.Item label="节点数">
          {result.nodeCount}
        </Descriptions.Item>
        <Descriptions.Item label="请求ID">
          <Tooltip title={result.requestId}>
            <Typography.Text ellipsis style={{ maxWidth: 150 }}>
              {result.requestId}
            </Typography.Text>
          </Tooltip>
        </Descriptions.Item>
      </Descriptions>

      {result.message && (
        <div className={styles.message}>
          <Typography.Text type={result.success ? 'success' : 'danger'}>
            {result.message}
          </Typography.Text>
        </div>
      )}

      <div className={styles.stepTable}>
        <Typography.Title level={5}>执行步骤详情</Typography.Title>
        <Table
          dataSource={result.stepDetails}
          columns={columns}
          rowKey="nodeId"
          size="small"
          pagination={false}
          scroll={{ y: 200 }}
        />
      </div>

      {result.exceptionStack && (
        <div className={styles.exception}>
          <Typography.Title level={5} type="danger">异常信息</Typography.Title>
          <pre>{result.exceptionStack}</pre>
        </div>
      )}
    </div>
  );
};

export default ExecuteResult;
```

---

### 4.4 脚本节点物料扩展

#### 4.4.1 节点类型常量扩展

```typescript
// src/LiteFlowEditor/constant/index.ts（扩展）

// 现有的 NodeTypeEnum 扩展
export enum NodeTypeEnum {
  COMMON = 'common',
  // 新增脚本节点类型
  SCRIPT = 'script',
  SWITCH_SCRIPT = 'switch_script',
  BOOLEAN_SCRIPT = 'boolean_script',
  FOR_SCRIPT = 'for_script',
}
```

#### 4.4.2 脚本节点定义

```typescript
// src/LiteFlowEditor/cells/script.ts（新增）
import { register } from '@antv/x6-react-shape';
import { Graph, Node } from '@antv/x6';
import NodeView from '../components/NodeView';
import { NodeTypeEnum } from '../constant';

// 脚本节点样式配置
const SCRIPT_NODE_CONFIG = {
  [NodeTypeEnum.SCRIPT]: {
    label: '脚本',
    color: '#722ed1',
    icon: 'script-icon',
  },
  [NodeTypeEnum.SWITCH_SCRIPT]: {
    label: '选择脚本',
    color: '#eb2f96',
    icon: 'switch-script-icon',
  },
  [NodeTypeEnum.BOOLEAN_SCRIPT]: {
    label: '布尔脚本',
    color: '#13c2c2',
    icon: 'boolean-script-icon',
  },
  [NodeTypeEnum.FOR_SCRIPT]: {
    label: '循环脚本',
    color: '#fa8c16',
    icon: 'for-script-icon',
  },
};

// 注册脚本节点
Object.entries(SCRIPT_NODE_CONFIG).forEach(([type, config]) => {
  register({
    shape: type,
    inherit: 'react-shape',
    width: 180,
    height: 36,
    component(node: Node) {
      return (
        <NodeView
          node={node}
          label={config.label}
          color={config.color}
          isScript={true}
        />
      );
    },
  });
});

export const SCRIPT_NODE_GROUP = [
  { type: NodeTypeEnum.SCRIPT, label: '普通脚本' },
  { type: NodeTypeEnum.SWITCH_SCRIPT, label: '选择脚本' },
  { type: NodeTypeEnum.BOOLEAN_SCRIPT, label: '布尔脚本' },
  { type: NodeTypeEnum.FOR_SCRIPT, label: '循环脚本' },
];

export default SCRIPT_NODE_CONFIG;
```

#### 4.4.3 物料区扩展

```typescript
// src/LiteFlowEditor/panels/sideBar/index.tsx（扩展）
import { SCRIPT_NODE_GROUP } from '../../cells/script';

// 在现有分组基础上添加脚本节点组
const NODE_GROUPS = [
  // ... 现有分组
  {
    key: 'script',
    title: '脚本节点',
    items: SCRIPT_NODE_GROUP,
  },
];
```

---

### 4.5 工具栏扩展

#### 4.5.1 执行按钮组件

```typescript
// src/LiteFlowEditor/panels/toolBar/widgets/ExecuteButton.tsx（新增）
import React, { useState, useCallback } from 'react';
import { Button, Tooltip } from 'antd';
import { PlayCircleOutlined, BugOutlined } from '@ant-design/icons';
import DebugPanel from '../../debugPanel';
import { useModel } from '../../../hooks/useModel';
import styles from './styles.less';

const ExecuteButton: React.FC = () => {
  const [debugVisible, setDebugVisible] = useState(false);
  const model = useModel();

  const handleClick = useCallback(() => {
    setDebugVisible(true);
  }, []);

  const handleClose = useCallback(() => {
    setDebugVisible(false);
  }, []);

  // 获取当前 Chain ID
  const chainId = model?.properties?.chainId || 'chain1';

  return (
    <>
      <Tooltip title="执行调试">
        <Button
          type="text"
          icon={<BugOutlined />}
          onClick={handleClick}
          className={styles.toolButton}
        />
      </Tooltip>

      <DebugPanel
        visible={debugVisible}
        chainId={chainId}
        onClose={handleClose}
      />
    </>
  );
};

export default ExecuteButton;
```

---

## 五、技术选型

### 5.1 核心依赖

| 库 | 版本 | 用途 |
|----|------|------|
| React | 18.x | UI 框架 |
| TypeScript | 5.x | 类型系统 |
| Ant Design | 4.x | UI 组件库 |
| @antv/x6 | 2.x | 图编辑引擎 |
| Monaco Editor | 0.44.x | 代码编辑器 |
| axios | 1.x | HTTP 请求 |

### 5.2 新增依赖

```json
{
  "dependencies": {
    "monaco-editor": "^0.44.0",
    "@monaco-editor/react": "^4.6.0",
    "axios": "^1.6.0"
  }
}
```

### 5.3 Monaco Editor 语言支持

| 语言 | Monaco 支持 | 备注 |
|------|-------------|------|
| Java | ✅ 原生 | 内置支持 |
| Groovy | ✅ 原生 | 需加载额外语言包 |
| JavaScript | ✅ 原生 | 内置支持 |
| Python | ✅ 原生 | 需加载额外语言包 |
| QLExpress | ❌ | 使用 plaintext |
| Lua | ✅ 原生 | 需加载额外语言包 |
| Aviator | ❌ | 使用 plaintext |
| Kotlin | ✅ 原生 | 需加载额外语言包 |

---

## 六、交互设计

### 6.1 脚本编辑交互流程

```
┌─────────────────────────────────────────────────────────────────────┐
│                        脚本编辑交互流程                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐          │
│  │ 选中节点 │ → │ 打开编辑器 │ → │ 编写脚�� │ → │ 验证语法 │          │
│  └─────────┘   └──────────┘   └──────────┘   └────┬─────┘          │
│                                                   │                 │
│                               ┌───────────────────┴───────┐         │
│                               ▼                           ▼         │
│                         ┌──────────┐               ┌──────────┐     │
│                         │ 验证通过 │               │ 验证失败 │     │
│                         └────┬─────┘               └────┬─────┘     │
│                              │                          │           │
│                              ▼                          ▼           │
│                         ┌──────────┐               ┌──────────┐     │
│                         │ 保存脚本 │               │ 显示错误 │     │
│                         └────┬─────┘               └──────────┘     │
│                              │                                      │
│                              ▼                                      │
│                         ┌──────────┐                                │
│                         │ 更新模型 │                                │
│                         └──────────┘                                │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 6.2 Chain 执行交互流程

```
┌────────��────────────────────────────────────────────────────────────┐
│                       Chain 执行交互流程                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌───────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐        │
│  │ 打开调试板 │ → │ 配置参数 │ → │ 点击执行 │ → │ 执行中... │        │
│  └───────────┘   └──────────┘   └──────────┘   └────┬─────┘        │
│                                                     │               │
│                                 ┌───────────────────┴───────┐       │
│                                 ▼                           ▼       │
│                           ┌──────────┐               ┌──────────┐   │
│                           │ 执行成功 │               │ 执行失败 │   │
│                           └────┬─────┘               └────┬─────┘   │
│                                │                          │         │
│            ┌───────────────────┴───────┐                  │         │
│            ▼                           ▼                  ▼         │
│       ┌──────────┐            ┌──────────────┐    ┌──────────────┐  │
│       │ 高亮路径 │            │ 显示执行详情 │    │ 显示异常信息 │  │
│       └──────────┘            └──────────────┘    └──────────────┘  │
│                                                                     │
└────────────────────────────────────────────────────────────────────���┘
```

### 6.3 UI 布局设计

#### 脚本编辑器布局

```
┌─────────────────────────────────────────────────────────────────┐
│ 脚本编辑器                                              [X]    │
├─────────────────────────────────────────────────────────────────┤
│ ┌─────────────────┐  ┌─────────────────────────────────────────┐│
│ │ 语言: [Groovy▼] │  │ [验证语法] [格式化] [保存]              ││
│ └─────────────────┘  └─────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 1  │ // Groovy Script                                       │ │
│ │ 2  │ def context = defaultContext                           │ │
│ │ 3  │ // 在这里编写你的脚本逻辑                               │ │
│ │ 4  │                                                        │ │
│ │ 5  │ return null                                            │ │
│ │    │                                                        │ │
│ │    │                                                        │ │
│ │    │                                                        │ │
│ └─────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│ [ℹ️] 普通脚本节点，用于执行通用逻辑                             │
└─────────────────────────────────────────────────────────────────┘
```

#### 执行调试面板布局

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Chain 执行调试                           [● 执行中]     [执行] [重置] [X]   │
├────────────────┬────────────────┬────────────────┬──────────────────────────┤
│  执行配置      │  执行状态      │  执行结果      │  执行路径                │
├────────────────┴────────────────┴────────────────┴──────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Chain ID: chain1                                                     │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │ 请求参数（Context）：                                                │   │
│  │ ┌─────────────────────────────────────────────────────────────────┐ │   │
│  │ │ {                                                               │ │   │
│  │ │   "userId": "12345",                                            │ │   │
│  │ │   "orderNo": "ORD001"                                           │ │   │
│  │ │ }                                                               │ │   │
│  │ └─────────────────────────────────────────────────────────────────┘ │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │ 超时时间: [30000    ] 毫秒                                          │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │                              [▶ 开始执行]                           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 七、实施计划

### 7.1 开发阶段划分

| 阶段 | 内容 | 交付物 |
|------|------|--------|
| **阶段一** | API 服务层 + 类型定义 | 完整的服务层代码 |
| **阶段二** | 脚本节点物料扩展 | 脚本节点类型和物料 |
| **阶段三** | 脚本编辑器开发 | 完整的脚本编辑功能 |
| **阶段四** | 执行调试面板开发 | 完整的执行调试功能 |
| **阶段五** | 集成测试 + 优化 | 可发布版本 |

### 7.2 里程碑

```
阶段一 ────────► 阶段二 ────────► 阶段三 ────────► 阶段四 ────────► 阶段五
  │                │                │                │                │
  ▼                ▼                ▼                ▼                ▼
API 层完成     节点扩展完成     编辑器完成     调试面板完成      发布上线
```

---

## 八、风险与应对

### 8.1 技术风险

| 风险 | 影响 | 应对措施 |
|------|------|----------|
| Monaco Editor 体积大 | 首屏加载慢 | 按需加载、CDN 引入 |
| 脚本执行超时 | 用户体验差 | 超时提示、取消机制 |
| 多语言语法高亮支持不全 | 编辑体验差 | 降级为纯文本模式 |

### 8.2 业务风险

| 风险 | 影响 | 应对措施 |
|------|------|----------|
| 后端 API 变更 | 前端功能异常 | 接口文档同步、版本管理 |
| 脚本语法错误多 | 用户挫败感 | 语法提示、错误高亮 |

---

## 九、附录

### 9.1 文件清单

```
新增文件：
├── src/LiteFlowEditor/services/
│   ├── index.ts
│   ├── request.ts
│   ├── types.ts
│   ├── scriptService.ts
│   └── executeService.ts
├── src/LiteFlowEditor/panels/settingBar/script/
│   ├── index.tsx
│   ├── ScriptEditor.tsx
│   ├── ScriptToolbar.tsx
│   ├── LanguageSelector.tsx
│   ├── constants.ts
│   └── styles.less
├── src/LiteFlowEditor/panels/debugPanel/
│   ├── index.tsx
│   ├── ExecuteConfig.tsx
│   ├── ExecuteStatus.tsx
│   ├── ExecuteResult.tsx
│   ├── ExecutionPath.tsx
│   ├── StepDetailDrawer.tsx
│   ├── ContextDiff.tsx
│   ├── JsonEditor.tsx
│   ├── hooks/
│   │   ├── useExecute.ts
│   │   └── useExecutionHighlight.ts
│   ├── constants.ts
│   └── styles.less
├── src/LiteFlowEditor/cells/script.ts
└── src/LiteFlowEditor/panels/toolBar/widgets/ExecuteButton.tsx

修改文件：
├── src/LiteFlowEditor/constant/index.ts（扩展 NodeTypeEnum）
├── src/LiteFlowEditor/cells/index.tsx（添加脚本节点组）
├── src/LiteFlowEditor/panels/sideBar/index.tsx（添加脚本节点物料）
├── src/LiteFlowEditor/panels/toolBar/index.tsx（添加执行按钮）
└── src/LiteFlowEditor/panels/settingBar/index.tsx（添加脚本编辑 Tab）
```

### 9.2 参考资料

- [LiteFlow 官方文档](https://liteflow.cc/)
- [AntV X6 官方文档](https://x6.antv.vision/zh/)
- [Monaco Editor 官方文档](https://microsoft.github.io/monaco-editor/)
- [Ant Design 官方文档](https://ant.design/components/overview-cn/)
