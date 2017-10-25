class Event {
  constructor(uuid, name, objectType, id, payload, context, timestamp) {
    this.uuid = uuid;
    this.name = name;
    this.objectType = objectType;
    this.id = id;
    this.payload = payload;
    this.context = context;
    this.timestamp = timestamp || Date.now();
  }
}

module.exports = Event;
