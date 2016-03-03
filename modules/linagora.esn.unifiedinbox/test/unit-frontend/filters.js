'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The Unified Inbox Angular module filters', function() {

  var $sce = {}, $filter, isMobile;

  beforeEach(function() {
    angular.mock.module('esn.session');
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

  describe('The trustAsHtml filter', function() {
    it('should delegate to $sce', function(done) {
      var rawHtml = '<xss />';

      $sce.trustAsHtml = function(text) {
        expect(text).to.equal(rawHtml);

        done();
      };

      $filter('trustAsHtml')(rawHtml);
    });
  });

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

  describe('The inlineImages filter', function() {

    it('should do nothing if there is no attachments', function() {
      expect($filter('inlineImages')('Text')).to.equal('Text');
    });

    it('should do nothing if attachments is not an array', function() {
      expect($filter('inlineImages')('Text', 'Attachments')).to.equal('Text');
    });

    it('should do nothing if attachments is zerolength', function() {
      expect($filter('inlineImages')('Text', [])).to.equal('Text');
    });

    it('should not change the src of images if the attachment is not found', function() {
      var html = '<html><body><img src="cid:abcd" /></body></html>';

      expect($filter('inlineImages')(html, [{ cid: 'noMatch', url: 'http://attachment.url' }])).to.equal(html);
    });

    it('should not change the src of images if the scheme is not "cid:"', function() {
      var html = '<html><body><img src="http://localhost/attach.ment" /></body></html>';

      expect($filter('inlineImages')(html, [{ cid: 'noMatch', url: 'http://attachment.url' }])).to.equal(html);
    });

    it('should change the src of images if the attachment is not found', function() {
      expect($filter('inlineImages')(
        '<html><body><img src="cid:abcd" /></body></html>', [{ cid: 'abcd', url: 'http://attachment.url' }]
      )).to.equal('<html><body><img src="http://attachment.url" /></body></html>');
    });

    it('should work with multiple inline images and multiple attachments', function() {
      expect($filter('inlineImages')(
        '<html>' +
        '  <body>' +
        '    <img src="cid:abc" />' +
        '    <img src="cid:def" />' +
        '    <img \n alt="test" src="cid:ghi" title="Title" />' +
        '  </body>' +
        '</html>', [{ cid: 'def', url: 'http://url.2' }, { cid: 'abc', url: 'http://url.1' }, { cid: 'ghi', url: 'http://url.3' }]
      )).to.equal(
        '<html>' +
        '  <body>' +
        '    <img src="http://url.1" />' +
        '    <img src="http://url.2" />' +
        '    <img \n alt="test" src="http://url.3" title="Title" />' +
        '  </body>' +
        '</html>'
      );
    });

    it('should work with multiple inline images having the same cid', function() {
      expect($filter('inlineImages')(
        '<html>' +
        '  <body>' +
        '    <img src="cid:abc" />' +
        '    <img src="cid:abc" />' +
        '  </body>' +
        '</html>', [{ cid: 'abc', url: 'http://url.1' }]
      )).to.equal(
        '<html>' +
        '  <body>' +
        '    <img src="http://url.1" />' +
        '    <img src="http://url.1" />' +
        '  </body>' +
        '</html>'
      );
    });

    it('should perfect match the cid', function() {
      expect($filter('inlineImages')(
        '<html>' +
        '  <body>' +
        '    <img src="cid:abc" />' +
        '  </body>' +
        '</html>', [{ cid: 'a', url: 'http://url.a' }, { cid: 'abcd', url: 'http://url.abcd' }, { cid: 'abc', url: 'http://url.abc' }]
      )).to.equal(
        '<html>' +
        '  <body>' +
        '    <img src="http://url.abc" />' +
        '  </body>' +
        '</html>'
      );
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

});
