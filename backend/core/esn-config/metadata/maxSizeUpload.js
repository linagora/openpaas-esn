const { createValidator } = require('../validator/helper');

const schema = {
  type: 'integer',
  required: [
    'maxSizeUpload'
  ]
};

const maxSizeUpload = 104857600; // is equal to 100 MO

module.exports = {
  rights: {
    padmin: 'rw',
    user: 'r'
  },
  pubsub: true,
  default: maxSizeUpload,
  validator: createValidator(schema)
};
