'use strict';

var core = require('../../core');

/**
 * Return error if the database connection is already configured
 *
 * @param {Request} req
 * @param {Response} res
 * @param {next middleware} next
 */
function failIfConfigured(req, res, next) {
  if (!core.configured()) {
    return next();
  }

  return res.status(400).json({error: { status: 400, message: 'Bad Request', details: 'the database connection is already configured'}});
}
module.exports.failIfConfigured = failIfConfigured;
