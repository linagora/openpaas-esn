
const nodemailer = require('nodemailer');
let transport;

module.exports = {
  get
};

function get(config) {
  if (transport) {
    return Promise.resolve(transport);
  }

  if (!config) {
    return Promise.reject(new Error('Mail configuration is required'));
  }

  if (!config.transport) {
    return Promise.reject(new Error('Mail transport is not configured'));
  }

  // require the nodemailer transport module if it is an external plugin
  if (config.transport.module) {
    try {
      const nodemailerPlugin = require(config.transport.module);

      transport = nodemailer.createTransport(nodemailerPlugin(config.transport.config));
    } catch (err) {
      return Promise.reject(err);
    }
  } else {
    transport = nodemailer.createTransport(config.transport.config);
  }

  return Promise.resolve(transport);
}
