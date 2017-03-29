const commons = require('../../commons');

function exec(url, username, password, email) {
  url = url.replace(/\/$/, '');

  const options = {
    method: 'POST',
    url: `${url}/api/superadmins`,
    body: {
      type: 'email',
      data: email
    },
    auth: { username, password }
  };

  return commons.httpClient(options);
}

module.exports = {
  command: 'set',
  desc: 'Set a user as superadmin',
  builder: {
    username: {
      describe: 'Username to login',
      demand: true
    },
    password: {
      describe: 'Password to login',
      demand: true
    },
    email: {
      describe: 'Email of the user to make as superadmin',
      demand: true
    }
  },
  handler(argv) {
    const { url, username, password, email } = argv;

    exec(url, username, password, email)
      .then(() => commons.logInfo('Set superadmin'))
      .catch(commons.logError)
      .finally(commons.exit);
  }
};
