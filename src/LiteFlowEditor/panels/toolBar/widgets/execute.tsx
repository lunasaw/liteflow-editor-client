import React, { useContext } from 'react';
import { BugOutlined } from '@ant-design/icons';
import { Modal, Tooltip, message } from 'antd';
import { Graph } from '@antv/x6';
import { GraphContext } from '../../../context/GraphContext';
import { useGraph } from '../../../hooks';
import DebugPanel from '../../debugPanel';
import styles from './index.module.less';

let debugModalVisible = false;
let debugModalInstance: ReturnType<typeof Modal.confirm> | null = null;

interface IExecuteProps {
  flowGraph: Graph;
}

/**
 * 执行调试按钮组件
 * 使用 GraphContext 获取 chainId
 */
const Execute: React.FC<IExecuteProps> = () => {
  const flowGraph = useGraph();
  const { chainId } = useContext(GraphContext);

  const handleClick = () => {
    if (debugModalVisible) {
      debugModalInstance?.destroy();
      debugModalInstance = null;
      debugModalVisible = false;
      return;
    }

    if (!chainId) {
      message.warning('请先设置 Chain ID 或保存 Chain');
      return;
    }

    debugModalVisible = true;
    debugModalInstance = Modal.confirm({
      title: '执行调试',
      icon: null,
      width: 600,
      content: <DebugPanel flowGraph={flowGraph} chainId={chainId} />,
      okButtonProps: { style: { display: 'none' } },
      cancelButtonProps: { style: { display: 'none' } },
      maskClosable: true,
      onCancel: () => {
        debugModalVisible = false;
        debugModalInstance = null;
      },
      afterClose: () => {
        debugModalVisible = false;
        debugModalInstance = null;
      },
    });
  };

  const isDisabled = !chainId;

  return (
    <Tooltip title={isDisabled ? '请先设置 Chain ID' : '执行调试'}>
      <div
        className={`${styles.btnWidget} ${isDisabled ? styles.disabled : ''}`}
        onClick={handleClick}
      >
        <BugOutlined />
      </div>
    </Tooltip>
  );
};

export default Execute;
