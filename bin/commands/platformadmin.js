const command = {
  command: 'platformadmin',
  desc: 'PlatformAdmin Management',
  builder: yargs => yargs.commandDir('platformadmin_cmds').demandCommand(1, 'Please specify a command')
};

module.exports = {
  command
};
