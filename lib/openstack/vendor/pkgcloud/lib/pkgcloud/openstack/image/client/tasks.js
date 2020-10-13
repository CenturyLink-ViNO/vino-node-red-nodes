var pkgcloud = require('../../../../../lib/pkgcloud'),
    base     = require('../../../core/compute'),
    urlJoin  = require('url-join'),
    task    = require('../task.js');

var _urlPrefix = 'v2/tasks';

/**
 * client.getImages
 *
 * @description get an array of images for the current account
 *
 * @param callback
 * @returns {*}
 */
exports.getTasks = function getTasks(options, callback) {
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
    if (!body || ! body.tasks) {
      return callback(new Error('Unexpected empty response'));
    }
    else {
      return callback(null, body.tasks.map(function (result) {
        return new task.Task(self, result);
      }));
    }
  });
};

/**
 * client.getTask
 *
 * @description get a task
 *
 * @param {String|object}     taskId     taskId to get
 * @param callback
 * @returns {*}
 */
exports.getTask = function getTask(taskId, callback) {
  var self    = this;

  return this._request({
    path: urlJoin(_urlPrefix, taskId)
  }, function (err, body) {
    if (err) {
      return callback(err);
    }
    if (!body) {
      return callback(new Error('Unexpected empty response'));
    }
    else {
      return callback(null, new task.Task(self, body));
    }
  });
};

/**
 * client.createTask
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
exports.createTask = function createTask(options, callback) {
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
      return callback(null, new task.Task(self, body));
    }
  });
};