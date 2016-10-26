'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The esn.file-saver Angular module', function() {

  var BlobMock, FileSaverMock;

  beforeEach(module('esn.file-saver', function($provide) {
    BlobMock = sinon.spy();
    FileSaverMock = {};

    $provide.value('Blob', BlobMock);
    $provide.value('FileSaver', FileSaverMock);
  }));

  describe('The esnFileSaver factory', function() {

    var esnFileSaver;

    beforeEach(inject(function(_esnFileSaver_) {
      esnFileSaver = _esnFileSaver_;
    }));

    describe('The saveText fn', function() {

      it('should save the content as plain text', function() {
        var textContent = 'textContent';
        var filename = 'filename';

        FileSaverMock.saveAs = sinon.spy();

        esnFileSaver.saveText(textContent, filename);

        expect(BlobMock).to.have.been.calledWith([textContent], {type: 'text/plain;charset=utf-8'});
        expect(FileSaverMock.saveAs).to.have.been.calledOnce;
        expect(FileSaverMock.saveAs).to.have.been.calledWith(sinon.match.instanceOf(BlobMock), filename);
      });

    });

  });

});
