import test from 'node:test';
import assert from 'node:assert/strict';
import { BusinessRulesService, DEFAULT_RULE_VERSION } from '../../src/components/business-rules/application/businessRulesService.js';
import { RuleRepository } from '../../src/components/business-rules/infrastructure/ruleRepository.js';
import { ValidationError } from '../../src/platform/http/errors.js';

// P-04：存款本息确定性计算的契约测试。
// 断言的是外部行为（返回结构、兴趣金额、错误码与状态码），不绑定私有实现细节；
// 规则来源使用真实的 fixture 规则目录（RuleRepository 在 fixture 模式下的行为），
// 因此同时覆盖“服务层 ↔ 规则目录”两步之间不得漂移的约束。
// 注意：本文件用 fixture 规则与固定输入验证公式与单位口径，不代表任何真实利率数据或生产验收结论。

function makeService() {
  return new BusinessRulesService({ repository: new RuleRepository({ db: { enabled: false }, dataMode: 'fixture' }) });
}

function expectValidationError(fn, field) {
  return assert.rejects(fn, (error) => {
    assert.ok(error instanceof ValidationError, 'must throw ValidationError');
    assert.equal(error.code, 'VALIDATION_ERROR');
    assert.equal(error.status, 400);
    if (field) assert.ok(error.details?.fields?.includes(field), `details.fields must include ${field}`);
    return true;
  });
}

test('deposit interest is reproducible from principal x decimal rate x years', async () => {
  const service = makeService();
  const principal = 500000;
  const annual_rate = 0.0215;
  const years = 3;
  const result = await service.calculateDeposit({ principal, annual_rate, years });

  assert.equal(result.status, 'MATCHED');
  assert.equal(result.rule_id, 'deposit-interest-simple');
  assert.equal(result.rule_version, DEFAULT_RULE_VERSION);

  // 业务不变量：利息与到期金额可由输入独立复算，且到分。
  const expectedInterest = Number((principal * annual_rate * years).toFixed(2));
  assert.equal(result.result.interest, expectedInterest);
  assert.equal(result.result.interest, 32250);
  assert.equal(result.result.maturity_amount, 532250);
  assert.equal(Number(result.result.maturity_amount.toFixed(2)), result.result.maturity_amount);
  assert.equal(result.result.principal, principal);

  // 期限矩阵：年数线性放大利息，到期金额 = 本金 + 利息。
  for (const term of [1, 2, 5]) {
    const scaled = await service.calculateDeposit({ principal, annual_rate, years: term });
    assert.equal(scaled.result.interest, Number((principal * annual_rate * term).toFixed(2)));
    assert.equal(scaled.result.maturity_amount, Number((principal + scaled.result.interest).toFixed(2)));
  }
});

test('deposit rate boundary at the 200% decimal ceiling is accepted while anything above is rejected', async () => {
  const service = makeService();
  // 正好等于上限（200% 年利率）仍属于合法小数口径，不被单位防御误伤。
  const atLimit = await service.calculateDeposit({ principal: 100, annual_rate: 2, years: 1 });
  assert.equal(atLimit.status, 'MATCHED');
  assert.equal(atLimit.result.interest, 200);
  assert.equal(atLimit.result.maturity_amount, 300);

  await expectValidationError(
    () => service.calculateDeposit({ principal: 100, annual_rate: 2.0001, years: 1 }),
    'annual_rate'
  );
});

test('decimal and percent rate units yield the same calculation_id and interest', async () => {
  const service = makeService();
  const base = { principal: 500000, years: 3 };
  const decimal = await service.calculateDeposit({ ...base, annual_rate: 0.0215, rate_unit: 'decimal' });
  const percent = await service.calculateDeposit({ ...base, annual_rate: 2.15, rate_unit: 'percent' });
  // 默认 rate_unit 为 decimal：省略与显式 decimal 必须一致。
  const implicit = await service.calculateDeposit({ ...base, annual_rate: 0.0215 });

  assert.equal(decimal.result.interest, 32250);
  assert.equal(percent.result.interest, decimal.result.interest);
  assert.equal(percent.result.maturity_amount, decimal.result.maturity_amount);
  assert.equal(percent.calculation_id, decimal.calculation_id);
  assert.equal(implicit.calculation_id, decimal.calculation_id);
  assert.equal(implicit.rate_unit, 'decimal');

  // 归一后进入规则的年利率是同一小数；回显保留调用方原始单位与数值。
  assert.equal(decimal.inputs.annual_rate, 0.0215);
  assert.equal(percent.inputs.annual_rate, 0.0215);
  assert.equal(percent.rate_unit, 'percent');
  assert.equal(percent.inputs_echo.annual_rate, 2.15);
  assert.equal(percent.inputs_echo.rate_unit, 'percent');
  assert.equal(decimal.rate_unit, 'decimal');

  // 中途换算不得引入浮点放大：回报的小数利率必须是 0.0215，而不是 0.021500000000000002。
  assert.equal(Number(percent.inputs.annual_rate.toFixed(4)), 0.0215);
});

