import React, {
  useRef,
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { Graph, Edge, Cell, Node } from '@antv/x6';
import classNames from 'classnames'
import createFlowGraph from './panels/flowGraph/createFlowGraph';
// import NodeEditorModal from './panels/flowGraph/nodeEditorModal';
import FlowGraphContextMenu from './panels/flowGraph/contextMenu';
import FlowGraphContextPad from './panels/flowGraph/contextPad';
import GraphContext from './context/GraphContext';
import Layout from './panels/layout';
import SideBar from './panels/sideBar';
import ToolBar from './panels/toolBar';
import SettingBar from './panels/settingBar';
import Breadcrumb from './panels/breadcrumb';
import styles from './index.module.less';
import '@antv/x6/dist/index.css';
import { forceLayout } from './common/layout';
import { useModel } from './hooks';
import { history } from './hooks/useHistory';
import ELBuilder from './model/builder';
import { setModel } from './hooks/useModel';
import { MIN_ZOOM } from './constant';

interface ILiteFlowEditorProps {
  /**
   * 样式类
   */
  className?: string;
  /**
   * 当前编辑的 Chain ID（用于调试执行）
   */
  chainId?: string;
  /**
   * 生成图示例事件
   * @param graph 图实例
   * @returns
   */
  onReady?: (graph: Graph) => void;
  /**
   * 工具栏组件
   */
  widgets?: React.FC<any>[];
  /**
   * 更多子节点
   */
  children?: React.ReactNode;
  /**
   * 其他可扩展属性
   */
  [key: string]: any;
}

const defaultMenuInfo: IMenuInfo = {
  x: 0,
  y: 0,
  scene: 'blank',
  visible: false,
};

interface IPadInfo {
  x: number;
  y: number;
  edge?: Edge;
  node?: Node;
  scene?: IContextPadScene;
  visible: boolean;
}

const defaultPadInfo: IPadInfo = {
  x: 0,
  y: 0,
  scene: 'append',
  visible: false,
};

const LiteFlowEditor = forwardRef<React.FC, ILiteFlowEditorProps>(function (props, ref) {
  const { className, chainId: propChainId, onReady, widgets, children } = props;
  const wrapperRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<HTMLDivElement>(null);
  const miniMapRef = useRef<HTMLDivElement>(null);
  const [flowGraph, setFlowGraph] = useState<Graph>();
  const [contextMenuInfo, setContextMenuInfo] =
    useState<IMenuInfo>(defaultMenuInfo);
  const [contextPadInfo, setContextPadInfo] =
    useState<IPadInfo>(defaultPadInfo);
  // 内部维护的 chainId 和 chainName，优先使用 prop 传入的值
  const [internalChainId, setInternalChainId] = useState<string | undefined>(propChainId);
  const [internalChainName, setInternalChainName] = useState<string | undefined>();

  // 当 prop 变化时同步更新内部状态
  useEffect(() => {
    if (propChainId) {
      setInternalChainId(propChainId);
    }
  }, [propChainId]);

  // 最终使用的 chainId：优先使用 prop，其次使用内部状态
  const chainId = propChainId || internalChainId;
  const chainName = internalChainName;

  const currentEditor = {
    getGraphInstance() {
      return flowGraph;
    },
    toJSON() {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      return useModel().toJSON();
    },
    /**
     * 从 JSON 数据加载 Chain
     * @param data EL JSON 数据
     * @param newChainId 可选的 Chain ID，如果提供则会更新内部的 chainId；如果传入空字符串或不传，则清空 chainId
     * @param newChainName 可选的 Chain 中文名称
     */
    fromJSON(data: Record<string, any>, newChainId?: string, newChainName?: string) {
      const model = ELBuilder.build(data || {});
      setModel(model);
      history.cleanHistory();
      flowGraph?.zoomToFit({minScale: MIN_ZOOM, maxScale: 1});
      // 更新内部 chainId 和 chainName 状态：有值则设置，无值则清空
      setInternalChainId(newChainId || undefined);
      setInternalChainName(newChainName || undefined);
    },
    /**
     * 设置当前编辑的 Chain ID
     * @param newChainId Chain ID
     */
    setChainId(newChainId: string) {
      setInternalChainId(newChainId);
    },
    /**
     * 获取当前的 Chain ID
     */
    getChainId() {
      return chainId;
    },
    /**
     * 设置当前编辑的 Chain 中文名称
     * @param newChainName Chain 中文名称
     */
    setChainName(newChainName: string) {
      setInternalChainName(newChainName);
    },
    /**
     * 获取当前的 Chain 中文名称
     */
    getChainName() {
      return chainName;
    }
  }
  useImperativeHandle(ref, () => currentEditor as any);

  useEffect(() => {
    if (graphRef.current && miniMapRef.current) {
      const flowGraph = createFlowGraph(graphRef.current, miniMapRef.current);
      onReady?.(flowGraph);
      setFlowGraph(flowGraph);
      history.init(flowGraph);
    }
  }, []);

  // resize flowGraph's size when window size changes
  useEffect(() => {
    const handler = () => {
      requestAnimationFrame(() => {
        if (flowGraph && wrapperRef && wrapperRef.current) {
          const width = wrapperRef.current.clientWidth;
          const height = wrapperRef.current.clientHeight;
          flowGraph.resize(width, height);
        }
      });
    };
    window.addEventListener('resize', handler);
    return () => {
      window.removeEventListener('resize', handler);
    };
  }, [flowGraph, wrapperRef]);

  // NOTE: listen toggling context menu event
  useEffect(() => {
    const showHandler = (info: IMenuInfo) => {
      flowGraph?.lockScroller();
      setContextMenuInfo({ ...info, visible: true });
    };
    const hideHandler = () => {
      flowGraph?.unlockScroller();
      setContextMenuInfo({ ...contextMenuInfo, visible: false });
    };
    const showContextPad = (info: IPadInfo) => {
      flowGraph?.lockScroller();
      setContextPadInfo({ ...info, visible: true });
    };
    const hideContextPad = () => {
      flowGraph?.unlockScroller();
      setContextPadInfo({ ...contextPadInfo, visible: false });
    };
    const handleModelChange = () => {
      if (flowGraph) {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const model = useModel();
        const modelJSON = model.toCells() as Cell[];
        flowGraph.lockScroller();
        flowGraph.startBatch('update');
        flowGraph.resetCells(modelJSON);
        forceLayout(flowGraph);
        flowGraph.stopBatch('update');
        flowGraph.unlockScroller();
        flowGraph.trigger('model:changed');
      }
    };
    if (flowGraph) {
      flowGraph.on('graph:showContextMenu', showHandler);
      flowGraph.on('graph:hideContextMenu', hideHandler);
      flowGraph.on('graph:showContextPad', showContextPad);
      flowGraph.on('graph:hideContextPad', hideContextPad);
      flowGraph.on('model:change', handleModelChange);
    }
    return () => {
      if (flowGraph) {
        flowGraph.off('graph:showContextMenu', showHandler);
        flowGraph.off('graph:hideContextMenu', hideHandler);
        flowGraph.off('graph:showContextPad', showContextPad);
        flowGraph.off('graph:hideContextPad', hideContextPad);
        flowGraph.off('model:change', handleModelChange);
      }
    };
  }, [flowGraph]);

  return (
    // @ts-ignore
    <GraphContext.Provider // @ts-ignore
      value={{ graph: flowGraph, graphWrapper: wrapperRef, model: null, currentEditor, chainId, chainName }}
    >
      <Layout
        flowGraph={flowGraph}
        SideBar={SideBar}
        ToolBar={ToolBar}
        SettingBar={SettingBar}
        widgets={widgets}
      >
        <div className={classNames(styles.liteflowEditorContainer, className)} ref={wrapperRef}>
          <div className={styles.liteflowEditorGraph} ref={graphRef} />
          <div className={styles.liteflowEditorMiniMap} ref={miniMapRef} />
          {flowGraph && <Breadcrumb flowGraph={flowGraph} />}
          {/* {flowGraph && <NodeEditorModal flowGraph={flowGraph} />} */}
          {flowGraph && (
            <FlowGraphContextMenu {...contextMenuInfo} flowGraph={flowGraph} />
          )}
          {flowGraph && (
            <FlowGraphContextPad {...contextPadInfo} flowGraph={flowGraph} />
          )}
          {children}
        </div>
      </Layout>
    </GraphContext.Provider>
  );
});

export default LiteFlowEditor;
