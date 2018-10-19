'use strict';

/* global chai: false, sinon: false */

var expect = chai.expect;

describe('The esnAttachmentsSelectorService\'s AttachmentServiceHolder', function() {

  var $rootScope, esnAttachmentsSelectorService, target;

  beforeEach(function() {
    module('esn.attachments-selector');

    inject(function(_$rootScope_, _esnAttachmentsSelectorService_) {
      $rootScope = _$rootScope_;
      esnAttachmentsSelectorService = _esnAttachmentsSelectorService_;
    });
  });

  beforeEach(function() {
    target = esnAttachmentsSelectorService.newAttachmentServiceHolder({
      attachments: [],
      onAttachmentsUpdate: sinon.spy(),
      uploadAttachments: sinon.spy($q.when)
    });
  });

  describe('The onAttachmentsSelect function', function() {

    it('should do nothing if no files are given', function() {
      target.onAttachmentsSelect();
      $rootScope.$digest();

      expect(target.attachments).to.deep.equal([]);
    });

    it('should do nothing if files is zerolength', function() {
      target.onAttachmentsSelect([]);
      $rootScope.$digest();

      expect(target.attachments).to.deep.equal([]);
    });

    it('should add the attachment', function() {
      target.onAttachmentsSelect([{
        name: 'name'
      }]);
      $rootScope.$digest();

      expect(target.attachments).to.deep.equal([{
        name: 'name'
      }]);
    });

    it('should update attachment', function() {
      target.onAttachmentsSelect([{
        name: 'name'
      }]);
      $rootScope.$digest();

      expect(target.onAttachmentsUpdate).to.have.been
        .calledWith(sinon.match([sinon.match({ name: 'name' })]));
    });
  });

  describe('the getAttachmentsStatus function', function() {

    it('should return a value with number=0 when there is no attachments', function() {
      expect(target.getAttachmentsStatus()).to.deep.equal({
        number: 0,
        uploading: false,
        error: false
      });
    });

    it('should consider currently uploading attachments for uploading=true flag', function() {
      target.attachments.push({
        status: 'uploading'
      });

      expect(target.getAttachmentsStatus()).to.deep.equal({
        number: 1,
        uploading: true,
        error: false
      });
    });

    it('should consider failed uploads for error=true flag', function() {
      target.attachments.push({
        status: 'error'
      });

      expect(target.getAttachmentsStatus()).to.deep.equal({
        number: 1,
        uploading: false,
        error: true
      });
    });

    describe('with a filter defined', function() {

      beforeEach(function() {
        target.attachmentFilter = { isInline: true };
      });

      it('should consider only attachments related to given filter', function() {
        target.attachments.push({ isInline: true });
        target.attachments.push({ iLovePotato: false });

        expect(target.getAttachmentsStatus()).to.deep.equal({
          number: 1,
          uploading: false,
          error: false
        });
      });
    });

    describe('with a type defined', function() {

      beforeEach(function() {
        target.attachmentType = 'jmap';
      });

      it('should consider only given type attachments', function() {
        target.attachments.push({ attachmentType: 'jmap' });
        target.attachments.push({ attachmentType: 'linshare' });

        expect(target.getAttachmentsStatus()).to.deep.equal({
          number: 1,
          uploading: false,
          error: false
        });
      });
    });
  });
});
