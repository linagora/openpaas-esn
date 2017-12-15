'use strict';

const q = require('q');
const uuidV4 = require('uuid/v4');
const request = require('request');
const ICAL = require('@linagora/ical.js');
const fs = require('fs');
const path = require('path');
const commons = require('../../../../bin/commons');

const DEFAULT_BASE_URL = 'http://localhost:8080';
const DEFAULT_LOGIN = 'admin@open-paas.org';
const DEFAULT_PASSWORD = 'secret';

const command = {
  command: 'populate <type> <size>',
  desc: 'Configure OpenPaaS',
  builder: {
    login: {
      alias: 'l',
      describe: 'User login',
      default: DEFAULT_LOGIN
    },
    password: {
      alias: 'p',
      describe: 'User password',
      default: DEFAULT_PASSWORD
    },
    url: {
      alias: 'u',
      describe: 'ESN base URL',
      default: DEFAULT_BASE_URL
    }
  },
  handler: argv => {
    const { url, login, password, size, type } = argv;

    commons.logInfo(`Calling with user ${login}/${password} on ${url}`);

    exec(url, login, password, size, type)
      .then(() => commons.logInfo('Configured'))
      .catch(commons.logError)
      .finally(commons.exit);
  }
};

function exec(base_url, login, password, size, type) {

  var defer = q.defer();
  var bookId;

  function getRandomContactsFromFile() {
    var defer = q.defer();
    var fileName = size < 1000 ? '100' : '1000';

    var filePath = path.join(__dirname, './data/populate/' + fileName + '.json');

    fs.readFile(filePath, 'utf-8', function(err, data) {
      if (err) {
        return defer.reject(err);
      }

      return defer.resolve(JSON.parse(data).results);
    });

    return defer.promise;
  }

  function getRandomContactsFromWeb() {
    var defer = q.defer();

    request({
      method: 'GET',
      json: true,
      uri: 'http://api.randomuser.me/?nat=fr&results=' + size
    }, function(err, response, body) {
      if (err) {
        return defer.reject(err);
      }

      return defer.resolve(body.results || []);
    });

    return defer.promise;
  }

  var contactGenerators = {
    file: getRandomContactsFromFile,
    web: getRandomContactsFromWeb
  };

  function getRandomContacts() {
    var generator = contactGenerators[type] || contactGenerators.file;

    return generator();
  }

  function shellToVCARD(shell) {
    var vcard = new ICAL.Component('vcard');

    vcard.addPropertyWithValue('version', '4.0');
    vcard.addPropertyWithValue('uid', shell.id);

    if (shell.displayName) {
      vcard.addPropertyWithValue('fn', shell.displayName);
    }

    if (shell.photo) {
      vcard.addPropertyWithValue('photo', shell.photo);
    }

    if (shell.emails) {
      shell.emails.forEach(function(data) {
        var prop = vcard.addPropertyWithValue('email', 'mailto:' + data.value);

        prop.setParameter('type', data.type);
      });
    }

    if (shell.lastName || shell.firstName) {
      vcard.addPropertyWithValue('n', [shell.lastName || '', shell.firstName || '']);
    }

    return vcard;
  }

  function sendContact(user, shell) {
    bookId = bookId || user._id;

    var path = '/dav/api/addressbooks/' + bookId + '/contacts/' + shell.id + '.vcf';
    var json = shellToVCARD(shell).toJSON();
    var defer = q.defer();

    commons.logInfo(`Creating contact on path ${path}...`);

    request({
      uri: base_url + path,
      jar: true,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/vcard+json'
      },
      json: true,
      body: json
    }, function(err, response, body) {
      if (err) {
        return defer.reject(err);
      }

      commons.logInfo(`${shell.id} created`);

      return defer.resolve(body);
    });

    return defer.promise;
  }

  function createContact(user, contact) {

    function capitalize(str) {
      return str.toLowerCase().replace(/\b\w/g, function(m) {
        return m.toUpperCase();
      });
    }

    var u = contact.user;
    var first = capitalize(u.name.first);
    var last = capitalize(u.name.last);
    var shell = {
      id: uuidV4(),
      displayName: first + ' ' + last,
      lastName: last,
      firstName: first,
      emails: [{type: 'work', value: u.email}],
      phone: [{type: 'mobile', value: u.cell}, {type: 'work', value: u.phone}],
      photo: u.picture.medium
    };

    return sendContact(user, shell);
  }

  function createContacts(user) {
    return getRandomContacts().then(function(contacts) {
      return q.all(contacts.map(function(contact) {
        return createContact(user, contact);
      }));
    });
  }

  commons.loginAsUser(base_url, login, password, function(err, user) {
    if (err) {
      commons.logError('Login error');

      return defer.reject(err);
    }

    commons.logInfo('Logged in as', user);

    return createContacts(user).then(function(results) {
      commons.logInfo('Contacts have been created', results.length);
      defer.resolve();
    }, function(err) {
      commons.logError(err);
      defer.reject(err);
    });
  });

  return defer.promise;
}

module.exports = {
  exec,
  command
};
