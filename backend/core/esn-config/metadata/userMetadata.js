const { createValidator } = require('../validator/helper');

module.exports = {
  rights: {
    admin: 'r',
    user: 'r'
  },
  validator: createValidator({ type: 'object' })
};
