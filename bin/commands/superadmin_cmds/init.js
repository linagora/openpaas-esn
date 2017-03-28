const commons = require('../../commons');

function exec(url, email) {
  url = url.replace(/\/$/, '');

  return createSuperAdmin(url, email);
}

function createSuperAdmin(url, email) {
  const options = {
    method: 'POST',
    url: `${url}/api/superadmins/init`,
    body: {
      type: 'email',
      data: email
    }
  };

  return commons.httpClient(options);
}

module.exports = {
  command: 'init',
  desc: 'Initialize the first superadmin',
  builder: {
    email: {
      describe: 'Email of the user to make as superadmin',
      demand: true
    }
  },
  handler: argv => {
    const { url, email } = argv;

    exec(url, email)
      .then(() => commons.logInfo('Created superadmin'))
      .catch(commons.logError)
      .finally(commons.exit);
  }
};
