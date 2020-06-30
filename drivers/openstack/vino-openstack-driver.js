/* globals path */

/* eslint max-lines: ["off"] */
/* eslint max-lines-per-function: ["off"] */
/* eslint max-statements: ["off"] */
/* eslint complexity: ["off"] */

const NodeUtilities = require('../../lib/driver-utils/index');
const OpenstackNetworkClient = require('./model/NetworkClient');
const OpenstackComputeClient = require('./model/ComputeClient');
const OpenstackBlockStorageClient = require('./model/BlockStorageClient');
const Parameter = require('../../lib/driver-utils/parameter');
const VinoNodeUtility = NodeUtilities.VinoNodeUtility;
const settingsObject = require('./nodeConfig.json');

module.exports = function(RED)
{
   function OpenstackDriverNode(config)
   {
      RED.nodes.createNode(this, config);
      this.NodeUtility = new VinoNodeUtility(
         config.name, config.description, config.baseTypes,
         config.selectedBaseType, RED
      );
      this.description = config.description;
      this.statusConfiguration = config.statusConfiguration;
      const outer = this;
      const utils = NodeUtilities.Utils;

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
            text: 'Starting Openstack Operation'
         });
         try
         {
            const inputParameters = await outer.NodeUtility.processInputParameters(msg, outer);
            utils.debug('Starting Openstack operation: ' + outer.NodeUtility.selectedBaseType, outer, msg);
            const result = await outer.processMessage(msg, outer, inputParameters);
            if (!result[0])
            {
               throw new Error(result[1]);
            }
            if (Array.isArray(outer.NodeUtility.outputParameters))
            {
               outer.NodeUtility.processOutputParameters(result[1], outer, msg);
            }
            if (vinoServiceActivation)
            {
               vinoServiceActivation.stepActivated(outer, inputParameters, result[1], null, msg);
            }
            outer.status({
               fill: 'green',
               shape: 'dot',
               text: 'Openstack operation completed successfully'
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
               text: 'Openstack Operation Failed' + errMsg.length > 20 ? errMsg.subString(0, 20) : errMsg
            });
         }
      });

      this.processMessage = async function(msg, node, inputParameters)
      {
         let client;
         let output;
         switch (node.NodeUtility.selectedBaseType)
         {
         /** ******************************************/
         /* Networks                                 */
         /** ******************************************/
         case 'Openstack_Driver_Get_Networks':
            client = new OpenstackNetworkClient(inputParameters);
            output = [];
            try
            {
               const result = await client.getNetworks();
               output[0] = true;
               const outputParams = [];
               output[1] = outputParams;
               outputParams.push(new Parameter({
                  parameterName: 'Raw Output',
                  parameterKey: 'rawResponse',
                  parameterType: 'string',
                  parameterDescription: 'The raw response from Openstack in the form of a JSON formatted string.',
                  stringValue: JSON.stringify(result),
                  outputDetails: {
                     type: 'CUSTOM',
                     format: ''
                  }
               }));
            }
            catch (err)
            {
               output[0] = false;
               output[1] = err;
            }
            return output;
         case 'Openstack_Driver_Get_Network':
            client = new OpenstackNetworkClient(inputParameters);
            output = [];
            try
            {
               const result = await client.getNetwork();
               output[0] = true;
               const outputParams = [];
               output[1] = outputParams;
               outputParams.push(new Parameter({
                  parameterName: 'Raw Output',
                  parameterKey: 'rawResponse',
                  parameterType: 'string',
                  parameterDescription: 'The raw response from Openstack in the form of a JSON formatted string.',
                  stringValue: JSON.stringify(result),
                  outputDetails: {
                     type: 'CUSTOM',
                     format: ''
                  }
               }));
            }
            catch (err)
            {
               output[0] = false;
               output[1] = err;
            }
            return output;
         case 'Openstack_Driver_Network':
            client = new OpenstackNetworkClient(inputParameters);
            output = [];
            try
            {
               const result = await client.createNetwork();
               output[0] = true;
               const outputParams = [];
               output[1] = outputParams;
               outputParams.push(new Parameter({
                  parameterName: 'Raw Output',
                  parameterKey: 'rawResponse',
                  parameterType: 'string',
                  parameterDescription: 'The raw response from Openstack in the form of a JSON formatted string.',
                  stringValue: JSON.stringify(result),
                  outputDetails: {
                     type: 'CUSTOM',
                     format: ''
                  }
               }));
               outputParams.push(new Parameter({
                  parameterName: 'Network ID',
                  parameterKey: 'openstack_network_id',
                  parameterType: 'string',
                  parameterDescription: 'The ID of the network that was created.',
                  stringValue: result.id,
                  outputDetails: {
                     type: 'CUSTOM',
                     format: ''
                  }
               }));
               outputParams.push(new Parameter({
                  parameterName: 'Network Name',
                  parameterKey: 'openstack_network_name',
                  parameterType: 'string',
                  parameterDescription: 'The name (or ID if no name was provided) of the network that was created.',
                  stringValue: result.name || result.id,
                  outputDetails: {
                     type: 'CUSTOM',
                     format: ''
                  }
               }));
            }
            catch (err)
            {
               output[0] = false;
               output[1] = err;
            }
            return output;
         case 'Openstack_Driver_Network_Modify':
            client = new OpenstackNetworkClient(inputParameters);
            output = [];
            try
            {
               const result = await client.updateNetwork();
               output[0] = true;
               const outputParams = [];
               output[1] = outputParams;
               outputParams.push(new Parameter({
                  parameterName: 'Raw Output',
                  parameterKey: 'rawResponse',
                  parameterType: 'string',
                  parameterDescription: 'The raw response from Openstack in the form of a JSON formatted string.',
                  stringValue: JSON.stringify(result),
                  outputDetails: {
                     type: 'CUSTOM',
                     format: ''
                  }
               }));
               outputParams.push(new Parameter({
                  parameterName: 'Network ID',
                  parameterKey: 'openstack_network_id',
                  parameterType: 'string',
                  parameterDescription: 'The ID of the network that was modified.',
                  stringValue: result.id,
                  outputDetails: {
                     type: 'CUSTOM',
                     format: ''
                  }
               }));
               outputParams.push(new Parameter({
                  parameterName: 'Network Name',
                  parameterKey: 'openstack_network_name',
                  parameterType: 'string',
                  parameterDescription: 'The name (or ID if no name was provided) of the network that was modified.',
                  stringValue: result.name || result.id,
                  outputDetails: {
                     type: 'CUSTOM',
                     format: ''
                  }
               }));
            }
            catch (err)
            {
               output[0] = false;
               output[1] = err;
            }
            return output;
         case 'Openstack_Driver_Network_Delete':
            client = new OpenstackNetworkClient(inputParameters);
            output = [];
            try
            {
               const result = await client.destroyNetwork();
               output[0] = true;
               const outputParams = [];
               output[1] = outputParams;
               outputParams.push(new Parameter({
                  parameterName: 'Raw Output',
                  parameterKey: 'rawResponse',
                  parameterType: 'string',
                  parameterDescription: 'The raw response from Openstack in the form of a JSON formatted string.',
                  stringValue: JSON.stringify(result),
                  outputDetails: {
                     type: 'CUSTOM',
                     format: ''
                  }
               }));
            }
            catch (err)
            {
               output[0] = false;
               output[1] = err;
            }
            return output;
            /** ******************************************/
            /* Subnets                                  */
            /** ******************************************/
         case 'Openstack_Driver_Get_Subnets':
            client = new OpenstackNetworkClient(inputParameters);
            output = [];
            try
            {
               const result = await client.getSubnets();
               output[0] = true;
               const outputParams = [];
               output[1] = outputParams;
               outputParams.push(new Parameter({
                  parameterName: 'Raw Output',
                  parameterKey: 'rawResponse',
                  parameterType: 'string',
                  parameterDescription: 'The raw response from Openstack in the form of a JSON formatted string.',
                  stringValue: JSON.stringify(result),
                  outputDetails: {
                     type: 'CUSTOM',
                     format: ''
                  }
               }));
            }
            catch (err)
            {
               output[0] = false;
               output[1] = err;
            }
            return output;
         case 'Openstack_Driver_Get_Subnet':
            client = new OpenstackNetworkClient(inputParameters);
            output = [];
            try
            {
               const result = await client.getSubnet();
               output[0] = true;
               const outputParams = [];
               output[1] = outputParams;
               outputParams.push(new Parameter({
                  parameterName: 'Raw Output',
                  parameterKey: 'rawResponse',
                  parameterType: 'string',
                  parameterDescription: 'The raw response from Openstack in the form of a JSON formatted string.',
                  stringValue: JSON.stringify(result),
                  outputDetails: {
                     type: 'CUSTOM',
                     format: ''
                  }
               }));
            }
            catch (err)
            {
               output[0] = false;
               output[1] = err;
            }
            return output;
         case 'Openstack_Driver_Subnet':
            client = new OpenstackNetworkClient(inputParameters);
            output = [];
            try
            {
               const result = await client.createSubnet();
               output[0] = true;
               const outputParams = [];
               output[1] = outputParams;
               outputParams.push(new Parameter({
                  parameterName: 'Raw Output',
                  parameterKey: 'rawResponse',
                  parameterType: 'string',
                  parameterDescription: 'The raw response from Openstack in the form of a JSON formatted string.',
                  stringValue: JSON.stringify(result),
                  outputDetails: {
                     type: 'CUSTOM',
                     format: ''
                  }
               }));
               outputParams.push(new Parameter({
                  parameterName: 'Subnet ID',
                  parameterKey: 'openstack_subnet_id',
                  parameterType: 'string',
                  parameterDescription: 'The ID of the subnet that was created.',
                  stringValue: result.id,
                  outputDetails: {
                     type: 'CUSTOM',
                     format: ''
                  }
               }));
               outputParams.push(new Parameter({
                  parameterName: 'Subnet Name',
                  parameterKey: 'openstack_subnet_name',
                  parameterType: 'string',
                  parameterDescription: 'The name (or ID if no name was provided) of the subnet that was created.',
                  stringValue: result.name || result.id,
                  outputDetails: {
                     type: 'CUSTOM',
                     format: ''
                  }
               }));
            }
            catch (err)
            {
               output[0] = false;
               output[1] = err;
            }
            return output;
         case 'Openstack_Driver_Modify_Subnet':
            client = new OpenstackNetworkClient(inputParameters);
            output = [];
            try
            {
               const result = await client.updateSubnet();
               output[0] = true;
               const outputParams = [];
               output[1] = outputParams;
               outputParams.push(new Parameter({
                  parameterName: 'Raw Output',
                  parameterKey: 'rawResponse',
                  parameterType: 'string',
                  parameterDescription: 'The raw response from Openstack in the form of a JSON formatted string.',
                  stringValue: JSON.stringify(result),
                  outputDetails: {
                     type: 'CUSTOM',
                     format: ''
                  }
               }));
               outputParams.push(new Parameter({
                  parameterName: 'Subnet ID',
                  parameterKey: 'openstack_subnet_id',
                  parameterType: 'string',
                  parameterDescription: 'The ID of the subnet that was modified.',
                  stringValue: result.id,
                  outputDetails: {
                     type: 'CUSTOM',
                     format: ''
                  }
               }));
               outputParams.push(new Parameter({
                  parameterName: 'Subnet Name',
                  parameterKey: 'openstack_subnet_name',
                  parameterType: 'string',
                  parameterDescription: 'The name (or ID if no name was provided) of the subnet that was modified.',
                  stringValue: result.name || result.id,
                  outputDetails: {
                     type: 'CUSTOM',
                     format: ''
                  }
               }));
            }
            catch (err)
            {
               output[0] = false;
               output[1] = err;
            }
            return output;
         case 'Openstack_Driver_Subnet_Delete':
            client = new OpenstackNetworkClient(inputParameters);
            output = [];
            try
            {
               const result = await client.destroySubnet();
               output[0] = true;
               const outputParams = [];
               output[1] = outputParams;
               outputParams.push(new Parameter({
                  parameterName: 'Raw Output',
                  parameterKey: 'rawResponse',
                  parameterType: 'string',
                  parameterDescription: 'The raw response from Openstack in the form of a JSON formatted string.',
                  stringValue: JSON.stringify(result),
                  outputDetails: {
                     type: 'CUSTOM',
                     format: ''
                  }
               }));
            }
            catch (err)
            {
               output[0] = false;
               output[1] = err;
            }
            return output;
            /** ******************************************/
            /* Ports                                    */
            /** ******************************************/
         case 'Openstack_Driver_Get_Ports':
            client = new OpenstackNetworkClient(inputParameters);
            output = [];
            try
            {
               const result = await client.getPorts();
               output[0] = true;
               const outputParams = [];
               output[1] = outputParams;
               outputParams.push(new Parameter({
                  parameterName: 'Raw Output',
                  parameterKey: 'rawResponse',
                  parameterType: 'string',
                  parameterDescription: 'The raw response from Openstack in the form of a JSON formatted string.',
                  stringValue: JSON.stringify(result),
                  outputDetails: {
                     type: 'CUSTOM',
                     format: ''
                  }
               }));
            }
            catch (err)
            {
               output[0] = false;
               output[1] = err;
            }
            return output;
         case 'Openstack_Driver_Get_Port':
            client = new OpenstackNetworkClient(inputParameters);
            output = [];
            try
            {
               const result = await client.getPort();
               output[0] = true;
               const outputParams = [];
               output[1] = outputParams;
               outputParams.push(new Parameter({
                  parameterName: 'Raw Output',
                  parameterKey: 'rawResponse',
                  parameterType: 'string',
                  parameterDescription: 'The raw response from Openstack in the form of a JSON formatted string.',
                  stringValue: JSON.stringify(result),
                  outputDetails: {
                     type: 'CUSTOM',
                     format: ''
                  }
               }));
            }
            catch (err)
            {
               output[0] = false;
               output[1] = err;
            }
            return output;
         case 'Openstack_Driver_Port':
            client = new OpenstackNetworkClient(inputParameters);
            output = [];
            try
            {
               const result = await client.createPort();
               output[0] = true;
               const outputParams = [];
               output[1] = outputParams;
               outputParams.push(new Parameter({
                  parameterName: 'Raw Output',
                  parameterKey: 'rawResponse',
                  parameterType: 'string',
                  parameterDescription: 'The raw response from Openstack in the form of a JSON formatted string.',
                  stringValue: JSON.stringify(result),
                  outputDetails: {
                     type: 'CUSTOM',
                     format: ''
                  }
               }));
               outputParams.push(new Parameter({
                  parameterName: 'Port ID',
                  parameterKey: 'openstack_port_id',
                  parameterType: 'string',
                  parameterDescription: 'The ID of the port that was created.',
                  stringValue: result.id,
                  outputDetails: {
                     type: 'CUSTOM',
                     format: ''
                  }
               }));
               outputParams.push(new Parameter({
                  parameterName: 'Port Name',
                  parameterKey: 'openstack_port_name',
                  parameterType: 'string',
                  parameterDescription: 'The name (or ID if no name was provided) of the port that was created.',
                  stringValue: result.name || result.id,
                  outputDetails: {
                     type: 'CUSTOM',
                     format: ''
                  }
               }));
               const portAddresses = [];
               let addressFound = false;
               if (result.fixedIps !== null && result.fixedIps !== undefined && Array.isArray(result.fixedIps))
               {
                  for (const idx in result.fixedIps)
                  {
                     if (result.fixedIps.hasOwnProperty(idx))
                     {
                        addressFound = true;
                        portAddresses.push(result.fixedIps[idx].ip_address);
                     }
                  }
               }
               if (!addressFound)
               {
                  portAddresses.push('0.0.0.0');
               }
               outputParams.push(new Parameter({
                  parameterName: 'Port Addresses',
                  parameterKey: 'openstack_port_addresses',
                  parameterType: 'stringList',
                  parameterDescription: 'A list of addresses assigned to this port.',
                  stringListValue: portAddresses,
                  outputDetails: {
                     type: 'CUSTOM',
                     format: ''
                  }
               }));
            }
            catch (err)
            {
               output[0] = false;
               output[1] = err;
            }
            return output;
         case 'Openstack_Driver_Modify_Port':
            client = new OpenstackNetworkClient(inputParameters);
            output = [];
            try
            {
               const result = await client.updatePort();
               output[0] = true;
               const outputParams = [];
               output[1] = outputParams;
               outputParams.push(new Parameter({
                  parameterName: 'Raw Output',
                  parameterKey: 'rawResponse',
                  parameterType: 'string',
                  parameterDescription: 'The raw response from Openstack in the form of a JSON formatted string.',
                  stringValue: JSON.stringify(result),
                  outputDetails: {
                     type: 'CUSTOM',
                     format: ''
                  }
               }));
            }
            catch (err)
            {
               output[0] = false;
               output[1] = err;
            }
            return output;
         case 'Openstack_Driver_Attach_Port_To_Device':
            client = new OpenstackNetworkClient(inputParameters);
            output = [];
            try
            {
               const result = await client.attachPort();
               output[0] = true;
               const outputParams = [];
               output[1] = outputParams;
               outputParams.push(new Parameter({
                  parameterName: 'Raw Output',
                  parameterKey: 'rawResponse',
                  parameterType: 'string',
                  parameterDescription: 'The raw response from Openstack in the form of a JSON formatted string.',
                  stringValue: JSON.stringify(result),
                  outputDetails: {
                     type: 'CUSTOM',
                     format: ''
                  }
               }));
            }
            catch (err)
            {
               output[0] = false;
               output[1] = err;
            }
            return output;
         case 'Openstack_Driver_Port_Delete':
            client = new OpenstackNetworkClient(inputParameters);
            output = [];
            try
            {
               const result = await client.destroyPort();
               output[0] = true;
               const outputParams = [];
               output[1] = outputParams;
               outputParams.push(new Parameter({
                  parameterName: 'Raw Output',
                  parameterKey: 'rawResponse',
                  parameterType: 'string',
                  parameterDescription: 'The raw response from Openstack in the form of a JSON formatted string.',
                  stringValue: JSON.stringify(result),
                  outputDetails: {
                     type: 'CUSTOM',
                     format: ''
                  }
               }));
            }
            catch (err)
            {
               output[0] = false;
               output[1] = err;
            }
            return output;
            /** ******************************************/
            /* Security Groups                          */
            /** ******************************************/
         case 'Openstack_Driver_Get_Security_Groups':
            client = new OpenstackNetworkClient(inputParameters);
            output = [];
            try
            {
               const result = await client.getSecurityGroups();
               output[0] = true;
               const outputParams = [];
               output[1] = outputParams;
               outputParams.push(new Parameter({
                  parameterName: 'Raw Output',
                  parameterKey: 'rawResponse',
                  parameterType: 'string',
                  parameterDescription: 'The raw response from Openstack in the form of a JSON formatted string.',
                  stringValue: JSON.stringify(result),
                  outputDetails: {
                     type: 'CUSTOM',
                     format: ''
                  }
               }));
            }
            catch (err)
            {
               output[0] = false;
               output[1] = err;
            }
            return output;
         case 'Openstack_Driver_Get_Security_Group':
            client = new OpenstackNetworkClient(inputParameters);
            output = [];
            try
            {
               const result = await client.getSecurityGroup();
               output[0] = true;
               const outputParams = [];
               output[1] = outputParams;
               outputParams.push(new Parameter({
                  parameterName: 'Raw Output',
                  parameterKey: 'rawResponse',
                  parameterType: 'string',
                  parameterDescription: 'The raw response from Openstack in the form of a JSON formatted string.',
                  stringValue: JSON.stringify(result),
                  outputDetails: {
                     type: 'CUSTOM',
                     format: ''
                  }
               }));
            }
            catch (err)
            {
               output[0] = false;
               output[1] = err;
            }
            return output;
         case 'Openstack_Driver_Security_Group':
            client = new OpenstackNetworkClient(inputParameters);
            output = [];
            try
            {
               const result = await client.createSecurityGroup();
               output[0] = true;
               const outputParams = [];
               output[1] = outputParams;
               outputParams.push(new Parameter({
                  parameterName: 'Raw Output',
                  parameterKey: 'rawResponse',
                  parameterType: 'string',
                  parameterDescription: 'The raw response from Openstack in the form of a JSON formatted string.',
                  stringValue: JSON.stringify(result),
                  outputDetails: {
                     type: 'CUSTOM',
                     format: ''
                  }
               }));
               outputParams.push(new Parameter({
                  parameterName: 'Security Group Identification',
                  parameterKey: 'openstack_security_group_id',
                  parameterType: 'string',
                  parameterDescription: 'The identifier of the Security Group that was created in Openstack.',
                  stringValue: result.id,
                  outputDetails: {
                     type: 'CUSTOM',
                     format: ''
                  }
               }));
               outputParams.push(new Parameter({
                  parameterName: 'Security Group Name',
                  parameterKey: 'openstack_security_group_name',
                  parameterType: 'string',
                  parameterDescription: 'The name of the Security Group that was created in Openstack.',
                  stringValue: result.name,
                  outputDetails: {
                     type: 'CUSTOM',
                     format: ''
                  }
               }));
            }
            catch (err)
            {
               output[0] = false;
               output[1] = err;
            }
            return output;
         case 'Openstack_Driver_Security_Group_Delete':
            client = new OpenstackNetworkClient(inputParameters);
            output = [];
            try
            {
               const result = await client.destroySecurityGroup();
               output[0] = true;
               const outputParams = [];
               output[1] = outputParams;
               outputParams.push(new Parameter({
                  parameterName: 'Raw Output',
                  parameterKey: 'rawResponse',
                  parameterType: 'string',
                  parameterDescription: 'The raw response from Openstack in the form of a JSON formatted string.',
                  stringValue: JSON.stringify(result),
                  outputDetails: {
                     type: 'CUSTOM',
                     format: ''
                  }
               }));
            }
            catch (err)
            {
               output[0] = false;
               output[1] = err;
            }
            return output;
            /** ******************************************/
            /* Security Group Rules                     */
            /** ******************************************/
         case 'Openstack_Driver_Get_Security_Group_Rules':
            client = new OpenstackNetworkClient(inputParameters);
            output = [];
            try
            {
               const result = await client.getSecurityGroupRules();
               output[0] = true;
               const outputParams = [];
               output[1] = outputParams;
               outputParams.push(new Parameter({
                  parameterName: 'Raw Output',
                  parameterKey: 'rawResponse',
                  parameterType: 'string',
                  parameterDescription: 'The raw response from Openstack in the form of a JSON formatted string.',
                  stringValue: JSON.stringify(result),
                  outputDetails: {
                     type: 'CUSTOM',
                     format: ''
                  }
               }));
            }
            catch (err)
            {
               output[0] = false;
               output[1] = err;
            }
            return output;
         case 'Openstack_Driver_Get_Security_Group_Rule':
            client = new OpenstackNetworkClient(inputParameters);
            output = [];
            try
            {
               const result = await client.getSecurityGroupRule();
               output[0] = true;
               const outputParams = [];
               output[1] = outputParams;
               outputParams.push(new Parameter({
                  parameterName: 'Raw Output',
                  parameterKey: 'rawResponse',
                  parameterType: 'string',
                  parameterDescription: 'The raw response from Openstack in the form of a JSON formatted string.',
                  stringValue: JSON.stringify(result),
                  outputDetails: {
                     type: 'CUSTOM',
                     format: ''
                  }
               }));
            }
            catch (err)
            {
               output[0] = false;
               output[1] = err;
            }
            return output;
         case 'Openstack_Driver_Security_Group_Rule':
            client = new OpenstackNetworkClient(inputParameters);
            output = [];
            try
            {
               const result = await client.createSecurityGroupRule();
               output[0] = true;
               const outputParams = [];
               output[1] = outputParams;
               outputParams.push(new Parameter({
                  parameterName: 'Raw Output',
                  parameterKey: 'rawResponse',
                  parameterType: 'string',
                  parameterDescription: 'The raw response from Openstack in the form of a JSON formatted string.',
                  stringValue: JSON.stringify(result),
                  outputDetails: {
                     type: 'CUSTOM',
                     format: ''
                  }
               }));
               outputParams.push(new Parameter({
                  parameterName: 'Security Group Rule Identification',
                  parameterKey: 'openstack_security_group_rule_id',
                  parameterType: 'string',
                  parameterDescription: 'The identifier of the Security Group Rule that was created.',
                  stringValue: result.id,
                  outputDetails: {
                     type: 'CUSTOM',
                     format: ''
                  }
               }));
            }
            catch (err)
            {
               output[0] = false;
               output[1] = err;
            }
            return output;
         case 'Openstack_Driver_Security_Group_Rule_Delete':
            client = new OpenstackNetworkClient(inputParameters);
            output = [];
            try
            {
               const result = await client.destroySecurityGroupRule();
               output[0] = true;
               const outputParams = [];
               output[1] = outputParams;
               outputParams.push(new Parameter({
                  parameterName: 'Raw Output',
                  parameterKey: 'rawResponse',
                  parameterType: 'string',
                  parameterDescription: 'The raw response from Openstack in the form of a JSON formatted string.',
                  stringValue: JSON.stringify(result),
                  outputDetails: {
                     type: 'CUSTOM',
                     format: ''
                  }
               }));
            }
            catch (err)
            {
               output[0] = false;
               output[1] = err;
            }
            return output;
            /** ******************************************/
            /* Network Trunking                         */
            /** ******************************************/
         case 'Openstack_Driver_Get_Network_Trunks':
            client = new OpenstackNetworkClient(inputParameters);
            output = [];
            try
            {
               const result = await client.getTrunks();
               output[0] = true;
               const outputParams = [];
               output[1] = outputParams;
               outputParams.push(new Parameter({
                  parameterName: 'Raw Output',
                  parameterKey: 'rawResponse',
                  parameterType: 'string',
                  parameterDescription: 'The raw response from Openstack in the form of a JSON formatted string.',
                  stringValue: JSON.stringify(result),
                  outputDetails: {
                     type: 'CUSTOM',
                     format: ''
                  }
               }));
            }
            catch (err)
            {
               output[0] = false;
               output[1] = err;
            }
            return output;
         case 'Openstack_Driver_Get_Network_Trunk':
            client = new OpenstackNetworkClient(inputParameters);
            output = [];
            try
            {
               const result = await client.getTrunk();
               output[0] = true;
               const outputParams = [];
               output[1] = outputParams;
               outputParams.push(new Parameter({
                  parameterName: 'Raw Output',
                  parameterKey: 'rawResponse',
                  parameterType: 'string',
                  parameterDescription: 'The raw response from Openstack in the form of a JSON formatted string.',
                  stringValue: JSON.stringify(result),
                  outputDetails: {
                     type: 'CUSTOM',
                     format: ''
                  }
               }));
            }
            catch (err)
            {
               output[0] = false;
               output[1] = err;
            }
            return output;
         case 'Openstack_Driver_Create_Network_Trunk':
            client = new OpenstackNetworkClient(inputParameters);
            output = [];
            try
            {
               const result = await client.createTrunk();
               output[0] = true;
               const outputParams = [];
               output[1] = outputParams;
               outputParams.push(new Parameter({
                  parameterName: 'Raw Output',
                  parameterKey: 'rawResponse',
                  parameterType: 'string',
                  parameterDescription: 'The raw response from Openstack in the form of a JSON formatted string.',
                  stringValue: JSON.stringify(result),
                  outputDetails: {
                     type: 'CUSTOM',
                     format: ''
                  }
               }));
               outputParams.push(new Parameter({
                  parameterName: 'Trunk Name',
                  parameterKey: 'openstack_trunk_name',
                  parameterType: 'string',
                  parameterDescription: 'The name of the newly created network trunk.',
                  stringValue: result.name,
                  outputDetails: {
                     type: 'CUSTOM',
                     format: ''
                  }
               }));
               outputParams.push(new Parameter({
                  parameterName: 'Trunk ID',
                  parameterKey: 'openstack_trunk_id',
                  parameterType: 'string',
                  parameterDescription: 'The ID of the newly created network trunk.',
                  stringValue: result.id,
                  outputDetails: {
                     type: 'CUSTOM',
                     format: ''
                  }
               }));
            }
            catch (err)
            {
               output[0] = false;
               output[1] = err;
            }
            return output;
         case 'Openstack_Driver_Update_Network_Trunk':
            client = new OpenstackNetworkClient(inputParameters);
            output = [];
            try
            {
               const result = await client.updateTrunk();
               output[0] = true;
               const outputParams = [];
               output[1] = outputParams;
               outputParams.push(new Parameter({
                  parameterName: 'Raw Output',
                  parameterKey: 'rawResponse',
                  parameterType: 'string',
                  parameterDescription: 'The raw response from Openstack in the form of a JSON formatted string.',
                  stringValue: JSON.stringify(result),
                  outputDetails: {
                     type: 'CUSTOM',
                     format: ''
                  }
               }));
               outputParams.push(new Parameter({
                  parameterName: 'Trunk Name',
                  parameterKey: 'openstack_trunk_name',
                  parameterType: 'string',
                  parameterDescription: 'The name of the newly created network trunk.',
                  stringValue: result.name,
                  outputDetails: {
                     type: 'CUSTOM',
                     format: ''
                  }
               }));
               outputParams.push(new Parameter({
                  parameterName: 'Trunk ID',
                  parameterKey: 'openstack_trunk_id',
                  parameterType: 'string',
                  parameterDescription: 'The ID of the newly created network trunk.',
                  stringValue: result.id,
                  outputDetails: {
                     type: 'CUSTOM',
                     format: ''
                  }
               }));
            }
            catch (err)
            {
               output[0] = false;
               output[1] = err;
            }
            return output;
         case 'Openstack_Driver_Update_Network_Trunk_Add_Subport':
            client = new OpenstackNetworkClient(inputParameters);
            output = [];
            try
            {
               const result = await client.addSubPortToTrunk();
               output[0] = true;
               const outputParams = [];
               output[1] = outputParams;
               outputParams.push(new Parameter({
                  parameterName: 'Raw Output',
                  parameterKey: 'rawResponse',
                  parameterType: 'string',
                  parameterDescription: 'The raw response from Openstack in the form of a JSON formatted string.',
                  stringValue: JSON.stringify(result),
                  outputDetails: {
                     type: 'CUSTOM',
                     format: ''
                  }
               }));
            }
            catch (err)
            {
               output[0] = false;
               output[1] = err;
            }
            return output;
         case 'Openstack_Driver_Update_Network_Trunk_Remove_Subports':
            client = new OpenstackNetworkClient(inputParameters);
            output = [];
            try
            {
               const result = await client.removeSubPortFromTrunk();
               output[0] = true;
               const outputParams = [];
               output[1] = outputParams;
               outputParams.push(new Parameter({
                  parameterName: 'Raw Output',
                  parameterKey: 'rawResponse',
                  parameterType: 'string',
                  parameterDescription: 'The raw response from Openstack in the form of a JSON formatted string.',
                  stringValue: JSON.stringify(result),
                  outputDetails: {
                     type: 'CUSTOM',
                     format: ''
                  }
               }));
            }
            catch (err)
            {
               output[0] = false;
               output[1] = err;
            }
            return output;
         case 'Openstack_Driver_Network_Trunk_Get_Subports':
            client = new OpenstackNetworkClient(inputParameters);
            output = [];
            try
            {
               const result = await client.getSubPortsFromTrunk();
               output[0] = true;
               const outputParams = [];
               output[1] = outputParams;
               outputParams.push(new Parameter({
                  parameterName: 'Raw Output',
                  parameterKey: 'rawResponse',
                  parameterType: 'string',
                  parameterDescription: 'The raw response from Openstack in the form of a JSON formatted string.',
                  stringValue: JSON.stringify(result),
                  outputDetails: {
                     type: 'CUSTOM',
                     format: ''
                  }
               }));
            }
            catch (err)
            {
               output[0] = false;
               output[1] = err;
            }
            return output;
         case 'Openstack_Driver_Delete_Network_Trunk':
            client = new OpenstackNetworkClient(inputParameters);
            output = [];
            try
            {
               const result = await client.destroyTrunk();
               output[0] = true;
               const outputParams = [];
               output[1] = outputParams;
               outputParams.push(new Parameter({
                  parameterName: 'Raw Output',
                  parameterKey: 'rawResponse',
                  parameterType: 'string',
                  parameterDescription: 'The raw response from Openstack in the form of a JSON formatted string.',
                  stringValue: JSON.stringify(result),
                  outputDetails: {
                     type: 'CUSTOM',
                     format: ''
                  }
               }));
            }
            catch (err)
            {
               output[0] = false;
               output[1] = err;
            }
            return output;
            /** ******************************************/
            /* Virtual Machines                         */
            /** ******************************************/
         case 'Openstack_Driver_Get_Virtual_Machines':
            client = new OpenstackComputeClient(inputParameters);
            output = [];
            try
            {
               const result = await client.getServers();
               output[0] = true;
               const outputParams = [];
               output[1] = outputParams;
               outputParams.push(new Parameter({
                  parameterName: 'Raw Output',
                  parameterKey: 'rawResponse',
                  parameterType: 'string',
                  parameterDescription: 'The raw response from Openstack in the form of a JSON formatted string.',
                  stringValue: JSON.stringify(result),
                  outputDetails: {
                     type: 'CUSTOM',
                     format: ''
                  }
               }));
            }
            catch (err)
            {
               output[0] = false;
               output[1] = err;
            }
            return output;
         case 'Openstack_Driver_Get_Virtual_Machine':
            client = new OpenstackComputeClient(inputParameters);
            output = [];
            try
            {
               const result = await client.getServer();
               output[0] = true;
               const outputParams = [];
               output[1] = outputParams;
               outputParams.push(new Parameter({
                  parameterName: 'Raw Output',
                  parameterKey: 'rawResponse',
                  parameterType: 'string',
                  parameterDescription: 'The raw response from Openstack in the form of a JSON formatted string.',
                  stringValue: JSON.stringify(result),
                  outputDetails: {
                     type: 'CUSTOM',
                     format: ''
                  }
               }));
            }
            catch (err)
            {
               output[0] = false;
               output[1] = err;
            }
            return output;
         case 'Openstack_Driver_VM':
            client = new OpenstackComputeClient(inputParameters);
            output = [];
            try
            {
               const result = await client.createServer();
               const mgmtInterface = await client.getManagementInterface(result.id);
               let mgmtIp = null;
               if (mgmtInterface && mgmtInterface.fixed_ips && Array.isArray(mgmtInterface.fixed_ips) && mgmtInterface.fixed_ips.length > 0)
               {
                  mgmtIp = mgmtInterface.fixed_ips[0].ip_address;
               }
               else
               {
                  throw new Error('Unable to determine the management IP Address of the newly created VM.');
               }
               if (typeof result === 'string' || typeof result === undefined)
               {
                  output[0] = false;
                  output[1] = result;
               }
               else
               {
                  output[0] = true;
                  const outputParams = [];
                  output[1] = outputParams;
                  outputParams.push(new Parameter({
                     parameterName: 'Raw Output',
                     parameterKey: 'rawResponse',
                     parameterType: 'string',
                     parameterDescription: 'The raw response from Openstack in the form of a JSON formatted string.',
                     stringValue: JSON.stringify(result),
                     outputDetails: {
                        type: 'CUSTOM',
                        format: ''
                     }
                  }));
                  outputParams.push(new Parameter({
                     parameterName: 'VM Name',
                     parameterKey: 'openstack_vm_name',
                     parameterType: 'string',
                     parameterDescription: 'The name of the newly created Virtual Machine.',
                     stringValue: result.name,
                     outputDetails: {
                        type: 'CUSTOM',
                        format: ''
                     }
                  }));
                  outputParams.push(new Parameter({
                     parameterName: 'VM ID',
                     parameterKey: 'openstack_vm_id',
                     parameterType: 'string',
                     parameterDescription: 'The name of the newly created Virtual Machine.',
                     stringValue: result.id,
                     outputDetails: {
                        type: 'CUSTOM',
                        format: ''
                     }
                  }));
                  outputParams.push(new Parameter({
                     parameterName: 'Management IP Address',
                     parameterKey: 'targetAddress',
                     parameterType: 'string',
                     parameterDescription: 'The management address of the newly created Virtual Machine.',
                     stringValue: mgmtIp,
                     outputDetails: {
                        type: 'CUSTOM',
                        format: ''
                     }
                  }));
               }
            }
            catch (err)
            {
               output[0] = false;
               output[1] = err;
            }
            return output;
         case 'Openstack_Driver_VM_Delete':
            client = new OpenstackComputeClient(inputParameters);
            output = [];
            try
            {
               const result = await client.destroyServer();
               output[0] = true;
               const outputParams = [];
               output[1] = outputParams;
               outputParams.push(new Parameter({
                  parameterName: 'Raw Output',
                  parameterKey: 'rawResponse',
                  parameterType: 'string',
                  parameterDescription: 'The raw response from Openstack in the form of a JSON formatted string.',
                  stringValue: JSON.stringify(result),
                  outputDetails: {
                     type: 'CUSTOM',
                     format: ''
                  }
               }));
            }
            catch (err)
            {
               output[0] = false;
               output[1] = err;
            }
            return output;
         case 'Openstack_Driver_VM_Action':
            client = new OpenstackComputeClient(inputParameters);
            output = [];
            try
            {
               const result = await client.rebootServer();
               output[0] = true;
               const outputParams = [];
               output[1] = outputParams;
               outputParams.push(new Parameter({
                  parameterName: 'Raw Output',
                  parameterKey: 'rawResponse',
                  parameterType: 'string',
                  parameterDescription: 'The raw response from Openstack in the form of a JSON formatted string.',
                  stringValue: JSON.stringify(result),
                  outputDetails: {
                     type: 'CUSTOM',
                     format: ''
                  }
               }));
            }
            catch (err)
            {
               output[0] = false;
               output[1] = err;
            }
            return output;
         case 'Openstack_Driver_Attach_Volume_To_Virtual_Machine':
            client = new OpenstackComputeClient(inputParameters);
            output = [];
            try
            {
               const result = await client.attachVolume();
               output[0] = true;
               const outputParams = [];
               output[1] = outputParams;
               outputParams.push(new Parameter({
                  parameterName: 'Raw Output',
                  parameterKey: 'rawResponse',
                  parameterType: 'string',
                  parameterDescription: 'The raw response from Openstack in the form of a JSON formatted string.',
                  stringValue: JSON.stringify(result),
                  outputDetails: {
                     type: 'CUSTOM',
                     format: ''
                  }
               }));
            }
            catch (err)
            {
               output[0] = false;
               output[1] = err;
            }
            return output;
         case 'Openstack_Driver_Detach_Volume_From_Virtual_Machine':
            client = new OpenstackComputeClient(inputParameters);
            output = [];
            try
            {
               const result = await client.detachVolume();
               output[0] = true;
               const outputParams = [];
               output[1] = outputParams;
               outputParams.push(new Parameter({
                  parameterName: 'Raw Output',
                  parameterKey: 'rawResponse',
                  parameterType: 'string',
                  parameterDescription: 'The raw response from Openstack in the form of a JSON formatted string.',
                  stringValue: JSON.stringify(result),
                  outputDetails: {
                     type: 'CUSTOM',
                     format: ''
                  }
               }));
            }
            catch (err)
            {
               output[0] = false;
               output[1] = err;
            }
            return output;
         case 'Openstack_Driver_Attach_Port':
            client = new OpenstackComputeClient(inputParameters);
            output = [];
            try
            {
               const result = await client.attachInterface();
               let address = '0.0.0.0';
               if (result && result.fixed_ips && Array.isArray(result.fixed_ips) && result.fixed_ips.length > 0)
               {
                  address = result.fixed_ips[0].ip_address;
               }
               output[0] = true;
               const outputParams = [];
               output[1] = outputParams;
               outputParams.push(new Parameter({
                  parameterName: 'Raw Output',
                  parameterKey: 'rawResponse',
                  parameterType: 'string',
                  parameterDescription: 'The raw response from Openstack in the form of a JSON formatted string.',
                  stringValue: JSON.stringify(result),
                  outputDetails: {
                     type: 'CUSTOM',
                     format: ''
                  }
               }));
               outputParams.push(new Parameter({
                  parameterName: 'Port ID',
                  parameterKey: 'port_id',
                  parameterType: 'string',
                  parameterDescription: 'The id of the port that was attached to the VM. This is useful when attaching a network directly.',
                  stringValue: result.port_id,
                  outputDetails: {
                     type: 'CUSTOM',
                     format: ''
                  }
               }));
               outputParams.push(new Parameter({
                  parameterName: 'Port Address',
                  parameterKey: 'port_ip_address',
                  parameterType: 'string',
                  parameterDescription: 'The ip address of the port that was attached. This may be 0.0.0.0 in the case the port has no address.',
                  stringValue: address,
                  outputDetails: {
                     type: 'CUSTOM',
                     format: ''
                  }
               }));
            }
            catch (err)
            {
               output[0] = false;
               output[1] = err;
            }
            return output;
         case 'Openstack_Driver_Detach_Port':
            client = new OpenstackComputeClient(inputParameters);
            output = [];
            try
            {
               const result = await client.detachInterface();
               output[0] = true;
               const outputParams = [];
               output[1] = outputParams;
               outputParams.push(new Parameter({
                  parameterName: 'Raw Output',
                  parameterKey: 'rawResponse',
                  parameterType: 'string',
                  parameterDescription: 'The raw response from Openstack in the form of a JSON formatted string.',
                  stringValue: JSON.stringify(result),
                  outputDetails: {
                     type: 'CUSTOM',
                     format: ''
                  }
               }));
            }
            catch (err)
            {
               output[0] = false;
               output[1] = err;
            }
            return output;
         /** ******************************************/
         /* Block Storage                            */
         /** ******************************************/
         case 'Openstack_Driver_Get_Volumes':
            client = new OpenstackBlockStorageClient(inputParameters);
            output = [];
            try
            {
               const result = await client.getVolumes();
               output[0] = true;
               const outputParams = [];
               output[1] = outputParams;
               outputParams.push(new Parameter({
                  parameterName: 'Raw Output',
                  parameterKey: 'rawResponse',
                  parameterType: 'string',
                  parameterDescription: 'The raw response from Openstack in the form of a JSON formatted string.',
                  stringValue: JSON.stringify(result),
                  outputDetails: {
                     type: 'CUSTOM',
                     format: ''
                  }
               }));
            }
            catch (err)
            {
               output[0] = false;
               output[1] = err;
            }
            return output;
         case 'Openstack_Driver_Get_Volume':
            client = new OpenstackBlockStorageClient(inputParameters);
            output = [];
            try
            {
               const result = await client.getVolume();
               output[0] = true;
               const outputParams = [];
               output[1] = outputParams;
               outputParams.push(new Parameter({
                  parameterName: 'Raw Output',
                  parameterKey: 'rawResponse',
                  parameterType: 'string',
                  parameterDescription: 'The raw response from Openstack in the form of a JSON formatted string.',
                  stringValue: JSON.stringify(result),
                  outputDetails: {
                     type: 'CUSTOM',
                     format: ''
                  }
               }));
            }
            catch (err)
            {
               output[0] = false;
               output[1] = err;
            }
            return output;
         case 'Openstack_Driver_Create_Volume':
            client = new OpenstackBlockStorageClient(inputParameters);
            output = [];
            try
            {
               const result = await client.createVolume();
               output[0] = true;
               const outputParams = [];
               output[1] = outputParams;
               outputParams.push(new Parameter({
                  parameterName: 'Raw Output',
                  parameterKey: 'rawResponse',
                  parameterType: 'string',
                  parameterDescription: 'The raw response from Openstack in the form of a JSON formatted string.',
                  stringValue: JSON.stringify(result),
                  outputDetails: {
                     type: 'CUSTOM',
                     format: ''
                  }
               }));
               outputParams.push(new Parameter({
                  parameterName: 'Volume ID',
                  parameterKey: 'openstack_volume_id',
                  parameterType: 'string',
                  parameterDescription: 'The ID of the newly created volume.',
                  stringValue: result.id,
                  outputDetails: {
                     type: 'CUSTOM',
                     format: ''
                  }
               }));
            }
            catch (err)
            {
               output[0] = false;
               output[1] = err;
            }
            return output;
         case 'Openstack_Driver_Update_Volume':
            client = new OpenstackBlockStorageClient(inputParameters);
            output = [];
            try
            {
               const result = await client.updateVolume();
               output[0] = true;
               const outputParams = [];
               output[1] = outputParams;
               outputParams.push(new Parameter({
                  parameterName: 'Raw Output',
                  parameterKey: 'rawResponse',
                  parameterType: 'string',
                  parameterDescription: 'The raw response from Openstack in the form of a JSON formatted string.',
                  stringValue: JSON.stringify(result),
                  outputDetails: {
                     type: 'CUSTOM',
                     format: ''
                  }
               }));
            }
            catch (err)
            {
               output[0] = false;
               output[1] = err;
            }
            return output;
         case 'Openstack_Driver_Delete_Volume':
            client = new OpenstackBlockStorageClient(inputParameters);
            output = [];
            try
            {
               await client.destroyVolume();
               output[0] = true;
               const outputParams = [];
               output[1] = outputParams;
               outputParams.push(new Parameter({
                  parameterName: 'Raw Output',
                  parameterKey: 'rawResponse',
                  parameterType: 'string',
                  parameterDescription: 'The raw response from Openstack in the form of a JSON formatted string.',
                  stringValue: 'Success',
                  outputDetails: {
                     type: 'CUSTOM',
                     format: ''
                  }
               }));
            }
            catch (err)
            {
               output[0] = false;
               output[1] = err;
            }
            return output;
         case 'Openstack_Driver_Get_Snapshots':
            client = new OpenstackBlockStorageClient(inputParameters);
            output = [];
            try
            {
               const result = await client.getSnapshots();
               output[0] = true;
               const outputParams = [];
               output[1] = outputParams;
               outputParams.push(new Parameter({
                  parameterName: 'Raw Output',
                  parameterKey: 'rawResponse',
                  parameterType: 'string',
                  parameterDescription: 'The raw response from Openstack in the form of a JSON formatted string.',
                  stringValue: JSON.stringify(result),
                  outputDetails: {
                     type: 'CUSTOM',
                     format: ''
                  }
               }));
            }
            catch (err)
            {
               output[0] = false;
               output[1] = err;
            }
            return output;
         case 'Openstack_Driver_Get_Snapshot':
            client = new OpenstackBlockStorageClient(inputParameters);
            output = [];
            try
            {
               const result = await client.getSnapshot();
               output[0] = true;
               const outputParams = [];
               output[1] = outputParams;
               outputParams.push(new Parameter({
                  parameterName: 'Raw Output',
                  parameterKey: 'rawResponse',
                  parameterType: 'string',
                  parameterDescription: 'The raw response from Openstack in the form of a JSON formatted string.',
                  stringValue: JSON.stringify(result),
                  outputDetails: {
                     type: 'CUSTOM',
                     format: ''
                  }
               }));
            }
            catch (err)
            {
               output[0] = false;
               output[1] = err;
            }
            return output;
         case 'Openstack_Driver_Create_Snapshot':
            client = new OpenstackBlockStorageClient(inputParameters);
            output = [];
            try
            {
               const result = await client.createSnapshot();
               output[0] = true;
               const outputParams = [];
               output[1] = outputParams;
               outputParams.push(new Parameter({
                  parameterName: 'Raw Output',
                  parameterKey: 'rawResponse',
                  parameterType: 'string',
                  parameterDescription: 'The raw response from Openstack in the form of a JSON formatted string.',
                  stringValue: JSON.stringify(result),
                  outputDetails: {
                     type: 'CUSTOM',
                     format: ''
                  }
               }));
               outputParams.push(new Parameter({
                  parameterName: 'Snapshot ID',
                  parameterKey: 'openstack_snapshot_id',
                  parameterType: 'string',
                  parameterDescription: 'The ID of the newly created Openstack Volume Snapshot.',
                  stringValue: result.id,
                  outputDetails: {
                     type: 'CUSTOM',
                     format: ''
                  }
               }));
            }
            catch (err)
            {
               output[0] = false;
               output[1] = err;
            }
            return output;
         case 'Openstack_Driver_Delete_Snapshot':
            client = new OpenstackBlockStorageClient(inputParameters);
            output = [];
            try
            {
               const result = await client.destroySnapshot();
               output[0] = true;
               const outputParams = [];
               output[1] = outputParams;
               outputParams.push(new Parameter({
                  parameterName: 'Raw Output',
                  parameterKey: 'rawResponse',
                  parameterType: 'string',
                  parameterDescription: 'The raw response from Openstack in the form of a JSON formatted string.',
                  stringValue: JSON.stringify(result),
                  outputDetails: {
                     type: 'CUSTOM',
                     format: ''
                  }
               }));
            }
            catch (err)
            {
               output[0] = false;
               output[1] = err;
            }
            return output;
         /** ******************************************/
         /* Keypairs                                  */
         /** ******************************************/
         case 'Openstack_Driver_Get_Keypairs':
            client = new OpenstackComputeClient(inputParameters);
            output = [];
            try
            {
               const result = await client.getKeypairs();
               output[0] = true;
               const outputParams = [];
               output[1] = outputParams;
               outputParams.push(new Parameter({
                  parameterName: 'Raw Output',
                  parameterKey: 'rawResponse',
                  parameterType: 'string',
                  parameterDescription: 'The raw response from Openstack in the form of a JSON formatted string.',
                  stringValue: JSON.stringify(result),
                  outputDetails: {
                     type: 'CUSTOM',
                     format: ''
                  }
               }));
            }
            catch (err)
            {
               output[0] = false;
               output[1] = err;
            }
            return output;
         case 'Openstack_Driver_Get_Keypair':
            client = new OpenstackComputeClient(inputParameters);
            output = [];
            try
            {
               const result = await client.getKeypair();
               output[0] = true;
               const outputParams = [];
               output[1] = outputParams;
               outputParams.push(new Parameter({
                  parameterName: 'Raw Output',
                  parameterKey: 'rawResponse',
                  parameterType: 'string',
                  parameterDescription: 'The raw response from Openstack in the form of a JSON formatted string.',
                  stringValue: JSON.stringify(result),
                  outputDetails: {
                     type: 'CUSTOM',
                     format: ''
                  }
               }));
            }
            catch (err)
            {
               output[0] = false;
               output[1] = err;
            }
            return output;
         case 'Openstack_Driver_Create_Keypair':
            client = new OpenstackComputeClient(inputParameters);
            output = [];
            try
            {
               const result = await client.createKeypair();
               if (typeof result === 'string' || typeof result === undefined)
               {
                  output[0] = false;
                  output[1] = result;
               }
               else
               {
                  output[0] = true;
                  const outputParams = [];
                  output[1] = outputParams;
                  outputParams.push(new Parameter({
                     parameterName: 'Raw Output',
                     parameterKey: 'rawResponse',
                     parameterType: 'string',
                     parameterDescription: 'The raw response from Openstack in the form of a JSON formatted string.',
                     stringValue: JSON.stringify(result),
                     outputDetails: {
                        type: 'CUSTOM',
                        format: ''
                     }
                  }));
                  outputParams.push(new Parameter({
                     parameterName: 'Keypair Name',
                     parameterKey: 'openstack_keypair_name',
                     parameterDescription: 'The name of the newly created Openstack Keypair',
                     parameterType: 'string',
                     stringValue: result.name,
                     outputDetails: {
                        type: 'CUSTOM',
                        format: ''
                     }
                  }));
               }
            }
            catch (err)
            {
               output[0] = false;
               output[1] = err;
            }
            return output;
         case 'Openstack_Driver_Delete_Keypair':
            client = new OpenstackComputeClient(inputParameters);
            output = [];
            try
            {
               await client.destroyKeypair();
               output[0] = true;
               const outputParams = [];
               output[1] = outputParams;
            }
            catch (err)
            {
               output[0] = false;
               output[1] = err;
            }
            return output;
         /** ******************************************/
         /* Projects                                  */
         /** ******************************************/
         case 'Openstack_Driver_Get_Projects':
            client = new OpenstackComputeClient(inputParameters);
            output = [];
            try
            {
               const result = await client.getProjects();
               output[0] = true;
               const outputParams = [];
               output[1] = outputParams;
               outputParams.push(new Parameter({
                  parameterName: 'Raw Output',
                  parameterKey: 'rawResponse',
                  parameterType: 'string',
                  parameterDescription: 'The raw response from Openstack in the form of a JSON formatted string.',
                  stringValue: JSON.stringify(result),
                  outputDetails: {
                     type: 'CUSTOM',
                     format: ''
                  }
               }));
            }
            catch (err)
            {
               output[0] = false;
               output[1] = err;
            }
            return output;
         case 'Openstack_Driver_Get_Project':
            client = new OpenstackComputeClient(inputParameters);
            output = [];
            try
            {
               const result = await client.getProject();
               output[0] = true;
               const outputParams = [];
               output[1] = outputParams;
               outputParams.push(new Parameter({
                  parameterName: 'Raw Output',
                  parameterKey: 'rawResponse',
                  parameterType: 'string',
                  parameterDescription: 'The raw response from Openstack in the form of a JSON formatted string.',
                  stringValue: JSON.stringify(result),
                  outputDetails: {
                     type: 'CUSTOM',
                     format: ''
                  }
               }));
            }
            catch (err)
            {
               output[0] = false;
               output[1] = err;
            }
            return output;
         default:
            return [false, 'An invalid command was selected in the node.'];
         }
      };
   }

   RED.nodes.registerType('vino-driver-openstack', OpenstackDriverNode, settingsObject);

   // This allows us to serve the required UI code (datatables, etc) even when in a plain Node-Red environment
   if (!RED.settings.vino)
   {
      RED.httpAdmin.get('/nodes/lib/ui/*', function(req, res)
      {
         const options = {
            root: path.join(__dirname, '/../../lib/ui/'),
            dotfiles: 'deny'
         };
         res.sendFile(req.params[0], options);
      });
   }
};
