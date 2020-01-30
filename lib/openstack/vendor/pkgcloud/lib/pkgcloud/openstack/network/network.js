/*
 * network.js: Openstack Network object.
 *
 * (C) 2014 Hewlett-Packard Development Company, L.P.
 *
 */

var util = require('util'),
    base = require('../../core/network/network'),
    _ = require('lodash');

var Network = exports.Network = function Network(client, details) {
  base.Network.call(this, client, details);
};

util.inherits(Network, base.Network);

Network.prototype._setProperties = function (details) {
  this.name = details.name || this.name;
  this.updatedAt = details.updated_at || details.updatedAt || this.updatedAt || null;
  this.status = details.status || this.status;
  this.adminStateUp = details.admin_state_up === true || this.adminStateUp === true;
  this.id = details.id || this.id;
  this.shared = details.shared || this.shared || 0;
  this.tenantId = details.tenant_id || this.tenantId;
  this.subnets = details.subnets || this.subnets;
  this.dnsDomain = details.dns_domain || this.dnsDomain || null;
  this.mtu = details.mtu || this.mtu || null;
  this.portSecurityEnabled = details.port_security_enabled === true || this.portSecurityEnabled === true;
  this.projectId = details.project_id || this.projectId || null;
  this.providerNetworkType = details.provider_network_type || details['provider:network_type'] || this.providerNetworkType || null;
  this.providerPhysicalNetwork = details.provider_physical_network || details['provider:physical_network'] || this.providerPhysicalNetwork || null;
  this.providerSegmentationId = details.provider_segmentation_id || details['provider:segmentation_id'] || this.providerSegmentationId || null;
  this.qosPolicyId = details.qos_policy_id || this.qosPolicyId || null;
  this.routerExternal = details.router_external || details['router:external'] || this.routerExternal || null;
  this.segments = details.segments || this.segments || null;
  this.vlanTransparent = details.vlan_transparent === true || details.vlanTransparent === true || this.vlanTransparent === true;
  this.description = details.description || this.description || null;
  this.isDefault = details.is_default === true || details.isDefault === true || this.isDefault === true;
  this.availabilityZoneHints = details.availability_zone_hints || details.availabilityZoneHints ||  this.availabilityZoneHints || null;
  this.availabilityZones = details.availability_zones || details.availabilityZoneHints || this.availabilityZones || null;
};

Network.prototype.toJSON = function () {
  return _.pick(this, ['name', 'id', 'adminStateUp', 'status', 'shared',
  'tenantId', 'subnets', 'dnsDomain', 'mtu', 'portSecurityEnabled', 'projectId', 'providerNetworkType',
  'providerPhysicalNetwork', 'providerSegmentationId', 'qosPolicyId', 'routerExternal', 'segments',
  'vlanTransparent', 'description', 'isDefault', 'availabilityZoneHints', 'availabilityZones', 'updatedAt']);
};
