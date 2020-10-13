var urlJoin = require('url-join');

exports.getRemoteConsole = function getRemoteConsole(serverId, options, callback) {
  const self = this;
  this.getVersion(function(err, version, details)
  {
    if (err)
    {
        return callback(err);
    }
    const actualVersion = details.version;

    // Old method of interacting with consoles is deprecated and replaced in 2.6
    // TODO: 2.6 version is untested
    if (actualVersion >= 2.6)
    {
        return self._request({
          method: 'POST',
          body: {remote_console: options},
          path: urlJoin('/servers', serverId, 'remote-consoles')
        }, function (err, body, res) {
            if (err)
            {
              callback(err)
            }
            const token = body.url.match(/.*token=([^&|\n|\t\s]+)/);
            return self._request({
                path: urlJoin('/os-console-auth-tokens', token)
              }, function (err, body, res) {
                return err
                  ? callback(err)
                  : callback(null, body, res);
              });
        });
    }
    else
    {
      let action;
      switch (options.type)
      {
        case 'vnc':
          action = 'os-getVNCConsole';
          break;
        case 'spice':
          action = 'os-getSPICEConsole';
          break;
        case 'rdp':
          action = 'os-getRDPConsole';
          break;
        case 'serial':
          action = 'os-getSerialConsole';
          break;
        default:
          callback(new Error('Invalid console type'));
      }
      return self._doServerAction(serverId,
          {[action]: { type: options.protocol }},
          function (err, res) {
              return callback(err, res);
      });
    }
  });
};