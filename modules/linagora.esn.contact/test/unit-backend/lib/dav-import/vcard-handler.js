'use strict';

const mockery = require('mockery');
const sinon = require('sinon');
const chai = require('chai');
const expect = chai.expect;

describe('The contacts backend/lib/dav-import/vcard-handler module', function() {
  let getModule;

  beforeEach(function() {
    this.moduleHelpers.backendPath = `${this.moduleHelpers.modulesPath}linagora.esn.contact/backend/`;
    getModule = () => require(`${this.moduleHelpers.backendPath}lib/dav-import/vcard-handler`)(this.moduleHelpers.dependencies);
  });

  describe('The readLines fn', function() {
    it('should return complete vcard items and remaining lines', function() {
      const lines = [
        'BEGIN:VCARD',
        'VERSION:4.0',
        'FN:Louis Vidal',
        'N:Vidal;Louis;;;',
        'EMAIL;TYPE=Work:mailto:lvidal1@mail',
        'END:VCARD',
        'BEGIN:VCARD',
        'VERSION:4.0',
        'FN:Louis Vidal',
        'N:Vidal;Louis;;;',
        'EMAIL;TYPE=Work:mailto:lvidal2@mail',
        'END:VCARD',
        'BEGIN:VCARD',
        'VERSION:4.0',
        'FN:Louis Vidal',
        'N:Vidal;Louis'
      ];

      const { items, remainingLines } = getModule().readLines(lines);

      expect(items).to.have.length(2);
      expect(items[0]).to.contain('mailto:lvidal1@mail');
      expect(items[1]).to.contain('mailto:lvidal2@mail');
      expect(remainingLines).to.have.length(4);
    });

    it('should skip lines until the start line if there is not remaining lines', function() {
      const lines = [
        'these',
        'lines',
        'must',
        'be',
        'ignored',
        'BEGIN:VCARD',
        'VERSION:4.0',
        'FN:Louis Vidal',
        'N:Vidal;Louis;;;',
        'EMAIL;TYPE=Work:mailto:lvidal1@mail',
        'END:VCARD',
        'BEGIN:VCARD',
        'VERSION:4.0',
        'FN:Louis Vidal',
        'N:Vidal;Louis;;;',
        'EMAIL;TYPE=Work:mailto:lvidal2@mail',
        'END:VCARD',
        'BEGIN:VCARD',
        'VERSION:4.0',
        'FN:Louis Vidal',
        'N:Vidal;Louis'
      ];

      const { items, remainingLines } = getModule().readLines(lines);

      expect(items).to.have.length(2);
      expect(items[0]).to.contain('mailto:lvidal1@mail');
      expect(items[1]).to.contain('mailto:lvidal2@mail');
      expect(remainingLines).to.have.length(4);
    });

    it('should take remaining lines into account', function() {
      const lines = [
        'N:Vidal;Louis;;;',
        'EMAIL;TYPE=Work:mailto:lvidal1@mail',
        'END:VCARD',
        'BEGIN:VCARD',
        'VERSION:4.0',
        'FN:Louis Vidal',
        'N:Vidal;Louis;;;',
        'EMAIL;TYPE=Work:mailto:lvidal2@mail',
        'END:VCARD',
        'BEGIN:VCARD',
        'VERSION:4.0',
        'FN:Louis Vidal',
        'N:Vidal;Louis;;;',
        'EMAIL;TYPE=Work:mailto:lvidal3@mail',
        'END:VCARD',
        'BEGIN:VCARD',
        'VERSION:4.0',
        'FN:Louis Vidal',
        'N:Vidal;Louis'
      ];

      const remainingLines = [
        'BEGIN:VCARD',
        'VERSION:4.0',
        'FN:Louis Vidal'
      ];

      const { items } = getModule().readLines(lines, remainingLines);

      expect(items).to.have.length(3);
      expect(items[0]).to.contain('mailto:lvidal1@mail');
      expect(items[1]).to.contain('mailto:lvidal2@mail');
      expect(items[2]).to.contain('mailto:lvidal3@mail');
    });

    it('should work well with \\r character at the end of the line', function() {
      const lines = [
        'BEGIN:VCARD\r',
        'VERSION:4.0\r',
        'FN:Louis Vidal\r',
        'N:Vidal;Louis;;;\r',
        'EMAIL;TYPE=Work:mailto:lvidal1@mail\r',
        'END:VCARD\r',
        'BEGIN:VCARD\r',
        'VERSION:4.0\r',
        'FN:Louis Vidal\r',
        'N:Vidal;Louis;;;\r',
        'EMAIL;TYPE=Work:mailto:lvidal2@mail\r',
        'END:VCARD\r',
        'BEGIN:VCARD\r',
        'VERSION:4.0\r',
        'FN:Louis Vidal\r',
        'N:Vidal;Louis'
      ];

      const { items, remainingLines } = getModule().readLines(lines);

      expect(items).to.have.length(2);
      expect(items[0]).to.contain('mailto:lvidal1@mail');
      expect(items[1]).to.contain('mailto:lvidal2@mail');
      expect(remainingLines).to.have.length(4);
    });
  });

  describe('The importItem fn', function() {
    let clientMock;

    beforeEach(function() {
      clientMock = sinon.stub();

      mockery.registerMock('../client', () => clientMock);
    });

    it('should reject when target is not a valid address book path', function(done) {
      const item = [
        'BEGIN:VCARD',
        'VERSION:4.0',
        'FN:Louis Vidal',
        'N:Vidal;Louis;;;',
        'EMAIL;TYPE=Work:mailto:lvidal@mail',
        'END:VCARD'
      ].join('\n');
      const target = '/addressbooks/';

      getModule().importItem(item, { target })
        .then(() => done('should reject'))
        .catch(err => {
          expect(err.message).to.equal(`${target} is not a valid address book path`);
          done();
        });
    });

    it('should call contact client to create contact', function(done) {
      const item = [
        'BEGIN:VCARD',
        'VERSION:4.0',
        'FN:Louis Vidal',
        'N:Vidal;Louis;;;',
        'EMAIL;TYPE=Work:mailto:lvidal@mail',
        'END:VCARD'
      ].join('\n');
      const target = '/addressbooks/bookHome/bookName.json';

      clientMock.returns({
        addressbookHome(bookHome) {
          expect(bookHome).to.equal('bookHome');

          return {
            addressbook(bookName) {
              expect(bookName).to.equal('bookName');

              return {
                vcard() {
                  return {
                    create(data) {
                      expect(JSON.stringify(data)).to.contain('Louis Vidal');
                      done();
                    }
                  };
                }
              };
            }
          };
        }
      });

      getModule().importItem(item, { target });
    });

    it('should generate new contact ID and replace the existing one', function(done) {
      const item = [
        'BEGIN:VCARD',
        'VERSION:4.0',
        'UID:old_uid',
        'FN:Louis Vidal',
        'N:Vidal;Louis;;;',
        'EMAIL;TYPE=Work:mailto:lvidal@mail',
        'END:VCARD'
      ].join('\n');
      const target = '/addressbooks/bookHome/bookName.json';

      clientMock.returns({
        addressbookHome(bookHome) {
          expect(bookHome).to.equal('bookHome');

          return {
            addressbook(bookName) {
              expect(bookName).to.equal('bookName');

              return {
                vcard(contactId) {
                  return {
                    create(data) {
                      expect(JSON.stringify(data)).to.not.contain('old_uid');
                      expect(JSON.stringify(data)).to.contain(contactId);
                      done();
                    }
                  };
                }
              };
            }
          };
        }
      });

      getModule().importItem(item, { target });
    });
  });

  describe('The targetValidator fn', function() {
    it('should return false when target is an invalid address book path', function() {
      expect(getModule().targetValidator(null, '/calendars/123/456.json')).to.equal(false);
    });

    it('should return true when target is a valid address book path', function() {
      expect(getModule().targetValidator(null, '/addressbooks/123/456.json')).to.equal(true);
    });
  });
});
