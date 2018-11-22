'use strict';

const q = require('q'),
      _ = require('lodash'),
      path = require('path');

const DEFAULT_ADDRESSBOOK_NAME = 'Contacts';

module.exports = dependencies => {
  const client = require('../client')(dependencies),
        token = dependencies('auth').token;

  return {
    transform: (config, user) => q.ninvoke(token, 'getNewToken', { user: user.id })
      .then(token => client({ user, ESNToken: token.token }))
      .then(client => client.addressbookHome(user.id).addressbook()
      .list(
        {
          query: {
            personal: true,
            subscribed: true,
            shared: true
          }
        }
      ))
      .then(res => {
        let addressbooks = [];

        if (res && res.body && res.body._embedded && res.body._embedded['dav:addressbook']) {
          addressbooks = _.map(res.body._embedded['dav:addressbook'], book => {
            const uri = book._links.self.href.replace('.json', ''); // No JSON for *DAV URI

            return {
              id: path.basename(uri),
              uri: uri,
              name: book['dav:name'] || DEFAULT_ADDRESSBOOK_NAME,
              description: book['carddav:description'],
              color: book['apple:color'],
              readOnly: !!(book['dav:acl'] && book['dav:acl'].indexOf('dav:write') === -1),
              username: user.preferredEmail
            };
          });
        }

        config.addressbooks = addressbooks;
      })
  };
};
