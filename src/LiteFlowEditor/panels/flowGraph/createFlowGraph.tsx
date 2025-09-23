import React from 'react';
import { createRoot } from 'react-dom/client';
import { Button } from 'antd';
import { Cell, Graph, NodeView } from '@antv/x6';
import { debounce } from 'lodash';
import { Clipboard } from '@antv/x6-plugin-clipboard'
import { Export } from '@antv/x6-plugin-export'
import { History } from '@antv/x6-plugin-history'
import { Keyboard } from '@antv/x6-plugin-keyboard'
import { MiniMap } from '@antv/x6-plugin-minimap'
import { Scroller } from '@antv/x6-plugin-scroller'
import { Selection } from '@antv/x6-plugin-selection'
import { Snapline } from '@antv/x6-plugin-snapline'
import { Transform } from '@antv/x6-plugin-transform'
import { MIN_ZOOM, MAX_ZOOM } from '../../constant';
// import MiniMapSimpleNode from './miniMapSimpleNode';

import {
  LITEFLOW_ANCHOR,
  LITEFLOW_ROUTER,
  registerEvents,
  registerShortcuts,
} from '../../common';

const createFlowChart = (
  container: HTMLDivElement,
  miniMapContainer: HTMLDivElement,
): Graph => {
  const flowGraph = new Graph({
    virtual: false,
    async: true,
    autoResize: true,
    container,
    onEdgeLabelRendered: (args) => {
      const { edge, selectors, label } = args;
      const content = selectors.foContent as HTMLElement;
      if (content) {
        content.style.display = 'flex';
        content.style.alignItems = 'center';
        content.style.justifyContent = 'center';
        content.style.overflow = 'hidden';
        if (label?.attrs?.label.text === '+') {
          const showContextPad = debounce((info: any) => {
            flowGraph.trigger('graph:showContextPad', info);
          }, 100);
          const handleOnClick = (event: any) => {
            showContextPad({
              x: event.clientX,
              y: event.clientY,
              edge,
            });
          };
          const root = createRoot(content);
          root.render(
            <Button
              size="small"
              onClick={handleOnClick}
              className="liteflow-edge-add-button"
            >
              +
            </Button>
          );
        } else {
          content.appendChild(
            document.createTextNode(label?.attrs?.label.text + ''),
          );
        }
      }
    },
    // https://x6.antv.vision/zh/docs/tutorial/intermediate/connector
    connecting: {
      snap: true,
      allowBlank: false,
      allowLoop: false,
      allowNode: false,
      allowEdge: false,
      dangling: true,
      highlight: true,
      anchor: LITEFLOW_ANCHOR, // LITEFLOW_ANCHOR, // 'center',
      connectionPoint: 'bbox',
      connector: {
        name: 'rounded', //两条线交叉时，出现线桥。
        args: {
          radius: 8,
        },
      },
      router: LITEFLOW_ROUTER, // LITEFLOW_ROUTER, // 'normal',
      validateEdge: (args) => {
        const { edge } = args;
        return !!(edge?.target as any)?.port;
      },
      validateConnection({
        sourceView,
        targetView,
        sourceMagnet,
        targetMagnet,
      }) {
        if (!sourceMagnet) {
          return false;
        } else if (!targetMagnet) {
          return false;
        } else {
          return sourceView !== targetView;
        }
      },
    },
    // https://x6.antv.vision/zh/docs/tutorial/basic/background
    background: {
      color: '#f4f7fc',
    },
    // https://x6.antv.vision/zh/docs/tutorial/basic/grid
    grid: {
      visible: true,
    },
    mousewheel: {
      enabled: true,
      minScale: MIN_ZOOM,
      maxScale: MAX_ZOOM,
      modifiers: ['ctrl', 'meta'],
    },
    interacting: {
      nodeMovable: true,
      edgeLabelMovable: false,
    },
  });
  // 图形变换：https://x6.antv.antgroup.com/tutorial/plugins/transform
  flowGraph.use(
    new Transform({
      rotating: false,
      resizing: false,
    }),
  );
  // 对齐线： https://x6.antv.antgroup.com/tutorial/plugins/snapline
  flowGraph.use(
    new Snapline({
      enabled: true,
      clean: 100,
    }),
  );
  // 复制粘贴：https://x6.antv.antgroup.com/tutorial/plugins/clipboard
  flowGraph.use(
    new Clipboard({
      enabled: true,
      useLocalStorage: true,
    }),
  );
  // 快捷键：https://x6.antv.antgroup.com/tutorial/plugins/keyboard
  flowGraph.use(
    new Keyboard({
      enabled: true,
      global: false,
    }),
  );
  // 撤销重做：https://x6.antv.antgroup.com/tutorial/plugins/history
  flowGraph.use(
    new History({
      enabled: true,
      beforeAddCommand(event, args: any) {
        if (args.options) {
          return args.options.ignore !== true;
        }
      },
    }),
  );
  // 框选：https://x6.antv.antgroup.com/tutorial/plugins/selection
  flowGraph.use(
    new Selection({
      enabled: true,
      rubberband: false, // 启用框选
      movable: true,
      multiple: true,
      strict: true,
      showNodeSelectionBox: true,
      selectNodeOnMoved: true,
      pointerEvents: 'none',
    }),
  );
  // 滚动画布：https://x6.antv.antgroup.com/tutorial/plugins/scroller
  flowGraph.use(
    new Scroller({
      enabled: true,
      pageVisible: false,
      pageBreak: false,
      pannable: true,
    }),
  );
  // 小地图：https://x6.antv.antgroup.com/tutorial/plugins/minimap
  flowGraph.use(
    new MiniMap({
      width: 150,
      height: 150,
      minScale: MIN_ZOOM,
      maxScale: MAX_ZOOM,
      enabled: true,
      scalable: false,
      container: miniMapContainer,
      graphOptions: {
        async: true,
        getCellView(cell: Cell) {
          if (cell.isNode()) {
            return NodeView.registry.get('react-shape-view');
            // return MiniMapSimpleNode;
          }
        },
        createCellView(cell: Cell) {
          if (cell.isEdge()) {
            return null;
          }
        },
      },
    }),
  );
  // 导出：https://x6.antv.antgroup.com/tutorial/plugins/export
  flowGraph.use(
    new Export()
  );
  registerEvents(flowGraph);
  registerShortcuts(flowGraph);
  return flowGraph;
};

export default createFlowChart;
