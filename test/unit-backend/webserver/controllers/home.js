'use strict';

const expect = require('chai').expect;
const mockery = require('mockery');
const sinon = require('sinon');

describe('The home controller', function() {

  describe('The index function', function() {
    it('should set a valid express response', function(done) {
      const assets = {foo: 'bar'};
      const tplPath = '/my/template';
      const alterMock = sinon.spy();
      const esnAwareAppMock = sinon.spy(function() {
        return assets;
      });

      mockery.registerMock('../middleware/templates', {
        alterTemplatePath: alterMock
      });

      mockery.registerMock('../../core', {
        assets: {
          envAwareApp: esnAwareAppMock
        }
      });

      const index = this.helpers.requireBackend('webserver/controllers/home').index;
      const res = {
        locals: {},
        render: function(templatePath, options) {
          expect(res.locals.assets).to.deep.equal(assets);
          expect(templatePath).to.equal(tplPath);
          expect(options).to.deep.equal({
            title: 'Home',
            locale: 'vi'
          });
          done();
        }
      };
      const req = {
        getLocale() {
          return 'vi';
        }
      };

      index(req, res);

      expect(alterMock).to.have.been.calledWith('esn/index', sinon.match.func.and(sinon.match(function(func) {
        func(tplPath);

        return true;
      })));
    });
  });
});
