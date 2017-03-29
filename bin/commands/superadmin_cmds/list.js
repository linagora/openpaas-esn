const commons = require('../../commons');
const Table = require('cli-table');

function exec(url, username, password) {
  url = url.replace(/\/$/, '');

  const options = {
    method: 'GET',
    url: `${url}/api/superadmins`,
    auth: { username, password }
  };

  return commons.httpClient(options);
}

function printSuperAdmins(superadmins) {
  const table = new Table({
    head: ['ID', 'First name', 'Last name', 'Email'],
    colWidths: [30, 30, 30, 30]
  });

  superadmins.forEach(superadmin => {
    table.push([superadmin.id, superadmin.firstname, superadmin.lastname, superadmin.email]);
  });

  console.log(table.toString());
}

module.exports = {
  command: 'list',
  desc: 'List all superadmins',
  builder: {
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
      .then(printSuperAdmins)
      .catch(commons.logError)
      .finally(commons.exit);
  }
};
