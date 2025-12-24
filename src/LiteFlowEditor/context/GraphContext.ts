import { Context, createContext, RefObject } from 'react';
import { Graph } from '@antv/x6';

/**
 * graph: Graph实例
 * graphWrapper: Graph的容器
 * chainId: 当前编辑的 Chain ID
 * chainName: 当前编辑的 Chain 中文名称
 * currentEditor: 编辑器实例
 */
interface IGraphContext {
  model: any;
  graph: Graph;
  graphWrapper: RefObject<HTMLDivElement>;
  chainId?: string;
  chainName?: string;
  currentEditor?: any;
}

const defaultValue: IGraphContext = {} as any;

export const GraphContext: Context<IGraphContext> = createContext(defaultValue);

export default GraphContext;
