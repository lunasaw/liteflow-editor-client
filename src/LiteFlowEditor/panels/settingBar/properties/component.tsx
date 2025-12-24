import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Form, Input, Select, Button, message, Spin, Collapse, Switch, Alert } from 'antd';
import { debounce } from 'lodash';
import { history } from '../../../hooks/useHistory';
import ELNode from '../../../model/node';
import { scriptService } from '../../../services';
import type { ScriptNodeVO, ScriptLanguage, ScriptNodeType } from '../../../services/types';
import { inferScriptNodeType, getScriptNodeTypeLabel } from '../../../services/types';
import styles from './index.module.less';

const { TextArea } = Input;
const { Option } = Select;
const { Panel } = Collapse;

interface IProps {
  model: ELNode;
}

// 脚本语言选项
const SCRIPT_LANGUAGES: { value: ScriptLanguage; label: string }[] = [
  { value: 'java', label: 'Java' },
  { value: 'groovy', label: 'Groovy' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'python', label: 'Python' },
  { value: 'qlexpress', label: 'QLExpress' },
  { value: 'lua', label: 'Lua' },
  { value: 'aviator', label: 'Aviator' },
  { value: 'kotlin', label: 'Kotlin' },
];

const ComponentPropertiesEditor: React.FC<IProps> = (props) => {
  const { model } = props;
  const properties = model.getProperties();

  const [form] = Form.useForm();
  const [scriptForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [scriptData, setScriptData] = useState<ScriptNodeVO | null>(null);
  const [isScriptEnabled, setIsScriptEnabled] = useState(false);
  // 保存从服务器获取的脚本类型，优先使用此类型
  const serverScriptTypeRef = useRef<ScriptNodeType | null>(null);

  const nodeId = model.id || '';

  // 根据节点在 EL 结构中的位置推断脚本类型
  const localInferredType = useMemo(() => inferScriptNodeType(model), [model]);
  // 优先使用服务器返回的类型（考虑到节点可能在其他 Chain 中有不同用途）
  const inferredScriptType = serverScriptTypeRef.current || localInferredType;
  const scriptTypeLabel = useMemo(() => getScriptNodeTypeLabel(inferredScriptType), [inferredScriptType]);

  // 获取脚本类型提示信息
  const scriptTypeHint = useMemo(() => {
    switch (inferredScriptType) {
      case 'boolean_script':
        return '此节点用于 IF/WHILE 条件判断，脚本需要返回 true 或 false';
      case 'switch_script':
        return '此节点用于 SWITCH 选择，脚本需要返回目标分支的节点 ID';
      case 'for_script':
        return '此节点用于 FOR 循环，脚本需要返回循环次数（整数）';
      default:
        return '普通脚本节点，可执行任意逻辑';
    }
  }, [inferredScriptType]);

  // 加载脚本数据
  useEffect(() => {
    if (nodeId) {
      loadScriptData(nodeId);
    }
  }, [nodeId]);

  const loadScriptData = async (id: string) => {
    setLoading(true);
    try {
      const data = await scriptService.getById(id);
      setScriptData(data);
      setIsScriptEnabled(true);
      // 保存服务器返回的脚本类型，以便保存时使用
      if (data.nodeType) {
        serverScriptTypeRef.current = data.nodeType;
      }
      scriptForm.setFieldsValue({
        language: data.language || 'groovy',
        script: data.script,
      });
    } catch (error) {
      // 节点没有脚本，使用默认值
      setScriptData(null);
      setIsScriptEnabled(false);
      serverScriptTypeRef.current = null;
      scriptForm.setFieldsValue({
        language: 'groovy',
        script: '',
      });
    } finally {
      setLoading(false);
    }
  };

  const [savingNode, setSavingNode] = useState(false);

  // 基础属性变更处理（只更新本地，不提交到后端）
  const handleOnChange = debounce(async () => {
    try {
      const changedValues = await form.validateFields();
      const { id, ...rest } = changedValues;
      model.id = id;
      model.setProperties({ ...properties, ...rest });
      history.push(undefined, { silent: true });
      // 更新视图层
      const modelNode = model.getStartNode();
      const originSize = modelNode.getSize();
      modelNode
        .updateAttrs({ label: { text: id } })
        .setSize(originSize);
    } catch (errorInfo) {
      console.log('Failed:', errorInfo);
    }
  }, 200);

  // 提交节点到后端
  const handleSaveNode = async () => {
    setSavingNode(true);
    try {
      const values = await form.validateFields();
      const currentNodeId = values.id;
      if (!currentNodeId) {
        message.error('请输入节点ID');
        return;
      }

      const finalNodeType = serverScriptTypeRef.current || inferScriptNodeType(model);
      const scriptValues = scriptForm.getFieldsValue();

      await scriptService.saveOrUpdate({
        nodeId: currentNodeId,
        nodeName: values.tag || '',
        nodeType: finalNodeType,
        language: scriptValues.language || 'groovy',
        script: scriptValues.script || `// ${currentNodeId}\nprintln("${currentNodeId}")`,
      });

      message.success('节点保存成功');
    } catch (error: any) {
      message.error(error.message || '节点保存失败');
    } finally {
      setSavingNode(false);
    }
  };

  // 保存脚本
  const handleSaveScript = useCallback(async () => {
    if (!isScriptEnabled) {
      // 如果禁用脚本，删除已有脚本
      if (scriptData) {
        try {
          await scriptService.delete({ nodeId });
          setScriptData(null);
          serverScriptTypeRef.current = null;
          message.success('脚本已删除');
        } catch (error: any) {
          message.error(error.message || '删除失败');
        }
      }
      return;
    }

    setSaving(true);
    try {
      const values = await scriptForm.validateFields();
      const currentNodeId = form.getFieldValue('id') || nodeId;

      // 优先使用服务器返回的类型（考虑节点可能在其他 Chain 中有不同用途）
      // 其次使用本地 EL 结构推断的类型
      const finalNodeType = serverScriptTypeRef.current || inferScriptNodeType(model);

      const scriptVO: ScriptNodeVO = {
        nodeId: currentNodeId,
        nodeName: form.getFieldValue('tag') || '',
        nodeType: finalNodeType,
        language: values.language,
        script: values.script || '',
      };

      // 使用统一的保存或更新接口
      await scriptService.saveOrUpdate(scriptVO);
      setScriptData(scriptVO);
      // 更新服务器类型引用
      serverScriptTypeRef.current = finalNodeType;

      // 更新模型属性
      model.setProperties({
        ...model.getProperties(),
        language: values.language,
        isScript: true,
      });

      history.push(undefined, { silent: true });
      message.success(`${getScriptNodeTypeLabel(finalNodeType)}保存成功`);
    } catch (error: any) {
      message.error(error.message || '保存失败');
    } finally {
      setSaving(false);
    }
  }, [form, scriptForm, model, nodeId, scriptData, isScriptEnabled]);

  // 验证脚本
  const handleVerifyScript = async () => {
    setVerifying(true);
    try {
      const values = await scriptForm.validateFields();
      const currentNodeId = form.getFieldValue('id') || nodeId;

      // 优先使用服务器返回的类型，其次使用本地推断的类型
      const finalNodeType = serverScriptTypeRef.current || inferScriptNodeType(model);

      await scriptService.verify({
        nodeId: currentNodeId,
        nodeName: form.getFieldValue('tag') || '',
        nodeType: finalNodeType,
        language: values.language,
        script: values.script || '',
      });
      message.success('脚本验证通过');
    } catch (error: any) {
      message.error(error.message || '脚本验证失败');
    } finally {
      setVerifying(false);
    }
  };

  // 切换脚本启用状态
  const handleScriptToggle = (checked: boolean) => {
    setIsScriptEnabled(checked);
    if (!checked && scriptData) {
      // 显示提示，但不立即删除，等用户点保存
    }
  };

  return (
    <div className={styles.liteflowEditorPropertiesEditorContainer}>
      {/* 基础属性 */}
      <Form
        layout="vertical"
        form={form}
        initialValues={{ ...properties, id: model.id }}
        onValuesChange={handleOnChange}
      >
        <Form.Item name="id" label="节点ID">
          <Input allowClear placeholder="请输入节点ID" />
        </Form.Item>
        <Form.Item name="tag" label="标签（tag）">
          <Input allowClear placeholder="请输入标签" />
        </Form.Item>
        <Form.Item name="data" label="参数（data）">
          <Input allowClear placeholder="请输入参数" />
        </Form.Item>
        <Form.Item name="maxWaitSeconds" label="超时（秒）">
          <Input allowClear placeholder="请输入超时时间" />
        </Form.Item>
        <Form.Item>
          <Button type="primary" onClick={handleSaveNode} loading={savingNode}>
            保存节点
          </Button>
        </Form.Item>
      </Form>

      {/* 脚本编辑区域 */}
      <Collapse
        defaultActiveKey={['script']}
        style={{ marginTop: 16 }}
      >
        <Panel
          key="script"
          header={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <span>脚本执行逻辑</span>
              <Switch
                size="small"
                checked={isScriptEnabled}
                onChange={handleScriptToggle}
                onClick={(_, e) => e.stopPropagation()}
              />
            </div>
          }
        >
          {loading ? (
            <Spin tip="加载中..." />
          ) : (
            <>
              {isScriptEnabled && (
                <Alert
                  message={scriptTypeLabel}
                  description={scriptTypeHint}
                  type={inferredScriptType === 'script' ? 'info' : 'warning'}
                  showIcon
                  style={{ marginBottom: 16 }}
                />
              )}
              <Form
              layout="vertical"
              form={scriptForm}
              initialValues={{
                language: 'groovy',
                script: '',
              }}
            >
              <Form.Item
                name="language"
                label="脚本语言"
                rules={isScriptEnabled ? [{ required: true, message: '请选择脚本语言' }] : []}
              >
                <Select
                  placeholder="请选择脚本语言"
                  disabled={!isScriptEnabled}
                >
                  {SCRIPT_LANGUAGES.map((lang) => (
                    <Option key={lang.value} value={lang.value}>
                      {lang.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                name="script"
                label="脚本内容"
                rules={isScriptEnabled ? [{ required: true, message: '请输入脚本内容' }] : []}
              >
                <TextArea
                  rows={8}
                  placeholder={isScriptEnabled ? '请输入脚本内容' : '启用脚本后可编辑'}
                  disabled={!isScriptEnabled}
                  style={{ fontFamily: 'Monaco, Menlo, monospace', fontSize: 12 }}
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  onClick={handleSaveScript}
                  loading={saving}
                  style={{ marginRight: 8 }}
                >
                  保存脚本
                </Button>
                <Button
                  onClick={handleVerifyScript}
                  loading={verifying}
                  disabled={!isScriptEnabled}
                >
                  验证脚本
                </Button>
              </Form.Item>
            </Form>
            </>
          )}
        </Panel>
      </Collapse>
    </div>
  );
};

export default ComponentPropertiesEditor;
