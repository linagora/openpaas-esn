'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The controlcenterGeneralService factory', function() {
  var esnModuleRegistry, controlcenterGeneralService;
  var modulesMock;

  beforeEach(function() {
    module('linagora.esn.controlcenter', function($provide) {
      $provide.value('esnI18nService', {
        translate: function(input) { return input; }
      });
    });

    modulesMock = [
      { homePage: 'a', title: 'A' },
      { homePage: 'b', title: 'B' }
    ];

    inject(function(_esnModuleRegistry_, _controlcenterGeneralService_) {
      esnModuleRegistry = _esnModuleRegistry_;
      controlcenterGeneralService = _controlcenterGeneralService_;
    });

    esnModuleRegistry.getAll = function() {
      return modulesMock;
    };
  });

  describe('The getHomePageCandidates fn', function() {
    it('should return a list homePage', function() {
      var expectResult = {a: 'A', b: 'B'};

      expect(controlcenterGeneralService.getHomePageCandidates()).to.deep.equal(expectResult);
    });
  });
});
