'use strict';

const command = {
  command: 'domain',
  desc: 'Domains Management',
  builder: yargs => yargs.commandDir('domain_cmds').demandCommand(1, 'Please specify a command'),
  handler: () => {}
};

module.exports = {
  command
};
