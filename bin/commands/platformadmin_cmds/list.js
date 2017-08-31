const Table = require('cli-table');
const commons = require('../../commons');
const constants = require('../../constants');

module.exports = {
  command: 'list',
  desc: 'List all platformadmins',
  builder: {
    url: constants.params.instance.url,
    username: {
      describe: 'Username to login',
      demand: true
    },
    password: {
      describe: 'Password to login',
      demand: true
    }
  },
  handler(argv) {
    const { url, username, password } = argv;

    exec(url, username, password)
      .then(printPlatformAdmins)
      .catch(commons.logError)
      .finally(commons.exit);
  }
};

function exec(url, username, password) {
  url = url.replace(/\/$/, '');

  const options = {
    method: 'GET',
    url: `${url}/api/platformadmins`,
    auth: { username, password }
  };

  return commons.httpClient(options);
}

function printPlatformAdmins(platformadmins) {
  const table = new Table({
    head: ['ID', 'First name', 'Last name', 'Email'],
    colWidths: [30, 30, 30, 30]
  });

  platformadmins.forEach(platformadmin => {

    platformadmin.firstname = platformadmin.firstname || '';
    platformadmin.lastname = platformadmin.lastname || '';

    table.push([
      platformadmin.id,
      platformadmin.firstname,
      platformadmin.lastname,
      platformadmin.email
    ]);

  });

  console.log(table.toString());
}
