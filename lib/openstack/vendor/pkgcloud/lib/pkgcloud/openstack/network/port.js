/*
 * network.js: Openstack Port object.
 *
 * (C) 2014 Hewlett-Packard Development Company, L.P.
 *
 */

var util = require('util'),
    base = require('../../core/network/port'),
    _ = require('lodash');

var Port = exports.Port = function Port(client, details) {
  base.Port.call(this, client, details);
};

util.inherits(Port, base.Port);

Port.prototype._setProperties = function (details) {

  this.status = details.status || this.status;
  this.name = details.name || this.name;
  this.allowedAddressPairs = details.allowed_address_pairs	 || this.allowedAddressPairs;
  this.adminStateUp = details.admin_state_up === true || this.adminStateUp === true;
  this.networkId = details.network_id || this.networkId;
  this.tenantId = details.tenant_id || this.tenantId;
  this.extraDhcpOpts = details.extra_dhcp_opts || this.extraDhcpOpts;
  this.deviceOwner = details.device_owner || this.deviceOwner;
  this.macAddress = details.mac_address || this.macAddress;
  this.fixedIps = details.fixed_ips || this.fixedIps;
  this.id = details.id || this.id;
  this.securityGroups = details.security_groups || this.securityGroups;
  this.deviceId = details.device_id || this.deviceId;
  this.bindingHostID = details['binding:host_id'] || this.bindingHostID || null;
  this.bindingProfile = details['binding:profile'] || this.bindingProfile || null;
  this.bindingVnicType = details['binding:vnic_type'] || this.bindingVnicType || null;
  this.description = details.description || this.description || null;
  this.deviceId = details.device_id || this.deviceId || null;
  this.dnsDomain = details.dns_domain || this.dnsDomain || null;
  this.dnsName = details.dns_name || this.dnsName || null;
  this.portSecurityEnabled = details.port_security_enabled === true || this.portSecurityEnabled === true;
  this.projectId = details.project_id || this.projectId || null;
  this.qosPolicyId = details.qos_policy_id || this.qosPolicyId || null;
  this.tags = details.tags || this.tags || null;
  this.uplinkStatusPropegation = details.uplink_status_propegation === true || this.uplinkStatusPropegation === true;
  this.macLearningEnabled = details.mac_learning_enabled === true || this.macLearningEnabled === true;
};

Port.prototype.toJSON = function () {
  return _.pick(this, ['status', 'name', 'allowedAddressPairs', 'adminStateUp',
  'networkId', 'tenantId', 'extraDhcpOpts', 'deviceOwner',
  'macAddress', 'fixedIps', 'id', 'securityGroups', 'deviceId', 'bindingHostID',
  'bindingProfile', 'bindingVnicType', 'description', 'deviceId', 'dnsDomain',
  'dnsName', 'portSecurityEnabled', 'projectId', 'qosPolicyId', 'tags',
  'uplinkStatusPropegation', 'macLearningEnabled']);
};
