var urlJoin = require('url-join');

var _extension = 'os-server-groups';

/**
 * client.getServerGroup
 *
 * @description List server groups for the current compute client
 *
 * @param {Function}    groupId     The ID of the server group to get
 * @param {Function}    callback    f(err, groups) where groups is an array of server groups
 * @returns {*}
 */
exports.getServerGroup = function getServerGroup(groupId, callback) {
  return this._request({
    path: urlJoin(_extension, groupId)
  }, function (err, body, res) {
    return err
      ? callback(err)
      : callback(null, body['server_group'], res);
  });
};
/**
 * client.getServerGroups
 *
 * @description List server groups for the current compute client
 *
 * @param {Function}    callback    f(err, groups) where groups is an array of server groups
 * @returns {*}
 */
exports.getServerGroups = function getServerGroups(options, callback) {

  if (typeof options === 'function') {
    callback = options;
    options = {};
  }

  return this._request({
    path: _extension
  }, function (err, body, res) {
    return err
      ? callback(err)
      : callback(null, body['server_groups'], res);
  });
};

/**
 * client.createServerGroup
 *
 * @description Create a new server group
 *
 * @param {object|String}   options         The object for the new server group
 * @param callback
 * @returns {*}
 */
exports.createServerGroup = function createServerGroup(options, callback) {
  var self = this;

  this.getVersion(function(err, version, details)
  {
    if (err)
    {
        return callback(err);
    }
    const actualVersion = details.version;
    let requestOptions;

    // Prior to Nova API v2.64, policy had to be wrapped in an array and rules dictionary was not accepted.
    if (actualVersion > '2.63')
    {
        requestOptions = options;
    }
    else
    {
        requestOptions = {
            name: options.name,
            policies: [options.policy]
        };
    }

    return self._request({
      method: 'POST',
      path: _extension,
      body: {
        server_group: requestOptions
      }
    }, function (err, body) {
      return err
        ? callback(err)
        : callback(null, body['server_group']);
    });
  });
};

/**
 * client.destroyServerGroup
 *
 * @description Delete a server group from the current account
 *
 * @param {String}    groupId    The ID of the server group to delete
 * @param {Function}  callback
 * @returns {*}
 */
exports.destroyServerGroup = function destroyServerGroup(groupId, callback) {
  return this._request({
    method: 'DELETE',
    path: urlJoin(_extension, groupId)
  }, function (err) {
    return callback(err);
  });
};

