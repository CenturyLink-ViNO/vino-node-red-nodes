/*
 * network.js: Openstack Subnet object.
 *
 * (C) 2014 Hewlett-Packard Development Company, L.P.
 *
 */

var util = require('util'),
    base = require('../../core/network/trunk'),
    _ = require('lodash');

var Trunk = exports.Trunk = function Trunk(client, details) {
  base.Trunk.call(this, client, details);
};

util.inherits(Trunk, base.Trunk);

Trunk.prototype._setProperties = function (details) {
    this.name = details.name;
    this.id = details.id;
    this.projectId = details.project_id || this.projectId;
    this.portId = details.port_id || this.portId;
    this.tenantId = details.tenant_id || this.tenantId;
    this.description = details.description;
    this.adminStateUp = details.admin_state_up || this.adminStateUp;
    this.subPorts = details.sub_ports || this.subPorts;
};

Trunk.prototype.toJSON = function () {
  return _.pick(this, ['name', 'id', 'projectId', 'portId',
  'tenantId', 'description', 'adminStateUp', 'subPorts']);
};
