const { expect } = require('chai');

describe('The workers lib module', function() {
  let getModule;

  beforeEach(function() {
    getModule = () => require('../../../backend/lib/workers')(this.moduleHelpers.dependencies);
  });

  describe('The add function', function() {
    it('should throw error if there is no worker name', function() {
      expect(() => { getModule().add({}); }).to.throw(Error, 'worker.name is required');
    });

    it('should throw error if there is no handler', function() {
      const worker = { name: 'foo' };

      expect(() => { getModule().add(worker); }).to.throw(Error, 'worker.handler is required');
    });

    it('should throw error if there is no handle funtion', function() {
      const worker = {
        name: 'foo',
        handler: {}
      };

      expect(() => { getModule().add(worker); }).to.throw(Error, 'worker.handler.handle must be a function');
    });

    it('should throw error if there is no getTitle function', function() {
      const worker = {
        name: 'foo',
        handler: { handle: () => {} }
      };

      expect(() => { getModule().add(worker); }).to.throw(Error, 'worker.handler.getTitle function is required');
    });

    it('should save the worker', function() {
      const module = getModule();
      const worker = {
        name: 'worker1',
        handler: {
          handle: () => {},
          getTitle: () => {}
        }
      };

      module.add(worker);
      expect(module.list()).to.deep.equal({ worker1: worker });
    });
  });

  describe('The get function', function() {
    it('should get the given worker', function() {
      const module = getModule();
      const worker1 = {
        name: 'importer',
        handler: {
          handle: () => {},
          getTitle: () => {}
        }
      };
      const worker2 = {
        name: 'foobbar',
        handler: {
          handle: () => {},
          getTitle: () => {}
        }
      };

      module.add(worker1);
      module.add(worker2);
      expect(module.get('importer')).to.deep.equal(worker1);
    });

    it('should not fail when calling with undefined', function() {
      expect(getModule().get()).to.not.exist;
    });

    it('should send back undefined when not found', function() {
      expect(getModule().get('foobar')).to.not.exist;
    });
  });
});
