'use strict';

const expect = require('chai').expect;
const mockery = require('mockery');
const q = require('q');

describe('i18n lib', function() {

  let requireModule, i18nLib;
  const user = {
    _id: 'userID'
  };

  beforeEach(function() {
    const modulesPath = this.moduleHelpers.modulesPath;
    requireModule = () => (require(modulesPath + 'linagora.esn.calendar/backend/lib/i18n')(function() {}));

    i18nLib = requireModule();
  });

  describe('the getI18nForMailer function', function() {
    it('should resolve i18n object configured by default if no user is provided', function(done) {
      i18nLib = requireModule();
      i18nLib.getI18nForMailer().then(function(i18nConf) {
        expect(i18nConf.locale).to.equal(i18nLib.DEFAULT_LOCALE);

        done();
      }, (error = 'fail') => done(error));
    });

    it('should resolve i18n object configured by default if serach for locale conf fails', function(done) {
      const i18nHelper = function() {
        return {
          getLocaleForUser: function(u) {
            expect(u).to.equal(user);
            return q.reject();
          }
        };
      };
      mockery.registerMock('./helpers', i18nHelper);
      requireModule().getI18nForMailer(user).then(function(i18nConf) {
        expect(i18nConf.locale).to.equal(i18nLib.DEFAULT_LOCALE);

        done();
      }, (error = 'fail') => done(error));
    });

    it('should resolve i18n object configured by default if no locale conf is found for the user', function(done) {
      const i18nHelper = function() {
        return {
          getLocaleForUser: function(u) {
            expect(u).to.equal(user);
            return q.when();
          }
        };
      };
      mockery.registerMock('./helpers', i18nHelper);
      requireModule().getI18nForMailer(user).then(function(i18nConf) {
        expect(i18nConf.locale).to.equal(i18nLib.DEFAULT_LOCALE);

        done();
      }, (error = 'fail') => done(error));
    });

    it('should resolve i18n object configured with locale conf found for the user', function(done) {
      const localeFromConf = 'de';
      const i18nHelper = function() {
        return {
          getLocaleForUser: function(u) {
            expect(u).to.equal(user);
            return q.when(localeFromConf);
          }
        };
      };
      mockery.registerMock('./helpers', i18nHelper);
      requireModule().getI18nForMailer(user).then(function(i18nConf) {
        expect(i18nConf.locale).to.equal(localeFromConf);

        done();
      }, (error = 'fail') => done(error));
    });
  });

});
