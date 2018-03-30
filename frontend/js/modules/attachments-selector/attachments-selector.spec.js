'use strict';

/* global chai: false, sinon: false */

var expect = chai.expect;

describe('The attachmentsSelectorController controller', function() {

  var $rootScope, $componentController, ctrl;

  beforeEach(function() {
    module('esn.attachments-selector');

    inject(function(_$rootScope_, _$componentController_) {
    $rootScope = _$rootScope_;
    $componentController = _$componentController_;
    });
  });

  beforeEach(function() {
    ctrl = $componentController('esnAttachmentsSelector', {}, {
      attachments: [],
      onAttachmentsUpdate: sinon.spy(),
      uploadAttachments: sinon.spy(function(attachments) {
        return $q.when(attachments.$files);
      })
    });
  });

  describe('The onAttachmentsSelect function', function() {

    it('should do nothing if no files are given', function() {
      ctrl.onAttachmentsSelect();
      $rootScope.$digest();

      expect(ctrl.attachments).to.deep.equal([]);
    });

    it('should do nothing if files is zerolength', function() {
      ctrl.onAttachmentsSelect([]);
      $rootScope.$digest();

      expect(ctrl.attachments).to.deep.equal([]);
    });

    it('should add the attachment', function() {
      ctrl.onAttachmentsSelect([{
        name: 'name'
      }]);
      $rootScope.$digest();

      expect(ctrl.attachments).to.deep.equal([{
        name: 'name'
      }]);
    });

    it('should update attachment', function() {
      ctrl.onAttachmentsSelect([{
        name: 'name'
      }]);
      $rootScope.$digest();

      expect(ctrl.onAttachmentsUpdate).to.have.been.calledWith(sinon.match({
        $attachments: [
          sinon.match({ name: 'name' })
        ]
      }));
    });
  });

  describe('the getAttachmentsStatus function', function() {

    it('should return a value with number=0 when there is no attachments', function() {
      expect(ctrl.getAttachmentsStatus()).to.deep.equal({
        number: 0,
        uploading: false,
        error: false
      });
    });

    it('should consider currently uploading attachments for uploading=true flag', function() {
      ctrl.attachments.push({
        status: 'uploading'
      });

      expect(ctrl.getAttachmentsStatus()).to.deep.equal({
        number: 1,
        uploading: true,
        error: false
      });
    });

    it('should consider failed uploads for error=true flag', function() {
      ctrl.attachments.push({
        status: 'error'
      });

      expect(ctrl.getAttachmentsStatus()).to.deep.equal({
        number: 1,
        uploading: false,
        error: true
      });
    });

    describe('with a filter defined', function() {

      beforeEach(function() {
        ctrl.attachmentFilter = { isInline: true };
      });

      it('should consider only attachments related to given filter', function() {
        ctrl.attachments.push({ isInline: true });
        ctrl.attachments.push({ iLovePotato: false });

        expect(ctrl.getAttachmentsStatus()).to.deep.equal({
          number: 1,
          uploading: false,
          error: false
        });
      });
    });

    describe('with a type defined', function() {

      beforeEach(function() {
        ctrl.attachmentType = 'jmap';
      });

      it('should consider only given type attachments', function() {
        ctrl.attachments.push({ attachmentType: 'jmap' });
        ctrl.attachments.push({ attachmentType: 'linshare' });

        expect(ctrl.getAttachmentsStatus()).to.deep.equal({
          number: 1,
          uploading: false,
          error: false
        });
      });
    });
  });
});
