'use strict';
var expect = require('chai').expect;

describe('The css core module', function() {
  describe('addLessInjection method', function() {

    beforeEach(function() {
      this.css = require(this.testEnv.basePath + '/backend/core').css;
    });

    it('should populate injections with a formatted data', function() {
      this.css.addLessInjection('myModule', ['/tmp/test.less'], ['esn']);
      this.css.addLessInjection('myModule2', ['/tmp/test.less'], ['esn']);
      this.css.addLessInjection('myModule', '/tmp/test2.less', ['esn', 'esn2']);
      expect(this.css.getInjections()).to.deep.equal({
        myModule: {
          esn: {
            less: [
              '/tmp/test.less',
              '/tmp/test2.less'
            ]
          },
          esn2: {
            less: [
              '/tmp/test2.less'
            ]
          }
        },
        myModule2: {
          esn: {
            less: [
              '/tmp/test.less'
            ]
          }
        }
      });
    });
  });
});
