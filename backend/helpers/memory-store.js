class MemoryStore {
  constructor(value) {
    this.value = value;
  }

  // @returns Promise
  get() {
    return this.value;
  }
}

module.exports = MemoryStore;
