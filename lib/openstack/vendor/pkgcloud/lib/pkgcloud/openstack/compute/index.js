/*
 * index.js: Top-level include for the OpenStack compute module
 *
 * (C) 2013 Charlie Robbins, Ken Perkins, Ross Kukulinski & the Contributors.
 *
 */

exports.Client = require('./client').Client;
exports.Flavor = require('./flavor').Flavor;
exports.Image  = require('./image').Image;
exports.Server = require('./server').Server;

exports.createClient = function (options) {
  return new exports.Client(options);
};
