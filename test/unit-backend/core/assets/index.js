'use strict';

const expect = require('chai').expect;
const Path = require('path');
const fs = require('fs');
const mockery = require('mockery');

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

  it('should bundle less, css, js, jsApp, and angular asset types', function() {
    const allTypes = getModule().getAllTypes();

    expect(allTypes).to.have.property('css');
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

  describe('envAwareApp() method', function() {
    it('should return an object having a type() method', function() {
      const appAsset = getModule().envAwareApp('testApp');

      expect(appAsset).to.respondTo('type');
    });

    describe('type() method', function() {
      it('should throw if the type is not registered', function() {
        const appAsset = getModule().envAwareApp('testApp');

        function test() {
          appAsset.type('unknownType');
        }
        expect(test).to.throw();
      });

      it('should return an AssetCollection', function() {
        const assetCollection = getModule().envAwareApp('testApp').type('angular');

        expect(assetCollection).to.respondTo('all');
        expect(assetCollection).to.respondTo('allNames');
        expect(assetCollection).to.respondTo('add');
      });

      it('should return an AssetCollectionTransformer when the type is jsApp', function() {
        const assetCollection = getModule().envAwareApp('testApp').type('jsApp');

        expect(assetCollection).to.respondTo('all');
        expect(assetCollection).to.respondTo('getKnownNamespaces');
        expect(assetCollection).to.respondTo('getBaseAssets');
        expect(assetCollection).to.respondTo('getAssetsForInjection');
      });

      it('should return an AssetCollectionTransformer when the type is js', function() {
        const assetCollection = getModule().envAwareApp('testApp').type('js');

        expect(assetCollection).to.respondTo('all');
        expect(assetCollection).to.respondTo('getKnownNamespaces');
        expect(assetCollection).to.respondTo('getBaseAssets');
        expect(assetCollection).to.respondTo('getAssetsForInjection');
      });
    });
  });

  describe('assetCollection', function() {
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

  describe('AssetCollectionTransformer', function() {
    let assetCollectionTransformer;

    beforeEach(function() {
      const testApp = getModule().app('testApp');
      const assetCollection = testApp.type('jsApp');
      const fullPathAssetCollection = testApp.type('jsAppFullPath');

      assetCollectionTransformer = getModule().envAwareApp('testApp').type('jsApp');

      assetCollection.add([
        {name: '11.js', namespace: 'm1'},
        {name: '12.js', namespace: 'm1'},
        {name: '21.js', namespace: 'm2'},
        {name: '22.js', namespace: 'm2'},
        {name: '31.js', namespace: 'm3'}
      ]);

      fullPathAssetCollection.add([
        {name: '/11.js', namespace: 'm1'},
        {name: '/12.js', namespace: 'm1'},
        {name: '/31.js', namespace: 'm3'}
      ]);
    });

    describe('getKnownNamespaces() method', function() {
      it('should return namespaces of the reference collection, and of the shadow collection', function() {
        expect(assetCollectionTransformer.getKnownNamespaces()).to.deep.equal({
          base: ['m1', 'm2', 'm3'],
          shadow: ['m1', 'm3']
        });
      });
    });

    describe('getBaseAssets(true) method', function() {
      it('should return the assets of the namespaces known on base and unknown on shadow', function() {
        expect(assetCollectionTransformer.getBaseAssets(true)).to.deep.equal([
          {
            name: '21.js',
            namespace: 'm2',
            priority: 0
          },
          {
            name: '22.js',
            namespace: 'm2',
            priority: 0
          }
        ]);
      });
    });

    describe('getAssetsForInjection() method', function() {
      describe('in production mode', function() {
        let origNodeEnv;
        beforeEach(function() {
          origNodeEnv = process.env.NODE_ENV;
          process.env.NODE_ENV = 'production';
        });

        afterEach(function() {
          process.env.NODE_ENV = origNodeEnv;
        });

        it('should return shadow namespace webservice link, and base assets', function() {

          expect(assetCollectionTransformer.getAssetsForInjection()).to.deep.equal([
            {
              name: '21.js',
              namespace: 'm2',
              priority: 0
            },
            {
              name: '22.js',
              namespace: 'm2',
              priority: 0
            },
            {
              name: 'm1',
              namespace: 'generated/jsApp/testApp',
              priority: 0
            },
            {
              name: 'm3',
              namespace: 'generated/jsApp/testApp',
              priority: 0
            }
          ]);
        });
      });

      describe('in !production mode', function() {
        let origNodeEnv;
        beforeEach(function() {
          origNodeEnv = process.env.NODE_ENV;
          process.env.NODE_ENV = 'test';
        });

        afterEach(function() {
          process.env.NODE_ENV = origNodeEnv;
        });

        it('should return base assets', function() {

          expect(assetCollectionTransformer.getAssetsForInjection()).to.deep.equal([
            {
              name: '11.js',
              namespace: 'm1',
              priority: 0
            },
            {
              name: '12.js',
              namespace: 'm1',
              priority: 0
            },
            {
              name: '21.js',
              namespace: 'm2',
              priority: 0
            },
            {
              name: '22.js',
              namespace: 'm2',
              priority: 0
            },
            {
              name: '31.js',
              namespace: 'm3',
              priority: 0
            }
          ]);
        });
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

  describe('prepareJsFiles() method', function() {
    const fixtureFiles = [];
    const fixtureContents = [];
    let ngAnnotateMock;

    beforeEach(function() {
      [Path.join(this.testEnv.fixtures, 'assets/f1.js.asset'), Path.join(this.testEnv.fixtures, 'assets/f2.js.asset')]
      .forEach(file => {
        fixtureFiles.push(file);
        fixtureContents.push(fs.readFileSync(file, 'utf8'));
      });

      ngAnnotateMock = function(code) {
        return {
          src: `annotated${code}`
        };
      };

      mockery.registerMock('ng-annotate/ng-annotate-main', ngAnnotateMock);

      const testApp = getModule().app('testApp');
      const assetCollection = testApp.type('jsApp');
      const fullPathAssetCollection = testApp.type('jsAppFullPath');

      assetCollection.add([
        {name: '11.js', namespace: 'm1'},
        {name: '12.js', namespace: 'm1'},
        {name: 'f1.js', namespace: 'm2'},
        {name: 'f2.js', namespace: 'm2'},
        {name: '31.js', namespace: 'm3'}
      ]);

      fullPathAssetCollection.add([
        {name: fixtureFiles[0], namespace: 'm2'},
        {name: fixtureFiles[1], namespace: 'm2'}
      ]);
    });

    it('should return nothing when the namespace is not known', function(done) {
      getModule().prepareJsFiles('jsApp', 'testApp', 'm1').then(code => {
        expect(code).to.deep.equal('');
        done();
      }, done);
    });

    it('should return concatenated annotated files', function(done) {
      getModule().prepareJsFiles('jsApp', 'testApp', 'm2').then(code => {
        expect(code).to.deep.equal('annotatedwindow.f1 = true;\nannotatedwindow.f2 = true;\n');
        done();
      }, done).done();
    });
  });
});
