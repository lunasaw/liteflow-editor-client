import React, { useState } from 'react';
import { Button, Form, Input, Modal, Tooltip } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import './index.less'

type Chain = {
  chainId: string;
  chainName: string;
}

interface IProps {
  value?: Chain;
  onChange: (newChain: Chain) => void;
  disabled?: boolean;
}

const ChainSettings: React.FC<IProps> = ({ value = {}, onChange, disabled }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const showModal = () => {
    setIsModalOpen(true);
  };

  const [form] = Form.useForm();

  const handleOk = async () => {
    try {
      const chain = await form.validateFields();
      onChange(chain);
      setIsModalOpen(false);
    } catch (errorInfo) {
      console.log('Failed:', errorInfo);
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  return (
    <React.Fragment>
      <Tooltip title='新增' placement='bottom'>
        <Button type='primary' onClick={showModal} className='chain-manager-add-btn' disabled={disabled}>
          <PlusOutlined /> 新增
        </Button>
      </Tooltip>
      <Modal
        className={classNames('chain-manager-settings-modal')}
        width={900}
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
      >
        <div>
          <Form
            layout="horizontal"
            form={form}
            labelCol={{ span: 6 }}
            wrapperCol={{ span: 14 }}
            initialValues={value}
          >
            <Form.Item name="chainId" label="chainId">
              <Input allowClear />
            </Form.Item>
            <Form.Item name="chainName" label="chainName">
              <Input allowClear />
            </Form.Item>
          </Form>
        </div>
      </Modal>
    </React.Fragment>
  )
};

export default ChainSettings;
