class PeopleResolver {
  constructor(objectType, resolve, denormalize) {
    this.objectType = objectType;
    this.resolve = resolve;
    this.denormalize = denormalize;
  }
}

module.exports = PeopleResolver;
