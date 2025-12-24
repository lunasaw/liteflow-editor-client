/**
 * HTTP 请求封装
 */

// API 基础配置
const API_BASE_URL = '/api';
const DEFAULT_TIMEOUT = 30000;

/** 请求配置 */
interface RequestConfig extends RequestInit {
  timeout?: number;
  params?: Record<string, any>;
}

/** 请求错误 */
export class RequestError extends Error {
  code: string;
  status?: number;

  constructor(message: string, code: string, status?: number) {
    super(message);
    this.name = 'RequestError';
    this.code = code;
    this.status = status;
  }
}

/**
 * 构建 URL 参数
 */
function buildQueryString(params: Record<string, any>): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

/**
 * 超时包装
 */
function withTimeout<T>(promise: Promise<T>, timeout: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new RequestError('请求超时', 'TIMEOUT')), timeout)
    ),
  ]);
}

/**
 * 基础请求方法
 */
async function request<T = any>(
  url: string,
  config: RequestConfig = {}
): Promise<T> {
  const { timeout = DEFAULT_TIMEOUT, params, ...fetchConfig } = config;

  // 构建完整 URL
  let fullUrl = `${API_BASE_URL}${url}`;
  if (params) {
    fullUrl += buildQueryString(params);
  }

  // 默认请求头
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(fetchConfig.headers || {}),
  };

  try {
    const response = await withTimeout(
      fetch(fullUrl, {
        ...fetchConfig,
        headers,
      }),
      timeout
    );

    // 检查 HTTP 状态
    if (!response.ok) {
      throw new RequestError(
        `HTTP Error: ${response.status} ${response.statusText}`,
        'HTTP_ERROR',
        response.status
      );
    }

    // 解析响应
    const data = await response.json();

    // 检查业务状态
    if (data.code && data.code !== 'S') {
      throw new RequestError(data.message || '请求失败', data.code);
    }

    return data;
  } catch (error) {
    if (error instanceof RequestError) {
      throw error;
    }
    throw new RequestError(
      error instanceof Error ? error.message : '网络异常',
      'NETWORK_ERROR'
    );
  }
}

/**
 * GET 请求
 */
export function get<T = any>(
  url: string,
  params?: Record<string, any>,
  config?: RequestConfig
): Promise<T> {
  return request<T>(url, {
    ...config,
    method: 'GET',
    params,
  });
}

/**
 * POST 请求
 */
export function post<T = any>(
  url: string,
  data?: any,
  config?: RequestConfig
): Promise<T> {
  return request<T>(url, {
    ...config,
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
}

export default {
  get,
  post,
  request,
  RequestError,
};
