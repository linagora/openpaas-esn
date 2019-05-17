'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The esnFileBrowserController', function() {
  var $controller, $rootScope, $scope, $log;
  var folderData = [
    {
      name: 'folder1',
      icon: 'mdi-folder',
      isSelectable: false
    }, {
      name: 'file1',
      icon: 'mdi-file',
      isSelectable: true
    }, {
      name: 'file2',
      icon: 'mdi-file',
      isSelectable: true
    }
  ];

  beforeEach(function() {
    module('esn.file-browser');

    inject(function(_$controller_, _$rootScope_, _$log_) {
      $controller = _$controller_;
      $rootScope = _$rootScope_;
      $log = _$log_;
    });
  });

  function initController(bindings) {
    $scope = $rootScope.$new();

    var controller = $controller('esnFileBrowserController', { $scope: $scope }, bindings);

    $scope.$digest();

    return controller;
  }

  describe('The open fn', function() {
    it('should set currentNode then load it', function() {
      var bindings = {
        loadNode: function() {
          return $q.when(folderData);
        },
        options: {
          rootName: 'root'
        }
      };
      var filesBrowser = initController(bindings);
      var node = { name: 'example' };
      filesBrowser.$onInit();
      filesBrowser.open(node);

      $scope.$digest();

      expect(filesBrowser.childNodes).to.deep.equal(folderData);
      expect(filesBrowser.currentNode).to.equal(node);
      expect(filesBrowser.status).to.equal('loaded');
    });

    it('should push a new node to breadcrumbs', function() {
      var bindings = {
        loadNode: function() {
          return $q.when(folderData);
        }
      };
      var filesBrowser = initController(bindings);
      var newNode = { name: 'new node' };

      filesBrowser.$onInit();
      filesBrowser.open(newNode);
      $scope.$digest();

      expect(filesBrowser.breadcrumbs).to.deep.equal([newNode]);
    });

    it('should change status and reset childNodes list in case of error', function() {
      var bindings = {
        loadNode: function() { return $q.reject(new Error('Something happened')); }
      };
      var filesBrowser = initController(bindings);

      $log.error = sinon.spy();
      filesBrowser.$onInit();
      $scope.$digest();

      expect(filesBrowser.status).to.equal('error');
      expect(filesBrowser.selectedNodes).to.be.empty;
      expect(filesBrowser.childNodes).to.be.empty;
      expect($log.error).to.have.been.calledWith('Error while loading nodes', new Error('Something happened'));
    });
  });

  describe('The back fn', function() {
    it('should pop out the last breadcrumb then load the its parent node', function() {
      var bindings = {
        loadNode: sinon.spy(function(node) {
          return $q.when(node);
        })
      };
      var filesBrowser = initController(bindings);
      var oldBreadcrumbs = [
        { name: 'folder1' },
        { name: 'folder2' }
      ];

      filesBrowser.$onInit();
      $scope.$digest();
      filesBrowser.breadcrumbs = oldBreadcrumbs;
      filesBrowser.back();
      $scope.$digest();

      expect(filesBrowser.breadcrumbs).to.have.lengthOf(1);
      expect(filesBrowser.breadcrumbs).to.include(oldBreadcrumbs[0]);
    });
  });

  describe('The toggleSelection fn', function() {
    it('should do nothing if node is not selectable', function() {
      var bindings = {
        loadNode: function() { return $q.when(folderData); },
        options: { multipleSelect: true }
      };
      var filesBrowser = initController(bindings);

      filesBrowser.$onInit();
      $scope.$digest();

      filesBrowser.toggleSelection(filesBrowser.childNodes[0]);

      expect(filesBrowser.selectedNodes).to.be.empty;
      expect(filesBrowser.childNodes[0].selected).to.be.undefined;
    });

    it('should add node to the selected nodes in case of multiple selection is enabled', function() {
      var bindings = {
        loadNode: function() { return $q.when(folderData); },
        options: { multipleSelect: true }
      };
      var filesBrowser = initController(bindings);

      filesBrowser.$onInit();
      $scope.$digest();

      filesBrowser.childNodes[0].selected = false;
      filesBrowser.childNodes[1].selected = false;
      filesBrowser.childNodes[2].selected = true;

      filesBrowser.toggleSelection(filesBrowser.childNodes[1]);

      expect(filesBrowser.selectedNodes).to.have.lengthOf(2);
      expect(filesBrowser.childNodes[1].selected).to.be.true;
      expect(filesBrowser.selectedNodes).to.include(folderData[1]);
      expect(filesBrowser.selectedNodes).to.include(folderData[2]);
    });

    it('should unselect previous selected nodes and update selected nodes list in case of multiple select is disabled', function() {
      var bindings = {
        loadNode: function() { return $q.when(folderData); },
        options: { multipleSelect: false }
      };
      var filesBrowser = initController(bindings);

      filesBrowser.$onInit();
      $scope.$digest();

      filesBrowser.childNodes[1].selected = false;
      filesBrowser.childNodes[2].selected = true;

      filesBrowser.toggleSelection(filesBrowser.childNodes[1]);

      expect(filesBrowser.childNodes[1].selected).to.be.true;
      expect(filesBrowser.childNodes[2].selected).to.be.false;
      expect(filesBrowser.selectedNodes).to.have.lengthOf(1);
    });
  });

  describe('The sortBy function', function() {
    it('should change the sorting criterias and first criteria should always be isFolder', function() {
      var bindings = {
        loadNode: function() { return $q.when(folderData); },
        options: { multipleSelect: false }
      };
      var filesBrowser = initController(bindings);

      filesBrowser.propertyName = null;

      filesBrowser.sortBy('modificationDate');

      expect(filesBrowser.criterias).to.deep.equal(['isFolder', 'modificationDate']);
    });

    it('should reverse the second criteria when it is called multiple time with the same property name', function() {
      var bindings = {
        loadNode: function() { return $q.when(folderData); },
        options: { multipleSelect: false }
      };
      var filesBrowser = initController(bindings);

      filesBrowser.sortBy('modificationDate');

      expect(filesBrowser.criterias).to.deep.equal(['isFolder', 'modificationDate']);

      filesBrowser.sortBy('modificationDate');

      expect(filesBrowser.criterias).to.deep.equal(['isFolder', '-modificationDate']);
    });
  });
});
