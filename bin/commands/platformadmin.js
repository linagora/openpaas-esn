const constants = require('../constants');

const command = {
  command: 'platformadmin',
  desc: 'PlatformAdmin Management',
  builder(yargs) {
    return yargs
      .commandDir('platformadmin_cmds')
      .options({
        url: Object.assign({ global: true }, constants.params.instance.url)
      });
  }
};

module.exports = {
  command
};
