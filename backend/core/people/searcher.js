class PeopleSearcher {
  constructor(objectType, search, denormalize, priority = 0) {
    this.objectType = objectType;
    this.search = search;
    this.denormalize = denormalize;
    this.priority = priority;
  }
}

module.exports = PeopleSearcher;
