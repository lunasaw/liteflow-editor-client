import React, { useState, useEffect, useCallback } from 'react';
import request from 'umi-request';
import {Select} from 'antd';
import './index.less'

type Chain = {
  chainId: string;
  chainName: string;
}

const ChainManager: React.FC = () => {
  const [chains, setChains] = useState<Array<Chain>>([]);

  const getChainList = useCallback(() => {
    return request(`/api/getChainList`, { method: 'GET' })
    .then((data) => {
      if (data && data.length) {
        setChains(data);
      }
    })
  }, [setChains]);

  useEffect(() => {
    getChainList();
  }, []);

  return (
    <div className='chain-manager-wrapper'>
      <span>接口数据：</span>
      <Select
        placeholder="请选择接口数据"
        style={{width: 200}}
        options={chains.map(({chainId, chainName}: Chain) => ({
          label: chainName,
          value: chainId,
        }))}
      />
    </div>
  );
}

export default ChainManager;
