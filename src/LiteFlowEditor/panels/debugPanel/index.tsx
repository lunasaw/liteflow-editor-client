import React, { useState, useCallback } from 'react';
import { Graph } from '@antv/x6';
import {
  Button,
  Input,
  Collapse,
  Spin,
  message,
  Tooltip,
  InputNumber,
  List,
  Empty,
} from 'antd';
import {
  PlayCircleOutlined,
  ClearOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CodeOutlined,
  HistoryOutlined,
  ReloadOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { executeService } from '../../services';
import type { ExecuteChainResponse, StepDetail } from '../../services/types';
import styles from './index.module.less';

const { TextArea } = Input;
const { Panel } = Collapse;

// 历史记录项
interface HistoryItem {
  id: string;
  chainId: string;
  requestData: string;
  timeout: number;
  result: ExecuteChainResponse;
  timestamp: number;
}

interface IProps {
  flowGraph: Graph;
  chainId: string;
}

const DebugPanel: React.FC<IProps> = (props) => {
  const { flowGraph, chainId } = props;
  const [requestData, setRequestData] = useState<string>('{}');
  const [timeout, setTimeout] = useState<number>(30000);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ExecuteChainResponse | null>(null);
  // 历史记录
  const [history, setHistory] = useState<HistoryItem[]>([]);
  // 当前查看的历史记录
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);

  // 执行 Chain（可选传入历史记录的参数）
  const handleExecute = useCallback(async (historyParams?: { requestData: string; timeout: number }) => {
    if (!chainId) {
      message.warning('请先保存 Chain');
      return;
    }

    const execRequestData = historyParams?.requestData ?? requestData;
    const execTimeout = historyParams?.timeout ?? timeout;

    setLoading(true);
    setSelectedHistoryId(null);
    try {
      // 解析请求数据
      let parsedData: Record<string, any> = {};
      try {
        parsedData = JSON.parse(execRequestData || '{}');
      } catch (e) {
        message.error('请求数据格式错误，请输入有效的 JSON');
        setLoading(false);
        return;
      }

      const response = await executeService.execute({
        chainId,
        requestData: parsedData,
        timeout: execTimeout,
      });

      setResult(response);

      // 保存到历史记录
      const historyItem: HistoryItem = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        chainId,
        requestData: execRequestData,
        timeout: execTimeout,
        result: response,
        timestamp: Date.now(),
      };
      setHistory(prev => [historyItem, ...prev].slice(0, 20)); // 最多保留20条

      // 高亮执行路径
      if (response.executionPath && response.executionPath.length > 0) {
        highlightExecutionPath(response.executionPath);
      }

      if (response.success) {
        message.success('执行成功');
      } else {
        message.error('执行失败');
      }
    } catch (error: any) {
      message.error(error.message || '执行失败');
    } finally {
      setLoading(false);
    }
  }, [chainId, requestData, timeout, flowGraph]);

  // 高亮执行路径
  const highlightExecutionPath = (path: string[]) => {
    // 清除之前的高亮
    flowGraph.getNodes().forEach((node) => {
      node.setAttrs({
        body: {
          stroke: undefined,
          strokeWidth: undefined,
        },
      });
    });

    // 高亮执行路径上的节点
    path.forEach((nodeId) => {
      const nodes = flowGraph.getNodes().filter((node) => {
        const model = node.getData()?.model;
        return model?.id === nodeId;
      });

      nodes.forEach((node) => {
        node.setAttrs({
          body: {
            stroke: '#52c41a',
            strokeWidth: 2,
          },
        });
      });
    });
  };

  // 清除结果
  const handleClear = useCallback(() => {
    setResult(null);
    setSelectedHistoryId(null);
    // 清除高亮
    flowGraph.getNodes().forEach((node) => {
      node.setAttrs({
        body: {
          stroke: undefined,
          strokeWidth: undefined,
        },
      });
    });
  }, [flowGraph]);

  // 查看历史记录
  const handleViewHistory = useCallback((item: HistoryItem) => {
    setSelectedHistoryId(item.id);
    setResult(item.result);
    // 高亮执行路径
    if (item.result.executionPath && item.result.executionPath.length > 0) {
      highlightExecutionPath(item.result.executionPath);
    }
  }, []);

  // 重新执行历史记录
  const handleReplayHistory = useCallback((item: HistoryItem) => {
    // 设置参数到输入框
    setRequestData(item.requestData);
    setTimeout(item.timeout);
    // 执行
    handleExecute({ requestData: item.requestData, timeout: item.timeout });
  }, [handleExecute]);

  // 删除单条历史记录
  const handleDeleteHistory = useCallback((id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
    if (selectedHistoryId === id) {
      setSelectedHistoryId(null);
      setResult(null);
    }
  }, [selectedHistoryId]);

  // 清空所有历史记录
  const handleClearHistory = useCallback(() => {
    setHistory([]);
    setSelectedHistoryId(null);
  }, []);

  // 格式化时间
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
  };

  // 点击执行路径节点
  const handlePathItemClick = (nodeId: string) => {
    const nodes = flowGraph.getNodes().filter((node) => {
      const model = node.getData()?.model;
      return model?.id === nodeId;
    });

    if (nodes.length > 0) {
      // 选中节点
      flowGraph.resetSelection(nodes);
      // 居中显示
      flowGraph.centerCell(nodes[0]);
    }
  };

  // 渲染执行结果
  const renderResult = () => {
    if (!result) {
      return (
        <div className={styles.emptyState}>
          <CodeOutlined className={styles.emptyIcon} />
          <div className={styles.emptyText}>点击执行按钮开始调试</div>
        </div>
      );
    }

    return (
      <div className={styles.executionResult}>
        {/* 执行状态 */}
        <div
          className={`${styles.resultHeader} ${
            result.success ? styles.success : styles.error
          }`}
        >
          {result.success ? (
            <CheckCircleOutlined
              className={styles.statusIcon}
              style={{ color: '#52c41a' }}
            />
          ) : (
            <CloseCircleOutlined
              className={styles.statusIcon}
              style={{ color: '#ff4d4f' }}
            />
          )}
          <span className={styles.statusText}>
            {result.success ? '执行成功' : '执行失败'}
          </span>
          <span className={styles.executionTime}>
            耗时: {result.executionTime}ms
          </span>
        </div>

        {/* 执行详情 */}
        <div className={styles.resultDetails}>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Chain ID:</span>
            <span className={styles.detailValue}>{result.chainId}</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>请求ID:</span>
            <span className={styles.detailValue}>{result.requestId}</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>节点数:</span>
            <span className={styles.detailValue}>{result.nodeCount}</span>
          </div>
          {result.responseData && (
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>返回数据:</span>
              <span className={styles.detailValue}>
                {JSON.stringify(result.responseData, null, 2)}
              </span>
            </div>
          )}
        </div>

        {/* 执行路径 */}
        {result.executionPath && result.executionPath.length > 0 && (
          <div className={styles.executionPath}>
            <div className={styles.pathTitle}>执行路径</div>
            <div className={styles.pathList}>
              {result.executionPath.map((nodeId, index) => (
                <React.Fragment key={nodeId}>
                  <Tooltip title="点击定位节点">
                    <span
                      className={styles.pathItem}
                      onClick={() => handlePathItemClick(nodeId)}
                    >
                      {nodeId}
                    </span>
                  </Tooltip>
                  {index < result.executionPath.length - 1 && (
                    <span className={styles.pathArrow}>→</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        {/* 步骤详情 */}
        {result.stepDetails && result.stepDetails.length > 0 && (
          <div className={styles.stepDetails}>
            <div className={styles.stepTitle}>步骤详情</div>
            <Collapse accordion>
              {result.stepDetails.map((step: StepDetail, index: number) => (
                <Panel
                  key={index}
                  header={
                    <div className={styles.stepHeader}>
                      <span className={styles.stepName}>{step.nodeId}</span>
                      <span
                        className={`${styles.stepStatus} ${
                          step.success ? styles.success : styles.error
                        }`}
                      >
                        {step.success ? '成功' : '失败'}
                      </span>
                      <span className={styles.stepTime}>
                        {step.timeSpent}ms
                      </span>
                    </div>
                  }
                >
                  <div className={styles.stepContent}>
                    {step.inputContext && (
                      <div className={styles.stepDataSection}>
                        <div className={styles.dataTitle}>输入Context</div>
                        <div className={styles.dataContent}>
                          {JSON.stringify(step.inputContext, null, 2)}
                        </div>
                      </div>
                    )}
                    {step.outputContext && (
                      <div className={styles.stepDataSection}>
                        <div className={styles.dataTitle}>输出Context</div>
                        <div className={styles.dataContent}>
                          {JSON.stringify(step.outputContext, null, 2)}
                        </div>
                      </div>
                    )}
                    {step.exception && (
                      <div className={styles.stepDataSection}>
                        <div className={styles.dataTitle}>异常信息</div>
                        <div
                          className={styles.dataContent}
                          style={{ color: '#ff4d4f' }}
                        >
                          {step.exception}
                        </div>
                      </div>
                    )}
                  </div>
                </Panel>
              ))}
            </Collapse>
          </div>
        )}

        {/* 异常堆栈 */}
        {result.exceptionStack && (
          <div className={styles.exceptionStack}>
            <div className={styles.exceptionTitle}>异常堆栈</div>
            <div className={styles.exceptionContent}>
              {result.exceptionStack}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={styles.liteflowEditorDebugPanelContainer}>
      {/* 头部 */}
      <div className={styles.debugPanelHeader}>
        <span className={styles.title}>执行调试</span>
        <div className={styles.actions}>
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            onClick={() => handleExecute()}
            loading={loading}
            disabled={!chainId}
          >
            执行
          </Button>
          <Button
            icon={<ClearOutlined />}
            onClick={handleClear}
            disabled={!result}
          >
            清除
          </Button>
        </div>
      </div>

      {/* 内容区域 */}
      <div className={styles.debugPanelContent}>
        {/* 请求参数 */}
        <div className={styles.requestSection}>
          <div className={styles.sectionTitle}>请求参数</div>
          <TextArea
            rows={4}
            placeholder='请输入请求数据 (JSON 格式)，例如: {"key": "value"}'
            value={requestData}
            onChange={(e) => setRequestData(e.target.value)}
          />
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center' }}>
            <span style={{ marginRight: 8 }}>超时时间 (ms):</span>
            <InputNumber
              min={1000}
              max={300000}
              value={timeout}
              onChange={(value) => setTimeout(value || 30000)}
              style={{ width: 120 }}
            />
          </div>
        </div>

        {/* 历史记录 */}
        <div className={styles.historySection}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>
              <HistoryOutlined style={{ marginRight: 4 }} />
              历史记录 ({history.length})
            </span>
            {history.length > 0 && (
              <Button
                type="text"
                size="small"
                icon={<DeleteOutlined />}
                onClick={handleClearHistory}
              >
                清空
              </Button>
            )}
          </div>
          <div className={styles.historyList}>
            {history.length === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无历史记录" />
            ) : (
              <List
                size="small"
                dataSource={history}
                renderItem={(item) => (
                  <List.Item
                    className={`${styles.historyItem} ${selectedHistoryId === item.id ? styles.selected : ''}`}
                    onClick={() => handleViewHistory(item)}
                    actions={[
                      <Tooltip title="重新执行" key="replay">
                        <Button
                          type="text"
                          size="small"
                          icon={<ReloadOutlined />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReplayHistory(item);
                          }}
                        />
                      </Tooltip>,
                      <Tooltip title="删除" key="delete">
                        <Button
                          type="text"
                          size="small"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteHistory(item.id);
                          }}
                        />
                      </Tooltip>,
                    ]}
                  >
                    <div className={styles.historyItemContent}>
                      <span className={styles.historyTime}>{formatTime(item.timestamp)}</span>
                      <span className={`${styles.historyStatus} ${item.result.success ? styles.success : styles.error}`}>
                        {item.result.success ? '成功' : '失败'}
                      </span>
                      <span className={styles.historyChain}>{item.chainId}</span>
                      <span className={styles.historyDuration}>{item.result.executionTime}ms</span>
                    </div>
                  </List.Item>
                )}
              />
            )}
          </div>
        </div>

        {/* 执行结果 */}
        <div className={styles.responseSection}>
          <div className={styles.sectionTitle}>
            执行结果
            {selectedHistoryId && <span className={styles.historyBadge}>历史</span>}
          </div>
          <div className={styles.responseContent}>
            {loading ? (
              <div className={styles.emptyState}>
                <Spin tip="执行中..." />
              </div>
            ) : (
              renderResult()
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebugPanel;
