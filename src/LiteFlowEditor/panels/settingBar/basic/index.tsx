import React, { useEffect, useState, useContext } from 'react';
import { Graph } from '@antv/x6';
import { useModel } from '../../../hooks/useModel';
import GraphContext from '../../../context/GraphContext';
import styles from './index.module.less';

interface IProps {
  flowGraph: Graph;
}

const Basic: React.FC<IProps> = (props) => {
  const { flowGraph } = props;
  const { chainId } = useContext<any>(GraphContext);
  const [elString, setELString] = useState<string>(useModel()?.toEL(' '));

  useEffect(() => {
    const handleModelChange = () => {
      setELString(useModel()?.toEL(' '));
    };
    flowGraph.on('model:change', handleModelChange);
    return () => {
      flowGraph.off('model:change', handleModelChange);
    };
  }, [flowGraph, setELString]);

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
