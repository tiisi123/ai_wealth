import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SESSION_PATCH_FIELDS,
  SESSION_COMMANDS,
  ACTIVITY_KINDS,
  MAX_ACTIVITIES,
  downstreamReset,
  sanitizePatch,
  validateSessionState
} from '../../src/components/sessions/domain/session.js';
import { defaultSessionState } from '../../src/fixtures/demoData.js';

// This file is the W1 state-contract lock. Any intentional change to the
// whitelist, command set, state shape or reset rules must update these
// expectations and docs/api-contract.md in the same PR.
const PATCH_FIELDS = [
  'role', 'authNotice', 'aiStatus', 'promptError', 'lastQuestion', 'lastAnswer',
  'diagnosis', 'goal', 'compareSet', 'reviewReady', 'researchAnswer',
  'researchUsedInCandidates', 'ruleMatch', 'contactTodo', 'holdingsExpanded',
  'landing', 'aiRequests', 'viewFilter', 'uiState'
];

const COMMANDS = [
  'set_authorization', 'generate_allocation', 'generate_candidates',
  'save_comparison', 'submit_care', 'create_reminder', 'record_activity'
];

const STATE_KEYS = [
  'customerName', 'customerId', 'authorized', 'qualified', 'lastQuestion',
  'lastAnswer', 'diagnosis', 'goal', 'plan', 'candidates', 'compareSet',
  'compareSaved', 'careSubmitted', 'remindCreated', 'reviewReady',
  'holdingsExpanded', 'contactTodo', 'selectPoolSynced', 'acceptanceAdvanced',
  'researchAnswer', 'researchUsedInCandidates', 'ruleMatch', 'aiStatus',
  'promptError', 'authNotice', 'landing', 'role', 'aiRequests', 'activities',
  'dataVersion', 'knowledgeVersion', 'ruleVersion', 'asOf', 'asOfFull',
  'viewFilter', 'uiState'
];

const RESET_KEYS = [
  'plan', 'ruleMatch', 'candidateCalculation', 'candidates', 'compareSet',
  'compareSaved', 'careSubmitted', 'remindCreated', 'researchUsedInCandidates',
  'selectPoolSynced', 'activities'
];

const sorted = (values) => [...values].sort();

test('PATCH whitelist is frozen at 19 fields', () => {
  assert.deepEqual(sorted(SESSION_PATCH_FIELDS), sorted(PATCH_FIELDS));
});

test('session command set is frozen at 7 commands', () => {
  assert.deepEqual(sorted(SESSION_COMMANDS), sorted(COMMANDS));
});

test('default session state is frozen at 36 keys', () => {
  assert.deepEqual(sorted(Object.keys(defaultSessionState())), sorted(STATE_KEYS));
});

test('downstream reset is frozen at 11 keys', () => {
  assert.deepEqual(sorted(Object.keys(downstreamReset())), sorted(RESET_KEYS));
});

test('server-authoritative fields can never be written through generic PATCH', () => {
  for (const field of ['authorized', 'plan', 'candidates', 'compareSaved', 'careSubmitted', 'remindCreated', 'selectPoolSynced', 'activities']) {
    assert.equal(SESSION_PATCH_FIELDS.has(field), false, `${field} must stay off the PATCH whitelist`);
    assert.throws(() => sanitizePatch({ [field]: true }), (error) => error.code === 'VALIDATION_ERROR');
  }
});

test('retired qualified / acceptanceAdvanced fields are no longer writable', () => {
  for (const field of ['qualified', 'acceptanceAdvanced']) {
    assert.equal(SESSION_PATCH_FIELDS.has(field), false);
    assert.throws(() => sanitizePatch({ [field]: true }), (error) => error.code === 'VALIDATION_ERROR');
  }
});

test('AI result projections must keep their bounded shape', () => {
  assert.ok(validateSessionState({ lastAnswer: { text: 'demo', sources: [], evidence: {}, model: 'fixture-generate-1' } }));
  assert.ok(validateSessionState({ researchAnswer: { question: 'q', text: 'a', sources: [] } }));
  assert.throws(() => validateSessionState({ lastAnswer: 'forged answer' }), (error) => error.code === 'VALIDATION_ERROR');
  assert.throws(() => validateSessionState({ lastAnswer: { sources: [] } }), (error) => error.code === 'VALIDATION_ERROR');
  assert.throws(() => validateSessionState({ lastAnswer: { text: 'x'.repeat(20001) } }), (error) => error.code === 'VALIDATION_ERROR');
  assert.throws(() => validateSessionState({ aiRequests: 'not-an-array' }), (error) => error.code === 'VALIDATION_ERROR');
  assert.throws(() => validateSessionState({ aiRequests: Array(101).fill('id') }), (error) => error.code === 'VALIDATION_ERROR');
});

test('UI state objects are bounded to 64KB', () => {
  assert.ok(validateSessionState({ uiState: { a: 1 }, viewFilter: {}, landing: { id: 'save' } }));
  assert.throws(() => validateSessionState({ uiState: { blob: 'x'.repeat(70000) } }), (error) => error.code === 'VALIDATION_ERROR');
  assert.throws(() => validateSessionState({ landing: 'not-an-object' }), (error) => error.code === 'VALIDATION_ERROR');
});

test('activity whitelist and cap stay consistent with the domain', () => {
  assert.equal(ACTIVITY_KINDS.size, 14);
  assert.equal(MAX_ACTIVITIES, 50);
  assert.equal(SESSION_COMMANDS.has('record_activity'), true);
});
