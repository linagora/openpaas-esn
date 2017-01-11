'use strict';

const command = {
  command: 'domain',
  desc: 'Domains Management',
  builder: yargs => yargs.commandDir('domain_cmds'),
  handler: () => {}
};

module.exports = {
  command
};
