const { createValidator } = require('../validator/helper');

const schema = {
  type: 'string',
  minLength: 1
};

module.exports = {
  rights: {
    padmin: 'rw',
    admin: 'rw',
    user: 'rw'
  },
  validator: createValidator(schema)
};
