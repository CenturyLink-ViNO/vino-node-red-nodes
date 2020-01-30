/*
 * trunks.js: Instance methods for working with trunks
 * for Openstack trunking
 *
 */

var urlJoin = require('url-join');

var trunksResourcePath = '/trunks';

// Declaring variables for helper functions defined later
var _convertTrunkToWireFormat;
var _convertTrunkToUpdateWireFormat;
var _convertTrunkSubPortsToWireFormat;

/**
 * client.getTrunks
 *
 * @description get the list of trunks for an account
 *
 * @param {object|Function}   options
 * @param {Function}          callback
 */
exports.getTrunks  = function (options, callback) {
  var self = this;

  if (typeof options === 'function') {
    callback = options;
    options = {};
  }

  var getPortOpts = {
    path: trunksResourcePath
  };

  this._request(getPortOpts, function (err, body) {
    if (err) {
      return callback(err);
    }
    else if (!body || !body.trunks || !(body.trunks instanceof Array)) {
      return new Error('Malformed API Response');
    }

    return callback(err, body.trunks.map(function (trunk) {
      return new self.models.Trunk(self, trunk);
    }));
  });
};

/**
 * client.getTrunk
 *
 * @description get the details for a specific trunk
 *
 * @param {String|object}     trunk     the trunk or trunkId
 * @param callback
 */
exports.getTrunk = function (trunk, callback) {
  var self = this,
    trunkId = trunk instanceof this.models.Trunk ? trunk.id : trunk;
  self.emit('log::trace', 'Getting details for trunk', trunkId);
  this._request({
    path: urlJoin(trunksResourcePath, trunkId),
    method: 'GET'
  }, function (err, body) {
    if (err) {
      return callback(err);
    }

    if (!body ||!body.trunk) {
      return new Error('Malformed API Response');
    }

    callback(err, new self.models.Trunk(self, body.trunk));
  });
};

/**
 * client.createTrunk
 *
 * @description create a new trunk
 *
 * @param {object}    options
 * @param {String}    options.name      the name of the new trunk
 * @param callback
 */
exports.createTrunk = function (options, callback) {
  let self = this;
  let trunk = typeof options === 'object' ? options : { 'name' : options};

  trunk = _convertTrunkToWireFormat(trunk);

  let createTrunkOpts = {
    method: 'POST',
    path: trunksResourcePath,
    body: { 'trunk' : trunk }
  };

  self.emit('log::trace', 'Creating trunk', trunk);
  this._request(createTrunkOpts, function (err,body) {
    return err
      ? callback(err)
      : callback(err, new self.models.Trunk(self, body.trunk));
  });
};

/**
 * client.updateTrunk
 *
 * @description update an existing trunk
 *
 * @param {object}    options
 * @param callback
 */
exports.updateTrunk = function (trunk, callback) {
  let self = this;
  let trunkId = trunk.id;

  trunk  = _convertTrunkToUpdateWireFormat(trunk);
  var updateTrunkOpts = {
    method: 'PUT',
    path: urlJoin(trunksResourcePath, trunkId),
    contentType: 'application/json',
    body: { 'trunk' : trunk}
  };

  self.emit('log::trace', 'Updating trunk', trunk);
  this._request(updateTrunkOpts, function (err,body) {
    return err
      ? callback(err)
      : callback(err, new self.models.Trunk(self, body.trunk));
  });
};

/**
 * client.destroyTrunk
 *
 * @description Delete a specific trunk
 *
 * @param {String|object}     trunk     the trunk or trunk ID
 * @param callback
 */
exports.destroyTrunk = function (trunk, callback) {
  let self = this;
  let trunkId = trunk instanceof this.models.Trunk ? trunk.id : trunk;
  self.emit('log::trace', 'Deleting trunk', trunkId);
  this._request({
    path: urlJoin(trunksResourcePath, trunkId),
    method: 'DELETE'
  }, function (err) {
    if (err) {
      return callback(err);
    }
    callback(err, trunkId);
  });
};

