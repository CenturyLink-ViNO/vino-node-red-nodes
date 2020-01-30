/*
 * network.js: Openstack Subnet object.
 *
 * (C) 2014 Hewlett-Packard Development Company, L.P.
 *
 */

var util = require('util'),
    base = require('../../core/network/subnet'),
    _ = require('lodash');

var Subnet = exports.Subnet = function Subnet(client, details) {
  base.Subnet.call(this, client, details);
};

util.inherits(Subnet, base.Subnet);

Subnet.prototype._setProperties = function (details) {
  this.name = details.name || this.name;
  this.enableDhcp = details.enable_dhcp || this.enableDhcp;
  this.networkId = details.network_id || this.networkId;
  this.id = details.id || this.id;
  this.ipVersion = details.ip_version || this.ipVersion;
  this.tenantId = details.tenant_id || this.tenantId;
  this.gatewayIp = details.gateway_ip || this.gatewayIp;
  this.cidr = details.cidr || this.cidr;
  this.dnsNameServers = details.dns_nameservers || this.dnsNameServers;
  this.hostRoutes = details.host_routes  || this.hostRoutes;
  this.allocationPools = details.allocation_pools  || this.allocationPools;
  this.projectId = details.project_id || this.projectId;
  this.prefixlen = details.prefixlen;
  this.description = details.description;
  this.ipv6AddressMode = details.ipv6_address_mode || this.ipv6AddressMode;
  this.ipv6RaMode = details.ipv6_ra_mode || this.ipv6RaMode;
  this.segmentId = details.segment_id || this.segmentId;
  this.subnetPoolId = details.subnetpool_id || this.subnetPoolId;
  this.useDefaultSubnetpool = details.use_default_subnetpool || this.useDefaultSubnetpool;
  this.serviceTypes = details.service_types || this.serviceTypes;
};

Subnet.prototype.toJSON = function () {
  return _.pick(this, ['name', 'id', 'networkId', 'ipVersion',
  'tenantId', 'gatewayIp', 'dnsNameServers', 'allocationPools', 'hostRoutes',
  'projectId', 'prefixlen', 'description', 'ipv6AddressMode', 'ipv6RaMode',
  'segmentId', 'subnetPoolId', 'useDefaultSubnetpool', 'serviceTypes']);
};
