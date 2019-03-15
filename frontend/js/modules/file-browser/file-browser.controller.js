(function(angular) {
  'use strict';

  angular.module('esn.file-browser')
    .controller('esnFileBrowserController', esnFileBrowserController);

  function esnFileBrowserController(_, $log) {
    var self = this;
    var DEFAULT_BROWSER_OPTIONS = {
      multipleSelect: false,
      rootName: ''
    };

    self.$onInit = $onInit;
    self.open = open;
    self.back = back;
    self.criterias = ['isFolder', 'name'];
    self.sortingProperty = 'name';
    self.sortBy = sortBy;
    self.toggleSelection = toggleSelection;

    function $onInit() {
      self.options = _.extend({}, DEFAULT_BROWSER_OPTIONS, self.options);
      self.breadcrumbs = [];

      _loadRoot();
    }

    function open(node) {
      self.currentNode = node;
      self.breadcrumbs.push(node);

      return _loadCurrentNode();
    }

    function back() {
      self.breadcrumbs.pop();
      self.currentNode = _.last(self.breadcrumbs);

      if (!self.currentNode) {
        return _loadRoot();
      }

      return _loadCurrentNode();
    }

    function toggleSelection(node) {
      if (!node.isSelectable) {
        return;
      }

      node.selected = !node.selected;

      if (node.selected && !self.options.multipleSelect) {
        _unselectOthers(node);
      }

      self.selectedNodes = _.filter(self.childNodes, _.property('selected'));
    }

    function sortBy(sortingProperty) {
      self.criterias = ['isFolder']; //always displays FOLDER type first
      self.reverse = self.sortingProperty === sortingProperty && !self.reverse;
      self.sortingProperty = sortingProperty;

      var secondCriteria = self.reverse ? ['-', sortingProperty].join('') : sortingProperty;

      self.criterias.push(secondCriteria);
    }

    function _loadRoot() {
      self.currentNode = null;

      _loadCurrentNode();
    }

    function _loadCurrentNode() {
      self.status = 'loading';

      return self.loadNode(self.currentNode)
        .then(function(data) {
          self.status = 'loaded';
          self.childNodes = data;
        })
        .catch(function(error) {
          self.status = 'error';
          self.childNodes = [];
          $log.error('Error while loading nodes', error);
        });
    }

    function _unselectOthers(node) {
      self.childNodes.forEach(function(child, index) {
        if (child !== node) {
          self.childNodes[index].selected = false;
        }
      });
    }
  }
})(angular);
