var pkgcloud = require('../../../../../lib/pkgcloud'),
    base     = require('../../../core/compute'),
    urlJoin  = require('url-join'),
    image    = require('../image.js');

var _urlPrefix = 'v2/images';

/**
 * client.getImages
 *
 * @description get an array of images for the current account
 *
 * @param callback
 * @returns {*}
 */
exports.getImages = function getImages(options, callback) {
  var self = this;

  if (typeof options === 'function') {
    callback = options;
    options = {};
  }

  return this._request({
    path: _urlPrefix
  }, function (err, body) {
    if (err) {
      return callback(err);
    }
    if (!body || ! body.images) {
      return callback(new Error('Unexpected empty response'));
    }
    else {
      return callback(null, body.images);
    }
  });
};

/**
 * client.getImage
 *
 * @description get an image for the current account
 *
 * @param {String|object}     image     the image or imageId to get
 * @param callback
 * @returns {*}
 */
exports.getImage = function getImage(imageId, callback) {
  var self = this;

  return this._request({
    path: urlJoin(_urlPrefix, imageId)
  }, function (err, body) {
    if (err) {
      return callback(err);
    }
    if (!body) {
      return callback(new Error('Unexpected empty response'));
    }
    else {
      return callback(null, body);
    }
  });
};

/**
 * client.createImage
 *
 * @description create an image for a provided server
 *
 * @param {object}          options
 * @param {String|object}   options.server    the server or serverId to create the image from
 * @param {String}          options.name      the name of the new image
 * @param {object}          [options.metadata]  optional metadata about the new image
 * @param callback
 * @returns {*}
 */
exports.createImage = function createImage(options, callback) {
  var self = this;

  return this._request({
    path: _urlPrefix,
    method: 'POST',
    contentType: 'application/json',
    body: options
  }, function(err, body) {
    if (err) {
      return callback(err);
    }
    if (!body) {
      return callback(new Error('Unexpected empty response'));
    }
    else {
      return callback(null, body);
    }
  });
};
exports.updateImage = function updateImage(imageId, options, callback) {
  var self = this;
  return this._request({
    path: urlJoin(_urlPrefix, imageId),
    method: 'PATCH',
    contentType: 'application/openstack-images-v2.1-json-patch',
    body: options
  }, function(err, body) {
    if (err) {
      return callback(err);
    }
    if (!body) {
      return callback(new Error('Unexpected empty response'));
    }
    else {
      return callback(null, body);
    }
  });
};
/**
 * client.destroyImage
 *
 * @description delete the provided image
 *
 * @param {String|object}     image     the image or imageId to get
 * @param callback
 * @returns {*}
 */
exports.destroyImage = function destroyImage(image, callback) {
  var imageId = image instanceof base.Image ? image.id : image;
  return this._request({
      path: urlJoin(_urlPrefix, imageId),
      method: 'DELETE'
    },
    function (err) {
      return err
        ? callback(err)
        : callback(null, { ok: imageId });
  });
};

exports.importImageData = function importImageData(image, options, callback) {
  var imageId = image instanceof base.Image ? image.id : image;
  return this._request({
      path: urlJoin(_urlPrefix, imageId, 'import' ),
      method: 'POST',
      body: options
    },
    function (err) {
      return err
        ? callback(err)
        : callback(null);
  });
};
