import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import { pathToFileURL } from 'node:url';

export async function readPackage(filePath) {
  const raw = await fs.readFile(filePath, 'utf8');
  return { raw, hash: crypto.createHash('sha256').update(raw).digest('hex'), value: JSON.parse(raw) };
}

function present(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

export function validatePackage(value) {
  const errors = [];
  if (!value || typeof value !== 'object' || Array.isArray(value)) return [{ path: '$', reason: 'package must be an object' }];
  for (const key of ['data_version', 'as_of']) {
    if (!present(value[key])) errors.push({ path: key, reason: 'non-empty string required' });
  }

  for (const key of ['customers', 'holdings', 'products']) {
    if (!Array.isArray(value[key]) || value[key].length === 0) {
      errors.push({ path: key, reason: 'non-empty array required' });
    }
  }
  if (value.documents !== undefined && !Array.isArray(value.documents)) {
    errors.push({ path: 'documents', reason: 'array required' });
  }

  const customers = Array.isArray(value.customers) ? value.customers : [];
  const products = Array.isArray(value.products) ? value.products : [];
  const holdings = Array.isArray(value.holdings) ? value.holdings : [];
  const documents = Array.isArray(value.documents) ? value.documents : [];
  const customerIds = new Set();
  const productIds = new Set();
  const holdingIds = new Set();

  for (const [index, customer] of customers.entries()) {
    const customerId = customer?.customer_id;
    if (!present(customerId) || !present(customer?.display_name) || !present(customer?.risk_level)) {
      errors.push({ path: `customers[${index}]`, reason: 'customer_id/display_name/risk_level required' });
    }
    if (present(customerId)) {
      if (customerIds.has(customerId)) errors.push({ path: `customers[${index}].customer_id`, reason: 'duplicate customer_id' });
      customerIds.add(customerId);
    }
  }
  for (const [index, product] of products.entries()) {
    const productId = product?.product_id;
    if (!present(productId) || !present(product?.name) || !present(product?.type) || !present(product?.risk) || !present(product?.source_id) || !present(product?.source_timestamp)) {
      errors.push({ path: `products[${index}]`, reason: 'product_id/name/type/risk/source fields required' });
    }
    if (present(productId)) {
      if (productIds.has(productId)) errors.push({ path: `products[${index}].product_id`, reason: 'duplicate product_id' });
      productIds.add(productId);
    }
  }
  for (const [index, holding] of holdings.entries()) {
    const holdingId = holding?.holding_id;
    if (!present(holdingId) || !customerIds.has(holding?.customer_id) || !productIds.has(holding?.product_id)) {
      errors.push({ path: `holdings[${index}]`, reason: 'holding_id and valid customer_id/product_id required' });
    }
    if (present(holdingId)) {
      if (holdingIds.has(holdingId)) errors.push({ path: `holdings[${index}].holding_id`, reason: 'duplicate holding_id' });
      holdingIds.add(holdingId);
    }
    if (typeof holding?.amount !== 'number' || !Number.isFinite(holding.amount) || holding.amount < 0) {
      errors.push({ path: `holdings[${index}].amount`, reason: 'amount must be a non-negative number' });
    }
  }

  const documentIds = new Set();
  const chunkIds = new Set();
  for (const [index, document] of documents.entries()) {
    const documentId = document?.document_id;
    if (!present(documentId) || !present(document?.title) || !present(document?.source_id)) {
      errors.push({ path: `documents[${index}]`, reason: 'document_id/title/source_id required' });
    }
    if (present(documentId)) {
      if (documentIds.has(documentId)) errors.push({ path: `documents[${index}].document_id`, reason: 'duplicate document_id' });
      documentIds.add(documentId);
    }
    if (!Array.isArray(document?.chunks) || document.chunks.length === 0) {
      errors.push({ path: `documents[${index}].chunks`, reason: 'non-empty array required' });
      continue;
    }
    for (const [chunkIndex, chunk] of document.chunks.entries()) {
      const chunkId = chunk?.chunk_id;
      if (!present(chunkId) || !present(chunk?.text)) {
        errors.push({ path: `documents[${index}].chunks[${chunkIndex}]`, reason: 'chunk_id and non-empty text required' });
      }
      if (present(chunkId)) {
        if (chunkIds.has(chunkId)) errors.push({ path: `documents[${index}].chunks[${chunkIndex}].chunk_id`, reason: 'duplicate chunk_id' });
        chunkIds.add(chunkId);
      }
    }
  }
  return errors;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const filePath = process.argv[2];
  if (!filePath) throw new Error('usage: npm run import:validate -- path/to/package.json');
  const { value, hash } = await readPackage(filePath);
  const errors = validatePackage(value);
  console.log(JSON.stringify({ valid: errors.length === 0, source_hash: hash, errors }, null, 2));
  if (errors.length) process.exitCode = 1;
}
