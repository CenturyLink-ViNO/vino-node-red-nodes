exports.Client = require('./client').Client;
exports.Image  = require('./image').Image;


exports.createClient = function (options) {
  return new exports.Client(options);
};
