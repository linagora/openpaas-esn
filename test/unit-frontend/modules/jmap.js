'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The esn.jmap-js module', function() {

  beforeEach(function() {
    this.JMAP = {
      store: {
        on: function() {}
      },
      Mailbox: {}
    };
    window.JMAP = this.JMAP;
    this.O = {};
    window.O = this.O;

    angular.mock.module('esn.overture');
    angular.mock.module('esn.jmap-js');
  });

  describe('The jmap service', function() {

    describe('The listMailboxes fn', function() {

      var observableArray, observableArrayChangeCallback;

      beforeEach(angular.mock.inject(function(jmap, overture) {
        this.jmap = jmap;
        this.overture = overture;

        this.JMAP.store.getQuery = function() {};
        this.overture.createObservableArray = function(query, callback) {
          observableArrayChangeCallback = callback;
          return observableArray;
        };
      }));

      it('should always call contentDidChange as data can already be loaded', function() {
        observableArray = {
          contentDidChange: function() {
            observableArrayChangeCallback('expected result');
          }
        };

        var expectedResult;
        this.jmap.listMailboxes(function(result) {
          expectedResult = result;
        });

        expect(expectedResult).to.equal('expected result');
      });

    });

  });

});
