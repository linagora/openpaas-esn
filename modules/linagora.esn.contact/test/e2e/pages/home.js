'use strict';

module.exports = function() {

  this.menuButton = element(by.css('#header .application-menu-toggler'));
  this.contactButton = element(by.css('#header .application-menu a[href="/#/contact"]'));
  this.clickOnModuleInMenu = function() {
    return this.menuButton.click().then(this.contactButton.click);
  }.bind(this);

};
