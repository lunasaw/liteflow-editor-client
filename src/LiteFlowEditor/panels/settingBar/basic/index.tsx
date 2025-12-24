import React, { useEffect, useState, useContext } from 'react';
import { Graph } from '@antv/x6';
import { Input, Button, message } from 'antd';
import { EditOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { useModel } from '../../../hooks/useModel';
import GraphContext from '../../../context/GraphContext';
import styles from './index.module.less';

interface IProps {
  flowGraph: Graph;
}

const Basic: React.FC<IProps> = (props) => {
  const { flowGraph } = props;
  const { chainId, chainName, currentEditor } = useContext<any>(GraphContext);
  const [elString, setELString] = useState<string>(useModel()?.toEL(' '));
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingChainName, setEditingChainName] = useState(chainName || '');

  useEffect(() => {
    const handleModelChange = () => {
      setELString(useModel()?.toEL(' '));
    };
    flowGraph.on('model:change', handleModelChange);
    return () => {
      flowGraph.off('model:change', handleModelChange);
    };
  }, [flowGraph, setELString]);

  // 当 chainName 变化时,同步更新编辑框的值
  useEffect(() => {
    setEditingChainName(chainName || '');
  }, [chainName]);

  // 开始编辑中文名称
  const handleStartEdit = () => {
    setIsEditingName(true);
  };

  // 保存中文名称
  const handleSaveName = () => {
    if (currentEditor) {
      currentEditor.setChainName(editingChainName);
      setIsEditingName(false);
      message.success('中文名称已更新');
    }
  };

  // 取消编辑
  const handleCancelEdit = () => {
    setEditingChainName(chainName || '');
    setIsEditingName(false);
  };

  return (
    <div className={styles.liteflowEditorBasicContainer}>
      {/* Chain 属性信息 */}
      <div className={styles.liteflowEditorTitle}>Chain 属性：</div>
      <div className={styles.chainPropertyWrapper}>
        <div className={styles.propertyItem}>
          <span className={styles.propertyLabel}>Chain ID：</span>
          {chainId ? (
            <span className={styles.propertyValue}>{chainId}</span>
          ) : (
            <span className={styles.propertyValueEmpty}>未设置（保存时需要输入）</span>
          )}
        </div>
        <div className={styles.propertyItem}>
          <span className={styles.propertyLabel}>中文名称：</span>
          {isEditingName ? (
            <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
              <Input
                value={editingChainName}
                onChange={(e) => setEditingChainName(e.target.value)}
                placeholder="请输入中文名称"
                size="small"
                style={{ flex: 1 }}
                onPressEnter={handleSaveName}
              />
              <Button
                type="primary"
                size="small"
                icon={<CheckOutlined />}
                onClick={handleSaveName}
              />
              <Button
                size="small"
                icon={<CloseOutlined />}
                onClick={handleCancelEdit}
              />
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '8px', flex: 1, alignItems: 'center' }}>
              {chainName ? (
                <span className={styles.propertyValue}>{chainName}</span>
              ) : (
                <span className={styles.propertyValueEmpty}>未设置</span>
              )}
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={handleStartEdit}
              >
                编辑
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* EL 表达式 */}
      <div className={styles.liteflowEditorTitle}>EL表达式：</div>
      <div className={styles.elContentWrapper}>
        <pre>{elString}</pre>
      </div>
    </div>
  );
};

export default Basic;
