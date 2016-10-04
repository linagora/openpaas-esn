'use strict';

/* global chai: false, sinon: false */

var expect = chai.expect;

describe('The Unified Inbox Angular module providers', function() {

  var $rootScope, inboxProviders, inboxTwitterProvider, inboxHostedMailMessagesProvider, inboxHostedMailThreadsProvider,
      $httpBackend, jmapClient, ELEMENTS_PER_PAGE, ELEMENTS_PER_REQUEST;

  function elements(id, length, offset) {
    var array = [], start = offset || 0;

    for (var i = start; i < (start + length); i++) {
      array.push({
        id: id + '_' + i,
        date: new Date(2016, 1, 1, 1, 1, 1, 999 - i),
        mailboxIds: ['id_inbox'],
        threadId: 'thread_' + i
      });
    }

    return array;
  }

  beforeEach(function() {
    angular.mock.module('esn.core');
    angular.mock.module('esn.configuration');
    angular.mock.module('linagora.esn.unifiedinbox', function($provide) {
      jmapClient = {
        getMailboxWithRole: function(role) {
          return $q.when({ id: 'id_' + role.value });
        },
        getMessageList: function(options) {
          expect(options.filter.inMailboxes).to.deep.equal(['id_inbox']);

          return $q.when({
            getMessages: function() {
              return $q.when(elements('message', options.limit, options.position));
            },
            getThreads: function() {
              return $q.when(elements('thread', options.limit, options.position));
            }
          });
        }
      };

      $provide.value('withJmapClient', function(cb) {
        return cb(jmapClient);
      });

      $provide.constant('ELEMENTS_PER_PAGE', ELEMENTS_PER_PAGE = 20);
    });
  });

  beforeEach(angular.mock.inject(function(_$rootScope_, _inboxProviders_, _inboxTwitterProvider_, _inboxHostedMailMessagesProvider_,
                                          _inboxHostedMailThreadsProvider_, _$httpBackend_, _ELEMENTS_PER_PAGE_, _ELEMENTS_PER_REQUEST_) {
    $rootScope = _$rootScope_;
    inboxProviders = _inboxProviders_;
    inboxTwitterProvider = _inboxTwitterProvider_;
    inboxHostedMailMessagesProvider = _inboxHostedMailMessagesProvider_;
    inboxHostedMailThreadsProvider = _inboxHostedMailThreadsProvider_;
    $httpBackend = _$httpBackend_;

    ELEMENTS_PER_REQUEST = _ELEMENTS_PER_REQUEST_;
  }));

  describe('The inboxHostedMailMessagesProvider factory', function() {

    it('should request the backend using the JMAP client, and return pages of messages', function(done) {
      var filter = { inMailboxes: ['id_inbox'] };
      var fetcher = inboxHostedMailMessagesProvider.fetch(filter);

      fetcher().then(function(messages) {
        expect(messages.length).to.equal(ELEMENTS_PER_PAGE);
        expect(messages[ELEMENTS_PER_PAGE - 1]).to.shallowDeepEqual({
          id: 'message_19',
          templateUrl: '/unifiedinbox/views/unified-inbox/elements/message'
        });
      });
      $rootScope.$digest();

      fetcher().then(function(messages) {
        expect(messages.length).to.equal(ELEMENTS_PER_PAGE);
        expect(messages[ELEMENTS_PER_PAGE - 1]).to.shallowDeepEqual({
          id: 'message_39',
          templateUrl: '/unifiedinbox/views/unified-inbox/elements/message'
        });

        done();
      });
      $rootScope.$digest();
    });

    it('should paginate requests to the backend', function(done) {
      var filter = { inMailboxes: ['id_inbox'] };
      var fetcher = inboxHostedMailMessagesProvider.fetch(filter);

      fetcher().then(function(messages) {
        expect(messages.length).to.equal(ELEMENTS_PER_PAGE);
        expect(messages[ELEMENTS_PER_PAGE - 1]).to.shallowDeepEqual({
          id: 'message_19',
          templateUrl: '/unifiedinbox/views/unified-inbox/elements/message'
        });
      });
      $rootScope.$digest();

      for (var i = ELEMENTS_PER_PAGE; i < ELEMENTS_PER_REQUEST; i += ELEMENTS_PER_PAGE) {
        fetcher();
        $rootScope.$digest();
      }

      fetcher().then(function(messages) {
        expect(messages.length).to.equal(ELEMENTS_PER_PAGE);
        expect(messages[ELEMENTS_PER_PAGE - 1]).to.shallowDeepEqual({
          id: 'message_219',
          templateUrl: '/unifiedinbox/views/unified-inbox/elements/message'
        });

        done();
      });
      $rootScope.$digest();
    });

  });

  describe('The inboxHostedMailThreadsProvider factory', function() {

    it('should have fetch function to resolve an array of thread', function(done) {
      var filter = { inMailboxes: ['id_inbox'] };
      var fetcher = inboxHostedMailThreadsProvider.fetch(filter);

      fetcher().then(function(threads) {
        expect(threads).to.be.an.instanceof(Array);
        expect(threads[0].emails).to.be.an.instanceof(Array);
        done();
      });

      $rootScope.$digest();
    });

    it('should request the backend using the JMAP client, and return pages of threads', function(done) {
      var filter = { inMailboxes: ['id_inbox'] };
      var fetcher = inboxHostedMailThreadsProvider.fetch(filter);

      fetcher().then(function(threads) {
        expect(threads.length).to.equal(ELEMENTS_PER_PAGE);
        expect(threads[ELEMENTS_PER_PAGE - 1]).to.shallowDeepEqual({
          id: 'thread_19',
          templateUrl: '/unifiedinbox/views/unified-inbox/elements/thread'
        });
      });
      $rootScope.$digest();

      fetcher().then(function(threads) {
        expect(threads.length).to.equal(ELEMENTS_PER_PAGE);
        expect(threads[ELEMENTS_PER_PAGE - 1]).to.shallowDeepEqual({
          id: 'thread_39',
          templateUrl: '/unifiedinbox/views/unified-inbox/elements/thread'
        });

        done();
      });
      $rootScope.$digest();
    });

    it('should paginate requests to the backend', function(done) {
      var filter = { inMailboxes: ['id_inbox'] };
      var fetcher = inboxHostedMailThreadsProvider.fetch(filter);

      fetcher().then(function(threads) {
        expect(threads.length).to.equal(ELEMENTS_PER_PAGE);
        expect(threads[ELEMENTS_PER_PAGE - 1]).to.shallowDeepEqual({
          id: 'thread_19',
          templateUrl: '/unifiedinbox/views/unified-inbox/elements/thread'
        });
      });
      $rootScope.$digest();

      for (var i = ELEMENTS_PER_PAGE; i < ELEMENTS_PER_REQUEST; i += ELEMENTS_PER_PAGE) {
        fetcher();
        $rootScope.$digest();
      }

      fetcher().then(function(threads) {
        expect(threads.length).to.equal(ELEMENTS_PER_PAGE);
        expect(threads[ELEMENTS_PER_PAGE - 1]).to.shallowDeepEqual({
          id: 'thread_219',
          templateUrl: '/unifiedinbox/views/unified-inbox/elements/thread'
        });

        done();
      });
      $rootScope.$digest();
    });

  });

  describe('The inboxTwitterProvider factory', function() {

    it('should request tweets from the  backend, and return pages of tweets', function(done) {
      var fetcher = inboxTwitterProvider('myTwitterAccount').fetch();

      $httpBackend.expectGET('/unifiedinbox/api/inbox/tweets?account_id=myTwitterAccount&count=200').respond(200, elements('tweet', ELEMENTS_PER_REQUEST));

      fetcher().then(function(tweets) {
        expect(tweets.length).to.equal(ELEMENTS_PER_PAGE);
        expect(tweets[ELEMENTS_PER_PAGE - 1]).to.shallowDeepEqual({
          id: 'tweet_19',
          templateUrl: '/unifiedinbox/views/unified-inbox/elements/tweet'
        });
      });
      $httpBackend.flush();

      fetcher().then(function(tweets) {
        expect(tweets.length).to.equal(ELEMENTS_PER_PAGE);
        expect(tweets[ELEMENTS_PER_PAGE - 1]).to.shallowDeepEqual({
          id: 'tweet_39',
          templateUrl: '/unifiedinbox/views/unified-inbox/elements/tweet'
        });

        done();
      });
      $rootScope.$digest();
    });

    it('should paginate requests to the backend', function(done) {
      var fetcher = inboxTwitterProvider('myTwitterAccount').fetch();

      $httpBackend.expectGET('/unifiedinbox/api/inbox/tweets?account_id=myTwitterAccount&count=200').respond(200, elements('tweet', ELEMENTS_PER_REQUEST));

      fetcher();
      $httpBackend.flush();

      for (var i = ELEMENTS_PER_PAGE; i < ELEMENTS_PER_REQUEST; i += ELEMENTS_PER_PAGE) {
        fetcher();
        $rootScope.$digest();
      }

      $httpBackend.expectGET('/unifiedinbox/api/inbox/tweets?account_id=myTwitterAccount&count=200&max_id=tweet_199').respond(200, [{
        id: 'tweet_200',
        date: '2016-01-01T01:01:01.001Z'
      }]);

      fetcher().then(function(tweets) {
        expect(tweets.length).to.equal(1);
        expect(tweets[0].date).to.equalTime(new Date(Date.UTC(2016, 0, 1, 1, 1, 1, 1)));

        done();
      });
      $httpBackend.flush();
    });

  });

  describe('The inboxProviders factory', function() {

    describe('The getAll function', function() {

      it('should return an array of providers, with the "loadNextItems" property initialized', function(done) {
        inboxProviders.add({
          buildFetchContext: sinon.spy(function() { return $q.when('container'); }),
          fetch: sinon.spy(function(container) {
            expect(container).to.equal('container');

            return function() {
              return $q.when(elements('id', 2));
            };
          }),
          templateUrl: 'templateUrl'
        });
        inboxProviders.add({
          buildFetchContext: sinon.spy(function() { return $q.when('container_2'); }),
          fetch: sinon.spy(function(container) {
            expect(container).to.equal('container_2');

            return function() {
              return $q.when(elements('id', ELEMENTS_PER_PAGE));
            };
          }),
          templateUrl: 'templateUrl'
        });

        inboxProviders.getAll().then(function(providers) {
          $q.all(providers.map(function(provider) {
            return provider.loadNextItems();
          })).then(function(results) {
            expect(results[0]).to.deep.equal({ data: elements('id', 2), lastPage: true });
            expect(results[1]).to.deep.equal({ data: elements('id', ELEMENTS_PER_PAGE), lastPage: false });

            done();
          });
        });
        $rootScope.$digest();
      });

    });

  });

  describe('The inboxJmapProviderContextBuilder', function() {

    var inboxJmapProviderContextBuilder;

    beforeEach(inject(function(_inboxJmapProviderContextBuilder_) {
      inboxJmapProviderContextBuilder = _inboxJmapProviderContextBuilder_;
    }));

    it('should build default context as a filter to get message list in Inbox folder', function() {
      inboxJmapProviderContextBuilder({ filterByType: {} }).then(function(context) {
        expect(context).to.deep.equal({
          inMailboxes: ['id_inbox']
        });
      });

      $rootScope.$digest();
    });

    it('should extend the JMAP filter when its is given', function() {
      inboxJmapProviderContextBuilder({
        filterByType: {
          JMAP: { isUnread: true }
        }
      }).then(function(context) {
        expect(context).to.deep.equal({
          inMailboxes: ['id_inbox'],
          isUnread: true
        });
      });

      $rootScope.$digest();
    });

    it('should build search context when query is passed as an option', function() {
      inboxJmapProviderContextBuilder({ query: 'query' }).then(function(context) {
        expect(context).to.deep.equal({
          text: 'query'
        });
      });

      $rootScope.$digest();
    });

  });

});
