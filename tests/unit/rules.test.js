import test from 'node:test';
import assert from 'node:assert/strict';
import { executeRule, validateRule } from '../../src/components/business-rules/domain/ruleCatalog.js';
import { rules } from '../../src/fixtures/rules.js';
import { selectCandidates } from '../../src/components/business-rules/domain/candidateRules.js';

test('allocation rule requires authorization and preserves a 100 percent total', () => {
  const rule = rules.find((item) => item.rule_id === 'allocation-balanced-r3');
  assert.equal(validateRule(rule, { amount: '500000', term: '3–5 年', risk: 'R3 平衡型', purpose: '教育金储备', liquidity: '大部分可长期投资', authorized: false }).status, 'NEED_CONFIRMATION');
  const result = executeRule(rule, { amount: '500000', term: '3–5 年', risk: 'R3 平衡型', purpose: '教育金储备', liquidity: '大部分可长期投资', authorized: true });
  assert.equal(result.status, 'MATCHED');
  assert.equal(Object.values(result.result).reduce((sum, value) => sum + value, 0), 100);
});

test('deposit calculation is deterministic and does not use a model', () => {
  const rule = rules.find((item) => item.rule_id === 'deposit-interest-simple');
  const result = executeRule(rule, { principal: 500000, annual_rate: 0.0215, years: 3 });
  assert.equal(result.result.interest, 32250);
  assert.equal(result.result.maturity_amount, 532250);
});

test('candidate selection rejects products outside risk, term, liquidity and sale constraints', () => {
  const result = selectCandidates({
    customer: { authorized: true, risk_level: 'R3' },
    goal: { risk: 'R3 平衡型', term: '3–5 年', liquidity: '大部分可长期投资' },
    products: [
      { id: 'ok', risk: 'R3', type: '基金', sale_status: 'ON_SALE', liquidity: '工作日可申赎', source_timestamp: '2026-11-02' },
      { id: 'too-risky', risk: 'R4', type: '基金', sale_status: 'ON_SALE', liquidity: '工作日可申赎', source_timestamp: '2026-11-02' },
      { id: 'off-sale', risk: 'R2', type: '基金', sale_status: 'OFF_SALE', liquidity: '工作日可申赎', source_timestamp: '2026-11-02' }
    ]
  });
  assert.deepEqual(result.candidate_ids, ['ok']);
  assert.equal(result.data_ids[0], 'product:ok');
});
