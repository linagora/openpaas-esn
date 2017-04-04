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

  describe('The inboxFilterRestrictedMailboxes filter', function() {

    var inboxFilterRestrictedMailboxesFilter;

    beforeEach(inject(function(_inboxFilterRestrictedMailboxesFilter_) {
      inboxFilterRestrictedMailboxesFilter = _inboxFilterRestrictedMailboxesFilter_;
    }));

    it('should filter RestrictMailboxes', function() {
      var mailboxes = [
          { role: { value: 'outbox' }},
          { role: { value: 'drafts' }},
          { role: { value: undefined }},
          { role: { value: 'inbox' }}
        ],
        expectedMailboxes = [
          { role: { value: undefined }},
          { role: { value: 'inbox' }}
        ];
     expect(inboxFilterRestrictedMailboxesFilter(mailboxes)).to.deep.equal(expectedMailboxes);
    });
  });

});
