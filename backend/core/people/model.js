const DEFAULT_TYPE = 'default';

class Person {
  constructor({ id, objectType, emailAddresses, phoneNumbers, names, photos }) {
    this.id = id;
    this.objectType = objectType;
    this.emailAddresses = emailAddresses;
    this.phoneNumbers = phoneNumbers;
    this.names = names;
    this.photos = photos;
  }
}

class Name {
  constructor({ displayName, type = DEFAULT_TYPE }) {
    this.displayName = displayName;
    this.type = type;
  }
}

class EmailAddress {
  constructor({ value, type = DEFAULT_TYPE }) {
    this.value = value;
    this.type = type;
  }
}

class Photo {
  constructor({ url, type = DEFAULT_TYPE }) {
    this.url = url;
    this.type = type;
  }
}

class PhoneNumber {
  constructor({ value, type = DEFAULT_TYPE }) {
    this.value = value;
    this.type = type;
  }
}

module.exports = {
  Person,
  Name,
  EmailAddress,
  PhoneNumber,
  Photo
};
