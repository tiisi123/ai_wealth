import { customer as fixtureCustomer, holdings as fixtureHoldings, products as fixtureProducts, DATA_AS_OF, DATA_AS_OF_FULL, DATA_VERSION } from '../../../fixtures/demoData.js';
import { NotFoundError } from '../../../platform/http/errors.js';

export class DemoDataRepository {
  constructor({ db, dataMode }) {
    this.db = db;
    this.dataMode = dataMode;
  }

  async getSnapshot({ customerId } = {}) {
    if (this.dataMode === 'fixture' || !this.db.enabled) {
      return { customer: fixtureCustomer, holdings: fixtureHoldings, products: fixtureProducts, data_as_of: DATA_AS_OF, data_as_of_full: DATA_AS_OF_FULL, data_version: DATA_VERSION };
    }
    return this.db.withTransaction(async (client) => {
      await client.query('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ, READ ONLY');
      const versionQuery = await client.query(
        `SELECT version, source_timestamp, ingested_at, quality_status
           FROM data_versions
          WHERE status = 'ACTIVE'
          ORDER BY activated_at DESC NULLS LAST
          LIMIT 1`
      );
      const activeVersion = versionQuery.rows[0];
      if (!activeVersion) throw new NotFoundError('active data version not found');

      const customerQuery = await client.query(
        `SELECT customer_id AS id, display_name AS name, risk_level, region, authorized, data_as_of
           FROM customers
          WHERE customer_id = $1 AND data_version = $2`,
        [customerId || fixtureCustomer.id, activeVersion.version]
      );
      const customer = customerQuery.rows[0];
      if (!customer) throw new NotFoundError('customer not found in active data version');

      const holdingsQuery = await client.query(
        `SELECT h.holding_id AS id, h.customer_id, h.product_id, h.amount, h.return_rate, h.source_id, h.source_timestamp
           FROM holdings h
          WHERE h.customer_id = $1 AND h.data_version = $2
          ORDER BY h.holding_id`,
        [customer.id, activeVersion.version]
      );
      const productsQuery = await client.query(
        `SELECT product_id AS id, data_version, name, type, risk, role, latest_return, drawdown, liquidity,
                fee, annual_rate, coverage, annual_premium, sale_status, source_id, source_timestamp,
                ingested_at, quality_status
           FROM products
          WHERE data_version = $1
          ORDER BY product_id`,
        [activeVersion.version]
      );
      const products = productsQuery.rows;
      const sourceTimestamps = [activeVersion.source_timestamp, ...products.map((product) => product.source_timestamp)]
        .filter(Boolean)
        .sort((left, right) => Date.parse(left) - Date.parse(right));
      const ingestedTimestamps = [activeVersion.ingested_at, ...products.map((product) => product.ingested_at)]
        .filter(Boolean)
        .sort((left, right) => Date.parse(left) - Date.parse(right));
      return {
        customer,
        holdings: holdingsQuery.rows,
        products,
        data_as_of: customer.data_as_of,
        data_as_of_full: sourceTimestamps.at(-1) || null,
        data_version: activeVersion.version,
        source_timestamp: sourceTimestamps.at(-1) || null,
        ingested_at: ingestedTimestamps.at(-1) || null,
        quality_status: activeVersion.quality_status
      };
    });
  }
}
