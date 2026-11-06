/*
 * Frontend adapter for the shared-session contract.
 * Only session_id is kept in localStorage; business state remains authoritative in PostgreSQL.
 */
(function (global) {
  const SESSION_KEY = 'wealth-demo-session-id';
  const EXPECTED_FRONTEND_CONTRACT = '2026-11-02.1';
  let sessionId = global.localStorage?.getItem(SESSION_KEY) || '';
  let serverVersion = null;
  let connected = false;
  let syncing = Promise.resolve();
  let initializationPromise = null;
  let lifecycle = 0;
  let applyingServerState = false;
  const original = global.DemoSession;

  function emit(name, detail) {
    global.dispatchEvent(new CustomEvent(name, { detail }));
  }

  function createRequestId() {
    if (global.crypto?.randomUUID) return global.crypto.randomUUID();
    const bytes = new Uint8Array(16);
    if (global.crypto?.getRandomValues) global.crypto.getRandomValues(bytes);
    else for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = [...bytes].map((value) => value.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  function staleRequestError() {
    const error = new Error('请求所属会话已失效');
    error.code = 'STALE_REQUEST';
    throw error;
  }

  function assertCurrent(expectedLifecycle, expectedSessionId) {
    if (lifecycle !== expectedLifecycle || sessionId !== expectedSessionId) staleRequestError();
  }

  function assertWritable() {
    if (!connected || !sessionId) throw new Error('共享会话尚未建立');
    if (!Number.isInteger(serverVersion) || serverVersion <= 0) throw new Error('共享会话版本无效');
  }

  async function request(path, options = {}) {
    const response = await fetch(path, {
      ...options,
      headers: { 'content-type': 'application/json', ...(options.headers || {}) }
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(body?.error?.message || `请求失败（${response.status}）`);
      error.status = response.status;
      error.code = body?.error?.code;
      error.body = body;
      throw error;
    }
    return body;
  }

  // PostgreSQL returns DATE as a UTC-midnight Date, so the authoritative
  // business date arrives as "2026-09-28T00:00:00.000Z". Normalise it back to
  // the business-date format the contract and the UI copy use; never present
  // the storage encoding as the data time point.
  function businessDate(value) {
    return typeof value === 'string' && value.length >= 10 ? value.slice(0, 10) : undefined;
  }

  function applyRecord(record) {
    if (!record || !Number.isInteger(record.version) || record.version <= 0) {
      throw new Error('应用服务返回了无效会话版本');
    }
    serverVersion = record.version;
    applyingServerState = true;
    try {
      original.patch(Object.assign({}, record.state || {}, { asOf: businessDate(record.state?.asOf), _serverVersion: serverVersion }));
    } finally {
      applyingServerState = false;
    }
  }

  async function loadData(expectedLifecycle = lifecycle, expectedSessionId = sessionId) {
    const body = await request(`/api/demo-data?session_id=${encodeURIComponent(expectedSessionId)}`);
    assertCurrent(expectedLifecycle, expectedSessionId);
    const products = (body.products || []).map((product) => ({
      ...product,
      ret: product.latest_return == null ? '—' : `${(Number(product.latest_return) * 100).toFixed(2)}%`,
      drawdown: product.drawdown == null ? '—' : `${(Number(product.drawdown) * 100).toFixed(2)}%`,
      fee: product.fee == null ? '—' : `${(Number(product.fee) * 100).toFixed(2)}% 管理费`,
      detail: `${product.type} · ${product.risk} · ${product.liquidity || '以产品规则为准'}`,
      match: '—'
    }));
    const holdings = (body.holdings || []).map((holding) => {
      const product = products.find((item) => item.id === holding.product_id);
      return { ...holding, name: product?.name || holding.product_id, type: product?.type || '产品', amount: `¥${Number(holding.amount || 0).toLocaleString('zh-CN')}`, ret: holding.return_rate == null ? '—' : `${(Number(holding.return_rate) * 100).toFixed(2)}%` };
    });
    original.replaceData?.({ products, holdings, asOf: body.data_as_of, asOfFull: body.data_as_of_full });
    emit('wealth-data-ready', { dataVersion: body.data_version });
  }

  async function loadKnowledge(expectedLifecycle = lifecycle, expectedSessionId = sessionId) {
    const body = await request('/api/knowledge');
    assertCurrent(expectedLifecycle, expectedSessionId);
    const chunks = Array.isArray(body.chunks) ? body.chunks : [];
    const documents = [...new Map(chunks.map((chunk) => [chunk.document_id, {
      document_id: chunk.document_id,
      title: chunk.title,
      source_id: chunk.source_id,
      source_timestamp: chunk.source_timestamp,
      knowledge_version: chunk.knowledge_version
    }])).values()];
    applyingServerState = true;
    try {
      original.patch({ _knowledgeStatus: body.status || null, _knowledgeDocuments: documents, _knowledgeChunks: chunks });
    } finally {
      applyingServerState = false;
    }
  }

  function reportError(error, kind = 'load') {
    connected = false;
    emit('wealth-session-sync-error', { error, kind });
  }

  function createOrLoad() {
    if (initializationPromise) return initializationPromise;
    const expectedLifecycle = lifecycle;
    initializationPromise = (async () => {
      try {
        const health = await request('/api/health');
        if (health.frontend_contract_version !== EXPECTED_FRONTEND_CONTRACT || health.api_version !== 'v1') {
          const error = new Error('前端与应用服务契约版本不匹配');
          error.code = 'FRONTEND_CONTRACT_MISMATCH';
          throw error;
        }
        let body;
        if (sessionId) {
          try {
            body = await request(`/api/sessions/${encodeURIComponent(sessionId)}`);
          } catch (error) {
            if (error.status !== 404 || !sessionId) throw error;
            global.localStorage?.removeItem(SESSION_KEY);
            sessionId = '';
            body = await request('/api/sessions', { method: 'POST', body: JSON.stringify({}) });
          }
        } else {
          body = await request('/api/sessions', { method: 'POST', body: JSON.stringify({}) });
        }
        const record = body.session;
        if (lifecycle !== expectedLifecycle) staleRequestError();
        sessionId = record.session_id;
        assertCurrent(expectedLifecycle, sessionId);
        global.localStorage?.setItem(SESSION_KEY, sessionId);
        applyRecord(record);
        await Promise.all([loadData(expectedLifecycle, sessionId), loadKnowledge(expectedLifecycle, sessionId)]);
        connected = true;
        emit('wealth-session-ready', { sessionId, version: serverVersion });
        return record;
      } catch (error) {
        if (error.code !== 'STALE_REQUEST') reportError(error, 'initialization');
        throw error;
      }
    })();
    return initializationPromise;
  }

  async function reloadAfterConflict(expectedLifecycle, expectedSessionId) {
    try {
      assertCurrent(expectedLifecycle, expectedSessionId);
      const body = await request(`/api/sessions/${encodeURIComponent(expectedSessionId)}`);
      assertCurrent(expectedLifecycle, expectedSessionId);
      applyRecord(body.session);
      await Promise.all([loadData(expectedLifecycle, expectedSessionId), loadKnowledge(expectedLifecycle, expectedSessionId)]);
      connected = true;
      emit('wealth-session-ready', { sessionId, version: serverVersion, reloaded: true });
    } catch (error) {
      if (error.code !== 'STALE_REQUEST') reportError(error);
      throw error;
    }
  }

  function enqueueWrite(operation) {
    const run = syncing.catch(() => {}).then(operation);
    syncing = run;
    return run;
  }

  async function patchServer(patch, expectedLifecycle, expectedSessionId) {
    assertCurrent(expectedLifecycle, expectedSessionId);
    assertWritable();
    try {
      const body = await request(`/api/sessions/${encodeURIComponent(expectedSessionId)}`, {
        method: 'PATCH',
        body: JSON.stringify({ expected_version: serverVersion, request_id: createRequestId(), patch })
      });
      assertCurrent(expectedLifecycle, expectedSessionId);
      applyRecord(body.session);
      return body.session;
    } catch (error) {
      if (error.status === 409 && error.code !== 'STALE_REQUEST') {
        await reloadAfterConflict(expectedLifecycle, expectedSessionId);
      }
      throw error;
    }
  }

  const api = {
    createRequestId,
    async generate({ task_type, input, product_ids = [], source_ids = [], request_id }) {
      await createOrLoad();
      await syncing;
      assertWritable();
      const expectedLifecycle = lifecycle;
      const expectedSessionId = sessionId;
      const requestId = request_id || createRequestId();
      try {
        const body = await request('/api/ai/generate', {
          method: 'POST',
          body: JSON.stringify({ session_id: expectedSessionId, session_version: serverVersion, request_id: requestId, task_type, input, product_ids, source_ids })
        });
        assertCurrent(expectedLifecycle, expectedSessionId);
        return body;
      } catch (error) {
        if (error.status === 409 && error.code !== 'STALE_REQUEST') {
          await reloadAfterConflict(expectedLifecycle, expectedSessionId);
        }
        throw error;
      }
    },
    async command(command, input = {}) {
      await createOrLoad();
      await syncing;
      const expectedLifecycle = lifecycle;
      const expectedSessionId = sessionId;
      return enqueueWrite(async () => {
        assertCurrent(expectedLifecycle, expectedSessionId);
        assertWritable();
        try {
          const body = await request(`/api/sessions/${encodeURIComponent(expectedSessionId)}/commands`, {
            method: 'POST',
            body: JSON.stringify({ expected_version: serverVersion, request_id: createRequestId(), command, input })
          });
          assertCurrent(expectedLifecycle, expectedSessionId);
          applyRecord(body.session);
          return body;
        } catch (error) {
          if (error.status === 409 && error.code !== 'STALE_REQUEST') {
            await reloadAfterConflict(expectedLifecycle, expectedSessionId);
          }
          throw error;
        }
      });
    },
    async patch(patch) {
      await createOrLoad();
      original.patch(patch);
      await syncing;
      return original.get();
    },
    async whenSynced() {
      await syncing;
    },
    async health() { return request('/api/health'); },
    async getSession() {
      await createOrLoad();
      const expectedLifecycle = lifecycle;
      const expectedSessionId = sessionId;
      const body = await request(`/api/sessions/${encodeURIComponent(expectedSessionId)}`);
      assertCurrent(expectedLifecycle, expectedSessionId);
      return body;
    },
    newSession() {
      const expectedLifecycle = ++lifecycle;
      connected = false;
      sessionId = '';
      global.localStorage?.removeItem(SESSION_KEY);
      const run = enqueueWrite(async () => {
        try {
          const body = await request('/api/sessions', { method: 'POST', body: JSON.stringify({}) });
          const record = body.session;
          if (lifecycle !== expectedLifecycle) staleRequestError();
          sessionId = record.session_id;
          assertCurrent(expectedLifecycle, sessionId);
          global.localStorage?.setItem(SESSION_KEY, sessionId);
          original.reset();
          applyRecord(record);
          await Promise.all([loadData(expectedLifecycle, sessionId), loadKnowledge(expectedLifecycle, sessionId)]);
          connected = true;
          emit('wealth-session-ready', { sessionId, version: serverVersion, newSession: true });
          return record;
        } catch (error) {
          if (lifecycle === expectedLifecycle && error.code !== 'STALE_REQUEST') reportError(error, 'initialization');
          throw error;
        }
      });
      initializationPromise = run;
      return run;
    },
    get sessionId() { return sessionId; },
    get connected() { return connected; },
    get serverVersion() { return serverVersion; }
  };

  if (original) {
    const originalPatch = original.patch.bind(original);
    original.patch = function (patch) {
      const result = originalPatch(patch);
      const serverPatch = Object.fromEntries(Object.entries(patch || {}).filter(([key]) => !key.startsWith('_')));
      if (Object.keys(serverPatch).length && connected && !applyingServerState) {
        const expectedLifecycle = lifecycle;
        const expectedSessionId = sessionId;
        const run = enqueueWrite(() => patchServer(serverPatch, expectedLifecycle, expectedSessionId));
        run.catch((error) => {
          if (error.code !== 'STALE_REQUEST') emit('wealth-session-sync-error', { error, kind: 'patch' });
        });
      }
      return result;
    };
    original.sessionId = () => sessionId;
    original.serverVersion = () => serverVersion;
    original.isConnected = () => connected;
  }

  global.WealthApi = api;
  global.setTimeout(() => { createOrLoad().catch(() => {}); }, 0);
})(window);
