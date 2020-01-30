/*
 * subnet.js: Base subnet from which all pkgcloud subnet inherit.
 *
 * (C) 2014 Hewlett-Packard Development Company, L.P.
 *
 */

var util = require('util'),
    model = require('../base/model');

var Trunk = exports.Trunk = function (client, details) {
  model.Model.call(this, client, details);
};

util.inherits(Trunk, model.Model);

Trunk.prototype.create = function (callback) {
  this.client.createTrunk(this.name, callback);
};

Trunk.prototype.refresh = function (callback) {
  this.client.getTrunk(this.id, callback);
};

Trunk.prototype.update = function (callback) {
  this.client.updateTrunk(this, callback);
};

Trunk.prototype.destroy = function (callback) {
  this.client.destroyTrunk(this.id, callback);
};
