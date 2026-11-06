import { pathToFileURL } from 'node:url';
import { products, holdings, knowledgeChunks, DATA_AS_OF, DATA_VERSION, KNOWLEDGE_VERSION } from '../../src/fixtures/demoData.js';

/**
 * W1 fixture coverage report. Answers "which product actually has knowledge
 * evidence?" without inventing any: it reports, per product, whether a
 * knowledge chunk carries that product_id. Products without a chunk
 * (wealth / bondfund / cash) are the intended visible "insufficient evidence"
 * path for product_explain / candidate_explain, not a defect to patch by
 * adding chunks here. READ ONLY: never writes to the database.
 */

// Mirrors the API contract: these tasks require at least one retrieved chunk.
export const KNOWLEDGE_REQUIRED_TASKS = ['assistant_qa', 'research_qa', 'diagnosis_explain', 'candidate_explain', 'product_explain'];

// Mirrors KnowledgeRepository.search: product-scoped retrieval keeps only
// chunks tagged with a requested product, so an untagged chunk cannot rescue CV.
// assistant_qa also scopes structured facts to every product, so it is only
// listed here as product-scoped in that stricter sense (see UNFILTERED_TASKS).
const productScoped = new Set(KNOWLEDGE_REQUIRED_TASKS);
const UNFILTERED_TASKS = new Set(['assistant_qa']);

export function buildCoverageReport() {
  const chunksByProduct = new Map();
  for (const chunk of knowledgeChunks) {
    if (!chunk.product_id) continue;
    if (!chunksByProduct.has(chunk.product_id)) chunksByProduct.set(chunk.product_id, []);
    chunksByProduct.get(chunk.product_id).push(chunk.chunk_id);
  }

  const productRows = products.map((product) => {
    const chunkIds = chunksByProduct.get(product.id) || [];
    return {
      product_id: product.id,
      name: product.name,
      type: product.type,
      held: holdings.some((holding) => holding.product_id === product.id),
      chunk_count: chunkIds.length,
      chunk_ids: chunkIds,
      evidence_status: chunkIds.length ? 'COVERED' : 'INSUFFICIENT_EVIDENCE'
    };
  });

  const tasks = KNOWLEDGE_REQUIRED_TASKS.map((taskType) => {
    const candidates = productScoped.has(taskType) ? productRows : [];
    const failing = candidates.filter((row) => row.evidence_status !== 'COVERED').map((row) => row.product_id);
    return {
      task_type: taskType,
      product_scoped: productScoped.has(taskType),
      // assistant_qa may be called without product_ids; then it is not liable
      // to fail just because one product has no chunk.
      unfiltered_allowed: UNFILTERED_TASKS.has(taskType),
      // A product-scoped failure is per product; unscoped tasks only fail when
      // the whole knowledge base is empty, so they list no product.
      expected_failure_product_ids: !productScoped.has(taskType)
        ? []
        : failing.filter((id) => taskType !== 'diagnosis_explain' || productRows.find((row) => row.product_id === id)?.held)
    };
  });

  return {
    scope: 'W1 fixture knowledge coverage (deterministic fixture vectors, not semantic recall quality)',
    data_version: DATA_VERSION,
    knowledge_version: KNOWLEDGE_VERSION,
    data_as_of: DATA_AS_OF,
    chunk_total: knowledgeChunks.length,
    chunk_products: [...chunksByProduct.keys()].sort(),
    products: productRows,
    tasks,
    uncovered_products: productRows.filter((row) => row.evidence_status !== 'COVERED').map((row) => row.product_id)
  };
}

// Usage: node scripts/knowledge/coverage.js [--json]
// Read-only: prints which products have a knowledge chunk and which explain
// tasks are expected to show the "insufficient evidence" failure. It never
// writes, and a product without a chunk stays without a chunk.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const report = buildCoverageReport();
  if (process.argv.includes('--json')) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(report.scope);
    console.log(`data_version=${report.data_version} knowledge_version=${report.knowledge_version} chunks=${report.chunk_total} chunk_products=${report.chunk_products.join(',')}`);
    for (const row of report.products) {
      console.log(`  ${row.product_id.padEnd(10)} ${row.evidence_status.padEnd(21)} chunks=${row.chunk_count} held=${row.held ? 'yes' : 'no'} ${row.name}`);
    }
    for (const task of report.tasks) {
      const scope = task.product_scoped ? 'product-scoped' : 'knowledge-base wide';
      console.log(`  ${task.task_type.padEnd(18)} ${scope.padEnd(20)} expected insufficient-evidence: ${task.expected_failure_product_ids.length ? task.expected_failure_product_ids.join(',') : '(none)'}`);
    }
  }
}
