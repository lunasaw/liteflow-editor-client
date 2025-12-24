import React, { useState, useEffect, useCallback, useContext, useRef, useMemo } from 'react';
import request from 'umi-request';
import {Select, Button, Tooltip, Modal, Input, Form} from 'antd';
import { DeleteOutlined, SaveOutlined, PlusOutlined, CopyOutlined } from '@ant-design/icons';
import { GraphContext } from '../../../../src/index';
import mockData from '../../../../src/LiteFlowEditor/mock';
import './index.less';

// 测试数据集模板
const MOCK_TEMPLATES = Object.keys(mockData).map(key => ({
  templateId: `[模板] ${key}`,
  elJson: mockData[key],
}));

type Chain = {
  chainId: string;
  elJson: any;
}

type CmpItem = {
  cmpId: string;
  cmpName?: string;
  nodeType?: string;
}

// 节点类型信息（来自 /api/getNodeTypeMap 接口）
type NodeTypeInfo = {
  nodeId: string;
  nodeName: string;
  nodeType: string | null;  // script, boolean_script, switch_script, for_script
  language: string | null;
  isScriptNode: boolean;
  liteflowNodeType: string;  // SCRIPT, BOOLEAN_SCRIPT, SWITCH_SCRIPT, FOR_SCRIPT, COMMON
}

// 前端节点类型 -> 后端 nodeType 映射
const NODE_TYPE_MAP: Record<string, string> = {
  // Node 类型
  'NodeComponent': 'script',
  'NodeIfComponent': 'boolean_script',
  'NodeWhileComponent': 'boolean_script',
  'NodeBreakComponent': 'boolean_script',
  'NodeSwitchComponent': 'switch_script',
  'NodeForComponent': 'for_script',
  'NodeBooleanComponent': 'boolean_script',
  'NodeIteratorComponent': 'script',
  'NodeVirtualComponent': 'script',
  // Script 类型
  'ScriptCommonComponent': 'script',
  'ScriptBooleanComponent': 'boolean_script',
  'ScriptSwitchComponent': 'switch_script',
  'ScriptIfComponent': 'boolean_script',
  'ScriptForComponent': 'for_script',
  'ScriptWhileComponent': 'boolean_script',
  'ScriptBreakComponent': 'boolean_script',
};

// 从 elJson 递归提取所有节点（Node 和 Script 类型）
const extractNodes = (elJson: any): Array<{ id: string; type: string }> => {
  const nodes: Array<{ id: string; type: string }> = [];
  if (!elJson) return nodes;

  const traverse = (node: any) => {
    if (!node) return;
    // 如果是节点类型（以 Node 或 Script 开头），且有 id，记录下来
    if (node.type && (node.type.startsWith('Node') || node.type.startsWith('Script')) && node.id) {
      nodes.push({ id: node.id, type: node.type });
    }
    // 递归遍历 children
    if (node.children && Array.isArray(node.children)) {
      node.children.forEach(traverse);
    }
    // 递归遍历 condition
    if (node.condition) {
      traverse(node.condition);
    }
  };

  traverse(elJson);
  return nodes;
};

// 根据编排类型获取条件节点的后端类型
const getConditionNodeType = (parentType: string, nodeType: string): string => {
  // 根据父节点编排类型决定条件节点类型
  switch (parentType) {
    case 'FOR':
      return 'for_script';  // FOR 循环条件返回循环次数
    case 'WHILE':
      return 'boolean_script';  // WHILE 循环条件返回布尔值
    case 'IF':
      return 'boolean_script';  // IF 条件返回布尔值
    case 'SWITCH':
      return 'switch_script';  // SWITCH 条件返回选择值
    case 'ITERATOR':
      return 'iterator_script';  // ITERATOR 返回迭代器
    default:
      return NODE_TYPE_MAP[nodeType] || 'script';
  }
};

