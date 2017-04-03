const commons = require('../../commons');

function exec(url, username, password, email) {
  url = url.replace(/\/$/, '');

  const options = {
    method: 'DELETE',
    url: `${url}/api/platformadmins`,
    qs: {
      type: 'email',
      data: email
    },
    auth: { username, password }
  };

  return commons.httpClient(options);
}

module.exports = {
  command: 'unset',
  desc: 'Unset a platformadmin',
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
      describe: 'Email of the platformadmin to unset',
      demand: true
    }
  },
  handler(argv) {
    const { url, username, password, email } = argv;

    exec(url, username, password, email)
      .then(() => commons.logInfo(`Unset platformadmin ${email}`))
      .catch(commons.logError)
      .finally(commons.exit);
  }
};
