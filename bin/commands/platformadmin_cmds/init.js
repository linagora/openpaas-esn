const commons = require('../../commons');

module.exports = {
  command: 'init',
  desc: 'Initialize the first platformadmin',
  builder: {
    email: {
      describe: 'Email of the user to make as platformadmin',
      demand: true
    }
  },
  handler: argv => {
    const { url, email } = argv;

    exec(url, email)
      .then(() => commons.logInfo('Created platformadmin'))
      .catch(commons.logError)
      .finally(commons.exit);
  }
};

function exec(url, email) {
  url = url.replace(/\/$/, '');

  return createPlatformAdmin(url, email);
}

function createPlatformAdmin(url, email) {
  const options = {
    method: 'POST',
    url: `${url}/api/platformadmins/init`,
    body: {
      type: 'email',
      data: email
    }
  };

  return commons.httpClient(options);
}
