import { DependencyUnavailableError, AppError } from '../../../platform/http/errors.js';

export class OpenAICompatibleClient {
  constructor({ config, fetchImpl = globalThis.fetch, logger }) {
    this.config = config;
    this.fetch = fetchImpl;
    this.logger = logger;
  }

  get configured() {
    return this.config.MODEL_CONFIGURED;
  }

  assertConfigured() {
    if (!this.configured) {
      throw new DependencyUnavailableError('真实生成/Embedding API 未配置', { dependency: 'model_api' });
    }
  }

  async request(path, body) {
    this.assertConfigured();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.MODEL_TIMEOUT_MS);
    const started = Date.now();
    try {
      const response = await this.fetch(`${this.config.MODEL_BASE_URL}${path}`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${this.config.MODEL_API_KEY}`
        },
        body: JSON.stringify(body),
        signal: controller.signal
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new AppError('模型服务请求失败', { code: 'MODEL_API_ERROR', status: 502, details: { upstream_status: response.status, upstream_code: payload?.error?.code } });
      }
      return { payload, latency_ms: Date.now() - started };
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new AppError('模型服务请求超时', { code: 'MODEL_TIMEOUT', status: 504, details: { timeout_ms: this.config.MODEL_TIMEOUT_MS } });
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  async embed(input) {
    const { payload, latency_ms } = await this.request('/embeddings', { model: this.config.EMBEDDING_MODEL_NAME, input });
    const embedding = payload?.data?.[0]?.embedding;
    if (!Array.isArray(embedding)) throw new AppError('Embedding API 返回格式无效', { code: 'MODEL_OUTPUT_INVALID', status: 502 });
    return { embedding, model: payload.model || this.config.EMBEDDING_MODEL_NAME, latency_ms };
  }

  async generate({ system, user }) {
    const { payload, latency_ms } = await this.request('/chat/completions', {
      model: this.config.MODEL_NAME,
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
      temperature: 0.1,
      max_tokens: 1200,
      response_format: { type: 'json_object' }
    });
    const choice = payload?.choices?.[0];
    const content = choice?.message?.content;
    if (typeof content !== 'string') throw new AppError('生成 API 返回格式无效', { code: 'MODEL_OUTPUT_INVALID', status: 502 });
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (error) {
      throw new AppError('生成模型未返回有效 JSON', { code: 'MODEL_OUTPUT_INVALID', status: 502, cause: error });
    }
    return { ...parsed, model: payload.model || this.config.MODEL_NAME, finish_reason: choice.finish_reason || null, latency_ms };
  }
}
