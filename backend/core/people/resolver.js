class PeopleResolver {
  constructor(objectType, resolve, denormalize, defaultPriority = 0) {
    this.objectType = objectType;
    this.resolve = resolve;
    this.denormalize = denormalize;
    this.defaultPriority = defaultPriority;
  }
}

module.exports = PeopleResolver;
