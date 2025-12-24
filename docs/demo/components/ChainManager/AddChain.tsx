import React, { useState, useMemo } from 'react';
import { Button, Form, Input, Modal, Select, Tooltip } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import request from 'umi-request';
import mockData from '../../../../src/LiteFlowEditor/mock';
import './index.less'

type Chain = {
  chainId: string;
  elJson: any;
}

// 测试数据集模板
const MOCK_TEMPLATES = Object.keys(mockData).map(key => ({
  chainId: `[模板] ${key}`,
  elJson: mockData[key],
  isMock: true,
}));

interface IProps {
  value?: Chain;
  onChange: (newChain?: Chain) => void;
  disabled?: boolean;
  chains: Array<{
    chainId: string;
    elJson: any;
  }>;
}

const ChainSettings: React.FC<IProps> = ({ value = {}, onChange, chains, disabled }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  // 合并服务器数据和测试模板
  const allTemplates = useMemo(() => {
    const serverTemplates = chains.map(chain => ({
      ...chain,
      isMock: false,
    }));
    return [...serverTemplates, ...MOCK_TEMPLATES];
  }, [chains]);

  const showModal = () => {
    setIsModalOpen(true);
    form.resetFields();
  };

  const handleOk = async () => {
    try {
      const { chainId, elTemplateId } = await form.validateFields();
      let elJson = {};
      if (elTemplateId) {
        // 检查是否是测试模板
        const mockTemplate = MOCK_TEMPLATES.find(t => t.chainId === elTemplateId);
        if (mockTemplate) {
          elJson = mockTemplate.elJson;
        } else {
          elJson = await request(`/api/getChainById?chainId=${elTemplateId}`, { method: 'GET' })
            .then((data) => data?.elJson ? data.elJson : {});
        }
      }
      onChange({ chainId, elJson });
      setIsModalOpen(false);
    } catch (errorInfo) {
      console.log('Failed:', errorInfo);
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const handleEmptyCanvas = async () => {
    try {
      // 创建空白画布也需要 chainId
      const { chainId } = await form.validateFields(['chainId']);
      onChange({ chainId, elJson: {} });
      setIsModalOpen(false);
    } catch (errorInfo) {
      console.log('Failed:', errorInfo);
    }
  }

  return (
    <React.Fragment>
      <Tooltip title='新增' placement='bottom'>
        <Button type='primary' onClick={showModal} className='chain-manager-add-btn' disabled={disabled}>
          <PlusOutlined /> 新增
        </Button>
      </Tooltip>
      <Modal
        title='新增Chain'
        className={classNames('chain-manager-settings-modal')}
        width={900}
        open={isModalOpen}
        onCancel={handleCancel}
        footer={[
          <Button key='emptyCanvas' onClick={handleEmptyCanvas}>创建空白画布</Button>,
          <Button type='primary' key='save' onClick={handleOk}>保存</Button>
        ]}
      >
        <div>
          <Form
            layout="horizontal"
            form={form}
            labelCol={{ span: 6 }}
            wrapperCol={{ span: 14 }}
            initialValues={value}
          >
            <Form.Item name="chainId" label="chainId" rules={[{ required: true, message: '请输入Chain ID' }]}>
              <Input placeholder="请输入Chain ID" allowClear />
            </Form.Item>
            <Form.Item name="elTemplateId" label="chainTemplate" rules={[{ required: false }]}>
              <Select
                placeholder="请选择Chain模板（可选）"
                style={{width: '100%'}}
                allowClear
                options={allTemplates.map((template) => ({
                  label: template.chainId,
                  value: template.chainId,
                }))}
              />
            </Form.Item>
          </Form>
        </div>
      </Modal>
    </React.Fragment>
  )
};

export default ChainSettings;
