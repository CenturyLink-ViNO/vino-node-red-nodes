/* eslint max-lines: ["off"] */
/* eslint max-lines-per-function: ["off"] */

const NodeUtilities = require('../../lib/driver-utils/index');
const VinoNodeUtility = NodeUtilities.VinoNodeUtility;
const Parameter = require('../../lib/driver-utils/parameter');
const netconf = require('../../lib/netconf/netconf');
const xml2js = require('xml2js');
const filesystem = require('fs');

module.exports = function(RED)
{
   function NetconfDriverNode(config)
   {
      RED.nodes.createNode(this, config);
      this.NodeUtility = new VinoNodeUtility(
         config.name, config.description, config.baseTypes,
         config.selectedBaseType, RED
      );
      this.description = config.description;
      this.statusConfiguration = config.statusConfiguration;
      const outer = this;
      let reportRetry = null;

      async function handleCommand(client, promiseErrorCallbacks, inputParameters, msg)
      {
         let output = [];
         if (await outer.openConnection(client, promiseErrorCallbacks, inputParameters, msg))
         {
            switch (outer.NodeUtility.selectedBaseType)
            {
            case 'Netconf_Driver_EditConfig':
               output = await outer.processEditConfig(client, inputParameters, output, msg);
               if (Array.isArray(outer.NodeUtility.outputParameters) && outer.NodeUtility.outputParameters.length > 0)
               {
                  output = outer.NodeUtility.processOutputParameters(output, outer, msg);
               }
               break;
            case 'Netconf_Driver_GenericRpc':
               output = await outer.processGenericRPC(client, inputParameters, output, msg);
               if (Array.isArray(outer.NodeUtility.outputParameters) && outer.NodeUtility.outputParameters.length > 0)
               {
                  output = outer.NodeUtility.processOutputParameters(output, outer, msg);
               }
               break;
            case 'Netconf_Driver_GetConfig':
               output = await outer.processGetConfig(client, inputParameters, output, msg);
               if (Array.isArray(outer.NodeUtility.outputParameters) && outer.NodeUtility.outputParameters.length > 0)
               {
                  output = outer.NodeUtility.processOutputParameters(output, outer, msg);
               }
               break;
            case 'Netconf_Driver_Get':
               output = await outer.processGet(client, inputParameters, output, msg);
               if (Array.isArray(outer.NodeUtility.outputParameters) && outer.NodeUtility.outputParameters.length > 0)
               {
                  output = outer.NodeUtility.processOutputParameters(output, outer, msg);
               }
               break;
            default:
               throw new Error('Failed to activate netconf step. An invalid action type was specified');
            }
         }
         else
         {
            await outer.closeClient(client);
            throw new Error('Failed to open netconf connection. Could not execute netconf action.');
         }
         return output;
      }

      outer.on('input', async function(msg)
      {
         let vinoServiceActivation = null;
         reportRetry = function(retryOperation)
         {
            const timeoutsString = '_timeouts';
            const attemptTimeInSeconds = retryOperation[timeoutsString][0] / 1000;
            if (!isNaN(attemptTimeInSeconds))
            {
               const retryMessage = 'Netconf step failed. Waiting ' + attemptTimeInSeconds + ' seconds and retrying';
               if (vinoServiceActivation)
               {
                  vinoServiceActivation.setStatus('Retry', retryMessage, outer);
               }
               NodeUtilities.Utils.log(retryMessage, outer, msg);
            }
         };
         if (msg.vino && msg.vino.serviceActivationId)
         {
            vinoServiceActivation = outer.getActivationObject(msg.vino.serviceActivationId);
            if (vinoServiceActivation.checkForCancellation(outer, msg))
            {
               return;
            }
            vinoServiceActivation.stepActivating(outer, msg);
         }
         outer.status({
            fill: 'green',
            shape: 'dot',
            text: 'Running Netconf'
         });
         let client;
         try
         {
            const inputParameters = await outer.NodeUtility.processInputParameters(msg, outer);
            const promiseErrorCallbacks = [];
            client = outer.createClient(inputParameters, promiseErrorCallbacks);
            const outputParams = await handleCommand(client, promiseErrorCallbacks, inputParameters, msg);
            if (vinoServiceActivation)
            {
               vinoServiceActivation.stepActivated(outer, inputParameters, outputParams, null, msg);
            }
            outer.status({
               fill: 'green',
               shape: 'dot',
               text: 'Netconf completed successfully'
            });
            outer.send(msg);
         }
         catch (err)
         {
            if (vinoServiceActivation)
            {
               vinoServiceActivation.error(outer, err, msg);
            }
            else
            {
               outer.error(err, msg);
            }
            const errMsg = typeof err === 'string' ? err : err.message;
            outer.status({
               fill: 'red',
               shape: 'dot',
               text: 'Error performing Netconf' + errMsg.length > 20 ? errMsg.subString(0, 20) : errMsg
            });
         }
         finally
         {
            try
            {
               if (client && client.connected)
               {
                  await outer.closeClient(client);
               }
            }
            catch (err)
            {
               console.log(err);
            }
         }
      });

      this.getActivationObject = function(serviceActivationId)
      {
         const vinoServiceActivation = outer.context().global.vinoServiceActivations[serviceActivationId];
         if (!vinoServiceActivation)
         {
            throw new Error('No valid service activation was found for the ID: ' + msg.vino.serviceActivationId);
         }
         return vinoServiceActivation;
      };

      this.createClient = function(inputParameters, promiseErrorCallbacks)
      {
         const host = NodeUtilities.Utils.findParameter(inputParameters, 'targetAddress');
         const port = NodeUtilities.Utils.findParameter(inputParameters, 'targetPort');
         const username = NodeUtilities.Utils.findParameter(inputParameters, 'targetUserName');
         const options = {
            host: host.getValue(),
            port: port.getValue(),
            username: username.getValue(),
            raw: true
         };
         const password = NodeUtilities.Utils.findParameter(inputParameters, 'targetPassword');
         if (password && password.hasValue())
         {
            options.password = password.getValue();
         }
         const privateKey = NodeUtilities.Utils.findParameter(inputParameters, 'sshKey');
         if (privateKey && privateKey.hasValue())
         {
            try
            {
               const privateKeyValue = filesystem.readFileSync(privateKey.getValue(), 'utf8');
               options.pkey = privateKeyValue;
            }
            catch (error)
            {
               throw new Error('Error while reading private key file: ' + error);
            }
         }
         const client = new netconf.Client(options);
         client.on('error', function(error)
         {
            for (const idx in promiseErrorCallbacks)
            {
               if (promiseErrorCallbacks.hasOwnProperty(idx))
               {
                  const theCallback = promiseErrorCallbacks[idx];
                  theCallback(error);
               }
            }
         });
         return client;
      };

      this.openConnection = async function(client, promiseErrorCallbacks, inputParameters /* , msg*/)
      {
         const connectOp = NodeUtilities.Utils.getFaultTolerantOperation(inputParameters);

         const retryPromise = new Promise((resolve, reject) =>
         {
            connectOp.attempt(() =>
            {
               try
               {
                  const callback = function(err)
                  {
                     if (connectOp.retry(err))
                     {
                        promiseErrorCallbacks.pop();
                        reportRetry(connectOp);
                        return;
                     }
                     if (err)
                     {
                        promiseErrorCallbacks.pop();
                        reject(new Error(err));
                     }
                     else
                     {
                        promiseErrorCallbacks.pop();
                        resolve();
                     }
                  };
                  promiseErrorCallbacks.push(callback);
                  client.open(callback);
               }
               catch (err)
               {
                  connectOp.stop();
                  promiseErrorCallbacks.pop();
                  reject(new Error(err));
               }
            }, NodeUtilities.getFaultTolerantTimeoutOpts(inputParameters, () =>
            {
               client.sshConn.destroy();
               if (connectOp.retry('Timed out while attempting to connect to the netconf server.'))
               {
                  return;
               }
               connectOp.stop();
               promiseErrorCallbacks.pop();
               reject(new Error('Timed out while attempting to connect to the netconf server.'));
            }));
         });
         await retryPromise;
         return true;
      };

      this.closeClient = async function(client)
      {
         const retryPromise = new Promise(function(res)
         {
            if (client && client.connected)
            {
               client.close(function(err)
               {
                  if (err)
                  {
                     console.warn(`Failed to close Netconf Socket: ${err}`);
                  }
                  client.sshConn.end();
                  res();
               });
            }
            else
            {
               if (client)
               {
                  client.sshConn.end();
               }
               res();
            }
         });
         const ret = await retryPromise;
         return ret;
      };

      this.processEditConfig = async function(client, theInputParameters, theOutputParameters, msg)
      {
         const inputParameters = theInputParameters;
         let outputParameters = theOutputParameters;
         const copyRunning = NodeUtilities.Utils.findParameter(inputParameters, 'copyRunningToCandidate');
         const dataStore = NodeUtilities.Utils.findParameter(inputParameters, 'datastore');
         if (copyRunning.hasValue() && copyRunning.getValue() === true &&
                dataStore.hasValue() && dataStore.getValue() === 'candidate' &&
                client.remoteCapabilities.includes('urn:ietf:params:netconf:capability:candidate:1.0'))
         {
            const retry = NodeUtilities.Utils.getFaultTolerantOperation(inputParameters);
            const retryPromise = new Promise((resolve, reject) =>
            {
               retry.attempt(() =>
               {
                  const rpc = {
                     'copy-config': {
                        'target': { 'candidate': null },
                        'source': { 'running': null }
                     }
                  };
                  client.rpc(rpc, function(err)
                  {
                     if (retry.retry(err))
                     {
                        reportRetry(retry);
                        return;
                     }
                     if (err)
                     {
                        reject(err);
                     }
                     else
                     {
                        retry.stop();
                        resolve(true);
                     }
                  });
               }, NodeUtilities.getFaultTolerantTimeoutOpts(inputParameters, () =>
               {
                  if (retry.retry('Timed out while attempting to copy the running configuration to candidate.'))
                  {
                     return;
                  }
                  retry.stop();
                  reject(new Error('Timed out while attempting to copy the running configuration to candidate.'));
               }));
            });
            await retryPromise;
         }
         const retry = NodeUtilities.Utils.getFaultTolerantOperation(inputParameters);
         let retryPromise = new Promise((resolve, reject) =>
         {
            retry.attempt(() =>
            {
               try
               {
                  const template = NodeUtilities.Utils.
                     processHandlebarsTemplate(NodeUtilities.Utils.findParameter(inputParameters, 'template').getValue(), inputParameters);
                  xml2js.parseString(template, function(err, result)
                  {
                     if (err)
                     {
                        retry.stop();
                        throw err;
                     }
                     const target = JSON.parse(`{ "${NodeUtilities.Utils.findParameter(inputParameters, 'datastore').getValue()}": null }`);
                     const rpc = {
                        'edit-config': {
                           target: target,
                           'default-operation': NodeUtilities.Utils.findParameter(inputParameters, 'operation').getValue(),
                           config: result
                        }
                     };
                     NodeUtilities.Utils.debug('RPC Template: ' + template.replace(/(\r\n|\n|\r|\t)/gm, ' '), outer, msg);
                     client.rpc(rpc, function(error, json)
                     {
                        if (retry.retry(error))
                        {
                           reportRetry(retry);
                           return;
                        }
                        if (error)
                        {
                           reject(new Error(error));
                        }
                        else
                        {
                           NodeUtilities.Utils.debug('RPC Response: ' + json.raw.replace(/(\r\n|\n|\r|\t)/gm, ' '), outer, msg);
                           outputParameters = NodeUtilities.Utils.parseResponseForOutputParameters(
                              outer.NodeUtility.outputParameters,
                              json.raw
                           );
                           resolve(true);
                        }
                     });
                  });
               }
               catch (err)
               {
                  NodeUtilities.Utils.error(err, outer, msg);
                  retry.stop();
                  reject(new Error(error));
               }
            }, NodeUtilities.getFaultTolerantTimeoutOpts(inputParameters, () =>
            {
               if (retry.retry('Timed out while attempting to execute Netconf Edit Config.'))
               {
                  return;
               }
               retry.stop();
               reject(new Error('Timed out while attempting to execute Netconf Edit Config.'));
            }));
         });
         let result;
         try
         {
            result = await retryPromise;
         }
         catch (error)
         {
            throw new Error(error);
         }
         if (!result)
         {
            await outer.closeClient(client);
            throw new Error('Failed to execute Netconf Edit Config.');
         }
         const commitAfter = NodeUtilities.Utils.findParameter(inputParameters, 'commit');
         if (commitAfter && commitAfter.getValue())
         {
            retryPromise = new Promise(function(res, rej)
            {
               retry.attempt(function()
               {
                  const rpc = { commit: null };
                  client.rpc(rpc, function(err)
                  {
                     if (retry.retry(err))
                     {
                        reportRetry(retry);
                        return;
                     }
                     if (err)
                     {
                        rej(err);
                     }
                     else
                     {
                        retry.stop();
                        res(true);
                     }
                  });
               });
            });
            result = await retryPromise;
            if (!result)
            {
               await outer.closeClient(client);
               throw new Error('Failed to commit changes.');
            }
         }
         await outer.closeClient(client);
         return outputParameters;
      };

      this.processGetConfig = async function(client, theInputParameters, theOutputParameters, msg)
      {
         const inputParameters = theInputParameters;
         let outputParameters = theOutputParameters;
         const getConfigOp = NodeUtilities.Utils.getFaultTolerantOperation(inputParameters);
         const retryPromise = new Promise(function(res, rej)
         {
            getConfigOp.attempt(function()
            {
               try
               {
                  const templateParam = NodeUtilities.Utils.findParameter(inputParameters, 'template');
                  let template = '';
                  if (templateParam !== null && templateParam !== undefined && templateParam.getValue() !== null &&
                            templateParam.getValue() !== undefined)
                  {
                     template = NodeUtilities.Utils.processHandlebarsTemplate(templateParam.getValue(), inputParameters);
                  }
                  xml2js.parseString(template, function(err, result)
                  {
                     if (err)
                     {
                        getConfigOp.stop();
                        throw new Error(`Failed to compile Netconf template - ${err}`);
                     }
                     const source = JSON.parse(`{ "${NodeUtilities.Utils.findParameter(inputParameters, 'datastore').getValue()}": null }`);
                     let rpc = {};
                     if (result === null || result === undefined)
                     {
                        rpc = { 'get-config': { source: source } };
                     }
                     else
                     {
                        rpc = {
                           'get-config': {
                              source: source,
                              filter: result
                           }
                        };
                     }
                     NodeUtilities.Utils.debug('RPC Template: ' + template.replace(/(\r\n|\n|\r|\t)/gm, ' '), outer, msg);
                     client.rpc(rpc, function(theError, json)
                     {
                        let error = theError;
                        if (json === null || json === undefined)
                        {
                           error = 'No message returned';
                        }
                        if (getConfigOp.retry(error))
                        {
                           reportRetry(getConfigOp);
                           return;
                        }
                        if (error)
                        {
                           rej(error);
                        }
                        else
                        {
                           getConfigOp.stop();
                           NodeUtilities.Utils.debug('RPC Response: ' + json.raw.replace(/(\r\n|\n|\r|\t)/gm, ' '), outer, msg);
                           outputParameters = NodeUtilities.Utils.parseResponseForOutputParameters(
                              outer.NodeUtility.outputParameters,
                              json.raw
                           );
                           outputParameters.push(new Parameter({
                              parameterName: 'Raw Output',
                              parameterKey: 'rawResponse',
                              parameterType: 'string',
                              parameterDescription: 'The raw response from Netconf in the form of an XML formatted string.',
                              stringValue: json.raw,
                              outputDetails: {
                                 type: 'CUSTOM',
                                 format: ''
                              }
                           }));
                           res(true);
                        }
                     });
                  });
               }
               catch (err)
               {
                  NodeUtilities.Utils.error(err, outer, msg);
                  getConfigOp.stop();
                  rej(new Error());
               }
            });
         });
         try
         {
            const result = await retryPromise;
            if (!result)
            {
               await outer.closeClient(client);
               throw new Error('Failed to execute Netconf Get Config.');
            }
            await outer.closeClient(client);
            return outputParameters;
         }
         catch (err)
         {
            throw new Error(err);
         }
      };

      this.processGet = async function(client, theInputParameters, theOutputParameters, msg)
      {
         const inputParameters = theInputParameters;
         let outputParameters = theOutputParameters;
         const getConfigOp = NodeUtilities.Utils.getFaultTolerantOperation(inputParameters);
         const retryPromise = new Promise(function(res, rej)
         {
            getConfigOp.attempt(function()
            {
               try
               {
                  const templateParam = NodeUtilities.Utils.findParameter(inputParameters, 'template');
                  let template = '';
                  if (templateParam !== null && templateParam !== undefined && templateParam.getValue() !== null &&
                            templateParam.getValue() !== undefined)
                  {
                     template = NodeUtilities.Utils.processHandlebarsTemplate(templateParam.getValue(), inputParameters);
                  }
                  xml2js.parseString(template, function(err, result)
                  {
                     if (err)
                     {
                        getConfigOp.stop();
                        throw new Error(`Failed to compile Netconf template - ${err}`);
                     }
                     const source = JSON.parse(`{ "${NodeUtilities.Utils.findParameter(inputParameters, 'datastore').getValue()}": null }`);
                     let rpc = {};
                     if (result === null || result === undefined)
                     {
                        rpc = { 'get': { source: source } };
                     }
                     else
                     {
                        rpc = {
                           'get': {
                              source: source,
                              filter: result
                           }
                        };
                     }
                     NodeUtilities.Utils.debug('RPC Template: ' + template.replace(/(\r\n|\n|\r|\t)/gm, ' '), outer, msg);
                     client.rpc(rpc, function(theError, json)
                     {
                        let error = theError;
                        if (json === null || json === undefined)
                        {
                           error = 'No message returned';
                        }
                        if (getConfigOp.retry(error))
                        {
                           reportRetry(getConfigOp);
                           return;
                        }
                        if (error)
                        {
                           rej(error);
                        }
                        else
                        {
                           NodeUtilities.Utils.debug('RPC Response: ' + json.raw.replace(/(\r\n|\n|\r|\t)/gm, ' '), outer, msg);
                           outputParameters = NodeUtilities.Utils.parseResponseForOutputParameters(
                              outer.NodeUtility.outputParameters,
                              json.raw
                           );
                           outputParameters.push(new Parameter({
                              parameterName: 'Raw Output',
                              parameterKey: 'rawResponse',
                              parameterType: 'string',
                              parameterDescription: 'The raw response from Netconf in the form of an XML formatted string.',
                              stringValue: json.raw,
                              outputDetails: {
                                 type: 'CUSTOM',
                                 format: ''
                              }
                           }));
                           res(true);
                        }
                     });
                  });
               }
               catch (err)
               {
                  NodeUtilities.Utils.error(err, outer, msg);
                  rej(new Error());
               }
            });
         });
         try
         {
            const result = await retryPromise;
            if (!result)
            {
               await outer.closeClient(client);
               throw new Error('Failed to execute Netconf Get.');
            }
            await outer.closeClient(client);
            return outputParameters;
         }
         catch (err)
         {
            throw new Error(err);
         }
      };

      this.processGenericRPC = async function(client, theInputParameters, theOutputParameters, msg)
      {
         const inputParameters = theInputParameters;
         let outputParameters = theOutputParameters;
         const getConfigOp = NodeUtilities.Utils.getFaultTolerantOperation(inputParameters);
         const retryPromise = new Promise(function(res, rej)
         {
            getConfigOp.attempt(function()
            {
               try
               {
                  const templateParam = NodeUtilities.Utils.findParameter(inputParameters, 'template');
                  let template = '';
                  if (templateParam !== null && templateParam !== undefined && templateParam.getValue() !== null &&
                            templateParam.getValue() !== undefined)
                  {
                     template = NodeUtilities.Utils.processHandlebarsTemplate(templateParam.getValue(), inputParameters);
                  }
                  xml2js.parseString(template, function(err, result)
                  {
                     if (err)
                     {
                        getConfigOp.stop();
                        throw new Error(`Failed to compile Netconf template - ${err}`);
                     }
                     let rpc = null;
                     if (result === null || result === undefined)
                     {
                        throw new Error('No RPC body was passed in as the template.');
                     }
                     else
                     {
                        rpc = result;
                     }
                     if (rpc.rpc)
                     {
                        rpc = rpc.rpc;
                     }
                     NodeUtilities.Utils.debug('RPC Template: ' + template.replace(/(\r\n|\n|\r|\t)/gm, ' '), outer, msg);
                     client.rpc(rpc, function(theError, json)
                     {
                        let error = theError;
                        if (json === null || json === undefined)
                        {
                           error = 'No message returned';
                        }
                        if (getConfigOp.retry(error))
                        {
                           reportRetry(getConfigOp);
                           return;
                        }
                        if (error)
                        {
                           rej(error);
                        }
                        else
                        {
                           NodeUtilities.Utils.debug('RPC Response: ' + json.raw.replace(/(\r\n|\n|\r|\t)/gm, ' '), outer, msg);
                           outputParameters = NodeUtilities.Utils.parseResponseForOutputParameters(
                              outer.NodeUtility.outputParameters,
                              json.raw
                           );
                           outputParameters.push(new Parameter({
                              parameterName: 'Raw Output',
                              parameterKey: 'rawResponse',
                              parameterType: 'string',
                              parameterDescription: 'The raw response from Netconf in the form of an XML formatted string.',
                              stringValue: json.raw,
                              outputDetails: {
                                 type: 'CUSTOM',
                                 format: ''
                              }
                           }));
                           res(true);
                        }
                     });
                  });
               }
               catch (err)
               {
                  console.log(err);
                  rej(new Error());
               }
            });
         });
         try
         {
            const result = await retryPromise;
            if (!result)
            {
               await outer.closeClient(client);
               throw new Error('Failed to execute generic netconf RPC.');
            }
            await outer.closeClient(client);
            return outputParameters;
         }
         catch (err)
         {
            throw new Error(err);
         }
      };
   }
   const settingsObject = {
      settings: {
         vinoDriverNetconfCommonParameters: {
            value: [
               {
                  parameterName: 'Number of Retries',
                  parameterKey: 'retries',
                  parameterDescription: '(Optional) The number of times to retry asynchronous operations. Defaults to 5.',
                  parameterType: 'number',
                  inputDetails:
                          { isOptional: true }
               },
               {
                  parameterName: 'Retry Backoff Factor',
                  parameterKey: 'retryBackoffFactor',
                  parameterDescription: '(Optional) The factor to use when employing an exponential backoff strategy. Defaults to 3',
                  parameterType: 'number',
                  inputDetails:
                          { isOptional: true }
               },
               {
                  parameterName: 'Retry Timeout',
                  parameterKey: 'retryTimeout',
                  parameterDescription: '(Optional) The number of milliseconds to wait between retry attempts. Setting this value will' +
                      ' disable the exponential backoff strategy.',
                  parameterType: 'number',
                  inputDetails:
                          { isOptional: true }
               },
               {
                  parameterName: 'Minimum Timeout',
                  parameterKey: 'minTimeout',
                  parameterDescription: '(Optional) The minimum number of milliseconds to wait between retry attempts. This value will be' +
                      ' used when employing an exponential backoff strategy. Defaults to 10 seconds (10,000 milliseconds).',
                  parameterType: 'number',
                  inputDetails:
                          { isOptional: true }
               },
               {
                  parameterName: 'Maximum Timeout',
                  parameterKey: 'maxTimeout',
                  parameterDescription: '(Optional) The maximum number of milliseconds to wait between retry attempts. This value will be' +
                      ' used when employing an exponential backoff strategy. Defaults to 60 seconds (60,000 milliseconds).',
                  parameterType: 'number',
                  inputDetails:
                          { isOptional: true }
               }
            ],
            exportable: true
         },
         vinoDriverNetconfCommands: {
            value: [
               {
                  name: 'Netconf Edit Config',
                  key: 'Netconf_Driver_EditConfig',
                  description: 'Use to edit configurations on the Netconf server',
                  webservice: '/netconf/editconfig',
                  allowedExtractionMethods: ['REGEX', 'XPATH', 'XPATHFULL', 'JSONPATH', 'CUSTOM'],
                  inputParameters:
                      [
                         {
                            parameterName: 'Target IP Address',
                            parameterKey: 'targetAddress',
                            parameterDescription: 'IP address of the Netconf server',
                            parameterType: 'string'
                         },
                         {
                            parameterName: 'Target Port',
                            parameterKey: 'targetPort',
                            parameterDescription: 'Port of the Netconf server',
                            parameterType: 'number'
                         },
                         {
                            parameterName: 'Target Username',
                            parameterKey: 'targetUserName',
                            parameterDescription: 'Username for the Netconf server',
                            parameterType: 'string'
                         },
                         {
                            parameterName: 'Target Password',
                            parameterKey: 'targetPassword',
                            parameterDescription: 'Password for the Netconf server',
                            parameterType: 'string',
                            encrypt: true,
                            inputDetails:
                               { isOptional: true }
                         },
                         {
                            parameterName: 'SSH Key',
                            parameterKey: 'sshKey',
                            parameterDescription: 'SSH Private Key for the Netconf server',
                            parameterType: 'string',
                            inputDetails:
                               { isOptional: true }
                         },
                         {
                            parameterName: 'Template',
                            parameterKey: 'template',
                            parameterDescription: 'Template string for the "edit-config" operation. Uses Handlebars templating',
                            parameterType: 'encodedString'
                         },
                         {
                            parameterName: 'Datastore',
                            parameterKey: 'datastore',
                            parameterDescription: 'Datastore to operate on: \'running\', \'candidate\', \'startup\'',
                            parameterType: 'enumerated',
                            inputDetails:
                               { options: ['running', 'candidate', 'startup'] }
                         },
                         {
                            parameterName: 'datastore operation',
                            parameterKey: 'operation',
                            parameterDescription: 'datastore operation: \'merge\', \'replace\', \'none\'',
                            parameterType: 'enumerated',
                            inputDetails:
                               {
                                  isOptional: true,
                                  options: ['merge', 'replace', 'none']
                               }
                         },
                         {
                            parameterName: 'Commit',
                            parameterKey: 'commit',
                            parameterDescription: 'Set to true if you want to send a commit after the edit-config',
                            parameterType: 'boolean'
                         },
                         {
                            parameterName: 'Copy Running To Candidate',
                            parameterKey: 'copyRunningToCandidate',
                            parameterDescription: 'Set to true if you want to copy the running config to the candidate ' +
                            'config before the edit-config operation',
                            parameterType: 'boolean'
                         }
                      ],
                  outputParameters:
                      [
                      ]
               },
               {
                  name: 'Netconf Generic RPC',
                  key: 'Netconf_Driver_GenericRpc',
                  description: 'Use to send a generic RPC message to the Netconf server and optionally wait for a reply',
                  webservice: '/netconf/genericrpc',
                  allowedExtractionMethods: ['REGEX', 'XPATH', 'XPATHFULL', 'JSONPATH', 'CUSTOM'],
                  inputParameters:
                      [
                         {
                            parameterName: 'Target IP Address',
                            parameterKey: 'targetAddress',
                            parameterDescription: 'IP address of the Netconf server',
                            parameterType: 'string'
                         },
                         {
                            parameterName: 'Target Port',
                            parameterKey: 'targetPort',
                            parameterDescription: 'Port of the Netconf server',
                            parameterType: 'number'
                         },
                         {
                            parameterName: 'Target Username',
                            parameterKey: 'targetUserName',
                            parameterDescription: 'Username for the Netconf server',
                            parameterType: 'string'
                         },
                         {
                            parameterName: 'Target Password',
                            parameterKey: 'targetPassword',
                            parameterDescription: 'Password for the Netconf server',
                            parameterType: 'string',
                            encrypt: true,
                            inputDetails:
                               { isOptional: true }
                         },
                         {
                            parameterName: 'SSH Key',
                            parameterKey: 'sshKey',
                            parameterDescription: 'SSH Private Key for the Netconf server',
                            parameterType: 'string',
                            inputDetails:
                               { isOptional: true }
                         },
                         {
                            parameterName: 'Template',
                            parameterKey: 'template',
                            parameterDescription: 'Template string for the rpc request body. Uses Handlebars templating',
                            parameterType: 'encodedString'
                         }
                      ],
                  outputParameters:
                      [
                         {
                            parameterName: 'Raw Response',
                            parameterKey: 'rawResponse',
                            parameterDescription: 'The raw response from the Netconf API. XML formatted String',
                            parameterType: 'string',
                            outputDetails:
                            {
                               type: 'CUSTOM',
                               format: 'unused'
                            }
                         }
                      ]
               },
               {
                  name: 'Netconf Get Config',
                  key: 'Netconf_Driver_GetConfig',
                  description: 'Use to get configuration data from the Netconf server',
                  allowedExtractionMethods: ['REGEX', 'XPATH', 'XPATHFULL', 'JSONPATH', 'CUSTOM'],
                  inputParameters:
                      [
                         {
                            parameterName: 'Target IP Address',
                            parameterKey: 'targetAddress',
                            parameterDescription: 'IP address of the Netconf server',
                            parameterType: 'string'
                         },
                         {
                            parameterName: 'Target Port',
                            parameterKey: 'targetPort',
                            parameterDescription: 'Port of the Netconf server',
                            parameterType: 'number'
                         },
                         {
                            parameterName: 'Target Username',
                            parameterKey: 'targetUserName',
                            parameterDescription: 'Username for the Netconf server',
                            parameterType: 'string'
                         },
                         {
                            parameterName: 'Target Password',
                            parameterKey: 'targetPassword',
                            parameterDescription: 'Password for the Netconf server',
                            parameterType: 'string',
                            encrypt: true,
                            inputDetails:
                               { isOptional: true }
                         },
                         {
                            parameterName: 'SSH Key',
                            parameterKey: 'sshKey',
                            parameterDescription: 'SSH Private Key for the Netconf server',
                            parameterType: 'string',
                            inputDetails:
                               { isOptional: true }
                         },
                         {
                            parameterName: 'Datastore',
                            parameterKey: 'datastore',
                            parameterDescription: 'Datastore to operate on: \'running\', \'candidate\', \'startup\'',
                            parameterType: 'enumerated',
                            inputDetails:
                               { options: ['running', 'candidate', 'startup'] }
                         },
                         {
                            parameterName: 'Template',
                            parameterKey: 'template',
                            parameterDescription: 'Template string for the "get-config" operation. Uses Handlebars templating',
                            parameterType: 'encodedString',
                            inputDetails:
                               { isOptional: true }
                         }
                      ],
                  outputParameters:
                      [
                         {
                            parameterName: 'Raw Response',
                            parameterKey: 'rawResponse',
                            parameterDescription: 'The raw response from the Netconf API. XML formatted String',
                            parameterType: 'string',
                            outputDetails:
                            {
                               type: 'CUSTOM',
                               format: 'unused'
                            }
                         }
                      ]
               },
               {
                  name: 'Netconf Get',
                  key: 'Netconf_Driver_Get',
                  description: 'Use to get configuration data and device state information from the Netconf server',
                  allowedExtractionMethods: ['REGEX', 'XPATH', 'XPATHFULL', 'JSONPATH', 'CUSTOM'],
                  inputParameters:
                      [
                         {
                            parameterName: 'Target IP Address',
                            parameterKey: 'targetAddress',
                            parameterDescription: 'IP address of the Netconf server',
                            parameterType: 'string'
                         },
                         {
                            parameterName: 'Target Port',
                            parameterKey: 'targetPort',
                            parameterDescription: 'Port of the Netconf server',
                            parameterType: 'number'
                         },
                         {
                            parameterName: 'Target Username',
                            parameterKey: 'targetUserName',
                            parameterDescription: 'Username for the Netconf server',
                            parameterType: 'string'
                         },
                         {
                            parameterName: 'Target Password',
                            parameterKey: 'targetPassword',
                            parameterDescription: 'Password for the Netconf server',
                            parameterType: 'string',
                            encrypt: true,
                            inputDetails:
                               { isOptional: true }
                         },
                         {
                            parameterName: 'SSH Key',
                            parameterKey: 'sshKey',
                            parameterDescription: 'SSH Private Key for the Netconf server',
                            parameterType: 'string',
                            inputDetails:
                               { isOptional: true }
                         },
                         {
                            parameterName: 'Datastore',
                            parameterKey: 'datastore',
                            parameterDescription: 'Datastore to operate on: \'running\', \'candidate\', \'startup\'',
                            parameterType: 'enumerated',
                            inputDetails:
                               { options: ['running', 'candidate', 'startup'] }
                         },
                         {
                            parameterName: 'Template',
                            parameterKey: 'template',
                            parameterDescription: 'Template string for the "get-config" operation. Uses Handlebars templating',
                            parameterType: 'encodedString',
                            inputDetails:
                               { isOptional: true }
                         },
                         {
                            parameterName: 'Number of Retries',
                            parameterKey: 'retries',
                            parameterDescription: 'The number of retries to attempt when performing an action.  Defaults to 5',
                            parameterType: 'number',
                            inputDetails:
                               { isOptional: true }
                         },
                         {
                            parameterName: 'Wait time between retries',
                            parameterKey: 'retryTimeout',
                            parameterDescription: 'The number of milli-seconds to wait between retries. ' +
                            'Defaults to 10 seconds (10,000 milli-seconds)',
                            parameterType: 'number',
                            inputDetails:
                               { isOptional: true }
                         }
                      ],
                  outputParameters:
                      [
                         {
                            parameterName: 'Raw Response',
                            parameterKey: 'rawResponse',
                            parameterDescription: 'The raw response from the Netconf API. XML formatted String',
                            parameterType: 'string',
                            outputDetails:
                            {
                               type: 'CUSTOM',
                               format: 'unused'
                            }
                         }
                      ]
               }

            ],
            exportable: true
         }
      }
   };
   RED.nodes.registerType('vino-driver-netconf', NetconfDriverNode, settingsObject);
};
