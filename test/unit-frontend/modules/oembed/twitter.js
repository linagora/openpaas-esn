'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The oembed Twitter module', function() {

  beforeEach(angular.mock.module('esn.parser'));
  beforeEach(angular.mock.module('esn.oembed.twitter'));

  describe('twitterOembed directive', function() {

    var tweetId;

    beforeEach(angular.mock.module('esn.twitter', function($provide) {
      tweetId = null;
      $provide.constant('twitterWidgetService', {
        widgets: {
          createTweet: function(callTweetId) {
            tweetId = callTweetId;
          }
        }
      });
    }));

    beforeEach(inject(function(_$compile_, _$rootScope_) {
      this.$compile = _$compile_;
      this.$rootScope = _$rootScope_;
      this.scope = this.$rootScope.$new();
    }));

    it('should call the twitter widget when parse regular tweet url', function() {
      var htmlWithUrl = '<twitter-oembed url="https://twitter.com/openpaas/status/expectedTweetId"></twitter-oembed>';

      this.$compile(htmlWithUrl)(this.scope);

      expect(tweetId).to.equal('expectedTweetId');
    });

    it('should call the twitter widget when parse android shared tweet url', function() {
      var htmlWithUrl = '<twitter-oembed url="https://twitter.com/openpaas/status/expectedTweetId?s=bla"></twitter-oembed>';

      this.$compile(htmlWithUrl)(this.scope);

      expect(tweetId).to.equal('expectedTweetId');
    });

  });

});
