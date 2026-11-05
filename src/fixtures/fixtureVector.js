import { createHash } from 'node:crypto';

export const FIXTURE_VECTOR_DIM = 1536;
export const FIXTURE_EMBEDDING_MODEL = 'fixture-deterministic-1536';
export const FIXTURE_GENERATION_MODEL = 'fixture-generate-1';

/**
 * Deterministic stand-in vector for W1 only.
 *
 * Every component is a strong positive baseline plus a tiny hash-derived jitter,
 * so any two fixture vectors have a high cosine similarity while a vector is
 * exactly self-similar. That guarantees the pgvector `<=>` path, the 0.2
 * relevance floor and the fixed Top-1 self-recall regression all pass without
 * pretending to carry semantic meaning.
 *
 * Never use these vectors for retrieval-quality measurements.
 */
export function fixtureEmbedding(text, dim = FIXTURE_VECTOR_DIM) {
  if (!Number.isInteger(dim) || dim <= 0) throw new RangeError('dim must be a positive integer');
  const seed = createHash('sha256').update(String(text ?? ''), 'utf8').digest();
  const bytes = Buffer.alloc(dim);
  let offset = 0;
  let counter = 0;
  while (offset < dim) {
    const block = counter === 0
      ? seed
      : createHash('sha256').update(seed).update(String(counter), 'utf8').digest();
    const take = Math.min(block.length, dim - offset);
    block.copy(bytes, offset, 0, take);
    offset += take;
    counter += 1;
  }
  // 20% jitter keeps every component positive (so any pair still scores far
  // above the 0.2 relevance floor) while making inter-chunk distances clearly
  // larger than floating-point noise, which keeps the Top-1 regression stable.
  return Array.from(bytes, (byte) => 1 + (byte / 255 - 0.5) * 0.2);
}

export function fixtureVectorLiteral(text, dim = FIXTURE_VECTOR_DIM) {
  return `[${fixtureEmbedding(text, dim).join(',')}]`;
}
