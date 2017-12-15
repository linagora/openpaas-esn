'use strict';

const expect = require('chai').expect;

describe('The core/esn-config/metadata/businessHours module', () => {
  let getModule;

  beforeEach(function() {
    getModule = () => this.helpers.requireBackend('core/esn-config/metadata/businessHours');

  });

  describe('The validator fn', () => {
    let validator;

    beforeEach(function() {
      validator = getModule().validator;
    });

    it('should return error message when config is not an array', () => {
      const config = {};

      expect(validator(config)).to.equal('should be array');
    });

    it('should return error message when array is empty', () => {
      const config = [];

      expect(validator(config)).to.equal('should NOT have less than 1 items');
    });

    it('should return error message when array has more than 1 item', () => {
      const config = [{}, {}];

      expect(validator(config)).to.equal('should NOT have more than 1 items');
    });

    it('should return error message when config does not contain required attributes', () => {
      const config = [{}];

      expect(validator(config)).to.equal('[0]: should have required property \'start\'');
    });

    it('should return error message when start time is not in required format', () => {
      const config = [{
        start: '09:00:30',
        end: '18:00',
        daysOfWeek: []
      }];

      expect(validator(config)).to.equal('start must be in time format: H:m');
    });

    it('should return error message when end time is not in required format', () => {
      const config = [{
        start: '09:00',
        end: '24:42',
        daysOfWeek: []
      }];

      expect(validator(config)).to.equal('end must be in time format: H:m');
    });

    it('should return error message when start time is after end time', () => {
      const config = [{
        start: '19:00',
        end: '18:00',
        daysOfWeek: []
      }];

      expect(validator(config)).to.equal('start time must be before the end time');
    });

    it('should return error message when start time is equal end time', () => {
      const config = [{
        start: '18:00',
        end: '18:00',
        daysOfWeek: []
      }];

      expect(validator(config)).to.equal('start time must be before the end time');
    });

    it('should return error message when daysOfWeek is invalid', () => {
      const config = [{
        start: '9:00',
        end: '18:00',
        daysOfWeek: [1, 2, 8, 9]
      }];

      expect(validator(config)).to.equal('[0].daysOfWeek[2]: should be <= 6');
    });

    it('should return nothing when everything is alright', () => {
      const config = [{
        start: '9:00',
        end: '18:00',
        daysOfWeek: [1, 2, 6, 5]
      }];

      expect(validator(config)).to.not.exist;
    });

    it('should remove additional attributes and return nothing when everything is alright', () => {
      const config = [{
        start: '09:00',
        end: '18:00',
        daysOfWeek: [],
        other: 'value'
      }];

      expect(validator(config)).to.not.exist;
      expect(config[0].other).to.not.exist;
    });
  });
});
