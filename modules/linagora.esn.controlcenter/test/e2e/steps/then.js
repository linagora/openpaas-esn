'use strict';

var SidebarPage = require('../pages/sidebar');
var sidebarPage = new SidebarPage();

module.exports = function() {

  this.Then('I see the control center sidebar', function() {
    return this.expect(sidebarPage.sidebar.isDisplayed()).to.eventually.equal(true);
  });

  this.Then('I do not see the control center sidebar', function() {
    return this.expect(sidebarPage.sidebar.isDisplayed()).to.eventually.equal(false);
  });

};
