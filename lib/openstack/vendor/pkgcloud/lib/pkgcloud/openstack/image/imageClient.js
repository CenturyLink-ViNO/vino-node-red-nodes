
var urlJoin = require('url-join');

var Client = exports.ImageClient = function () {
  this.serviceType = 'image';
};

/**
 * client._getUrl
 *
 * @description get the url for the current image service
 *
 * @param options
 * @returns {exports|*}
 * @private
 */
Client.prototype._getUrl = function (options) {
  options = options || {};

  if (!this._serviceUrl) {
    throw new Error('Service url not found');
  }

  return urlJoin(this._serviceUrl,
    typeof options === 'string'
      ? options
      : options.path);

};

