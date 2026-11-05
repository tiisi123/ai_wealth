export class DemoDataService {
  constructor({ repository }) {
    this.repository = repository;
  }

  async snapshot(options) {
    return this.repository.getSnapshot(options);
  }

  async getCustomerContext({ customerId, authorized = false } = {}) {
    const snapshot = await this.snapshot({ customerId });
    if (!authorized || snapshot.customer.authorized !== true) {
      return {
        ...snapshot,
        customer: { id: snapshot.customer.id, risk_level: snapshot.customer.risk_level, authorized: false, data_as_of: snapshot.customer.data_as_of },
        holdings: []
      };
    }
    return snapshot;
  }
}
