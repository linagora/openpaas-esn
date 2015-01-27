'use strict';

function UserMember(object) {
  this._id = object._id;
  this.emails = object.emails;
  this.firstname = object.firstname;
  this.lastname = object.lastname;
  this.job_title = object.job_title;
  this.service = object.service;
  this.building_location = object.building_location;
  this.office_location = object.office_location;
  this.main_phone = object.main_phone;
  this.domains = object.domains;
  this.currentAvatar = object.currentAvatar;
}
module.exports.UserMember = UserMember;

var adapters = {
  user: UserMember
};

function memberAdapter(objectType) {
  return adapters[objectType];
}
module.exports.memberAdapter = memberAdapter;
