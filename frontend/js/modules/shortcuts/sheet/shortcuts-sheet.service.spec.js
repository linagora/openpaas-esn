'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The esnShortcutsSheet service', function() {
  var esnShortcutsSheet;
  var $modalMock, modalInstance;

  beforeEach(function() {
    modalInstance = {};
    $modalMock = sinon.stub().returns(modalInstance);

    module('esn.shortcuts', function($provide) {
      $provide.value('$modal', $modalMock);
    });
  });

  beforeEach(inject(function(_esnShortcutsSheet_) {
    esnShortcutsSheet = _esnShortcutsSheet_;
  }));

  describe('The toggle fn', function() {
    it('should create and open the modal on first call', function() {
      esnShortcutsSheet.toggle();

      expect($modalMock).to.have.been.calledOnce;
    });

    it('should reuse the modal instance and toggle in next calls', function() {
      modalInstance.toggle = sinon.spy();

      esnShortcutsSheet.toggle();
      esnShortcutsSheet.toggle();
      esnShortcutsSheet.toggle();

      expect($modalMock).to.have.been.calledOnce;
      expect(modalInstance.toggle).to.have.been.calledTwice;
    });
  });
});
