module.exports = {
  command: {
    command: 'james',
    desc: 'James command lines',
    builder: yargs => yargs.commandDir('james_cmds').demandCommand(1, 'Please specify a command'),
    handler: () => {}
  }
};
