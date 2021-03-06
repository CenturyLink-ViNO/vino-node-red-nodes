/*
 * networks.js: Instance methods for working with networks
 * for Openstack networking
 *
  * (C) 2014 Hewlett-Packard Development Company, L.P.
 *
 */

var urlJoin = require('url-join');

var subnetsResourcePath = '/subnets';

// Declaring variables for helper functions defined later
var _convertSubnetToWireFormat;

/**
 * client.getSubnets
 *
 * @description get the list of networks for an account
 *
 * @param {object|Function}   options
 * @param {Number}            [options.limit]   the number of records to return
 * @param {String}            [options.marker]  Marker value. Operation returns object names that are greater than this value.
 * @param {String}            [options.end_marker]  Operation returns object names that are less than this value.
 * @param {Function}          callback
 */
exports.getSubnets  = function (options, callback) {
  var self = this;

  if (typeof options === 'function') {
    callback = options;
    options = {};
  }

  var getSubnetOpts = {
    path: subnetsResourcePath,
   };

  this._request(getSubnetOpts, function (err, body) {
    if (err) {
      return callback(err);
    }
    else if (!body ||!body.subnets || !(body.subnets instanceof Array)) {
      return new Error('Malformed API Response');
    }

    return callback(err, body.subnets.map(function (subnet) {
      return new self.models.Subnet(self, subnet);
    }));
  });
};

/**
 * client.getSubnet
 *
 * @description get the details for a specific network
 *
 * @param {String|object}     subnet     the subnet or subnetId
 * @param callback
 */
exports.getSubnet = function (subnet, callback) {
  var self = this,
    subnetId = subnet instanceof this.models.Subnet ? subnet.id : subnet;
  self.emit('log::trace', 'Getting details for subnet', subnetId);
  this._request({
    path: urlJoin(subnetsResourcePath, subnetId),
    method: 'GET'
  }, function (err, body) {
    if (err) {
      return callback(err);
    }

    if (!body || !body.subnet) {
      return new Error('Malformed API Response');
    }

    callback(err, new self.models.Subnet(self, body.subnet));
  });
};

/**
 * client.createSubnet
 *
 * @description create a new subnet
 *
 * @param {object}    options
 * @param {String}    options.name      the name of the new subnet
 * @param callback
 */
exports.createSubnet = function (options, callback) {
  var self = this,
    subnet = typeof options === 'object' ? options : { 'name' : options};

  subnet = _convertSubnetToWireFormat(subnet);

  var createSubnetOpts = {
    method: 'POST',
    path: subnetsResourcePath,
    body: { 'subnet' : subnet}
  };

  self.emit('log::trace', 'Creating subnet', subnet);
  this._request(createSubnetOpts, function (err,body) {
    return err
      ? callback(err)
      : callback(err, new self.models.Subnet(self, body.subnet));
  });
};

/**
 * client.updateSubnet
 *
 * @description update an existing subnet
 *
 * @param {object}    options
 * @param callback
 */
exports.updateSubnet = function (subnet, callback) {
  var self = this,
  subnetId = subnet.id,
  subnetToUpdate = _convertSubnetToWireFormat(subnet);

  var updateSubnetOpts = {
    method: 'PUT',
    path: urlJoin(subnetsResourcePath, subnetId),
    contentType: 'application/json',
    body: { 'subnet' : subnetToUpdate}
  };

  self.emit('log::trace', 'Updating subnet', subnetId);
  this._request(updateSubnetOpts, function (err,body) {
    return err
      ? callback(err)
      : callback(err, new self.models.Subnet(self, body.subnet));
  });
};

/**
 * client.destroySubnet
 *
 * @description Delete a specific network
 *
 * @param {String|object}     subnet     the subnet or subnet ID
 * @param callback
 */
exports.destroySubnet = function (subnet, callback) {
  var self = this,
    subnetId = subnet instanceof this.models.Subnet ? subnet.id : subnet;
  self.emit('log::trace', 'Deleting subnet', subnetId);
  this._request({
    path: urlJoin(subnetsResourcePath,subnetId),
    method: 'DELETE'
  }, function (err) {
    if (err) {
      return callback(err);
    }
    callback(err, subnetId);
  });
};

/**
 * _convertSubnetToWireFormat
 *
 * @description convert Subnet instance into its wire representation.
 *
 * @param {object}     details    the Subnet instance.
 */
_convertSubnetToWireFormat = function (details){

  var wireFormat = {};

  wireFormat.name = details.name;
  wireFormat.network_id = details.networkId || details.network_id;
  if (details.tenantId || details.tenant_id) wireFormat.tenant_id = details.tenantId || details.tenant_id;
  wireFormat.allocation_pools = details.allocationPools || details.allocation_pools;
  wireFormat.gateway_ip = details.gatewayIp || details.gateway_ip;
  wireFormat.ip_version = details.ipVersion || details.ip_version;
  wireFormat.cidr = details.cidr;
  wireFormat.enable_dhcp = details.enable_dhcp == null ? details.enableDhcp : details.enable_dhcp;
  wireFormat.dns_nameservers = details.dns_nameservers || details.dnsNameServers;
  wireFormat.host_routes = details.host_routes  || details.hostRoutes;
  if (details.project_id || details.projectId) wireFormat.project_id = details.project_id || details.projectId;
  if (details.prefixlen) wireFormat.prefixlen = details.prefixlen;
  wireFormat.description = details.description;
  if (details.ipv6_address_mode || details.ipv6AddressMode) wireFormat.ipv6_address_mode = details.ipv6_address_mode || details.ipv6AddressMode;
  if (details.ipv6_ra_mode || details.ipv6RaMode) wireFormat.ipv6_ra_mode = details.ipv6_ra_mode || details.ipv6RaMode;
  wireFormat.segment_id = details.segment_id || details.segmentId;
  wireFormat.subnetpool_id = details.subnetpool_id || details.subnetPoolId;
  wireFormat.use_default_subnetpool = details.use_default_subnetpool || details.useDefaultSubnetpool;
  wireFormat.service_types = details.service_types || details.serviceTypes;

  return wireFormat;
};
