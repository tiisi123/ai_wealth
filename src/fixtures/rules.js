import { RULE_VERSION } from './demoData.js';

export const rules = [
  {
    rule_id: 'allocation-balanced-r3',
    rule_version: RULE_VERSION,
    name: 'R3 平衡型教育金配置',
    applicable_scenario: 'asset_allocation',
    required_inputs: ['amount', 'term', 'risk', 'purpose', 'liquidity', 'authorized'],
    conditions: ['risk == R3', 'authorized == true', 'term in 3–5 年'],
    action: { cash: 20, bond: 50, equity: 20, protection: 10 },
    enabled: true
  },
  {
    rule_id: 'allocation-liquid-r2',
    rule_version: RULE_VERSION,
    name: 'R2 流动性优先配置',
    applicable_scenario: 'asset_allocation',
    required_inputs: ['amount', 'term', 'risk', 'purpose', 'liquidity', 'authorized'],
    conditions: ['risk in R1/R2', 'authorized == true', 'liquidity contains 1 年'],
    action: { cash: 45, bond: 45, equity: 0, protection: 10 },
    enabled: true
  },
  {
    rule_id: 'deposit-interest-simple',
    rule_version: RULE_VERSION,
    name: '存款到期利息测算',
    applicable_scenario: 'deposit_calculation',
    required_inputs: ['principal', 'annual_rate', 'years'],
    conditions: ['principal > 0', 'annual_rate >= 0', 'years > 0'],
    action: { formula: 'principal * annual_rate * years' },
    enabled: true
  }
];
