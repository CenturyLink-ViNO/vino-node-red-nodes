const NodeUtilities = require('../../lib/driver-utils/index');
const VinoNodeUtility = NodeUtilities.VinoNodeUtility;
const Parameter = require('../../lib/driver-utils/parameter');
const Ansible = require('node-ansible');
const filesystem = require('fs');

const inventoryTemplate = 'vino ansible_port={{#if targetPort}}{{targetPort}}{{else}}22{{/if}} ansible_ssh_host={{targetAddress}} ' +
    '{{#if ssh_username}}ansible_user={{ssh_username}}{{/if}} ' +
    '{{#if ssh_password}}ansible_ssh_pass={{ssh_password}}{{/if}}' +
    '{{#if ssh_private_key}}ansible_ssh_private_key_file={{ssh_private_key}}{{/if}}';

module.exports = function(RED)
{
   function findMatchingBracketsIndex(string, openBracketIndex)
   {
      let ret = -1;
      let depth = 0;
      if (string.charAt(openBracketIndex) === '{')
      {
         let index;
         for (index = openBracketIndex; index < string.length; index += 1)
         {
            if (string.charAt(index) === '{')
            {
               depth += 1;
            }
            if (string.charAt(index) === '}')
            {
               if (depth === 1)
               {
                  ret = index;
                  break;
               }
               depth -= 1;
            }
         }
      }
      return ret;
   }

   function AnsibleDriverNode(config)
   {
      RED.nodes.createNode(this, config);
      this.NodeUtility = new VinoNodeUtility(
         config.name, config.description, config.baseTypes,
         config.selectedBaseType, RED
      );
      this.description = config.description;
      this.statusConfiguration = config.statusConfiguration;
      this.outputProcessingType = config.outputProcessingType;
      const outer = this;

      outer.on('input', async function(msg)
      {
         let vinoServiceActivation = null;
         if (msg.vino && msg.vino.serviceActivationId)
         {
            vinoServiceActivation = outer.context().global.vinoServiceActivations[msg.vino.serviceActivationId];
            if (!vinoServiceActivation)
            {
               throw new Error('No valid service activation was found for the ID: ' + msg.vino.serviceActivationId);
            }
            if (vinoServiceActivation.checkForCancellation(outer, msg))
            {
               return;
            }
            vinoServiceActivation.stepActivating(outer, msg);
         }
         outer.status({
            fill: 'green',
            shape: 'dot',
            text: 'Running Ansible playbook'
         });

         const utils = NodeUtilities.Utils;

         let tmpPlaybookPath = '';
         let tmpInventoryPath = '';
         try
         {
            const inputParameters = await outer.NodeUtility.processInputParameters(msg, outer);
            let outputParameters = null;
            const playbookTemplate = NodeUtilities.Utils.findParameter(inputParameters, 'playbook');
            if (playbookTemplate === null || playbookTemplate === undefined || !playbookTemplate.hasValue())
            {
               throw new Error('Failed to process Ansible command. No template was present in activation request.');
            }
            const playbook = NodeUtilities.Utils.processMustacheTemplate(playbookTemplate.getValue(), inputParameters);
            const logPlaybook = NodeUtilities.Utils.processMustacheTemplate(playbookTemplate.getValue(), inputParameters, true);
            const inventory = NodeUtilities.Utils.processHandlebarsTemplate(inventoryTemplate, inputParameters);
            utils.debug(`generated inventory file:\n---------------------------------------------------------------\n${inventory}\n\n`, outer, msg);
            utils.debug(`generated playbook file:\n---------------------------------------------------------------\n${logPlaybook}\n\n`, outer, msg);
            tmpPlaybookPath = `/tmp/temp-playbook-${Date.now()}.yml`;
            tmpInventoryPath = `/tmp/temp-inventory-${Date.now()}`;
            try
            {
               filesystem.writeFileSync(tmpPlaybookPath, playbook);
            }
            catch (err)
            {
               throw new Error(`Failed to write temporary playbook: ${err}`);
            }
            try
            {
               filesystem.writeFileSync(tmpInventoryPath, inventory);
            }
            catch (err)
            {
               throw new Error(`Failed to write temporary inventory: ${err}`);
            }
            const splitPlaybookPath = tmpPlaybookPath.split('.')[0];
            const ansibleOp = utils.getFaultTolerantOperation(inputParameters);
            const reportRetry = function()
            {
               const timeoutsString = '_timeouts';
               const attemptTimeInSeconds = ansibleOp[timeoutsString][0] / 1000;
               if (!isNaN(attemptTimeInSeconds))
               {
                  const retryMessage = 'Ansible step failed. Waiting ' + attemptTimeInSeconds + ' seconds and retrying';
                  if (vinoServiceActivation)
                  {
                     vinoServiceActivation.setStatus('Retry', retryMessage, outer);
                  }
                  utils.log(retryMessage, outer, msg);
               }
            };
            const retryPromise = new Promise(function(res, rej)
            {
               ansibleOp.attempt(function()
               {
                  const command = new Ansible.Playbook().playbook(splitPlaybookPath).inventory(tmpInventoryPath).verbose('v');
                  let stdOut = '';
                  let stdErr = '';
                  command.on('stdout', function(data)
                  {
                     stdOut = stdOut + data.toString('utf8');
                  });
                  command.on('stderr', function(data)
                  {
                     stdErr = stdErr + data.toString('utf8');
                  });
                  try
                  {
                     command.exec().then(function(result)
                     {
                        utils.log(result.output, outer, msg);
                        ansibleOp.stop();
                        const resultRegex = /^changed:.*=> ({.*}).*$/gm;
                        let resultObject;
                        let resultJson;
                        let parseString = '';
                        switch (outer.outputProcessingType)
                        {
                        case 'stdout':
                           resultObject = resultRegex.exec(result.output);
                           if (resultObject)
                           {
                              resultJson = JSON.parse(resultObject[1]);
                              if (resultJson.stdout)
                              {
                                 parseString = resultJson.stdout;
                              }
                           }
                           outputParameters = NodeUtilities.Utils.parseResponseForOutputParameters(
                              outer.NodeUtility.outputParameters,
                              parseString
                           );
                           break;
                        case 'stderr':
                           resultObject = resultRegex.exec(result.output);
                           if (resultObject)
                           {
                              resultJson = JSON.parse(resultObject[1]);
                              if (resultJson.stdErr)
                              {
                                 parseString = resultJson.stderr;
                              }
                           }
                           outputParameters = NodeUtilities.Utils.parseResponseForOutputParameters(
                              outer.NodeUtility.outputParameters,
                              parseString
                           );
                           break;
                        case 'full':
                        default:
                           outputParameters = NodeUtilities.Utils.parseResponseForOutputParameters(
                              outer.NodeUtility.outputParameters,
                              result.output
                           );
                           break;
                        }
                        outputParameters.push(new Parameter({
                           parameterName: 'Raw Output',
                           parameterKey: 'rawResponse',
                           parameterType: 'string',
                           parameterDescription: 'The raw response from the Ansible playbook execution.',
                           stringValue: result.output,
                           outputDetails: {
                              type: 'CUSTOM',
                              format: ''
                           }
                        }));
                        res([true]);
                     }, function(err)
                     {
                        utils.error(err, outer, msg);
                        utils.error(stdErr, outer, msg);
                        reportRetry();
                        if (ansibleOp.retry(err))
                        {
                           return;
                        }
                        let failureMessage;
                        if (err.message)
                        {
                           const startFatal = err.message.indexOf('fatal: [vino]');
                           if (startFatal > 0)
                           {
                              const fatalString = err.message.slice(startFatal);
                              const jsonStart = fatalString.indexOf('{');
                              const jsonEnd = findMatchingBracketsIndex(fatalString, jsonStart);
                              const jsonString = fatalString.slice(jsonStart, jsonEnd + 1);
                              const jsonObject = JSON.parse(jsonString);
                              if (jsonObject.hasOwnProperty('stderr'))
                              {
                                 failureMessage = jsonObject.stderr;
                              }
                           }
                        }
                        if (failureMessage)
                        {
                           rej(new Error('Playbook failure: ' + failureMessage));
                        }
                        else
                        {
                           rej(new Error([false, err + ' - ' + stdErr]));
                        }
                     });
                  }
                  catch (err)
                  {
                     utils.error(err, outer, msg);
                     reject(new Error(err));
                  }
               }, NodeUtilities.getFaultTolerantTimeoutOpts(inputParameters, function()
               {
                  reportRetry();
                  if (ansibleOp.retry('Ansible operation timed out.'))
                  {
                     return;
                  }
                  rej(new Error([false, 'Ansible operation timed out.']));
               }));
            });
            const result = await retryPromise;
            if (!result[0])
            {
               throw new Error(result[1]);
            }
            if (Array.isArray(outer.NodeUtility.outputParameters))
            {
               outer.NodeUtility.processOutputParameters(outputParameters, outer, msg);
            }
            if (vinoServiceActivation)
            {
               vinoServiceActivation.stepActivated(outer, inputParameters, outputParameters, null, msg);
            }
            outer.status({
               fill: 'green',
               shape: 'dot',
               text: 'Ansible Playbook ran successfully'
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
               text: 'Error running Ansible playbook. ' + errMsg.length > 20 ? errMsg.subString(0, 20) : errMsg
            });
         }
         finally
         {
            try
            {
               if (filesystem.existsSync(tmpPlaybookPath))
               {
                  filesystem.unlinkSync(tmpPlaybookPath);
                  utils.debug('Deleted temporary playbook file', outer, msg);
               }
               if (filesystem.existsSync(tmpInventoryPath))
               {
                  filesystem.unlinkSync(tmpInventoryPath);
                  utils.debug('Deleted temporary inventory file', outer, msg);
               }
            }
            catch (error)
            {
               utils.error(error, outer, msg);
            }
         }
      });
   }

   const settingsObject = {
      settings: {
         vinoDriverAnsibleCommonParameters: {
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
         vinoDriverAnsibleCommands: {
            value: [
               {
                  name: 'Ansible',
                  key: 'Ansible_Driver',
                  description: 'Use to execute an Ansible playbook on a target machine',
                  webservice: '/ansible/execute',
                  allowedExtractionMethods: ['REGEX', 'CUSTOM'],
                  inputParameters:
                            [
                               {
                                  parameterName: 'SSH Private Key',
                                  parameterKey: 'ssh_private_key',
                                  parameterDescription: 'SSH Private Key for Ansible to use when logging in to Virtual Machines',
                                  parameterType: 'string',
                                  inputDetails:
                                        {
                                           isOptional: true,
                                           fromConstants: true,
                                           constantsPath: 'openstack/sshPrivateKey'
                                        }
                               },
                               {
                                  parameterName: 'SSH Username',
                                  parameterKey: 'ssh_username',
                                  parameterDescription: 'SSH username for Ansible to use when logging in to Virtual Machines',
                                  parameterType: 'string',
                                  inputDetails:
                                        { isOptional: true }
                               },
                               {
                                  parameterName: 'SSH Password',
                                  parameterKey: 'ssh_password',
                                  parameterDescription: 'SSH password for Ansible to use when logging in to Virtual Machines',
                                  parameterType: 'string',
                                  inputDetails:
                                        { isOptional: true }
                               },
                               {
                                  parameterName: 'Playbook',
                                  parameterKey: 'playbook',
                                  parameterDescription: 'The contents or a reference of the playbook. Uses Mustache templating',
                                  parameterType: 'encodedString'
                               },
                               {
                                  parameterName: 'Target IP Address',
                                  parameterKey: 'targetAddress',
                                  parameterDescription: 'IP Address of the target machine to run the playbook on',
                                  parameterType: 'string'
                               },
                               {
                                  parameterName: 'Target Port',
                                  parameterKey: 'targetPort',
                                  parameterDescription: 'The TCP port where Ansible will attempt an SSH connection.  Defaults to port 22',
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
                                  parameterDescription: 'The raw response from the Ansible playbook execution.',
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
   RED.nodes.registerType('vino-driver-ansible', AnsibleDriverNode, settingsObject);
};
