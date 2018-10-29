'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The esn.notification Angular modules', function() {
  beforeEach(function() {
    angular.mock.module('esn.notification');
  });

  describe('The notification service', function() {
    var notifyService, notifyMock, self, esnI18nServiceMock;

    beforeEach(function() {
      self = this;

      this.escapeHTMLMockResult = {};
      this.escapeHTMLMock = {
        escapeHTML: sinon.stub().returns(this.escapeHTMLMockResult)
      };
      esnI18nServiceMock = {
        translate: sinon.spy(function(input) {
          return {
            toString: function() {return input;}
          };
        })
      };

      angular.mock.module(function($provide) {
        $provide.value('$window', {
          $: {
            notify: function() {
              return notifyMock.apply(this, arguments);
            }
          }
        });

        $provide.value('escapeHtmlUtils', self.escapeHTMLMock);
        $provide.value('esnI18nService', esnI18nServiceMock);
      });
    });

    beforeEach(inject(function(_notifyService_) {
      notifyService = _notifyService_;
    }));

    it('should contain defaultSettings when the hideCross option is not defined', function() {
      var settings = {};
      var expectedSettings = {
        placement: { from: 'bottom', align: 'center'},
        animate: { enter: 'animated fadeInUp', exit: 'animated fadeOutDown' },
        offset: 0,
        template: '<div data-notify="container" class="alert alert-{0} flex-space-between" role="alert">' +
          '<span data-notify="message">{2}</span>' +
          '<a target="_self" class="action-link cancel-task" data-notify="url"></a>' +
          '<a class="close" data-notify="dismiss"><i class="mdi mdi-close"></i></a>' +
        '</div>'
      };

      notifyMock = sinon.spy(function(options, settings) {
        expect(settings).to.shallowDeepEqual(expectedSettings);

        return {};
      });

      notifyService({}, settings);
      expect(notifyMock).to.have.been.calledOnce;
    });

    it('should contain defaultSettings with no tag "a" that contains the cross when the hideCross option is true', function() {
      var settings = {};
      var expectedSettings = {
        placement: { from: 'bottom', align: 'center'},
        animate: { enter: 'animated fadeInUp', exit: 'animated fadeOutDown' },
        offset: 0,
        template: '<div data-notify="container" class="alert alert-{0} flex-space-between" role="alert">' +
          '<span data-notify="message">{2}</span>' +
          '<a target="_self" class="action-link cancel-task" data-notify="url"></a>' +
          '</div>'
      };

      notifyMock = sinon.spy(function(options, settings) {
        expect(settings).to.shallowDeepEqual(expectedSettings);

        return {};
      });

      notifyService({ hideCross: true }, settings);
      expect(notifyMock).to.have.been.calledOnce;
    });

    it('should translate messages before passing it to notify', function() {
      var data = {
        title: 'title',
        message: 'message'
      };

      notifyMock = function() { return {}; };

      notifyService(data, {});
      expect(esnI18nServiceMock.translate).to.have.been.calledWith('title');
      expect(esnI18nServiceMock.translate).to.have.been.calledWith('message');
    });

    it('should not run translate if message or title are undefined', function() {
      notifyMock = function() { return {}; };
      notifyService(null, null);

      expect(esnI18nServiceMock.translate).to.not.have.been.called;
    });

    it('should esecape the html data before passing it to notify', function() {
      var title = '<script>alert("XSS")</script>title';
      var message = '<script>alert("XSS")</script>message';
      var escapedString = '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;';
      var data = {
        title: title,
        message: message
      };
      var options = {};

      this.escapeHTMLMock.escapeHTML = sinon.spy(function(val) {
        return val.replace('<script>alert("XSS")</script>', escapedString);
      });

      notifyMock = sinon.spy(function(data, options) {
        expect(data).to.deep.equal({
          title: escapedString + 'title',
          message: escapedString + 'message'
        });
        expect(options).to.equal(options);

        return {};
      });

      notifyService(data, options);
      expect(this.escapeHTMLMock.escapeHTML).to.have.been.calledWith(message);
      expect(this.escapeHTMLMock.escapeHTML).to.have.been.calledWith(title);
      expect(notifyMock).to.have.been.calledOnce;
    });

    describe('the returned notify object of notifyService', function() {
      var notifyObj, rawUpdate, rawClose, wrappedNotifyObj, dirtyValue, rawFail;

      beforeEach(function() {
        rawUpdate = sinon.spy();
        rawClose = sinon.spy();
        rawFail = sinon.spy();
        notifyObj = {
          update: function() {
            rawUpdate.apply(this, arguments);
          },
          fail: function() {
            rawFail.apply(this, arguments);
          },
          close: function() {
            rawClose.apply(this, arguments);
          }
        };

        notifyMock = function() {
          return notifyObj;
        };

        wrappedNotifyObj = notifyService(null, null);

        dirtyValue = 'value<script></scrit>';
        this.escapeHTMLMock.escapeHTML = sinon.spy();
      });

      it('should have a update method that escapes his second argument when called with two string', function() {
        wrappedNotifyObj.update('key', dirtyValue);
        expect(this.escapeHTMLMock.escapeHTML).not.to.have.been.calledWith('key');
        expect(this.escapeHTMLMock.escapeHTML).to.have.been.calledWith(dirtyValue);
        expect(rawUpdate).to.have.been.calledOnce;
      });

      it('should have a update method that escapes the html of the value of an object when called with this object has an argument', function() {
        wrappedNotifyObj.update({key: dirtyValue});
        expect(this.escapeHTMLMock.escapeHTML).to.have.been.calledWith(dirtyValue);
        expect(rawUpdate).to.have.been.calledOnce;
      });

      it('should not alter close', function() {
        expect(wrappedNotifyObj.close).to.equal(notifyObj.close);
      });

    });
  });

  describe('The notification service with jQuery.notify plugin', function() {
    var notifyService;

    beforeEach(function() {
      angular.mock.module('esn.configuration');
    });

    beforeEach(inject(function(_notifyService_) {
      notifyService = _notifyService_;
    }));

    it('should provide a clickable link that triggers provided function', function() {
      var cancelActionConfig = {linkText: 'cancel', action: sinon.spy()};
      var notification = notifyService({title: 'title', message: 'message', type: 'danger'}, {});

      notification.setCancelAction(cancelActionConfig);
      notification.$ele.find('a.cancel-task').click();
      notification.$ele.find('a.cancel-task').click();

      expect(cancelActionConfig.action).to.have.been.calledOnce;
    });

    it('should provide a clickable link that closes th notification when clicked', function() {
      var notification = notifyService({ title: 'title', message: 'message', type: 'danger' }, {});

      notification.close = sinon.spy();
      notification.setCancelAction({ linkText: 'cancel', action: angular.noop });
      notification.$ele.find('a.cancel-task').click();

      expect(notification.close).to.have.been.calledWith();
    });

    it('should call the provided callback on close', function() {
      var notification = notifyService({ title: 'title', message: 'message', type: 'danger' }, {});

      var closeCallback = sinon.spy();
      notification.setCloseAction(closeCallback);
      notification.$ele.find('a.close').click();

      expect(closeCallback).to.have.been.calledWith();
    });
  });
});
