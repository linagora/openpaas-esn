class PeopleResolver {
  constructor(objectType, resolve, denormalize, priority = 0) {
    this.objectType = objectType;
    this.resolve = resolve;
    this.denormalize = denormalize;
    this.priority = priority;
  }
}

module.exports = PeopleResolver;
