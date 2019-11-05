const { FIELD_TYPES } = require('../../core/people/constants');

module.exports = {
  requireValidFieldType
};

function requireValidFieldType(req, res, next) {
  const AVAILABLE_FIELD_TYPES = Object.values(FIELD_TYPES);

  if (AVAILABLE_FIELD_TYPES.includes(req.params.fieldType)) {
    return next();
  }

  res.status(400).json({ error: 400, message: 'Bad Request', details: 'Invalid field type' });
}
