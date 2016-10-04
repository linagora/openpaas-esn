'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The Unified Inbox Angular module', function() {

  var jmapClient;

  beforeEach(function() {
    angular.mock.module('esn.core');
    angular.mock.module('linagora.esn.unifiedinbox', function($provide) {
      jmapClient = {
        getMailboxWithRole: function(role) {
          return $q.when({ id: 'id_' + role.value });
        },
        getMessageList: function(options) {
          expect(options.filter.inMailboxes).to.deep.equal(['id_inbox']);

          return $q.when({
            getMessages: function() { return $q.when([]); },
            getThreads: function() { return $q.when([]); }
          });
        }
      };

      $provide.value('withJmapClient', function(cb) {
        return cb(jmapClient);
      });
    });
  });

  function expectSingleProvider(name, done, specificProvider) {
    inject(function($rootScope, inboxProviders, searchProviders) {
      $rootScope.$digest();
      var providers = {
        inboxProviders: inboxProviders,
        searchProviders: searchProviders
      };
      specificProvider = specificProvider || 'inboxProviders';

      providers[specificProvider].getAll().then(function(providers) {
        expect(providers.length).to.equal(1);
        expect(providers[0].name).to.equal(name);

        done();
      });
      $rootScope.$digest();
    });
  }

  it('should register a search provider', function(done) {
    module(function($provide) {
      $provide.value('esnConfig', function() {
        return $q.when();
      });
    });

    expectSingleProvider('Emails', done, 'searchProviders');
  });

  it('should register a provider for messages, if there is no configuration', function(done) {
    module(function($provide) {
      $provide.value('esnConfig', function(key, defaultValue) {
        return $q.when(defaultValue);
      });
    });

    expectSingleProvider('Emails', done);
  });

  it('should register a provider for messages, if view=messages', function(done) {
    module(function($provide) {
      $provide.value('esnConfig', function() {
        return $q.when('messages');
      });
    });

    expectSingleProvider('Emails', done);
  });

  it('should register a provider for threads, if view=threads', function(done) {
    module(function($provide) {
      $provide.value('esnConfig', function() {
        return $q.when('threads');
      });
    });

    expectSingleProvider('inboxHostedMailThreadsProvider', done);
  });

  it('should register no providers for twitter, if there is no twitter accounts', function(done) {
    module(function($provide) {
      $provide.value('esnConfig', function() {
        return $q.when('threads');
      });
    });

    inject(function($rootScope, inboxProviders) {
      $rootScope.$digest();

      inboxProviders.getAll().then(function(providers) {
        expect(providers.filter(function(provider) {
        }).length).to.equal(0);
        done();
      });
      $rootScope.$digest();
    });
  });

  it('should register a provider for every twitter accounts', function(done) {
    module(function($provide) {
      $provide.value('esnConfig', function() {
        return $q.when('threads');
      });
    });

    inject(function($rootScope, inboxProviders, session) {
      session.user.accounts = [{
        data: {
          provider: 'twitter',
          id: '1234',
          username: '1234'
        }
      }, {
        data: {
          provider: 'twitter',
          id: '4321',
          username: '4321'
        }
      }];
      $rootScope.$digest();

      inboxProviders.getAll().then(function(providers) {
        expect(providers.filter(function(provider) {
          return provider.name === 'inboxTwitterProvider';
        }).length).to.equal(2);

        done();
      });
      $rootScope.$digest();
    });
  });

});
