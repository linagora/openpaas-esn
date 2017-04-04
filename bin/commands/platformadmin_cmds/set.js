const commons = require('../../commons');
const constants = require('../../constants');

module.exports = {
  command: 'set',
  desc: 'Set a user as platformadmin',
  builder: {
    url: constants.params.instance.url,
    username: {
      describe: 'Username to login',
      demand: true
    },
    password: {
      describe: 'Password to login',
      demand: true
    },
    email: {
      describe: 'Email of the user to make as platformadmin',
      demand: true
    }
  },
  handler(argv) {
    const { url, username, password, email } = argv;

    exec(url, username, password, email)
      .then(() => commons.logInfo('Set platformadmin'))
      .catch(commons.logError)
      .finally(commons.exit);
  }
};

function exec(url, username, password, email) {
  url = url.replace(/\/$/, '');

  const options = {
    method: 'POST',
    url: `${url}/api/platformadmins`,
    body: {
      type: 'email',
      data: email
    },
    auth: { username, password }
  };

  return commons.httpClient(options);
}
