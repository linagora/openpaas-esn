'use strict';

const expect = require('chai').expect;

describe('The assets module', function() {
  let helpers;

  beforeEach(function() {
    helpers = this.helpers;
  });

  function getModule() {
    return helpers.requireBackend('core/assets');
  }

  describe('registerType method', function() {
    it('should throw if registering a type that already exists', function() {
      function testfn() {
        const mod = getModule();

        mod.registerType('js', {});
      }

      expect(testfn).to.throw();
    });

    it('should register the new method, with optional parameters', function() {
      const mod = getModule();

      mod.registerType('test', {some: true});
      expect(mod.getType('test')).to.deep.equal({some: true});
    });
  });

  it('should bundle less, js, jsApp, and angular asset types', function() {
    const allTypes = getModule().getAllTypes();

    expect(allTypes).to.have.property('js');
    expect(allTypes).to.have.property('jsApp');
    expect(allTypes).to.have.property('less');
    expect(allTypes).to.have.property('angular');
  });

  describe('app() method', function() {
    it('should return an object having a type() method', function() {
      const appAsset = getModule().app('testApp');

      expect(appAsset).to.respondTo('type');
    });

    describe('type() method', function() {
      it('should throw if the type is not registered', function() {
        const appAsset = getModule().app('testApp');

        function test() {
          appAsset.type('unknownType');
        }
        expect(test).to.throw();
      });

      it('should return an AssetCollection', function() {
        const assetCollection = getModule().app('testApp').type('js');

        expect(assetCollection).to.respondTo('all');
        expect(assetCollection).to.respondTo('allNames');
        expect(assetCollection).to.respondTo('add');
      });
    });
  });

  describe.only('assetCollection', function() {
    let assetCollection;

    beforeEach(function() {
      assetCollection = getModule().app('testApp').type('js');
    });

    it('should allow declaring assets, giving a name and a namespace', function() {
      assetCollection.add('some/file.js', 'module');

      expect(assetCollection.all()).to.deep.equal([{name: 'some/file.js', namespace: 'module', priority: 0}]);
    });

    it('should allow declaring assets, giving an array of names and a namespace', function() {
      assetCollection.add(['some/file.js', 'some/file2.js'], 'module');

      expect(assetCollection.all()).to.deep.equal([{name: 'some/file.js', namespace: 'module', priority: 0}, {name: 'some/file2.js', namespace: 'module', priority: 0}]);
    });

    it('should allow declaring assets, giving assets-like objects', function() {
      assetCollection.add([{name: 'some/file.js', namespace: 'module'}, {name: 'some/file2.js', namespace: 'module'}]);

      expect(assetCollection.all()).to.deep.equal([{name: 'some/file.js', namespace: 'module', priority: 0}, {name: 'some/file2.js', namespace: 'module', priority: 0}]);
    });

    describe('namespaces() method', function() {
      it('should return an empty array, if no assets are declared', function() {
        expect(assetCollection.namespaces()).to.be.an('array');
        expect(assetCollection.namespaces()).to.have.length(0);
      });

      it('should return all known namespaces', function() {
       assetCollection.add(['some/file.js', 'some/file2.js'], 'module');
       assetCollection.add(['some/file3.js', 'some/file2.js'], 'module2');
       assetCollection.add('some/file4.js', 'module2');

       expect(assetCollection.namespaces()).to.deep.equal(['module', 'module2']);
      });
    });

    describe('all() method', function() {
      it('should return the assets, in an array', function() {
        assetCollection.add([{name: 'some/file.js', namespace: 'module'}, {name: 'some/file2.js', namespace: 'module2'}]);

        expect(assetCollection.all()).to.deep.equal([
          {name: 'some/file.js', namespace: 'module', priority: 0},
          {name: 'some/file2.js', namespace: 'module2', priority: 0}
        ]);
      });

      it('should return the assets of the specified namespaces', function() {
        assetCollection.add([
          {name: 'some/file.js', namespace: 'module'},
          {name: 'some/file3.js', namespace: 'module2'},
          {name: 'some/file4.js', namespace: 'module3'},
          {name: 'some/file2.js', namespace: 'module'}
        ]);

        expect(assetCollection.all(['module', 'module3'])).to.deep.equal([
          {name: 'some/file.js', namespace: 'module', priority: 0},
          {name: 'some/file4.js', namespace: 'module3', priority: 0},
          {name: 'some/file2.js', namespace: 'module', priority: 0}
        ]);
      });
    });

    describe('allNames() method', function() {
      it('should return the asset names only, in an array', function() {
        assetCollection.add([{name: 'some/file.js', namespace: 'module'}, {name: 'some/file2.js', namespace: 'module'}]);

        expect(assetCollection.allNames()).to.deep.equal(['some/file.js', 'some/file2.js']);
      });

      it('should return the asset names of the specified namespaces', function() {
        assetCollection.add([
          {name: 'some/file.js', namespace: 'module'},
          {name: 'some/file3.js', namespace: 'module2'},
          {name: 'some/file4.js', namespace: 'module3'},
          {name: 'some/file2.js', namespace: 'module'}
        ]);

        expect(assetCollection.allNames(['module', 'module3'])).to.deep.equal(['some/file.js', 'some/file4.js', 'some/file2.js']);
      });
    });
  });

  describe('asset types options', function() {
    describe('sort', function() {
      it('should return the assets, sorted by priority', function() {
        const mod = getModule();

        mod.registerType('testSorted', {sort: true});

        const assetCollection = mod.app('test').type('testSorted');

        assetCollection.add([
          {name: 'zz1', namespace: 'module', priority: -1},
          {name: 'zz2', namespace: 'module', priority: -2},
          {name: 'zz3', namespace: 'module', priority: 1}
        ]);

        expect(assetCollection.allNames()).to.deep.equal(['zz3', 'zz1', 'zz2']);
      });
    });

    describe('dedup', function() {
      it('should return the assets, removing duplicated names', function() {
        const mod = getModule();

        mod.registerType('testDedup', {dedup: true});

        const assetCollection = mod.app('test').type('testDedup');

        assetCollection.add([
          {name: 'zz1', namespace: 'module'},
          {name: 'zz2', namespace: 'module'},
          {name: 'zz1', namespace: 'module'},
          {name: 'zz3', namespace: 'module'},
          {name: 'zz2', namespace: 'module'}
        ]);

        expect(assetCollection.allNames()).to.deep.equal(['zz1', 'zz2', 'zz3']);
      });
    });
  });
});
