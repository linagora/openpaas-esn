const { Model } = require('../../people');
const { denormalize } = require('../denormalize');
const { getDisplayName } = require('../utils');
const { getPath } = require('../avatar');
const { OBJECT_TYPE } = require('../constants');

module.exports = ({ source }) => {
  const denormalized = denormalize(source);

  const email = new Model.EmailAddress({ value: denormalized.preferredEmail, type: 'default' });
  const name = new Model.Name({ displayName: getDisplayName(source) });
  const photo = new Model.Photo({ url: getPath(source) });
  const phone = source.main_phone ? new Model.PhoneNumber({ value: source.main_phone }) : undefined;

  return Promise.resolve(
    new Model.Person({
      id: denormalized._id,
      objectType: OBJECT_TYPE,
      emailAddresses: [email],
      phoneNumbers: phone ? [phone] : [],
      names: [name],
      photos: [photo]
    })
  );
};
