import { useContext } from 'react';
import { GraphContext } from '../context/GraphContext';

/**
 * 获取当前编辑的 Chain ID
 */
export const useChainId = (): string | undefined => {
  const { chainId } = useContext(GraphContext);
  return chainId;
};
