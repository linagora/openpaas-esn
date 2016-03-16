'use strict';

var q = require('q');
var uuid = require('node-uuid');
var request = require('request');
var ICAL = require('ical.js');
var fs = require('fs');
var path = require('path');
var commons = require('../../../../bin/commons');

var DEFAULT_BASE_URL = 'http://localhost:8080';
var DEFAULT_LOGIN = 'admin@open-paas.org';
var DEFAULT_PASSWORD = 'secret';

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
    console.log('Creating contact on path %s...', path);
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
      console.log('%s created', shell.id);
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
      id: uuid.v4(),
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
      console.log('Login error');
      return defer.reject(err);
    }

    console.log('Logged in as', user);
    return createContacts(user).then(function(results) {
      console.log('Contacts have been created', results.length);
      defer.resolve();
    }, function(err) {
      console.log(err);
      defer.reject(err);
    });
  });
  return defer.promise;
}
module.exports.exec = exec;

function getCommandParameters() {
  return '<type> <size>';
}
module.exports.getCommandParameters = getCommandParameters;

module.exports.createCommand = function(command) {

  command
    .description('Populate <size> random contacts from <type> generator')
    .option('-l, --login [login]', 'User login', DEFAULT_LOGIN)
    .option('-p, --password [password]', 'User password', DEFAULT_PASSWORD)
    .option('-u, --url [url]', 'ESN base URL like http://localhost:8080', DEFAULT_BASE_URL)

    .action(function(type, size) {
      var url = command.url;
      var login = command.login;
      var password = command.password;
      console.log('Calling with user %s/%s on %s', login, password, url);
      exec(url, login, password, size, type).then(function() {
        console.log('Populated');
      }, function(err) {
        console.log('Error', err);
      }).finally(commons.exit);
    });
};
