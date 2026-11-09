import { RULE_VERSION } from './demoData.js';

export const rules = [
  {
    rule_id: 'allocation-balanced-r3', rule_version: RULE_VERSION,
    name: 'R3 平衡型教育金配置', applicable_scenario: 'asset_allocation',
    required_inputs: ["amount","term","risk","purpose","liquidity","authorized"], conditions: ["risk == R3","authorized == true","term in 3–5 年"],
    action: {"cash":20,"bond":50,"equity":20,"protection":10}, enabled: true
  },
  {
    rule_id: 'allocation-liquid-r2', rule_version: RULE_VERSION,
    name: 'R2 流动性优先配置', applicable_scenario: 'asset_allocation',
    required_inputs: ["amount","term","risk","purpose","liquidity","authorized"], conditions: ["risk in R1/R2","authorized == true","liquidity contains 1 年"],
    action: {"cash":45,"bond":45,"equity":0,"protection":10}, enabled: true
  },
  {
    rule_id: 'deposit-interest-simple', rule_version: RULE_VERSION,
    name: '存款到期利息测算', applicable_scenario: 'deposit_calculation',
    required_inputs: ["principal","annual_rate","years"], conditions: ["principal > 0","annual_rate >= 0","years > 0"],
    action: {"formula":"principal * annual_rate * years"}, enabled: true
  },
  {
    rule_id: 'allocation-growth-r4', rule_version: RULE_VERSION,
    name: 'R4 进取型长期配置', applicable_scenario: 'asset_allocation',
    required_inputs: ["amount","term","risk","purpose","liquidity","authorized"], conditions: ["risk == R4","authorized == true"],
    action: {"cash":10,"bond":30,"equity":55,"protection":5}, enabled: true
  },
  {
    rule_id: 'allocation-conservative-r1', rule_version: RULE_VERSION,
    name: 'R1 保守型现金配置', applicable_scenario: 'asset_allocation',
    required_inputs: ["amount","term","risk","purpose","liquidity","authorized"], conditions: ["risk == R1","authorized == true"],
    action: {"cash":60,"bond":35,"equity":0,"protection":5}, enabled: true
  },
  {
    rule_id: 'allocation-education-short', rule_version: RULE_VERSION,
    name: '短期教育金稳健配置', applicable_scenario: 'asset_allocation',
    required_inputs: ["amount","term","risk","purpose","liquidity","authorized"], conditions: ["purpose == 教育金储备","term in 1–3 年","authorized == true"],
    action: {"cash":30,"bond":55,"equity":10,"protection":5}, enabled: true
  },
  {
    rule_id: 'deposit-interest-1y', rule_version: RULE_VERSION,
    name: '一年期存款利息测算', applicable_scenario: 'deposit_calculation',
    required_inputs: ["principal","annual_rate","years"], conditions: ["principal > 0","years == 1"],
    action: {"formula":"principal * annual_rate * years","term":"1y"}, enabled: true
  },
  {
    rule_id: 'insurance-suitability-check', rule_version: RULE_VERSION,
    name: '保险适配前置校验', applicable_scenario: 'insurance_eligibility',
    required_inputs: ["product_id","customer_risk","health_disclosure"], conditions: ["sale_status == ON_SALE","health_disclosure == true"],
    action: {"status":"NEED_CONFIRMATION"}, enabled: true
  }
];
