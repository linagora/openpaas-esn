'use strict';

module.exports = function() {

  this.container = element(by.css('div[data-notify="container"]'));
  this.containers = element.all(by.css('div[data-notify="container"]'));
  this.message = this.container.element(by.css('span[data-notify="message"]'));
  this.messages = element.all(by.css('span[data-notify="message"]'));
  this.actionLink = this.container.element(by.css('a[data-notify="url"]'));
  this.dismiss = this.container.element(by.css('a[data-notify="dismiss"]'));

};
