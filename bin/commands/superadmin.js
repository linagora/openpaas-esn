const constants = require('../constants');

const command = {
  command: 'superadmin',
  desc: 'Superadmin Management',
  builder(yargs) {
    return yargs
      .commandDir('superadmin_cmds')
      .options({
        url: Object.assign({ global: true }, constants.params.instance.url)
      });
  }
};

module.exports = {
  command
};
