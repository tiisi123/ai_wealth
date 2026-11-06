import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SESSION_PATCH_FIELDS,
  SESSION_COMMANDS,
  downstreamReset
} from '../../src/components/sessions/domain/session.js';
import { defaultSessionState } from '../../src/fixtures/demoData.js';

// 冻结集合回归保护（波次 2–5 之后的自检证据，A01–A35）。
//
// 定位：`tests/unit/session-contract.test.js` 是 W1 状态契约锁，其期望集合必须保持原样——
// 任何集合变更都要同步 `docs/api-contract.md` 并视为契约变更。本文件**不改**那份期望，
// 只在自己的文件里重新声明同一份冻结值并直接 import 领域常量做 deepEqual，
// 用于回答一个独立问题：波次 2–5 的并行改动之后，冻结集合是否仍与冻结时一致。
//
// 为什么值得单独一条：并行波次里最容易发生的回归不是"有人故意改集合"，而是"顺手加一个字段"
// （新增状态 key、把服务端权威字段挪进 PATCH 白名单、给 downstreamReset 多加一个 key、
// 新增命令却漏同步文档）。这条用例把四类漂移一次性挡住，且失败信息直接指出是哪一类。
//
// 说明：这里锁定的只是"集合不漂移"，不证明业务语义正确；业务行为仍由各自的用例覆盖。
// 本文件不连库、不调模型，纯内存常量。

// 冻结值（与 session-contract.test.js 的期望逐字一致；只读快照，不得在本文件修改）。
const FROZEN_PATCH_FIELDS = [
  'role', 'authNotice', 'aiStatus', 'promptError', 'lastQuestion', 'lastAnswer',
  'diagnosis', 'goal', 'compareSet', 'reviewReady', 'researchAnswer',
  'researchUsedInCandidates', 'ruleMatch', 'contactTodo', 'holdingsExpanded',
  'landing', 'aiRequests', 'viewFilter', 'uiState'
];

const FROZEN_COMMANDS = [
  'set_authorization', 'generate_allocation', 'generate_candidates',
  'save_comparison', 'submit_care', 'create_reminder', 'record_activity'
];

const FROZEN_STATE_KEYS = [
  'customerName', 'customerId', 'authorized', 'qualified', 'lastQuestion',
  'lastAnswer', 'diagnosis', 'goal', 'plan', 'candidates', 'compareSet',
  'compareSaved', 'careSubmitted', 'remindCreated', 'reviewReady',
  'holdingsExpanded', 'contactTodo', 'selectPoolSynced', 'acceptanceAdvanced',
  'researchAnswer', 'researchUsedInCandidates', 'ruleMatch', 'aiStatus',
  'promptError', 'authNotice', 'landing', 'role', 'aiRequests', 'activities',
  'dataVersion', 'knowledgeVersion', 'ruleVersion', 'asOf', 'asOfFull',
  'viewFilter', 'uiState'
];

const FROZEN_RESET_KEYS = [
  'plan', 'ruleMatch', 'candidateCalculation', 'candidates', 'compareSet',
  'compareSaved', 'careSubmitted', 'remindCreated', 'researchUsedInCandidates',
  'selectPoolSynced', 'activities'
];

const sorted = (values) => [...values].sort();

// 差集提示：直接告诉维护者多了/少了哪些项，而不是只报 deepEqual 失败。
function describeDrift(actual, expected) {
  const actualSet = new Set(actual);
  const expectedSet = new Set(expected);
  const added = [...actualSet].filter((value) => !expectedSet.has(value));
  const removed = [...expectedSet].filter((value) => !actualSet.has(value));
  return `added=[${added.join(',')}] removed=[${removed.join(',')}]`;
}

function assertFrozen(actual, expected, label) {
  assert.deepEqual(sorted(actual), sorted(expected), `${label} drifted: ${describeDrift(actual, expected)}`);
}

test('regression: SESSION_PATCH_FIELDS is still the frozen 19-field whitelist', () => {
  assertFrozen([...SESSION_PATCH_FIELDS], FROZEN_PATCH_FIELDS, 'SESSION_PATCH_FIELDS');
  assert.equal(SESSION_PATCH_FIELDS.size, 19);
});

test('regression: SESSION_COMMANDS is still the frozen 7-command set', () => {
  assertFrozen([...SESSION_COMMANDS], FROZEN_COMMANDS, 'SESSION_COMMANDS');
  assert.equal(SESSION_COMMANDS.size, 7);
});

test('regression: defaultSessionState() still has exactly the frozen 36 keys', () => {
  const state = defaultSessionState();
  assertFrozen(Object.keys(state), FROZEN_STATE_KEYS, 'defaultSessionState keys');
  assert.equal(Object.keys(state).length, 36);
  // 默认状态必须是值快照而不是共享引用：调用方改动一份不能污染下一份。
  const second = defaultSessionState();
  assert.notEqual(second, state);
});

test('regression: downstreamReset() is still the frozen 11-key cascade', () => {
  assertFrozen(Object.keys(downstreamReset()), FROZEN_RESET_KEYS, 'downstreamReset keys');
  assert.equal(Object.keys(downstreamReset()).length, 11);
  // 每次调用都应是新对象，避免命令之间共享同一个重置补丁。
  assert.notEqual(downstreamReset(), downstreamReset());
});

test('regression: the frozen sets do not overlap in ways the contract forbids', () => {
  // 命令写入、但没有默认值的服务端权威 key。`docs/api-contract.md` 把 `candidateCalculation`
  // 归为 A 类（命令写入），它由 `generate_candidates` 产生，因此不在 defaultSessionState() 的 36 个
  // 默认 key 里；它仍是下游重置的目标，重置后由后续命令重新写入。
  const COMMAND_ONLY_STATE_KEYS = ['candidateCalculation'];

  // 1) 每个 downstreamReset 的 key 都必须是一个真实的会话状态 key（默认 key 或命令写入 key），
  //    否则"重置"会凭空造字段，把未知字段写进会话状态。
  for (const key of FROZEN_RESET_KEYS) {
    assert.ok(
      FROZEN_STATE_KEYS.includes(key) || COMMAND_ONLY_STATE_KEYS.includes(key),
      `downstreamReset key ${key} is neither a default state key nor a command-only state key`
    );
  }
  // 2) 命令写入 key 不得混进默认 36 key，否则默认态会凭空出现一份"未计算"的计算结果。
  for (const key of COMMAND_ONLY_STATE_KEYS) {
    assert.equal(FROZEN_STATE_KEYS.includes(key), false, `${key} must not be part of defaultSessionState()`);
  }
  // 3) 服务端权威字段不得出现在 PATCH 白名单：命令写入的 candidateCalculation 与
  //    真业务闭环结果（plan/candidates/compareSaved/careSubmitted/remindCreated/selectPoolSynced）
  //    以及活动记录（activities）、授权（authorized）都由服务端产生。
  for (const key of ['authorized', 'plan', 'candidates', 'candidateCalculation', 'compareSaved', 'careSubmitted', 'remindCreated', 'selectPoolSynced', 'activities']) {
    assert.equal(FROZEN_PATCH_FIELDS.includes(key), false, `${key} must never become a PATCH field`);
  }
  // 4) 命令集与 PATCH 白名单互不相交（一个是命令名，一个是字段名），防止命名串用。
  for (const name of FROZEN_COMMANDS) {
    assert.equal(FROZEN_PATCH_FIELDS.includes(name), false, `command ${name} must not be a PATCH field`);
  }
});
