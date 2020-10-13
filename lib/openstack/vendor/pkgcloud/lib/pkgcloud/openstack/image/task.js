var util  = require('util'),
    base  = require('../../core/compute/image'),
    _     = require('lodash');

var Task = exports.Task = function Task(client, details) {
  base.Image.call(this, client, details);
};


Task.prototype._setProperties = function (details) {
  this.id      = details.id;
  this.name    = details.name;
  this.created_at = details.created_at;

  this.owner = details.owner;
  this.type = details.container_format;
  this.updated_at  = details.updated_at;
  this.status   = details.status;
  this.result = details.result;
};

Task.prototype.toJSON = function () {
  return _.pick(this, ['id', 'name', 'status', 'owner', 'created_at', 'updated_at', 'result']);
};