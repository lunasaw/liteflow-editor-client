import React, { useState, useEffect, useCallback, useContext } from 'react';
import request from 'umi-request';
import {Select, Button, Tooltip, Modal} from 'antd';
import { DeleteOutlined, SaveOutlined } from '@ant-design/icons';
import { GraphContext } from '../../../../src/index';
import AddChain from './AddChain';
import './index.less';

type Chain = {
  chainId: string;
  chainName: string;
  elJson: any;
}

const ChainManager: React.FC = () => {
  const [chains, setChains] = useState<Array<Chain>>([]);
  const [currentChain, setCurrentChain] = useState<Chain>();

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

  const { currentEditor } = useContext<any>(GraphContext)
  const handleOnChange = (chainId: string) => {
    setCurrentChain(chains.find(chain => chain.chainId === chainId))
    request(`/api/getChainById?chainId=${chainId}`, { method: 'GET' })
      .then((data) => {
        if (data) {
          currentEditor.fromJSON(data)
        }
      })
  };

  const handleSave = () => {
    request(`/api/updateChain`, {
      method: 'POST',
      data: {...currentChain, elJson: currentEditor.toJSON()}
    })
      .then((data) => {
        if (data) {
          Modal.success({ title: '操作成功' })
        }
      })
  }

  const handleDelete = () => {
    request(`/api/deleteChain`, {
      method: 'POST',
      data: {...currentChain}
    })
      .then((data) => {
        if (data) {
          Modal.success({ title: '操作成功' })
        }
      })
  }

  const handleAddChain = (newChain) => {
    setChains([...chains, newChain]);
    setCurrentChain(newChain);
    currentEditor.fromJSON({});
    request(`/api/createChain`, {
      method: 'POST',
      data: {...newChain}
    })
      .then((data) => {
        if (data) {
          Modal.success({ title: '操作成功' })
        }
      })
  }

  return (
    <div className='chain-manager-wrapper'>
      <Select
        value={currentChain?.chainId}
        placeholder="请选择接口数据"
        style={{width: 200}}
        options={chains.map(({chainId, chainName}: Chain) => ({
          label: chainName,
          value: chainId,
        }))}
        onChange={handleOnChange}
      />
      <Tooltip title='保存当前修改' placement='bottom'>
        <Button type='primary' className='chain-manager-save-btn' onClick={handleSave} disabled={!chains.length}>
          <SaveOutlined /> 保存
        </Button>
      </Tooltip>
      <Tooltip title='删除当前记录' placement='bottom'>
        <Button type='primary' danger className='chain-manager-delete-btn' onClick={handleDelete} disabled={!chains.length}>
          <DeleteOutlined /> 删除
        </Button>
      </Tooltip>
      <AddChain onChange={handleAddChain} disabled={!chains.length} />
    </div>
  );
}

export default ChainManager;
