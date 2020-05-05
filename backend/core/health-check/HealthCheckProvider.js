class HealthCheckProvider {
  constructor(name, checker) {
    if (!name || !checker) {
      throw new Error('Health check provider requires name and checker');
    }

    this.name = name;
    this.checker = checker;
  }
}

module.exports = HealthCheckProvider;
