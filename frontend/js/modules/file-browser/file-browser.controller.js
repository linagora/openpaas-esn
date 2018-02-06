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

    self.open = open;
    self.back = back;
    self.onSelectionChangeOf = onSelectionChangeOf;
    self.$onInit = $onInit;

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

    function onSelectionChangeOf(node) {
      if (self.options.multipleSelect) {
        self.selectedNodes = _.filter(self.childNodes, _.property('selected'));

        return;
      }

      _unselectOthers(node);
      self.selectedNodes = [node];
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
