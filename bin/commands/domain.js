'use strict';

const CONSTANTS = require('../constants').params;
const command = {
  command: 'domain',
  desc: 'Domains Management',
  builder: yargs => {
    return yargs
      .option('host', CONSTANTS.mongodb.host)
      .option('port', CONSTANTS.mongodb.port)
      .option('database', CONSTANTS.mongodb.database)
      .global(['host', 'port', 'database'])
      .commandDir('domain_cmds');
  },
  handler: argv => {}
};

module.exports = {
  command
};