test('a percentage value submitted as decimal is rejected instead of producing 100x inflated interest', async () => {
  const service = makeService();
  const inflatedInterest = 500000 * 2.15 * 3; // 3,225,000：若被静默接受将放大约 100 倍

  // 默认（decimal）口径下传 2.15 必须被拒绝，绝不产出错误本息。
  let error;
  await assert.rejects(
    () => service.calculateDeposit({ principal: 500000, annual_rate: 2.15, years: 3 }),
    (err) => {
      error = err;
      assert.ok(err instanceof ValidationError);
      assert.equal(err.code, 'VALIDATION_ERROR');
      assert.equal(err.status, 400);
      assert.ok(err.details?.fields?.includes('rate_unit'));
      return true;
    }
  );
  assert.ok(error, 'calculateDeposit must reject a percentage value sent as decimal');
  // 防御确实触发，而不是碰巧因为其他原因失败：错误信息必须提示单位。
  assert.match(error.message, /单位|rate_unit|decimal/i);

  // 显式 percent 口径下，同样的 2.15 才是合法输入，且利息远小于被放大的错误值。
  const percent = await service.calculateDeposit({ principal: 500000, annual_rate: 2.15, years: 3, rate_unit: 'percent' });
  assert.equal(percent.status, 'MATCHED');
  assert.notEqual(percent.result.interest, inflatedInterest);
  assert.equal(percent.result.interest, 32250);
});

test('unknown rule version returns UNSUPPORTED_RULE instead of guessing a rule', async () => {
  const service = makeService();
  const unknownVersion = await service.calculateDeposit({ principal: 500000, annual_rate: 0.0215, years: 3, rule_version: 'rules-demo-v999' });
  assert.equal(unknownVersion.status, 'UNSUPPORTED_RULE');
  assert.equal(unknownVersion.rule_id, 'deposit-interest-simple');
  assert.equal(unknownVersion.rule_version, 'rules-demo-v999');
  assert.equal(unknownVersion.calculation_id, undefined);
  assert.equal(unknownVersion.result, undefined);

  // 规则目录为空（仓库层找不到任何规则）时同样不得回退到硬编码计算。
  const emptyRepo = { findExact: async () => null };
  const emptyService = new BusinessRulesService({ repository: emptyRepo });
  const unsupported = await emptyService.calculateDeposit({ principal: 500000, annual_rate: 0.0215, years: 3 });
  assert.equal(unsupported.status, 'UNSUPPORTED_RULE');
  assert.equal(unsupported.result, undefined);
  assert.equal(unsupported.calculation_id, undefined);
});

test('invalid deposit input raises 400 VALIDATION_ERROR listing the offending field', async () => {
  const service = makeService();
  const invalidCases = [
    [{ principal: 0, annual_rate: 0.0215, years: 3 }, 'principal'],
    [{ principal: -1, annual_rate: 0.0215, years: 3 }, 'principal'],
    [{ annual_rate: 0.0215, years: 3 }, 'principal'],
    [{ principal: 500000, annual_rate: -0.01, years: 3 }, 'annual_rate'],
    [{ principal: 500000, years: 3 }, 'annual_rate'],
    [{ principal: 500000, annual_rate: 0.0215, years: 0 }, 'years'],
    [{ principal: 500000, annual_rate: 0.0215, years: 101 }, 'years'],
    [{ principal: 500000, annual_rate: 0.0215 }, 'years'],
    [{ principal: 'abc', annual_rate: 0.0215, years: 3 }, 'principal'],
    [{ principal: 500000, annual_rate: 0.0215, years: 3, rate_unit: 'bps' }, 'rate_unit']
  ];
  for (const [input, field] of invalidCases) {
    await expectValidationError(() => service.calculateDeposit(input), field);
  }
  // 无参数调用不得被当作“本金 0、期限 0”静默计算。
  await expectValidationError(() => service.calculateDeposit(), 'principal');
});

test('zero annual rate is allowed and yields zero interest but full principal back', async () => {
  const service = makeService();
  const result = await service.calculateDeposit({ principal: 100000, annual_rate: 0, years: 3 });
  assert.equal(result.status, 'MATCHED');
  assert.equal(result.result.interest, 0);
  assert.equal(result.result.maturity_amount, 100000);
});

test('matched deposit calculation carries an auditable formula string', async () => {
  const service = makeService();
  const result = await service.calculateDeposit({ principal: 500000, annual_rate: 0.0215, years: 3 });
  const formula = result.result.formula;
  assert.equal(typeof formula, 'string');
  assert.ok(formula.trim().length > 0);
  // 公式必须描述三个输入，且以规则目录的“小数口径”年利率出现。
  assert.match(formula, /本金/);
  assert.match(formula, /年利率/);
  assert.match(formula, /年数/);
  assert.ok(formula.includes('0.0215'), 'formula must use the normalized decimal rate');
  assert.ok(formula.includes('500000'));
  assert.ok(formula.includes('3'));
});

test('deposit calculation is deterministic and free of session or mutation side effects', async () => {
  const service = makeService();
  const calls = [];
  const spyRepo = {
    findExact: async (ruleId, version) => {
      calls.push([ruleId, version]);
      return (await new RuleRepository({ db: { enabled: false }, dataMode: 'fixture' }).findExact(ruleId, version));
    }
  };
  const spied = new BusinessRulesService({ repository: spyRepo });
  const first = await spied.calculateDeposit({ principal: 500000, annual_rate: 0.0215, years: 3 });
  const second = await spied.calculateDeposit({ principal: 500000, annual_rate: 0.0215, years: 3 });

  assert.deepEqual(first, second);
  assert.equal(first.calculation_id, second.calculation_id);
  // 只做了只读查找：没有写操作入口被调用（service 未暴露任何写方法）。
  assert.deepEqual(calls, [['deposit-interest-simple', DEFAULT_RULE_VERSION], ['deposit-interest-simple', DEFAULT_RULE_VERSION]]);
  assert.equal(typeof service.calculateDeposit, 'function');
});
