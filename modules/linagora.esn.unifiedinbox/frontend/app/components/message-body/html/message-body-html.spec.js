'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The inboxMessageBodyHtml component', function() {

  var $compile, $rootScope, $timeout, IFRAME_MESSAGE_PREFIXES;
  var element, iFrameResize;

  function compile(html) {
    element = angular.element(html);
    element.appendTo(document.body);

    $compile(element)($rootScope);
    $rootScope.$digest();

    return element;
  }

  afterEach(function() {
    if (element) {
      element.remove();
    }
  });

  beforeEach(function() {
    module('linagora.esn.unifiedinbox');
    module('jadeTemplates');

    module(function($provide) {
      $provide.provider('iFrameResize', function() {
        return {
          $get: function() {
            return iFrameResize;
          }
        };
      });
    });
  });

  beforeEach(inject(function(_$compile_, _$rootScope_, _$timeout_, _IFRAME_MESSAGE_PREFIXES_, jmap) {
    $compile = _$compile_;
    $rootScope = _$rootScope_;
    $timeout = _$timeout_;
    IFRAME_MESSAGE_PREFIXES = _IFRAME_MESSAGE_PREFIXES_;

    $rootScope.message = new jmap.Message({}, 'id', 'threadId', ['inbox'], {
      htmlBody: '<html><body><div>Message HTML Body</div></body></html>'
    });
  }));

  it('should contain an iframe element', function() {
    compile('<inbox-message-body-html message="message" />');

    expect(element.find('iframe')).to.have.length(1);
  });

  /**
   * PhantomJS does not work fine with iFrame and 'load' events, thus the .skip()
   * Tests run under Chrome and Firefox, though...
   */
  it.skip('should enable iFrame resizer on the iFrame', function(done) {
    iFrameResize = function(options) {
      expect(options).to.shallowDeepEqual({
        checkOrigin: false,
        scrolling: true,
        inPageLinks: true,
        resizedCallback: function() {}
      });

      done();
    };

    compile('<inbox-message-body-html message="message" />');
  });

  it('should invoke iFrameResizer.resize when it receives an email:collapse event', function(done) {
    iFrameResize = function() {
      return [{
        iFrameResizer: {
          resize: done
        }
      }];
    };

    compile('<inbox-message-body-html message="message" />');

    $rootScope.$broadcast('iframe:loaded', {
      contentWindow: {
        postMessage: angular.noop
      }
    });
    $rootScope.$broadcast('email:collapse');
    $timeout.flush();
  });

  it('should post html content after having filtered it with loadImagesAsync filters', function(done) {
    $rootScope.message.htmlBody = '<html><body><img src="remote.png" /><img src="cid:1" /></body></html>';

    compile('<inbox-message-body-html message="message" />');

    $rootScope.$broadcast('iframe:loaded', {
      contentWindow: {
        postMessage: function(content, target) {
          expect(target).to.equal('*');

          var contentWithoutRandomPort = content.replace(/localhost:\d*/g, 'localhost:PORT');

          expect(contentWithoutRandomPort).to.equal(
            '[linagora.esn.unifiedinbox.changeDocument]<html><body>' +
            '<img src="http://localhost:PORT/images/throbber-amber.svg" data-async-src="remote.png" />' +
            '<img src="http://localhost:PORT/images/throbber-amber.svg" data-async-src="cid:1" />' +
            '</body></html>');

          done();
        }
      }
    });
  });

  it('should get a signed download URL for inline attachments, when asked by the iFrame', function(done) {
    $rootScope.message.htmlBody = '<html><body><img src="cid:1" /></body></html>';
    $rootScope.message.attachments = [{
      cid: '1',
      getSignedDownloadUrl: function() {
        done();

        return $q.when('signedUrl');
      }
    }];

    compile('<inbox-message-body-html message="message" />');

    $rootScope.$broadcast('wm:' + IFRAME_MESSAGE_PREFIXES.INLINE_ATTACHMENT, '1', {});
  });

  it('should call postMessage with the argument 1', function(done) {
    $rootScope.message.htmlBody = '<html><body><img src="cid:1" /></body></html>';
    $rootScope.message.attachments = [{
      cid: '2',
      getSignedDownloadUrl: function() {
        return;
      }
    }];

    compile('<inbox-message-body-html message="message" />');

    $rootScope.$broadcast('wm:' + IFRAME_MESSAGE_PREFIXES.INLINE_ATTACHMENT, '1', {
      contentWindow: {
        postMessage: function(content, target) {
          expect(target).to.equal('*');

          var contentWithoutRandomPort = content.replace(/localhost:\d*/g, 'localhost:PORT');

          expect(contentWithoutRandomPort).to.equal('[linagora.esn.unifiedinbox.inlineAttachment]1');

          done();
        }
      }
    });
  });

  it('should scale the iframe if the computed width is larger than the parent', function() {
    var iFrame = {
      contentWindow: {
        postMessage: angular.noop
      },
      style: {}
    };

    iFrameResize = function(options) {
      options.resizedCallback({
        iframe: iFrame,
        width: 1280,
        height: 800
      });

      return [{
        iFrameResizer: {
          resize: angular.noop
        }
      }];
    };

    compile('' +
      '<div class="parent" style="position: absolute; width: 640px; height: 480px">' +
        '<inbox-message-body-html message="message" />' +
      '</div>'
    );
    $rootScope.$broadcast('iframe:loaded', iFrame);

    expect(iFrame.style.transform).to.equal('scale3d(0.5, 0.5, 1)');
    expect(element.height()).to.equal(440); // 800 / 2 + 40
    expect(element.css('overflow')).to.equal('hidden');

    $rootScope.$digest();

    expect($rootScope.message.scaled).to.equal(true);
  });

  it('should display a message to the user when message is auto-scaled', function() {
    var iFrame = {
      contentWindow: {
        postMessage: angular.noop
      },
      style: {}
    };

    iFrameResize = function(options) {
      options.resizedCallback({
        iframe: iFrame,
        width: 1280,
        height: 800
      });

      return [{
        iFrameResizer: {
          resize: angular.noop
        }
      }];
    };

    compile('' +
      '<div class="parent" style="position: absolute; width: 640px; height: 480px">' +
        '<inbox-message-body-html message="message" />' +
      '</div>'
    );
    $rootScope.$broadcast('iframe:loaded', iFrame);
    $rootScope.$digest();

    expect(element.find('.inbox-message-body-html-autoscale')).to.have.length(1);
  });

  it('should not scale the iframe and allow scrolling if the computed width is smaller than the parent', function() {
    var iFrame = {
      contentWindow: {
        postMessage: angular.noop
      },
      style: {}
    };

    iFrameResize = function(options) {
      options.resizedCallback({
        iframe: iFrame,
        width: 600
      });

      return [{
        iFrameResizer: {
          resize: angular.noop
        }
      }];
    };

    compile('' +
      '<div class="parent" style="position: absolute; width: 640px;">' +
        '<inbox-message-body-html message="message" />' +
      '</div>'
    );
    $rootScope.$broadcast('iframe:loaded', iFrame);

    expect(iFrame.style.transform).to.equal('');
    expect(element.css('overflow')).to.equal('auto');

    $rootScope.$digest();

    expect($rootScope.message.scaled).to.equal(false);
  });

  it('should not display a message to the user when message is full size', function() {
    var iFrame = {
      contentWindow: {
        postMessage: angular.noop
      },
      style: {}
    };

    iFrameResize = function(options) {
      options.resizedCallback({
        iframe: iFrame,
        width: 200,
        height: 200
      });

      return [{
        iFrameResizer: {
          resize: angular.noop
        }
      }];
    };

    compile('' +
      '<div class="parent" style="position: absolute; width: 640px; height: 480px">' +
        '<inbox-message-body-html message="message" />' +
      '</div>'
    );
    $rootScope.$broadcast('iframe:loaded', iFrame);
    $rootScope.$digest();

    expect(element.find('.inbox-message-body-html-autoscale')).to.have.length(0);
  });

  it('should resize the iframe and remove transform when auto-scaling is canceled by the user', function() {
    var iFrame = {
      contentWindow: {
        postMessage: angular.noop
      },
      style: {}
    };

    iFrameResize = function(options) {
      function resize() {
        options.resizedCallback({
          iframe: iFrame,
          width: 1280,
          height: 800
        });
      }

      resize();

      return [{
        iFrameResizer: {
          resize: resize
        }
      }];
    };

    compile('' +
      '<div class="parent" style="position: absolute; width: 640px; height: 480px">' +
        '<inbox-message-body-html message="message" />' +
      '</div>'
    );
    $rootScope.$broadcast('iframe:loaded', iFrame);
    $rootScope.$digest();

    element.find('.inbox-message-body-html-autoscale-disable').click();
    $timeout.flush();
    $rootScope.$digest();

    expect(iFrame.style.transform).to.equal('');
    expect(element.css('overflow')).to.equal('auto');
    expect($rootScope.message.scaled).to.equal(false);
  });

});
