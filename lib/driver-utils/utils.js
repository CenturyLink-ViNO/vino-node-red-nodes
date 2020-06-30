
let Request = require('request');
let Mustache = require('mustache');
let Parameter = require('./parameter');
let xpath = require('xpath');
let dom = require('xmldom').DOMParser;
let jsonPath = require('jsonpath');
let Handlebars = require('handlebars');
let retry = require('retry');
let fs = require('fs');

module.exports = {

    getAllStepsBetweenNodes: function(startNode, endNode, RED, visited = [])
    {
        let steps = [];
        if (!endNode || startNode.id !== endNode.id)
        {
            visited.push(startNode);
            for (let outputIndex in startNode.wires)
            {
                for (let wireIndex in startNode.wires[outputIndex])
                {
                    let next = RED.nodes.getNode(startNode.wires[outputIndex][wireIndex]);
                    if (visited.indexOf(next) === -1)
                    {
                        steps = steps.concat(this.getAllStepsBetweenNodes(next, endNode, RED, visited));
                    }
                }
            }
            if (steps.indexOf(startNode) === -1)
            {
                steps.push(startNode);
            }
        }
        return steps;
    },

    findParameter: function(parameters, key)
    {
        for (let paramIndex in parameters)
        {
            if (parameters[paramIndex].parameterKey === key)
            {
               return parameters[paramIndex];
            }
        }
    },

    //TODO: switch core nodes with built-in templating to use handlebars function below
    fillTemplate: function(templateString, inputParams, msg)
    {
        let inputMap = {
            msg: msg
        };

        inputParams.forEach(function(param)
        {
            inputMap[param.parameterKey] = param.getValue();
        });

        return Mustache.render(templateString, inputMap);
    },

    processHandlebarsTemplate: function(template, inputParameters, hideEncrypted) {
        function createContextFromInputParameters() {
            let ctx = {};
            for (let idx in inputParameters)
            {
                if (inputParameters.hasOwnProperty(idx))
                {
                    if (hideEncrypted)
                    {
                       ctx[inputParameters[idx].parameterKey] = '*******';
                    }
                    else
                    {
                       ctx[inputParameters[idx].parameterKey] = inputParameters[idx].getValue();
                    }
                }
            }
            return ctx;
        }
        let context = createContextFromInputParameters();
        let tpl = Handlebars.compile(template);
        return tpl(context);
    },

    processMustacheTemplate: function(template, inputParameters, hideEncrypted) {
        function createContextFromInputParameters() {
            let ctx = {};
            for (let idx in inputParameters)
            {
                if (inputParameters.hasOwnProperty(idx))
                {
                   if (hideEncrypted)
                   {
                      ctx[inputParameters[idx].parameterKey] = '*******';
                   }
                   else
                   {
                      ctx[inputParameters[idx].parameterKey] = inputParameters[idx].getValue();
                   }
                }
            }
            return ctx;
        }
        let context = createContextFromInputParameters();
        let tpl = Mustache.render(template, context);
        return tpl;
    },

    parseResponseForOutputParameters: function(outputParams, response) {
        function processXPath(path, content, fullResponse) {
            let doc = new dom().parseFromString(content);
            let ret = '';
            if (fullResponse)
            {
               // Full XPATH response with nodes
               ret = xpath.select(path, doc).toString();
            }
            else
            {
               // Value only XPATH response
               ret = xpath.select(`string(${path})`, doc);
            }
            return ret;
        }
        function processJsonPath(path, content) {
            let json = content;
            if (typeof json === 'string')
            {
                json = JSON.parse(json);
            }
            return jsonPath.query(json, path);
        }
        function processRegex(regex, content, returnAllMatches) {
            let ret;
            let regEx = new RegExp(regex);
            let matches = content.match(regEx);
            if (matches && Array.isArray(matches))
            {
               if (returnAllMatches)
               {
                  ret = [];
                  content.match(regEx).forEach((match) => {
                     ret.push(match);
                  });
               }
               else
               {
                  ret = matches[0];
               }
            }
            return ret;
        }

        let ret = [];
        for (let idx in outputParams) {
            if (outputParams.hasOwnProperty(idx)) {
                let newParam = new Parameter(outputParams[idx]);
                if (newParam.outputDetails && newParam.outputDetails.type) {
                    switch (newParam.outputDetails.type) {
                        case 'XPATH':
                            newParam.setValue(processXPath(newParam.outputDetails.format, response, false));
                            break;
                        case 'XPATHFULL':
                            newParam.setValue(processXPath(newParam.outputDetails.format, response, true));
                            break;
                        case 'JSONPATH':
                            newParam.setValue(processJsonPath(newParam.outputDetails.format, response));
                            break;
                        case 'REGEX':
                            if (newParam.parameterType === 'stringList')
                            {
                               newParam.setValue(processRegex(newParam.outputDetails.format, response, true));
                            }
                            else
                            {
                               newParam.setValue(processRegex(newParam.outputDetails.format, response, false));
                            }
                            break;
                        case 'CUSTOM':
                        default:
                            // This is handled by the driver node
                            break;
                    }
                }
                ret.push(newParam);
            }
        }
        return ret;
    },

    getFaultTolerantOperation: function(inputParameters) {
        let retries = this.findParameter(inputParameters, 'retries');
        if (retries && retries.hasValue())
        {
            retries = parseInt(retries.getValue(), 10);
        } else {
            retries = 5
        }
        let factor = this.findParameter(inputParameters, 'retryBackoffFactor');
        if (factor && factor.hasValue())
        {
            factor = parseInt(factor.getValue(), 10);
        } else {
            factor = 3;
        }
        let minTimeout;
        let maxTimeout;
        let retryTimeout = this.findParameter(inputParameters, 'retryTimeout');
        if (retryTimeout && retryTimeout.hasValue())
        {
           minTimeout = parseInt(retryTimeout.getValue(), 10);
           maxTimeout = parseInt(retryTimeout.getValue(), 10);
        }
        else
        {
           minTimeout = this.findParameter(inputParameters, 'minTimeout');
           if (minTimeout && minTimeout.hasValue())
           {
              minTimeout = parseInt(minTimeout.getValue(), 10);
           }
           else
           {
              minTimeout = 10000;
           }
           maxTimeout = this.findParameter(inputParameters, 'maxTimeout');
           if (maxTimeout && maxTimeout.hasValue())
           {
              maxTimeout = parseInt(maxTimeout.getValue(), 10);
           }
           else
           {
              maxTimeout = 60000;
           }
        }
        return retry.operation({
            retries: retries,
            factor: factor,
            minTimeout: minTimeout,
            maxTimeout: maxTimeout,
            randomize: false,
        });
    },

   setTimeout: function(ms, reject) {
       setTimeout(function() {
          reject(`Timeout after ${ms / 1000} seconds.`);
       }, ms);
   },

   prependNodeInfoToLogMessage: function(logMessage, senderNode)
   {
      if (senderNode)
      {
         return `[Node ${senderNode.id} (${senderNode.name})] ${logMessage}`;
      }
      return logMessage;
   },

   debug: function(message, senderNode, msg)
   {
      let logMessage = this.prependNodeInfoToLogMessage(message, senderNode);
      let stamp = '[Debug] [' + new Date(Date.now()).toLocaleString() + '] ';
      if (msg && msg.vino && msg.vino.debug)
      {
         this.writeToActivationLog(stamp+logMessage+'\n', senderNode, msg);
      }
      console.debug(logMessage)
   },

   log: function(message, senderNode, msg)
   {
      let logMessage = this.prependNodeInfoToLogMessage(message, senderNode);
      let stamp = '[Info] [' + new Date(Date.now()).toLocaleString() + '] ';
      this.writeToActivationLog(stamp+logMessage+'\n', senderNode, msg);
      if (senderNode)
      {
         senderNode.log(logMessage, msg);
      }
      else
      {
         console.log(logMessage);
      }
   },

   error: function(message, senderNode, msg)
   {
      let logMessage = this.prependNodeInfoToLogMessage(message, senderNode);
      let stamp = '[Error] [' + new Date(Date.now()).toLocaleString() + '] ';
      this.writeToActivationLog(stamp+logMessage+'\n', senderNode, msg);
      if (senderNode)
      {
         senderNode.warn(logMessage, msg);
      }
      else
      {
         console.error(logMessage);
      }
   },

   warn: function(message, senderNode, msg)
   {
      let logMessage = this.prependNodeInfoToLogMessage(message, senderNode);
      let stamp = '[Warn] [' + new Date(Date.now()).toLocaleString() + '] ';
      this.writeToActivationLog(stamp+logMessage+'\n', senderNode, msg);
      if (senderNode)
      {
         senderNode.warn(logMessage, msg);
      }
      else
      {
         console.warn(logMessage);
      }
   },

   writeToActivationLog: function(logMessage, senderNode, msg)
   {
      if (msg && msg.vino && msg.vino.serviceActivationId)
      {
         fs.appendFile('/var/log/vino/activations/' + msg.vino.serviceActivationId + '.log', logMessage, function (err)
         {
            if (err)
            {
               console.warn(`Error writing to ViNO activation log for activation ${msg.vino.serviceActivationId}. ${err}`);
            }
         });
      }
   }
};
