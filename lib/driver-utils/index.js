let Parameter = require('./parameter');
let Utils = require('./utils');
let VinoNodeUtility = require('./vino-driver-node-utility-scripts');
let retry = require('retry');

module.exports = {
    Parameter: Parameter,
    Utils: Utils,
    VinoNodeUtility: VinoNodeUtility,
    getFaultTolerantOperation: function(inputParameters) {
        let retries = Utils.findParameter(inputParameters, 'retries');
        if (retries && retries.hasValue())
        {
            retries = retries.getValue();
        } else {
            retries = 5
        }
        let factor = Utils.findParameter(inputParameters, 'retryBackoffFactor');
        if (factor && factor.hasValue())
        {
            factor = factor.getValue();
        } else {
            factor = 3;
        }
        let minTimeout = Utils.findParameter(inputParameters, 'minTimeout');
        if (minTimeout && minTimeout.hasValue())
        {
            minTimeout = minTimeout.getValue();
        }
        let maxTimeout = Utils.findParameter(inputParameters, 'maxTimeout');
        if (maxTimeout && maxTimeout.hasValue())
        {
            maxTimeout = maxTimeout.getValue();
        }
        let retryTimeout = Utils.findParameter(inputParameters, 'retryTimeout');
        if (retryTimeout && retryTimeout.hasValue())
        {
           minTimeout = retryTimeout.getValue();
           maxTimeout = retryTimeout.getValue();
        }
        return retry.operation({
            retries: retries,
            factor: factor,
            minTimeout: minTimeout,
            maxTimeout: maxTimeout,
            randomize: false,
        });
    },
    getFaultTolerantTimeoutOpts: function(inputParameters, callback) {
       let ret = { cb: callback };
       let minTimeout = Utils.findParameter(inputParameters, 'minTimeout');
       if (minTimeout && minTimeout.hasValue())
       {
          ret.timeout = minTimeout.getValue();
       }
       else
       {
          let maxTimeout = Utils.findParameter(inputParameters, 'maxTimeout');
          if (maxTimeout && maxTimeout.hasValue())
          {
             ret.timeout = maxTimeout.getValue();
          }
       }
       let retryTimeout = Utils.findParameter(inputParameters, 'retryTimeout');
       if (retryTimeout && retryTimeout.hasValue()) {
          ret.timeout = retryTimeout.getValue();
       }
       if (!ret.timeout) {
          ret.timeout = 10000;
       }
       return ret;
    }
};