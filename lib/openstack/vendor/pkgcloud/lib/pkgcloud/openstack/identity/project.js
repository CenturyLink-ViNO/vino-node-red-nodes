/*
 *
 * (C) 2014 Hewlett-Packard Development Company, L.P.
 *
 */

var util = require('util'),
    base = require('../../core/identity/project'),
    _ = require('lodash');

var Project = exports.Project = function Project(client, details) {
  base.Project.call(this, client, details);
};

util.inherits(Project, base.Project);

Project.prototype._setProperties = function (details) {
    this.name = details.name;
    this.id = details.id;
    this.enabled = details.enabled;
};

Project.prototype.toJSON = function () {
  return _.pick(this, ['name', 'id', 'enabled']);
};
