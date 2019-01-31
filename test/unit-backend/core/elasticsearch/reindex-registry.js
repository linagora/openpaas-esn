const { expect } = require('chai');

describe('The ES reindex registry module', function() {
  let getModule;

  beforeEach(function() {
    getModule = () => this.helpers.requireBackend('core/elasticsearch/reindex-registry');
  });

  describe('The register function', function() {
    it('should do nothing if resource type is taken', function() {
      const type = 'foo';
      const data = {
        name: '123',
        buildReindexOptionsFunction: () => {}
      };

      getModule().register(type, data);

      getModule().register(type, {
        name: '345',
        buildReindexOptionsFunction: () => {}
      });

      expect(getModule().getAll()[type]).to.shallowDeepEqual(data);
    });

    it('should do nothing if there is no index name', function() {
      const type = 'foo';

      getModule().register(type, {
        buildReindexOptionsFunction: () => {}
      });

      expect(getModule().getAll()[type]).to.be.undefined;
    });

    it('should do nothing if there is no buildReindexOptionsFunction', function() {
      const type = 'foo';

      getModule().register(type, {
        name: '345'
      });

      expect(getModule().getAll()[type]).to.be.undefined;
    });

    it('should register new resource type', function() {
      getModule().register('foo', {
        name: '123',
        buildReindexOptionsFunction: () => {}
      });

      getModule().register('bar', {
        name: '345',
        buildReindexOptionsFunction: () => {}
      });

      expect(getModule().getAll()).to.shallowDeepEqual({
        foo: {
          name: '123',
          buildReindexOptionsFunction: () => {}
        },
        bar: {
          name: '345',
          buildReindexOptionsFunction: () => {}
        }
      });
    });
  });
});