/**
 * client.addSubports
 *
 * @description Add a subport to a specific trunk
 *
 * @param {String|object}     trunk     the trunk or trunk ID
 * @param callback
 */
exports.addSubports = function (trunk, callback) {
    let self = this;
    let trunkId = trunk.id;

    subPorts  = _convertTrunkSubPortsToWireFormat(trunk);
    var updateTrunkOpts = {
        method: 'PUT',
        path: urlJoin(urlJoin(trunksResourcePath, trunkId), 'add_subports'),
        contentType: 'application/json',
        body: subPorts
    };

    self.emit('log::trace', 'Adding sub ports to trunk', trunk);
    this._request(updateTrunkOpts, function (err,body) {
        return err
            ? callback(err)
            : callback(err, new self.models.Trunk(self, body));
    });
};

/**
 * client.removeSubports
 *
 * @description Remove a subport from a specific trunk
 *
 * @param {String|object}     trunk     the trunk or trunk ID
 * @param callback
 */
exports.removeSubports = function (trunk, callback) {
    let self = this;
    let trunkId = trunk.id;

    subPorts  = _convertTrunkSubPortsToWireFormat(trunk);
    var deleteTrunkOpts = {
        method: 'PUT',
        path: urlJoin(urlJoin(trunksResourcePath, trunkId), 'remove_subports'),
        contentType: 'application/json',
        body: subPorts
    };

    self.emit('log::trace', 'Removing sub ports from trunk', trunk);
    this._request(deleteTrunkOpts, function (err,body) {
        return err
            ? callback(err)
            : callback(err, new self.models.Trunk(self, body.trunk));
    });
};

/**
 * client.getSubports
 *
 * @description Get the subports from a specific trunk
 *
 * @param {String|object}     trunk     the trunk or trunk ID
 * @param callback
 */
exports.getSubports = function (trunk, callback) {
    let self = this;
    let trunkId = trunk;

    var getTrunkOpts = {
        method: 'GET',
        path: urlJoin(urlJoin(trunksResourcePath, trunkId), 'get_subports')
    };

    self.emit('log::trace', 'Getting sub ports from trunk', trunk);
    this._request(getTrunkOpts, function (err, body) {
        return err
            ? callback(err)
            : callback(err, new self.models.Trunk(self, body));
    });
};

/**
 * _convertTrunkToWireFormat
 *
 * @description convert Trunk instance into its wire representation.
 *
 * @param {object}     details    the Trunk instance.
 */
_convertTrunkToWireFormat = function (details){
    var wireFormat = {};

    wireFormat.tenant_id = details.tenant_id || details.tenantId;
    wireFormat.project_id = details.project_id || details.projectId;
    wireFormat.port_id = details.port_id || details.portId;
    wireFormat.name = details.name;
    wireFormat.description = details.description;
    wireFormat.admin_state_up = details.admin_state_up || details.adminStateUp;
    wireFormat.sub_ports = details.sub_ports || details.subPorts;

    return wireFormat;
};

/**
 * _convertTrunkToWireFormat
 *
 * @description convert Trunk instance into its wire representation.
 *
 * @param {object}     details    the Trunk instance.
 */
_convertTrunkToUpdateWireFormat = function (details){
    var wireFormat = {};

    wireFormat.name = details.name;
    wireFormat.description = details.description;
    wireFormat.admin_state_up = details.admin_state_up || details.adminStateUp;

    return wireFormat;
};

/**
 * _convertSubPortToWireFormat
 *
 * @description convert SubPort instance into it's wire representation.
 *
 * @param {object}     details    the SubPort instance.
 */
_convertTrunkSubPortsToWireFormat = function (details){
    let wireFormat = {};

    wireFormat.sub_ports = details.sub_ports || details.subPorts || [];

    return wireFormat;
};
