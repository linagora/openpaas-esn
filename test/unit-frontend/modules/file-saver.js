'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The esn.file-saver Angular module', function() {

  var BlobMock, FileSaverMock, esnFileSaver, $log;

  beforeEach(function() {
    module('esn.file-saver', function($provide) {
      BlobMock = sinon.spy();
      FileSaverMock = {};

      $provide.value('Blob', BlobMock);
      $provide.value('FileSaver', FileSaverMock);
    });

    inject(function(_esnFileSaver_, _$log_) {
      esnFileSaver = _esnFileSaver_;
      $log = _$log_;
    });
  });

  describe('The esnFileSaver factory', function() {

    describe('The saveText fn', function() {

      it('should call FileSaver.saveAs with right params to save the text content', function() {
        var textContent = 'textContent';
        var filename = 'filename';
        var type = 'text/plain';

        FileSaverMock.saveAs = sinon.spy();

        esnFileSaver.saveText(textContent, filename, type);

        expect(BlobMock).to.have.been.calledWith([textContent], { type: type });
        expect(FileSaverMock.saveAs).to.have.been.calledOnce;
        expect(FileSaverMock.saveAs).to.have.been.calledWith(sinon.match.instanceOf(BlobMock), filename);
      });

      it('should save the content as plain text by default', function() {
        var textContent = 'textContent';
        var filename = 'filename';

        FileSaverMock.saveAs = sinon.spy();

        esnFileSaver.saveText(textContent, filename);

        expect(BlobMock).to.have.been.calledWith([textContent], {type: 'text/plain;charset=utf-8'});
        expect(FileSaverMock.saveAs).to.have.been.calledOnce;
        expect(FileSaverMock.saveAs).to.have.been.calledWith(sinon.match.instanceOf(BlobMock), filename);
      });

    });

    describe('The getFile function', function() {
      var $httpBackend;

      beforeEach(function() {
        inject(function(_$httpBackend_) {
          $httpBackend = _$httpBackend_;
        });
      });

      it('should send a request to file url', function() {
        $httpBackend.expectGET('/url/to/file').respond({});
        esnFileSaver.getFile('/url/to/file');
        $httpBackend.flush();
      });

      it('should return data if receive file data from server', function() {
        var response;

        $httpBackend.whenGET('/url/to/file').respond(200, {name: 'file'});
        esnFileSaver.getFile('/url/to/file').then(function(data) {
          response = data;
        });

        $httpBackend.flush();

        expect(response.name).to.equal('file');
      });

      it('should log the error if it is failed to load file from server', function() {
        $httpBackend.expectGET('/url/to/file').respond(400, 'error');
        esnFileSaver.getFile('/url/to/file');
        $httpBackend.flush();

        expect($log.debug.logs[0][0]).to.equal('XHR Failed for getFile.error');
      });
    });
  });
});
