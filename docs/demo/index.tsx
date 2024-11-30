import React from 'react';
import { LiteFlowEditor } from '../../src/index';
import { ConnectStatus, ChainManager } from './components'
import './index.less';

const Demo: React.FC<any> = () => {
  return (
    <div className='liteflow-editor-demo-wrapper'>
      <LiteFlowEditor
        widgets={[ConnectStatus, ChainManager]}
      />
    </div>
  )
};

export default Demo;
