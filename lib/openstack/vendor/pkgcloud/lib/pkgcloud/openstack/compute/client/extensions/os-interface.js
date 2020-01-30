var Server = require('../../server').Server,
   urlJoin = require('url-join');

var _urlPrefix = '/servers',
   _extension = 'os-interface';

/**
 * client.getInterfaceAttachments
 *
 * @description Get the attached interfaces for a server
 *
 * @param {object|String}   server    The server or serverId to get interfaces for
 * @param {function}        callback
 * @returns {*}
 */
exports.getInterfaceAttachments = function(server, callback) {
   var serverId = server instanceof Server ? server.id : server;

   return this._request({
      path: urlJoin(_urlPrefix, serverId, _extension)
   }, function (err, body, res) {
      return err
         ? callback(err)
         : callback(null, body.interfaceAttachments, res);
   });
};

/**
 * client.getInterfaceAttachmentDetails
 *
 * @description Get the details of an attached interface from a server
 *
 * @param {object|String}   server    The server or serverId for the volume
 * @param {object|String}   interface The interface or interfaceId to get details for
 * @param {function}        callback
 * @returns {*}
 */
exports.getInterfaceAttachmentDetails = function (server, attachment, callback) {
   var serverId = server instanceof Server ? server.id : server,
      attachmentId = (typeof attachment === 'object') ? attachment.id : attachment;

   return this._request({
      path: urlJoin(_urlPrefix, serverId, _extension, attachmentId)
   }, function (err, body, res) {
      return err
         ? callback(err)
         : callback(null, body.interfaceAttachment, res);
   });
};

/**
 * client.detachInterface
 *
 * @description Detaches the provided interface id from the provided server id
 *
 * @param {object|String}   server    The server or serverId to detach the volume to
 * @param {object|String}   volume    The interface or interfaceId to detach from the server
 * @param {function}        callback
 * @returns {*}
 */
exports.detachInterface = function(server, attachment, callback) {
   var serverId = server instanceof Server ? server.id : server,
      attachmentId = (typeof attachment === 'object') ? attachment.id : attachment;

   return this._request({
      path: urlJoin(_urlPrefix, serverId, _extension, attachmentId),
      method: 'DELETE'
   }, function (err) {
      return callback(err);
   });
};

/**
 * client.attachInterface
 *
 * @description Attaches the provided port id or network id to the provided server id
 *
 * @param {object|String}   server    The server or serverId to attach the volume to
 * @param {object}          interface The interface to attach to the server
 * @param {function}        callback
 * @returns {*}
 */
exports.attachInterface = function (server, interface, callback) {
   var serverId = server instanceof Server ? server.id : server;

   return this._request({
      path: urlJoin(_urlPrefix, serverId, _extension),
      body: {
         'interfaceAttachment': interface
      },
      method: 'POST'
   }, function (err, body) {
      return err
         ? callback(err)
         : callback(null, body.interfaceAttachment);
   });
};