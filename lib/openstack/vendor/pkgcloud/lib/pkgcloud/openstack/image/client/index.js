var util = require('util'),
    openstack = require('../../client'),
    ImageClient = require('../imageClient').ImageClient,
    _ = require('lodash');

var Client = exports.Client = function (options) {
  openstack.Client.call(this, options);

  _.extend(this, require('./images'));
  _.extend(this, require('./tasks'));

  this.serviceType = 'image';
};

util.inherits(Client, openstack.Client);
_.extend(Client.prototype, ImageClient.prototype);

