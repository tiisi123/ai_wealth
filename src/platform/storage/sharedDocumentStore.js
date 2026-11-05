import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

export class SharedDocumentStore {
  constructor(rootPath) {
    this.rootPath = rootPath;
  }

  async ensure() {
    await fs.mkdir(this.rootPath, { recursive: true });
    await fs.access(this.rootPath);
    return { ok: true, path: this.rootPath };
  }

  async health() {
    try {
      await fs.access(this.rootPath);
      const stat = await fs.stat(this.rootPath);
      if (!stat.isDirectory()) throw new Error('document store path is not a directory');
      return { ok: true, path: this.rootPath };
    } catch (error) {
      return { ok: false, path: this.rootPath, reason: error.code || 'storage_unavailable' };
    }
  }

  async write(relativePath, content) {
    const root = path.resolve(this.rootPath);
    const destination = path.resolve(root, relativePath);
    const relative = path.relative(root, destination);
    if (relative.startsWith('..') || path.isAbsolute(relative)) throw new Error('document path escapes shared store');
    await fs.mkdir(path.dirname(destination), { recursive: true });
    const temporary = `${destination}.${randomUUID()}.tmp`;
    try {
      await fs.writeFile(temporary, content, { flag: 'wx' });
      await fs.rename(temporary, destination);
    } finally {
      await fs.unlink(temporary).catch(() => {});
    }
    return destination;
  }
}
