'use strict';

const q = require('q');

const transformers = [];

module.exports = () => {
  return {
    addTransformer,
    transform
  };

  /////

  function addTransformer(transformer) {
    transformers.push(transformer);
  }

  function transform(user) {
    return config => q.all(transformers.map(transformer => transformer.transform(config, user))).then(() => config);
  }
};
