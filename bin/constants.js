'use strict';

const emailAddresses = require('email-addresses');

function validateEmail(email) {
  return emailAddresses.parseOneAddress(email) !== null;
}

module.exports = {
  params: {
    mongodb: {
      host: {
        alias: 'h',
        describe: 'MongoDB host to connect to',
        default: 'localhost'
      },
      port: {
        alias: 'p',
        describe: 'MongoDB port to connect to',
        type: 'number',
        default: 27017
      },
      database: {
        alias: 'db',
        describe: 'MongoDB database name to connect to',
        default: 'esn'
      },
      connectionString: {
        describe: 'MongoDB connection string URI',
        coerce: connectionString => {
          if (!/mongodb:\/\//.test(connectionString)) {
            throw new Error('connectionString must begin with mongodb://');
          }

          return connectionString;
        }
      }
    },
    administrator: {
      email: {
        describe: 'Email address of the administrator to create',
        demand: true,
        coerce: adminEmail => {
          if (!validateEmail(adminEmail)) {
            throw new Error('email is not a valid email address');
          }

          return adminEmail;
        }
      },
      password: {
        describe: 'Password of the administrator to create'
      }
    },
    instance: {
      url: {
        describe: 'The OpenPaaS instance URL',
        default: 'http://localhost:8080'
      }
    },
    jwt: {
      path: {
        describe: 'Path where the public key gonna be saved',
        default: '/etc/openpaas/private'
      }
    }
  }
};
