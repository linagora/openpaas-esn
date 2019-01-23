class Person {
  constructor(id, objectType, email, displayName, avatarUrl) {
    this.id = id;
    this.objectType = objectType;
    this.email = email;
    this.displayName = displayName;
    this.avatarUrl = avatarUrl;
  }
}

module.exports = Person;
