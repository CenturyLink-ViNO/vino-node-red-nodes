/*
 * ports.js: Instance methods for working with ports
 * for Openstack porting
 *
  * (C) 2014 Hewlett-Packard Development Company, L.P.
 *
 */

var urlJoin = require('url-join');

var portsResourcePath = '/ports';

// Declaring variables for helper functions defined later
var _convertPortToWireFormat;

/**
 * client.getPorts
 *
 * @description get the list of ports for an account
 *
 * @param {object|Function}   options
 * @param {Function}          callback
 */
exports.getPorts  = function (options, callback) {
  var self = this;

  if (typeof options === 'function') {
    callback = options;
    options = {};
  }

  var getPortOpts = {
    path: portsResourcePath
  };

  this._request(getPortOpts, function (err, body) {
    if (err) {
      return callback(err);
    }
    else if (!body || !body.ports || !(body.ports instanceof Array)) {
      return new Error('Malformed API Response');
    }

    return callback(err, body.ports.map(function (port) {
      return new self.models.Port(self, port);
    }));
  });
};

/**
 * client.getPort
 *
 * @description get the details for a specific port
 *
 * @param {String|object}     port     the port or portId
 * @param callback
 */
exports.getPort = function (port, callback) {
  var self = this,
    portId = port instanceof this.models.Port ? port.id : port;
  self.emit('log::trace', 'Getting details for port', portId);
  this._request({
    path: urlJoin(portsResourcePath, portId),
    method: 'GET'
  }, function (err, body) {
    if (err) {
      return callback(err);
    }

    if (!body ||!body.port) {
      return new Error('Malformed API Response');
    }

    callback(err, new self.models.Port(self, body.port));
  });
};

/**
 * client.createPort
 *
 * @description create a new port
 *
 * @param {object}    options
 * @param {String}    options.name      the name of the new port
 * @param callback
 */
exports.createPort = function (options, callback) {
  var self = this,
    port = typeof options === 'object' ? options : { 'name' : options};

  port = _convertPortToWireFormat(port);

  var createPortOpts = {
    method: 'POST',
    path: portsResourcePath,
    body: { 'port' : port}
  };

  self.emit('log::trace', 'Creating port', port);
  this._request(createPortOpts, function (err,body) {
    return err
      ? callback(err)
      : callback(err, new self.models.Port(self, body.port));
  });
};

/**
 * client.updatePort
 *
 * @description update an existing port
 *
 * @param {object}    options
 * @param callback
 */
exports.updatePort = function (port, callback) {
  var self = this,
  portId = port.id;

  port = _convertPortToWireFormat(port);
  var updatePortOpts = {
    method: 'PUT',
    path: urlJoin(portsResourcePath, portId),
    contentType: 'application/json',
    body: { 'port' : port}
  };

  self.emit('log::trace', 'Updating port', port);
  this._request(updatePortOpts, function (err,body) {
    return err
      ? callback(err)
      : callback(err, new self.models.Port(self, body.port));
  });
};

/**
 * client.destroyPort
 *
 * @description Delete a specific port
 *
 * @param {String|object}     port     the port or port ID
 * @param callback
 */
exports.destroyPort = function (port, callback) {
  var self = this,
    portId = port instanceof this.models.Port ? port.id : port;
  self.emit('log::trace', 'Deleting port', portId);
  this._request({
    path: urlJoin(portsResourcePath,portId),
    method: 'DELETE'
  }, function (err) {
    if (err) {
      return callback(err);
    }
    callback(err, portId);
  });
};

/**
 * _convertPortToWireFormat
 *
 * @description convert Port instance into its wire representation.
 *
 * @param {object}     details    the Port instance.
 */
_convertPortToWireFormat = function (details)
{
   var wireFormat = {};

   wireFormat.status = details.status;
   if (details.name) wireFormat.name = details.name;
   if (details.hasOwnProperty('admin_state_up'))
   {
      wireFormat.admin_state_up = details.admin_state_up;
   }
   else if (details.hasOwnProperty('adminStateUp'))
   {
      wireFormat.admin_state_up = details.adminStateUp;
   }
   else
   {
      wireFormat.admin_state_up = true;
   }
   wireFormat.tenant_id = details.tenant_id || details.tenantId;
   wireFormat.mac_address = details.mac_address || details.macAddress;
   wireFormat.fixed_ips = details.fixed_ips || details.fixedIps;
   wireFormat.security_groups  = details.security_groups  || details.securityGroups;
   wireFormat.network_id = details.network_id || details.networkId;
   wireFormat.allowed_address_pairs = details.allowedAddressPairs || details.allowed_address_pairs;
   wireFormat.extra_dhcp_opts = details.extraDhcpOpts || details.extra_dhcp_opts;
   wireFormat.device_owner = details.deviceOwner || details.device_owner;
   if (details.deviceId || details.device_id) wireFormat.device_id = details.deviceId || details.device_id;
   if (details['binding:host_id'] || details.bindingHostID) wireFormat['binding:host_id'] = details['binding:host_id'] || details.bindingHostID;
   wireFormat['binding:profile'] = details['binding:profile'] || details.bindingProfile;
   wireFormat['binding:vnic_type'] = details['binding:vnic_type'] || details.bindingVnicType;
   if (details.description) wireFormat.description = details.description;
   if (details.hasOwnProperty('port_security_enabled'))
   {
      wireFormat.port_security_enabled = details.port_security_enabled;
   }
   else if (details.hasOwnProperty('portSecurityEnabled'))
   {
      wireFormat.port_security_enabled = details.portSecurityEnabled;
   }
   wireFormat.project_id = details.projectId || details.project_id;
   return wireFormat;
};