// 将 elJson 中的前端节点类型转换为后端类型
const convertNodeTypes = (elJson: any): any => {
  if (!elJson) return elJson;

  const convert = (node: any, parentType?: string, isCondition?: boolean): any => {
    if (!node) return node;

    const newNode = { ...node };

    // 如果是条件节点，根据父节点类型转换
    if (isCondition && parentType) {
      newNode.type = getConditionNodeType(parentType, node.type);
    }
    // 如果是普通节点类型，使用映射表转换
    else if (newNode.type && NODE_TYPE_MAP[newNode.type]) {
      newNode.type = NODE_TYPE_MAP[newNode.type];
    }

    // 递归转换 children（非条件节点）
    if (newNode.children && Array.isArray(newNode.children)) {
      newNode.children = newNode.children.map((child: any) => convert(child));
    }

    // 递归转换 condition（条件节点，传递父节点类型）
    if (newNode.condition) {
      newNode.condition = convert(newNode.condition, node.type, true);
    }

    return newNode;
  };

  return convert(elJson);
};

const ChainManager: React.FC = () => {
  const [chains, setChains] = useState<Array<Chain>>([]);
  const [currentChain, setCurrentChain] = useState<Chain>();
  const [cmpList, setCmpList] = useState<CmpItem[]>([]);

  const getChainList = useCallback(() => {
    return request(`/api/getChainList`, { method: 'GET' })
            .then((data) => {
              if (data && data.length) {
                setChains(data);
              }
            })
  }, [setChains]);

  const getCmpList = useCallback(() => {
    return request(`/api/getCmpList`, { method: 'GET' })
            .then((data) => {
              if (data && Array.isArray(data)) {
                setCmpList(data);
              }
            })
  }, []);

  useEffect(() => {
    getChainList();
    getCmpList();
  }, []);

  const { currentEditor } = useContext<any>(GraphContext)

  // 下拉框选项：服务器数据 + 测试模板
  const selectOptions = useMemo(() => {
    const serverOptions = chains.map(({ chainId }: Chain) => ({
      label: chainId,
      value: chainId,
      isTemplate: false,
    }));
    const templateOptions = MOCK_TEMPLATES.map(t => ({
      label: t.templateId,
      value: t.templateId,
      isTemplate: true,
    }));
    return [
      { label: '服务器数据', options: serverOptions },
      { label: '测试模板', options: templateOptions },
    ];
  }, [chains]);

  const handleOnChange = (value: string) => {
    // 检查是否是测试模板
    const template = MOCK_TEMPLATES.find(t => t.templateId === value);
    if (template) {
      // 选择测试模板：加载数据，进入新增状态（清空 chainId）
      currentEditor.fromJSON(template.elJson);
      setCurrentChain(undefined);
      return;
    }

    // 选择服务器数据：加载数据，设置 chainId
    setCurrentChain(chains.find(chain => chain.chainId === value));
    request(`/api/getChainById?chainId=${value}`, { method: 'GET' })
      .then((data) => {
        if (data?.elJson) {
          currentEditor.fromJSON(data.elJson, value);
        }
      });
  };

  // 校验节点类型
  // 规则：节点已存在时校验类型是否匹配，不存在的节点由后端在保存 chain 时自动创建
  const ensureNodesExist = async (elJson: any): Promise<boolean> => {
    const nodes = extractNodes(elJson);
    if (nodes.length === 0) return true;

    // 使用新接口获取所有节点的类型信息（更准确）
    const nodeTypeMap: Record<string, NodeTypeInfo> = await request(`/api/getNodeTypeMap`, { method: 'GET' })
      .then((data) => data || {})
      .catch(() => ({}));

    const errors: string[] = [];

    for (const node of nodes) {
      const expectedType = NODE_TYPE_MAP[node.type] || 'script';
      const existingNodeInfo = nodeTypeMap[node.id];

      // 只有节点已存在时才需要校验类型，不存在的节点由后端在保存 chain 时自动创建
      if (existingNodeInfo) {
        // 使用 nodeTypeInfo 中的类型信息进行校验
        // 非脚本节点（Java 组件）的 nodeType 为 null，使用 liteflowNodeType 判断
        const actualType = existingNodeInfo.isScriptNode
          ? existingNodeInfo.nodeType
          : 'script';  // Java 组件默认当作 script 类型

        if (actualType && actualType !== expectedType) {
          errors.push(`节点 "${node.id}" 类型不匹配：当前使用场景需要 "${expectedType}"，但已注册类型为 "${actualType}" (${existingNodeInfo.liteflowNodeType})。请修改节点 ID 或使用其他节点`);
        }
        // 类型匹配则可以使用
      }
      // 节点不存在：后端会在保存 chain 时自动创建，无需前端处理
    }

    // 如果有错误，显示并返回
    if (errors.length > 0) {
      Modal.error({
        title: '节点校验失败',
        content: (
          <div>
            <p style={{ marginBottom: 12, color: '#666' }}>
              以下节点存在问题，请在画布中修改节点 ID 后重试：
            </p>
            {errors.map((err, idx) => (
              <div key={idx} style={{ marginBottom: 8, paddingLeft: 8, borderLeft: '2px solid #ff4d4f' }}>
                {err}
              </div>
            ))}
          </div>
        ),
        width: 520,
      });
      return false;
    }

    return true;
  };

  const newChainIdRef = useRef<string>('');

  // 执行实际的保存操作（创建节点 + 保存 chain）
  const doSaveChain = async (chainId: string, elJson: any, isNew: boolean) => {
    // 先检查并创建缺失的节点
    const nodesReady = await ensureNodesExist(elJson);
    if (!nodesReady) return false;

    // 转换节点类型为后端格式
    const convertedElJson = convertNodeTypes(elJson);

    // 打印当前创建/更新的 Chain 结构体到控制台
    console.group(`🔗 ${isNew ? '创建' : '更新'} Chain: ${chainId}`);
    console.log('📦 原始 elJson 结构:', JSON.stringify(elJson, null, 2));
    console.log('🔄 转换后 elJson 结构:', JSON.stringify(convertedElJson, null, 2));
    console.log('📊 详细信息:');
    console.table({
      ChainID: chainId,
      操作类型: isNew ? '创建新 Chain' : '更新现有 Chain',
      节点数量: extractNodes(elJson).length,
      时间戳: new Date().toLocaleString('zh-CN'),
    });
    console.log('📝 提取的所有节点:', extractNodes(elJson));
    console.groupEnd();

    if (isNew) {
      // 新建 chain
      const data = await request(`/api/createChain`, {
        method: 'POST',
        data: { chainId, elJson: convertedElJson }
      });

      if (data.code === 'S') {
        Modal.success({ title: '操作成功', content: data.message });
        const newChain = { chainId, elJson };
        setChains([...chains, newChain]);
        setCurrentChain(newChain);
        currentEditor.setChainId(chainId);
        return true;
      } else {
        Modal.error({ title: '操作失败', content: data.message });
        return false;
      }
    } else {
      // 更新 chain
      const data = await request(`/api/updateChain`, {
        method: 'POST',
        data: { chainId, elJson: convertedElJson }
      });

      if (data.code === 'S') {
        Modal.success({ title: '操作成功', content: data.message });
        return true;
      } else {
        Modal.error({ title: '操作失败', content: data.message });
        return false;
      }
    }
  };

  const handleSave = async () => {
    const elJson = currentEditor.toJSON();

    // 如果没有 chainId，先弹窗让用户输入
    if (!currentChain?.chainId) {
      Modal.confirm({
        title: '新建 Chain',
        content: (
          <div style={{ marginTop: 16 }}>
            <span>请输入 Chain ID：</span>
            <Input
              placeholder="请输入 Chain ID"
              onChange={(e) => { newChainIdRef.current = e.target.value }}
              style={{ marginTop: 8 }}
            />
          </div>
        ),
        async onOk() {
          const chainId = newChainIdRef.current.trim();
          if (!chainId) {
            Modal.error({ title: '错误', content: '请输入 Chain ID' });
            return Promise.reject();
          }
          // 用户确认 chainId 后，再执行保存（包括创建节点）
          const success = await doSaveChain(chainId, elJson, true);
          if (!success) {
            return Promise.reject();
          }
        }
      });
      return;
    }

    // 已有 chainId，直接保存
    await doSaveChain(currentChain.chainId, elJson, false);
  }

  const handleDelete = () => {
    Modal.confirm({
      title: '操作确认',
      content: '请确认是否删除当前记录？',
      onOk() {
        return request(`/api/deleteChain`, {
          method: 'POST',
          data: {...currentChain}
        })
          .then((data) => {
            if (data.code === 'S') {
              Modal.success({ title: '操作成功', content: data.message })
              setCurrentChain(undefined)
              setChains(chains.filter(chain => chain !== currentChain))
            } else {
              Modal.error({ title: '操作失败', content: data.message })
            }
          })
      }
    })
  }

  // 新增弹窗相关状态
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addForm] = Form.useForm();

  // 合并服务器数据和测试模板作为模板选项
  const allTemplates = useMemo(() => {
    const serverTemplates = chains.map(chain => ({
      templateId: chain.chainId,
      elJson: chain.elJson,
      isServerData: true,
    }));
    return [...MOCK_TEMPLATES, ...serverTemplates];
  }, [chains]);

  // 打开新增弹窗
  const handleShowAddModal = () => {
    setIsAddModalOpen(true);
    addForm.resetFields();
  };

  // 确认新增：加载模板到画布
  const handleAddConfirm = async () => {
    const { templateId } = addForm.getFieldsValue();
    let elJson = {};

    if (templateId) {
      const template = allTemplates.find(t => t.templateId === templateId);
      if (template) {
        elJson = template.elJson;
      }
    }

    // 加载到画布，清空 chainId
    currentEditor.fromJSON(elJson);
    setCurrentChain(undefined);
    setIsAddModalOpen(false);
  };

  // 创建空白画布
  const handleCreateEmpty = () => {
    currentEditor.fromJSON({});
    setCurrentChain(undefined);
    setIsAddModalOpen(false);
  };

  // 另存为：将当前 chain 以新的 chainId 保存
  const handleSaveAs = () => {
    const elJson = currentEditor.toJSON();
    newChainIdRef.current = '';

    Modal.confirm({
      title: '另存为',
      content: (
        <div style={{ marginTop: 16 }}>
          <span>请输入新的 Chain ID：</span>
          <Input
            placeholder="请输入新的 Chain ID"
            onChange={(e) => { newChainIdRef.current = e.target.value }}
            style={{ marginTop: 8 }}
          />
        </div>
      ),
      async onOk() {
        const chainId = newChainIdRef.current.trim();
        if (!chainId) {
          Modal.error({ title: '错误', content: '请输入 Chain ID' });
          return Promise.reject();
        }
        // 检查是否已存在
        if (chains.some(c => c.chainId === chainId)) {
          Modal.error({ title: '错误', content: `Chain ID "${chainId}" 已存在，请使用其他名称` });
          return Promise.reject();
        }
        // 以新 chainId 创建
        const success = await doSaveChain(chainId, elJson, true);
        if (!success) {
          return Promise.reject();
        }
      }
    });
  };

  return (
    <div className='chain-manager-wrapper'>
      <Select
        value={currentChain?.chainId}
        placeholder="请选择数据"
        style={{width: 200}}
        options={selectOptions}
        onChange={handleOnChange}
        allowClear
        onClear={() => {
          currentEditor.fromJSON({});
          setCurrentChain(undefined);
        }}
      />
      <Tooltip title='保存当前修改' placement='bottom'>
        <Button type='primary' className='chain-manager-save-btn' onClick={handleSave}>
          <SaveOutlined /> 保存
        </Button>
      </Tooltip>
      <Tooltip title='删除当前记录' placement='bottom'>
        <Button type='primary' danger className='chain-manager-delete-btn' onClick={handleDelete} disabled={!currentChain?.chainId}>
          <DeleteOutlined /> 删除
        </Button>
      </Tooltip>
      <Tooltip title='另存为' placement='bottom'>
        <Button className='chain-manager-saveas-btn' onClick={handleSaveAs}>
          <CopyOutlined /> 另存为
        </Button>
      </Tooltip>
      <Tooltip title='新增' placement='bottom'>
        <Button type='primary' className='chain-manager-add-btn' onClick={handleShowAddModal}>
          <PlusOutlined /> 新增
        </Button>
      </Tooltip>

      {/* 新增弹窗 */}
      <Modal
        title='新增 Chain'
        open={isAddModalOpen}
        onCancel={() => setIsAddModalOpen(false)}
        footer={[
          <Button key='empty' onClick={handleCreateEmpty}>创建空白画布</Button>,
          <Button key='confirm' type='primary' onClick={handleAddConfirm}>确认</Button>,
        ]}
      >
        <Form form={addForm} layout='vertical'>
          <Form.Item
            name='templateId'
            label='选择模板（可选）'
            help='选择一个模板作为起点，或直接创建空白画布'
          >
            <Select
              placeholder='请选择模板'
              allowClear
              options={allTemplates.map(t => ({
                label: t.templateId,
                value: t.templateId,
              }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default ChainManager;
