import React from 'react';
import { Node } from '@antv/x6';
import classNames from 'classnames';

import styles from './index.module.less';

const NodeView: React.FC<{ icon: string; node: Node; children: React.ReactNode }> = (props) => {
  const { icon, children } = props;
  // 从 props.node 中解构出实际的 node 对象（与 NodeBadge 保持一致）
  const { node } = props.node as any;
  // 从节点数据中获取 model，再获取 ID
  const nodeData = node?.getData?.() || {};
  const model = nodeData.model;
  const currentModel = model?.proxy || model;
  const nodeId = currentModel?.id || '';

  return (
    <div className={classNames(styles.liteflowShapeWrapper)}>
      <img className={styles.liteflowShapeSvg} src={icon}></img>
      {/* 节点 ID 标签 */}
      {nodeId && (
        <div className={styles.nodeIdLabel} title={nodeId}>
          {nodeId}
        </div>
      )}
      { children }
    </div>
  );
};

export default NodeView;
