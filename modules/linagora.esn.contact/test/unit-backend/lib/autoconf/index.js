'use strict';

const q = require('q'),
      mockery = require('mockery');
const expect = require('chai').expect;

describe('The Calendar autoconf transformer', function() {

  let modulePath, config, token;

  function transform() {
    return require(modulePath + '/backend/lib/autoconf')(() => ({ token })).transform(config, {
      id: 'id',
      preferredEmail: 'email'
    });
  }

  function mockClient(list) {
    mockery.registerMock('../client', () => () => ({
      addressbookHome: () => ({
        addressbook: () => ({ list })
      })
    }));
  }

  beforeEach(function() {
    config = {};
    token = {
      getNewToken: (user, callback) => callback(null, { token: 'token' })
    };

    modulePath = this.moduleHelpers.modulesPath + 'linagora.esn.contact';
  });

  it('should generate a new token, and reject if it fails', function(done) {
    token.getNewToken = (user, callback) => callback(new Error('Fail'));

    transform().then(() => done('Test should have failed'), () => done());
  });

  it('should call client.list and reject if it rejects', function(done) {
    mockClient(() => q.reject(new Error('Fail')));

    transform().then(() => done('Test should have failed'), () => done());
  });

  it('should call client.list with correct argument', function(done) {
    let argument;

    mockClient(arg => {
      argument = arg;
    });

    transform().then(() => {
      expect(argument).to.deep.equal({ query: {
        personal: true,
        subscribed: true,
        shared: true
      } });

      done();
    }, () => done('This test should have passed'));
  });

  it('should call client.list and assign an empty list to config.addressbooks, if there is no books', function(done) {
    mockClient(() => q({}));

    transform().then(() => {
      expect(config).to.deep.equal({ addressbooks: [] });

      done();
    }, () => done('This test should have passed'));
  });

  it('should call client.list and assign an upgraded list to config.addressbooks, handling readOnly', function(done) {
    mockClient(() => q({
      body: {
        _embedded: {
          'dav:addressbook': [
            {
              _links: {
                self: {
                  href: '/url/123.json'
                }
              },
              'dav:name': 'custom name',
              'carddav:description': 'description',
              'apple:color': '#CCCCCC',
              'dav:acl': ['dav:read']
            },
            {
              _links: {
                self: {
                  href: '/url/contacts.json'
                }
              },
              'apple:color': '#000000',
              'dav:acl': ['dav:write', 'dav:read']
            },
            {
              _links: {
                self: {
                  href: '/url/456.json'
                }
              },
              'dav:name': 'another book'
            }
          ]
        }
      }
    }));

    transform().then(() => {
      expect(config).to.deep.equal({
        addressbooks: [
          {
            id: '123',
            uri: '/url/123',
            name: 'custom name',
            description: 'description',
            color: '#CCCCCC',
            username: 'email',
            readOnly: true
          },
          {
            id: 'contacts',
            uri: '/url/contacts',
            name: 'Contacts',
            description: undefined,
            color: '#000000',
            username: 'email',
            readOnly: false
          },
          {
            id: '456',
            uri: '/url/456',
            name: 'another book',
            description: undefined,
            color: undefined,
            username: 'email',
            readOnly: false
          }
        ]
      });

      done();
    }, () => done('This test should have passed'));
  });

});
