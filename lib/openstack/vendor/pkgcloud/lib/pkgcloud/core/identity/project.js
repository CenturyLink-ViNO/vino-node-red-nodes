/*
 *
 * (C) 2014 Hewlett-Packard Development Company, L.P.
 *
 */

var util = require('util'),
    model = require('../base/model');

var Project = exports.Project = function (client, details) {
  model.Model.call(this, client, details);
};

util.inherits(Project, model.Model);

Project.prototype.refresh = function (callback) {
  this.client.getProject(this, callback);
};
