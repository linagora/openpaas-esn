'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The Unified Inbox Angular module filters', function() {

  var $sce = {}, $filter, isMobile;

  beforeEach(function() {
    angular.mock.module('esn.core');
    angular.mock.module('esn.session');
    angular.mock.module('esn.configuration');
    angular.mock.module('linagora.esn.unifiedinbox');
  });

  beforeEach(angular.mock.module(function($provide) {
    $provide.value('$sce', $sce);
    $provide.value('deviceDetector', {
      isMobile: function() { return isMobile; }
    });
  }));

  beforeEach(angular.mock.inject(function(_$filter_) {
    $filter = _$filter_;
  }));

  describe('The emailer filter', function() {
    var recipient;

    it('should do nothing if the array is not defined', function() {
      expect($filter('emailer')()).to.be.undefined;
    });

    it('should return the recipient in richtext mode for desktop', function() {
      recipient = {name: '1@linagora.com', email: '1@linagora.com'};
      isMobile = false;
      expect($filter('emailer')(recipient)).to.equal('1@linagora.com &lt;1@linagora.com&gt;');
    });

    it('should return the recipient in text mode for desktop', function() {
      recipient = {name: '1@linagora.com', email: '1@linagora.com'};
      isMobile = true;
      expect($filter('emailer')(recipient)).to.equal('1@linagora.com <1@linagora.com>');
    });
  });

  describe('The emailerList filter', function() {
    var array;

    it('should do nothing if the array is not defined', function() {
      expect($filter('emailerList')()).to.be.undefined;
    });

    it('should join an array in richtext mode for desktop', function() {
      array = [{name: '1@linagora.com', email: '1@linagora.com'}, {name: '2@linagora.com', email: '2@linagora.com'}];
      isMobile = false;
      expect($filter('emailerList')(array)).to.equal('1@linagora.com &lt;1@linagora.com&gt;, 2@linagora.com &lt;2@linagora.com&gt;');
    });

    it('should be able to join an array in text mode for mobile', function() {
      array = [{name: '1@linagora.com', email: '1@linagora.com'}, {name: '2@linagora.com', email: '2@linagora.com'}];
      isMobile = true;
      expect($filter('emailerList')(array)).to.equal('1@linagora.com <1@linagora.com>, 2@linagora.com <2@linagora.com>');
    });

    it('should prefix the joined array by the given prefix', function() {
      array = [{name: '1@linagora.com', email: '1@linagora.com'}, {name: '2@linagora.com', email: '2@linagora.com'}];
      isMobile = false;
      expect($filter('emailerList')(array, 'Prefix: ')).to.equal('Prefix: 1@linagora.com &lt;1@linagora.com&gt;, 2@linagora.com &lt;2@linagora.com&gt;');
    });
  });

  describe('The quote filter', function() {
    var emailTextBody;

    it('should do nothing if textBody is not defined', function() {
      expect($filter('quote')()).to.be.undefined;
    });

    it('should prefix each line with "> "', function() {
      emailTextBody = 'This \n is \n multi-line \n email';
      expect($filter('quote')(emailTextBody)).to.equal('> This \n>  is \n>  multi-line \n>  email');
    });

    it('should support CRLF as newlines', function() {
      emailTextBody = 'This \r\nis \nmulti-line \r\nemail \rtest';
      expect($filter('quote')(emailTextBody)).to.equal('> This \r\n> is \n> multi-line \r\n> email \r> test');
    });

    it('should trim useless spaces/lines', function() {
      emailTextBody = '       This \n is \n multi-line \n email     \n\n\n\n';
      expect($filter('quote')(emailTextBody)).to.equal('> This \n>  is \n>  multi-line \n>  email');
    });
  });

  describe('The nl2br filter', function() {
    var emailTextBody;

    it('should do nothing if textBody is not defined', function() {
      expect($filter('nl2br')()).to.be.undefined;
    });

    it('should replace each new line by <br/> tag', function() {
      emailTextBody = 'This\n is\n multi-line\n email';
      expect($filter('nl2br')(emailTextBody)).to.equal('This<br/> is<br/> multi-line<br/> email');
    });

    it('should support CRLF as newlines', function() {
      emailTextBody = 'This\r\n is\n multi-line\r\n email\r test';
      expect($filter('nl2br')(emailTextBody)).to.equal('This<br/> is<br/> multi-line<br/> email<br/> test');
    });

    it('should trim useless spaces/lines', function() {
      emailTextBody = '       This\n is\n multi-line\n email\n \n\n\n';
      expect($filter('nl2br')(emailTextBody)).to.equal('This<br/> is<br/> multi-line<br/> email');
    });
  });

  describe('The loadImagesAsync filter', function() {

    it('should transform the "img" tags so that they load asynchronously, using AsyncImageLoader', function() {
      var dom = angular.element($filter('loadImagesAsync')(
        '<html>' +
        '  <body>' +
        '    <p>' +
        '      <img alt="1" src="http://attach.1" />' +
        '      <img src="http://attach.2" alt="2" />' +
        '      <img \n src="http://attach.3.with.newLine" />' +
        '    </p>' +
        '  </body>' +
        '</html>'
      ));

      function checkImg(origSrc) {
        var img = dom.find('img[data-async-src="' + origSrc + '"]');

        expect(img.attr('src')).to.match(/http[s]?:\/\/.+\/throbber-amber.svg/);
        expect(img.attr('data-async-src')).to.equal(origSrc);
      }

      checkImg('http://attach.1');
      checkImg('http://attach.2');
      checkImg('http://attach.3.with.newLine');
    });

  });

  describe('The inboxFilterJmapItems filter', function() {

    var _, filter, inboxFilters;
    var items = [{ id: 'unread', isUnread: true }, { id: 'social' }, { another: 'property' }];

    beforeEach(inject(function(inboxFilterJmapItemsFilter, _inboxFilters_, ___) {
      filter = inboxFilterJmapItemsFilter;
      inboxFilters = _inboxFilters_;
      _ = ___;
    }));

    afterEach(function() {
      _.forEach(inboxFilters, function(filter) {
        filter.checked = false;
      });
    });

    function checkFilter(id) {
      _.find(inboxFilters, { id: id }).checked = true;
    }

    it('should not filter anything if nothing is selected', function() {
      expect(filter(items)).to.deep.equal(items);
    });

    it('should not filter anything if the selection does not involve JMAP', function() {
      checkFilter('isSocial');

      expect(filter(items)).to.deep.equal(items);
    });

    it('should filter items if the selection involves JMAP', function() {
      checkFilter('isUnread');

      expect(filter(items)).to.deep.equal([{ id: 'unread', isUnread: true }]);
    });

    it('should filter items up to an empty list, if nothing matches', function() {
      checkFilter('isFlagged');

      expect(filter(items)).to.deep.equal([]);
    });

  });

  describe('The inboxFilterDescendantMailboxes filter', function() {

    var _, filter, cache;

    beforeEach(inject(function(Mailbox, inboxFilterDescendantMailboxesFilter, inboxMailboxesCache, ___) {
      filter = inboxFilterDescendantMailboxesFilter;
      cache = inboxMailboxesCache;
      _ = ___;

      [
        Mailbox({ id: '1', name: '1' }),
        Mailbox({ id: '2', name: '2', parentId: '1' }),
        Mailbox({ id: '3', name: '3', parentId: '2' }),
        Mailbox({ id: '4', name: '4' }),
        Mailbox({ id: '5', name: '5', parentId: '4' })
      ].forEach(function(mailbox) {
        cache.push(mailbox);
      });
    }));

    it('should return mailboxes as-is when not defined', function() {
      expect(filter()).to.equal(undefined);
    });

    it('should return mailboxes as-is when null given', function() {
      expect(filter(null)).to.equal(null);
    });

    it('should return mailboxes as-is when no id is given', function() {
      expect(filter([])).to.deep.equal([]);
    });

    it('should return mailboxes as-is when the mailbox is not found', function() {
      expect(filter(cache, '0')).to.deep.equal(cache);
    });

    it('should filter out the mailbox and its descendants', function() {
      expect(_.map(filter(cache, '1'), 'id')).to.deep.equal(['4', '5']);
    });

    it('should filter out the mailbox only when there is no descendants', function() {
      expect(_.map(filter(cache, '5'), 'id')).to.deep.equal(['1', '2', '3', '4']);
    });

  });

});
