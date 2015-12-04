'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The esn.notification Angular modules', function() {
  beforeEach(function() {
    angular.mock.module('esn.notification');
  });

  describe('The notification service', function() {
    var notifyService, notifyMock, sanitizeMock;

    beforeEach(function() {
      angular.mock.module(function($provide) {
        $provide.value('$window', {
          $: {
            notify: function() {
              return notifyMock.apply(this, arguments);
            }
          }
        });

        $provide.value('$sanitize', function() {
          return sanitizeMock.apply(this, arguments);
        });
      });
    });

    beforeEach(inject(function(_notifyService_) {
      notifyService = _notifyService_;
    }));

    it('should sanitize data before passing it to notify', function() {
      var title = '<script>alert("XSS")</script>title';
      var message = '<script>alert("XSS")</script>message';
      var data = {
        title: title,
        message: message
      };
      var options = {};

      sanitizeMock = sinon.spy(function(val) {
        return val.replace('<script>alert("XSS")</script>', '');
      });

      notifyMock = sinon.spy(function(data, options) {
        expect(data).to.deep.equal({
          title:  'title',
          message: 'message'
        });
        expect(options).to.equal(options);

        return {};
      });

      notifyService(data, options);
      expect(sanitizeMock).to.have.been.calledWith(message);
      expect(sanitizeMock).to.have.been.calledWith(title);
      expect(notifyMock).to.have.been.calledOnce;
    });

    describe('the returned notify object of notifyService', function() {
      var notifyObj, rawUpdate, rawClose, wrappedNotifyObj, dirtyValue;

      beforeEach(function() {
        notifyObj = {
          update: function() {
            rawUpdate.apply(this, arguments);
          },
          close: function() {
            rawClose.apply(this, arguments);
          }
        };

        sanitizeMock = angular.identity;
        notifyMock = function() {
          return notifyObj;
        };

        wrappedNotifyObj = notifyService(null, null);

        dirtyValue = 'value<script></scrit>';
        sanitizeMock = sinon.spy(function(val) {
          expect(val).to.equal(dirtyValue);
          return 'value';
        });
      });

      it('should have a update method that sanitize his second argument when called with two string', function() {
        rawUpdate = sinon.spy(function(key, value) {
          expect(key).to.equal('key');
          expect(value).to.equal('value');
        });

        wrappedNotifyObj.update('key', dirtyValue);
        expect(sanitizeMock).to.have.been.calledOnce;
        expect(rawUpdate).to.have.been.calledOnce;
      });

      it('should have a update method that sanitize the value of an object when called with this object has an argument', function() {
        rawUpdate = sinon.spy(function(obj) {
          expect(obj.key).to.equal('value');
        });

        var dirtyValue = 'value<script></scrit>';

        sanitizeMock = sinon.spy(function(val) {
          expect(val).to.equal(dirtyValue);
          return 'value';
        });

        wrappedNotifyObj.update({key: dirtyValue});
        expect(sanitizeMock).to.have.been.calledOnce;
        expect(rawUpdate).to.have.been.calledOnce;
      });

      it('should not alter close', function() {
        expect(wrappedNotifyObj.close).to.equal(notifyObj.close);
      });
    });

  });
});
