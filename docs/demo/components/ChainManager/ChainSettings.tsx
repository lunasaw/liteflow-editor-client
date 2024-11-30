import React, { useState } from 'react';
import { Button, Modal, Table } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import './index.less'

interface IProps {
  value: any[];
}

const ChainSettings: React.FC<IProps> = ({ value: chains = []}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleOk = () => {
    setIsModalOpen(false);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const columns = [
    {
      title: '链ID',
      dataIndex: 'chainId'
    },
    {
      title: '链名称',
      dataIndex: 'chainName'
    },
    {
      title: '操作',
      key: 'operation',
      render: () => <Button type='primary'>删除</Button>,
    },
  ];

  return (
    <React.Fragment>
      <Button type='primary' icon={<SettingOutlined />} onClick={showModal} className='chain-manager-settings-btn'>维护</Button>
      <Modal
        className={classNames('chain-manager-settings-modal')}
        width={900}
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
      >
        <div>
          <Table
            style={{ paddingTop: 20 }}
            pagination={false}
            columns={columns}
            dataSource={chains}
          />
        </div>
      </Modal>
    </React.Fragment>
  )
};

export default ChainSettings;
