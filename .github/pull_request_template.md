## Agent 与范围

- Agent ID（分支 `ao/<agent-id>/<topic>` 中的 `<agent-id>`）：
- 改动路径是否全部在该 Agent 的 owner 范围内（`ci-ownership` 会按 `scripts/ci/check-ownership.mjs` 自动校验）：
- 若改了其他 owner 的文件，说明由该 owner 代改或已拆成 stacked PR：

## 变更说明

（简述本次改动与动机）

## Definition of Done

- [ ] `npm test`、`W1_DB_SMOKE=true npm run test:integration`、`npm run test:e2e` 三层通过
- [ ] `ci-security` 通过：生产依赖 audit high/critical 为 0，tracked 文件无密钥且 `.gitignore` 规则完整
- [ ] 改动目录在授权范围内；新增路径已先在 `scripts/ci/check-ownership.mjs` 登记
- [ ] fixture 输出仍标注「演示桩 fixture」，未冒充真实模型
- [ ] 新增按钮/操作有真实服务端状态，或落到显式「W1 未实现」失败态；无假闭环
- [ ] 相关文档（CONTEXT.md / api-contract.md / README.md / operations.md）已同步
- [ ] 未提交 `.env`、`qwen.key` 或任何凭据与连接串
