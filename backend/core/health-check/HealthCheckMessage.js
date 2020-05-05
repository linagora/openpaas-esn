class HealthCheckMessage {
  constructor(message) {
    const { status, name, cause } = message;

    if (!status || !name) {
      throw new Error('Health check message requires service name and status');
    }

    this.message = {
      componentName: name,
      status,
      cause
    };
  }
}

module.exports = HealthCheckMessage;
