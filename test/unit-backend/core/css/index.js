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
      this.css.addLessInjection('myModule', ['/tmp/test2.less'], ['esn', 'esn2']);
      expect(this.css.getInjections()).to.deep.equal({
        myModule: {
          esn: {
            less: [
              {filename: '/tmp/test.less', priority: 0},
              {filename: '/tmp/test2.less', priority: 0}
            ]
          },
          esn2: {
            less: [
              {filename: '/tmp/test2.less', priority: 0}
            ]
          }
        },
        myModule2: {
          esn: {
            less: [
              {filename: '/tmp/test.less', priority: 0}
            ]
          }
        }
      });
    });

    it('should support the object style injections', function() {
      var injected = [
        '/tmp/test.less',
        {
          filename: '/tmp/test2.less'
        }
      ];
      this.css.addLessInjection('myModule', injected, ['esn']);
      expect(this.css.getInjections()).to.deep.equal({
        myModule: {
          esn: {
            less: [
              {filename: '/tmp/test.less', priority: 0},
              {filename: '/tmp/test2.less', priority: 0}
            ]
          }
        }
      });
    });

    it('should respect the priority property', function() {
      var injected = [
        '/tmp/test.less',
        {
          filename: '/tmp/test2.less',
          priority: -100
        },
        {
          filename: '/tmp/test3.less',
          priority: 100
        }
      ];
      this.css.addLessInjection('myModule', injected, ['esn']);
      expect(this.css.getInjections()).to.deep.equal({
        myModule: {
          esn: {
            less: [
              {filename: '/tmp/test3.less', priority: 100},
              {filename: '/tmp/test.less', priority: 0},
              {filename: '/tmp/test2.less', priority: -100}
            ]
          }
        }
      });
    });
  });
});
