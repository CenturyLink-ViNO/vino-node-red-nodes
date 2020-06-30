/*
 * projects.js: Instance methods for working with Openstack projects
 *
 */
 var pkgcloud = require('../../../../../lib/pkgcloud'),
     base     = require('../../../core/identity'),
     urlJoin  = require('url-join'),
     identity  = pkgcloud.providers.openstack.identity;

 var _urlV2Prefix = 'tenants';
 var _urlV3Prefix = 'projects';

/**
 * client.getProjects
 *
 * @description get the list of Openstack projects
 *
 * @param {object|Function}   options
 * @param {Function}          callback
 */
exports.getProjects  = function (apiVersion, options, callback) {
  var self = this;
  var urlPrefix = _urlV3Prefix;

  if (apiVersion === 'v2')
  {
    urlPrefix = _urlV2Prefix;
  }

  if (typeof options === 'function') {
    callback = options;
    options = {};
  }

  var getProjectOpts = {
    path: urlPrefix
  };

  this._request(getProjectOpts, function (err, body) {
    if (err) {
      return callback(err);
    }
    else if (apiVersion === 'v2' && (!body || !body.tenants || !(body.tenants instanceof Array))) {
      return new Error('Malformed API Response');
    }
    else if (apiVersion === 'v3' && (!body || !body.projects || !(body.projects instanceof Array))) {
      return new Error('Malformed API Response');
    }

    if (apiVersion === 'v2')
    {
      return callback(err, body.tenants.map(function (tenant) {
        return new identity.Project(self, tenant);
      }));
    }
    else
    {
      return callback(err, body.projects.map(function (project) {
        return new identity.Project(self, project);
      }));
    }
  });
};

/**
 * client.getProject
 *
 * @description get the details for a specific project
 *
 * @param {String|object}     project     the project or projectName
 * @param callback
 */
exports.getProject = function (apiVersion, project, callback) {
  var self = this,
    projectName = project instanceof identity.Project ? project.name : project;

  var urlPrefix = _urlV3Prefix;

  if (apiVersion === 'v2')
  {
   urlPrefix = _urlV2Prefix;
  }

  self.emit('log::trace', 'Getting details for project', projectName);

  var getProjectOpts = {
    path: urlPrefix
  };

  this._request(getProjectOpts, function (err, body) {
    if (err) {
      return callback(err);
    }
    else if (apiVersion === 'v2' && (!body || !body.tenants || !(body.tenants instanceof Array))) {
      return new Error('Malformed API Response');
    }
    else if (apiVersion === 'v3' && (!body || !body.projects || !(body.projects instanceof Array))) {
      return new Error('Malformed API Response');
    }

    if (apiVersion === 'v2')
    {
      const tenants = body.tenants.map(function (tenant) {
        return new identity.Project(self, tenant);
      });
      try
      {
         var ret = tenants.find(tenant => tenant.name === projectName);
         return callback(null, ret);
      }
      catch (e)
      {
         return new Error('Error getting project (' + projectName + '): ' + e);
      }
    }
    else
    {
      const projects = body.projects.map(function (project) {
        return new identity.Project(self, project);
      });
      try
      {
         var ret = projects.find(project => project.name === projectName);
         return callback(null, ret);
      }
      catch (e)
      {
         return new Error('Error getting project (' + projectName + '): ' + e);
      }
    }
  });
};
