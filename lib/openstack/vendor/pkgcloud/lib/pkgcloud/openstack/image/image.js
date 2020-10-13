var util  = require('util'),
    base  = require('../../core/compute/image'),
    _     = require('lodash');

var Image = exports.Image = function Image(client, details) {
  base.Image.call(this, client, details);
};

util.inherits(Image, base.Image);

Image.prototype._setProperties = function (details) {
  this.id      = details.id;
  this.name    = details.name;
  this.created_at = details.created_at;

  //
  // OpenStack specific
  //
  this.owner = details.owner;
  this.checksum = details.checksum;
  this.container_format = details.container_format;
  this.disk_format = details.disk_format;
  this.min_disk = details.min_disk;
  this.min_ram = details.min_ram;
  this.size = details.size;
  this.visibility = details.visibility;
  this.protected = details.protected;
  this.tags = details.tags;

  this.updated_at  = details.updated_at;
  this.status   = details.status;
};

Image.prototype.toJSON = function () {
  return _.pick(this, ['id', 'name', 'status', 'owner', 'created_at', 'updated_at', 'checksum', 'container_format', 'disk_format', 'min_disk',
                       'min_ram', 'size', 'visibility', 'protected', 'tags']);
};