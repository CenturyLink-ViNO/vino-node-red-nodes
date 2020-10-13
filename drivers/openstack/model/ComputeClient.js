/* eslint camelcase: 0 */
/* eslint max-lines: ["off"] */
/* eslint no-await-in-loop: ["off"] */

const pkgcloud = require('../../../lib/openstack/vendor/pkgcloud/lib/pkgcloud');
const identity = require('../../../lib/openstack/vendor/pkgcloud/lib/pkgcloud/openstack/identity');
const NodeUtilities = require('../../../lib/driver-utils/index');
const utils = NodeUtilities.Utils;
const Parameter = require('../../../lib/driver-utils/parameter');

module.exports = class OpenstackComputeClient
{
   constructor(inputParameters)
   {
      this.inputParameters = inputParameters;
   }

   getClient()
   {
      if (!this.client)
      {
         const provider = 'openstack';
         const username = this.getParameterValue('openstack_username');
         const password = this.getParameterValue('openstack_password');
         const domainName = this.getParameterValue('openstack_domain_name');
         const tenantId = this.getParameterValue('openstack_tenant_id');
         const tenantName = this.getParameterValue('openstack_tenant_name');
         const keystoneAuthVersion = this.getParameterValue('openstack_api_version');
         const authUrl = this.getParameterValue('openstack_auth_url');
         const region = this.getParameterValue('openstack_region_name');
         const strictSSL = !this.getParameterValue('openstack_allow_insecure_connections');
         this.client = pkgcloud.compute.createClient({
            provider: provider,
            username: username,
            password: password,
            domainName: domainName,
            tenantId: tenantId,
            tenantName: tenantName,
            keystoneAuthVersion: keystoneAuthVersion,
            authUrl: authUrl,
            region: region,
            strictSSL: strictSSL
         });
      }
      return this.client;
   }

   getIdentityClient()
   {
      if (!this.identityClient)
      {
         const provider = 'openstack';
         const username = this.getParameterValue('openstack_username');
         const password = this.getParameterValue('openstack_password');
         const domainName = this.getParameterValue('openstack_domain_name');
         const tenantId = this.getParameterValue('openstack_tenant_id');
         const tenantName = this.getParameterValue('openstack_tenant_name');
         const keystoneAuthVersion = this.getParameterValue('openstack_api_version');
         const authUrl = this.getParameterValue('openstack_auth_url');
         const region = this.getParameterValue('openstack_region_name');
         const strictSSL = !this.getParameterValue('openstack_allow_insecure_connections');
         this.identityClient = identity.createClient({
            provider: provider,
            username: username,
            password: password,
            domainName: domainName,
            tenantId: tenantId,
            tenantName: tenantName,
            keystoneAuthVersion: keystoneAuthVersion,
            version: keystoneAuthVersion,
            authUrl: authUrl,
            region: region,
            strictSSL: strictSSL
         });
      }
      return this.identityClient;
   }

   static generateErrorMessage(err)
   {
      if (err.hasOwnProperty('result'))
      {
         return JSON.stringify(err.result, null, 3);
      }
      return err.toString();
   }

   getParameterValue(parameterName)
   {
      let ret;
      const parameter = utils.findParameter(this.inputParameters, parameterName);
      if (parameter !== null && parameter !== undefined && parameter.hasValue())
      {
         ret = parameter.getValue();
      }
      return ret;
   }

   setParameterValue(parameterName, parameterType, value)
   {
      let parameter = utils.findParameter(this.inputParameters, parameterName);
      if (parameter !== null && parameter !== undefined)
      {
         const paramObject = {
            parameterName: parameter.parameterName,
            parameterKey: parameter.parameterKey,
            parameterDescription: parameter.parameterDescription,
            parameterType: parameterType
         };
         paramObject[parameterType + 'Value'] = value;
         parameter = new Parameter(paramObject);
      }
      else
      {
         const paramObject = {
            parameterName: parameterName,
            parameterKey: parameterName,
            parameterDescription: 'placeHolder',
            parameterType: parameterType
         };
         paramObject[parameterType + 'Value'] = value;
         this.inputParameters.push(new Parameter(paramObject));
      }
      return parameter;
   }

   getServers()
   {
      const outer = this;
      const retry = utils.getFaultTolerantOperation(this.inputParameters);
      const retryPromise = new Promise((resolve, reject) =>
      {
         retry.attempt(() =>
         {
            try
            {
               outer.getClient().getServers((err, servers) =>
               {
                  if (retry.retry(err))
                  {
                     return;
                  }
                  if (err)
                  {
                     reject(new Error(`While getting the list of VMs: ${OpenstackComputeClient.generateErrorMessage(err)}`));
                  }
                  resolve(servers);
               });
            }
            catch (err)
            {
               retry.stop();
               reject(new Error(err));
            }
         }, NodeUtilities.getFaultTolerantTimeoutOpts(outer.inputParameters, () =>
         {
            if (retry.retry('Timed out while attempting to get the list of Openstack Servers.'))
            {
               return;
            }
            retry.stop();
            reject(new Error('Timed out while attempting to get the list of Openstack Servers.'));
         }));
      });
      return retryPromise;
   }

   async createServer()
   {
      const outer = this;

      const name = this.getParameterValue('openstack_vm_name');
      const sshKey = this.getParameterValue('openstack_ssh_key');

      let networks = this.getParameterValue('openstack_network_identifiers');
      if (!networks)
      {
         networks = [];
      }
      let ports = this.getParameterValue('openstack_port_identifiers');
      if (!ports)
      {
         ports = [];
      }
      const managementNet = this.getParameterValue('openstack_vm_management_network');
      const managementNetType = this.getParameterValue('openstack_vm_management_network_type');

      // const useFloatingIps = this.getParameterValue('openstack_use_floating_ip_addresses');
      // let floatingIpPool;
      // if (useFloatingIps)
      // {
      // floatingIpPool = this.getParameterValue('openstack_floating_ip_pool');
      // }

      const processNetworks = function(nets, thePorts, mgmtNet)
      {
         const ret = [];
         for (const iter in nets)
         {
            if (nets.hasOwnProperty(iter))
            {
               ret.push({ uuid: nets[iter] });
            }
         }
         for (const iter in thePorts)
         {
            if (thePorts.hasOwnProperty(iter))
            {
               ret.push({ port: thePorts[iter] });
            }
         }
         if (managementNetType === 'network' && Array.isArray(nets) && !nets.includes(mgmtNet))
         {
            ret.unshift({ uuid: mgmtNet });
         }
         if (managementNetType === 'port' && Array.isArray(thePorts) && !thePorts.includes(mgmtNet))
         {
            ret.unshift({ port: mgmtNet });
         }
         return ret;
      };
      const networkObject = processNetworks(networks, ports, managementNet);
      const firstNetwork = [];
      if (networkObject.length > 0)
      {
         firstNetwork.push(networkObject.shift());
      }
      const processFlavor = async function(theFlavor)
      {
         let ret = null;
         const flavors = await outer.getFlavors();
         if (flavors !== null && flavors !== undefined && Array.isArray(flavors))
         {
            for (const idx in flavors)
            {
               if (flavors.hasOwnProperty(idx) && flavors[idx].name === theFlavor)
               {
                  ret = flavors[idx].id;
                  break;
               }
            }
         }
         if (ret === null)
         {
            throw new Error(`Could not find flavor '${theFlavor}`);
         }
         return ret;
      };
      const flavor = await processFlavor(this.getParameterValue('openstack_flavor'));

      const processImage = async function(theImage)
      {
         let ret = null;
         const images = await outer.getImages();
         if (images !== null && images !== undefined && Array.isArray(images))
         {
            for (const idx in images)
            {
               if (images.hasOwnProperty(idx) && images[idx].name === theImage)
               {
                  ret = images[idx].id;
                  break;
               }
            }
         }
         if (ret === null)
         {
            throw new Error(`Could not find image '${theImage}`);
         }
         return ret;
      };
      const image = await processImage(this.getParameterValue('openstack_image'));

      const processSchedulerHints = function()
      {
         const ret = {};
         let hasParams = false;

         // Hosts
         const buildNearHostIp = outer.getParameterValue('openstack_build_near_host_ip');
         if (buildNearHostIp !== null && buildNearHostIp !== undefined)
         {
            hasParams = true;
            ret.build_near_host_ip = buildNearHostIp;
            const cidr = outer.getParameterValue('openstack_build_near_host_cidr');
            if (cidr !== null && cidr !== undefined)
            {
               ret.cidr = cidr;
            }
         }
         const buildOnSameHost = outer.getParameterValue('openstack_build_on_same_host');
         if (buildOnSameHost !== null && buildOnSameHost !== undefined)
         {
            hasParams = true;
            ret.same_host = Array.isArray(buildOnSameHost) ? buildOnSameHost : [buildOnSameHost];
         }
         const buildOnDifferentHost = outer.getParameterValue('openstack_build_on_different_host');
         if (buildOnDifferentHost !== null && buildOnDifferentHost !== undefined)
         {
            hasParams = true;
            ret.different_host = Array.isArray(buildOnDifferentHost) ? buildOnDifferentHost : [buildOnDifferentHost];
         }

         // Cells
         const differentCell = outer.getParameterValue('openstack_build_in_different_cell');
         if (differentCell !== null && differentCell !== undefined)
         {
            hasParams = true;
            ret.different_cell = Array.isArray(differentCell) ? differentCell : [differentCell];
         }
         const targetCell = outer.getParameterValue('openstack_build_in_cell');
         if (targetCell !== null && targetCell !== undefined)
         {
            hasParams = true;
            ret.target_cell = targetCell;
         }

         const serverGroup = outer.getParameterValue('openstack_build_using_server_group');
         if (serverGroup !== null && serverGroup !== undefined)
         {
            hasParams = true;
            ret.group = serverGroup;
         }

         const query = outer.getParameterValue('openstack_build_using_query');
         if (query !== null && query !== undefined)
         {
            hasParams = true;
            ret.query = query;
         }
         return hasParams ? ret : null;
      };

      const schedulerHints = processSchedulerHints();

      const processCloudConfig = () =>
      {
         let ret = null;
         const userData = outer.getParameterValue('openstack_user_data');
         if (userData !== null && userData !== undefined)
         {
            const buff = Buffer.from(userData);
            ret = buff.toString('base64');
         }
         return ret;
      };

      const cloudConfig = processCloudConfig();

      const processBlockDevice = () =>
      {
         const ret = [];
         const mapping = {};
         ret.push(mapping);
         let hasParams = false;

         const bootIndex = outer.getParameterValue('openstack_bdm_boot_index');
         if (bootIndex !== null && bootIndex !== undefined)
         {
            hasParams = true;
            mapping.boot_index = bootIndex;
         }

         const deleteOnTermination = outer.getParameterValue('openstack_bdm_delete_on_termination');
         if (deleteOnTermination !== null && deleteOnTermination !== undefined)
         {
            hasParams = true;
            mapping.delete_on_termination = deleteOnTermination;
         }

         const sourceType = outer.getParameterValue('openstack_bdm_source_type');
         if (sourceType !== null && sourceType !== undefined)
         {
            hasParams = true;
            mapping.source_type = sourceType;
         }

         const destType = outer.getParameterValue('openstack_bdm_destination_type');
         if (destType !== null && destType !== undefined)
         {
            hasParams = true;
            mapping.destination_type = destType;
         }

         const deviceName = outer.getParameterValue('openstack_bdm_device_name');
         if (deviceName !== null && deviceName !== undefined)
         {
            hasParams = true;
            mapping.device_name = deviceName;
         }

         const type = outer.getParameterValue('openstack_bdm_device_type');
         if (type !== null && type !== undefined)
         {
            hasParams = true;
            mapping.device_type = type;
         }

         const bus = outer.getParameterValue('openstack_bdm_disc_bus');
         if (bus !== null && bus !== undefined)
         {
            hasParams = true;
            mapping.disk_bus = bus;
         }

         const format = outer.getParameterValue('openstack_bdm_guest_format');
         if (format !== null && format !== undefined)
         {
            hasParams = true;
            mapping.guest_format = format;
         }

         const volumeSize = outer.getParameterValue('openstack_bdm_volume_size');
         if (volumeSize !== null && volumeSize !== undefined)
         {
            hasParams = true;
            mapping.volume_size = volumeSize;
         }

         const uuid = outer.getParameterValue('openstack_bdm_uuid');
         if (uuid !== null && uuid !== undefined)
         {
            hasParams = true;
            mapping.uuid = uuid;
         }
         else
         {
            hasParams = false;
         }

         return hasParams ? ret : null;
      };

      const blockDeviceV2 = processBlockDevice();

      const options = {
         name: name,
         flavor: flavor,
         image: image,
         networks: firstNetwork,
         keyname: sshKey,
         schedulerHints: schedulerHints,
         cloudConfig: cloudConfig,
         blockDeviceV2: blockDeviceV2
      };

      const retry = utils.getFaultTolerantOperation(this.inputParameters);
      const retryPromise = new Promise((resolve, reject) =>
      {
         retry.attempt(() =>
         {
            try
            {
               outer.getClient().createServer(options, (err, server) =>
               {
                  if (retry.retry(err))
                  {
                     return;
                  }
                  if (err)
                  {
                     reject(new Error(`While creating a server: ${OpenstackComputeClient.generateErrorMessage(err)}`));
                  }
                  resolve(server);
               });
            }
            catch (err)
            {
               retry.stop();
               reject(new Error(err));
            }
         }, NodeUtilities.getFaultTolerantTimeoutOpts(outer.inputParameters, () =>
         {
            if (retry.retry('Timed out while attempting to create an Openstack Server.'))
            {
               return;
            }
            retry.stop();
            reject(new Error('Timed out while attempting to create an Openstack Server.'));
         }));
      });
      let server = null;
      server = await retryPromise;
      if (server && server.id)
      {
         server = await this.waitForBoot(server.id);
         if (networkObject.length > 0)
         {
            for (const network of networkObject)
            {
               await outer.attachInterface(server.id, network.port, network.uuid);
            }
            await outer.rebootServer();
         }
      }
      return server;
   }

   waitForBoot(id)
   {
      const outer = this;
      this.setParameterValue('openstack_vm_id', 'string', id);
      const retry = utils.getFaultTolerantOperation(this.inputParameters);
      const retryPromise = new Promise((resolve, reject) =>
      {
         retry.attempt(async() =>
         {
            try
            {
               const server = await outer.getServer();
               if (server && server.status === 'RUNNING')
               {
                  retry.stop();
                  resolve(server);
               }
               else
               {
                  if (retry.retry('Server is not booted'))
                  {
                     return;
                  }
                  reject(new Error('Failed to determine if server was booted. Retry timeout exceeded'));
               }
            }
            catch (err)
            {
               if (retry.retry(err))
               {
                  return;
               }
               reject(new Error('Failed to query for server. Could not determine if the server was booted.'));
            }
         }, NodeUtilities.getFaultTolerantTimeoutOpts(outer.inputParameters, () =>
         {
            if (retry.retry('Timed out while attempting to determine if a server has booted successfully.'))
            {
               return;
            }
            retry.stop();
            reject(new Error('Timed out while attempting to determine if a server has booted successfully.'));
         }));
      });
      return retryPromise;
   }
   waitForShutdown(id)
   {
      const outer = this;
      this.setParameterValue('openstack_vm_id', 'string', id);
      const retry = utils.getFaultTolerantOperation(this.inputParameters);
      const retryPromise = new Promise((resolve, reject) =>
      {
         retry.attempt(async() =>
         {
            try
            {
               const server = await outer.getServer();
               if (server && server.status === 'STOPPED')
               {
                  retry.stop();
                  resolve(server);
               }
               else
               {
                  if (retry.retry('Server is not shut down'))
                  {
                     return;
                  }
                  reject(new Error('Failed to determine if server was shut down. Retry timeout exceeded'));
               }
            }
            catch (err)
            {
               if (retry.retry(err))
               {
                  return;
               }
               reject(new Error('Failed to query for server. Could not determine if the server was shut down.'));
            }
         }, NodeUtilities.getFaultTolerantTimeoutOpts(outer.inputParameters, () =>
         {
            if (retry.retry('Timed out while attempting to determine if a server has shut down successfully.'))
            {
               return;
            }
            retry.stop();
            reject(new Error('Timed out while attempting to determine if a server has shut down successfully.'));
         }));
      });
      return retryPromise;
   }

   destroyServer()
   {
      const outer = this;

      const vmId = this.getParameterValue('openstack_vm_id');
      const retry = utils.getFaultTolerantOperation(this.inputParameters);
      const retryPromise = new Promise((resolve, reject) =>
      {
         retry.attempt(() =>
         {
            try
            {
               outer.getClient().destroyServer(vmId, (err, server) =>
               {
                  if (retry.retry(err))
                  {
                     return;
                  }
                  if (err)
                  {
                     reject(new Error(`While destroying a VM: ${OpenstackComputeClient.generateErrorMessage(err)}`));
                  }
                  resolve(server);
               });
            }
            catch (err)
            {
               retry.stop();
               reject(new Error(err));
            }
         }, NodeUtilities.getFaultTolerantTimeoutOpts(outer.inputParameters, () =>
         {
            if (retry.retry('Timed out while attempting to destroy an Openstack Server.'))
            {
               return;
            }
            retry.stop();
            reject(new Error('Timed out while attempting to destroy an Openstack Server.'));
         }));
      });
      return retryPromise;
   }

   getServer()
   {
      const outer = this;

      const vmId = this.getParameterValue('openstack_vm_id');
      const retry = utils.getFaultTolerantOperation(this.inputParameters);
      const retryPromise = new Promise((resolve, reject) =>
      {
         retry.attempt(() =>
         {
            try
            {
               outer.getClient().getServer(vmId, (err, server) =>
               {
                  if (retry.retry(err))
                  {
                     return;
                  }
                  if (err)
                  {
                     reject(new Error(`While getting details on a server: ${OpenstackComputeClient.generateErrorMessage(err)}`));
                  }
                  resolve(server);
               });
            }
            catch (err)
            {
               retry.stop();
               reject(new Error(err));
            }
         }, NodeUtilities.getFaultTolerantTimeoutOpts(outer.inputParameters, () =>
         {
            if (retry.retry('Timed out while attempting to get the details of an Openstack Server.'))
            {
               return;
            }
            retry.stop();
            reject(new Error('Timed out while attempting to get the details of an Openstack Server.'));
         }));
      });
      return retryPromise;
   }
   startServer()
   {
      const outer = this;

      const vmId = this.getParameterValue('openstack_vm_id');

      const retry = utils.getFaultTolerantOperation(this.inputParameters);
      const retryPromise = new Promise((resolve, reject) =>
      {
         retry.attempt(() =>
         {
            try
            {
               outer.getClient().startServer(vmId, async(err) =>
               {
                  if (retry.retry(err))
                  {
                     return;
                  }
                  if (err)
                  {
                     reject(new Error(`While starting a VM: ${OpenstackComputeClient.generateErrorMessage(err)}`));
                  }
                  const server = await outer.waitForBoot(vmId);
                  resolve(server);
               });
            }
            catch (err)
            {
               retry.stop();
               reject(new Error(err));
            }
         }, NodeUtilities.getFaultTolerantTimeoutOpts(outer.inputParameters, () =>
         {
            if (retry.retry('Timed out while attempting to start an Openstack Server.'))
            {
               return;
            }
            retry.stop();
            reject(new Error('Timed out while attempting to start an Openstack Server.'));
         }));
      });
      return retryPromise;
   }
   stopServer()
   {
      const outer = this;

      const vmId = this.getParameterValue('openstack_vm_id');

      const retry = utils.getFaultTolerantOperation(this.inputParameters);
      const retryPromise = new Promise((resolve, reject) =>
      {
         retry.attempt(() =>
         {
            try
            {
               outer.getClient().stopServer(vmId, async(err) =>
               {
                  if (retry.retry(err))
                  {
                     return;
                  }
                  if (err)
                  {
                     reject(new Error(`While stopping a VM: ${OpenstackComputeClient.generateErrorMessage(err)}`));
                  }
                  const server = await outer.waitForBoot(vmId);
                  resolve(server);
               });
            }
            catch (err)
            {
               retry.stop();
               reject(new Error(err));
            }
         }, NodeUtilities.getFaultTolerantTimeoutOpts(outer.inputParameters, () =>
         {
            if (retry.retry('Timed out while attempting to stop an Openstack Server.'))
            {
               return;
            }
            retry.stop();
            reject(new Error('Timed out while attempting to stop an Openstack Server.'));
         }));
      });
      return retryPromise;
   }
   rebootServer()
   {
      const outer = this;

      const vmId = this.getParameterValue('openstack_vm_id');
      const action = this.getParameterValue('openstack_vm_action');

      const options = {};

      switch (action)
      {
      case 'soft-reboot':
         options.type = 'SOFT';
         break;
      case 'hard-reboot':
         options.type = 'HARD';
         break;
      default:
         console.warn(new Error('An invalid reboot action type was detected. Defaulting to a soft reboot.'));
         options.type = 'SOFT';
         break;
      }

      const retry = utils.getFaultTolerantOperation(this.inputParameters);
      const retryPromise = new Promise((resolve, reject) =>
      {
         retry.attempt(() =>
         {
            try
            {
               outer.getClient().rebootServer(vmId, options, async(err) =>
               {
                  if (retry.retry(err))
                  {
                     return;
                  }
                  if (err)
                  {
                     reject(new Error(`While rebooting a VM: ${OpenstackComputeClient.generateErrorMessage(err)}`));
                  }
                  const server = await outer.waitForBoot(vmId);
                  resolve(server);
               });
            }
            catch (err)
            {
               retry.stop();
               reject(new Error(err));
            }
         }, NodeUtilities.getFaultTolerantTimeoutOpts(outer.inputParameters, () =>
         {
            if (retry.retry('Timed out while attempting to reboot an Openstack Server.'))
            {
               return;
            }
            retry.stop();
            reject(new Error('Timed out while attempting to reboot an Openstack Server.'));
         }));
      });
      return retryPromise;
   }

   getFlavors()
   {
      const outer = this;
      const retry = utils.getFaultTolerantOperation(this.inputParameters);
      const retryPromise = new Promise((resolve, reject) =>
      {
         retry.attempt(() =>
         {
            try
            {
               outer.getClient().getFlavors((err, flavors) =>
               {
                  if (retry.retry(err))
                  {
                     return;
                  }
                  if (err)
                  {
                     reject(new Error(`While getting available flavors: ${OpenstackComputeClient.generateErrorMessage(err)}`));
                  }
                  resolve(flavors);
               });
            }
            catch (err)
            {
               retry.stop();
               reject(new Error(err));
            }
         }, NodeUtilities.getFaultTolerantTimeoutOpts(outer.inputParameters, () =>
         {
            if (retry.retry('Timed out while attempting to get the list of Openstack VM Flavors.'))
            {
               return;
            }
            retry.stop();
            reject(new Error('Timed out while attempting to get the list of Openstack VM Flavors.'));
         }));
      });
      return retryPromise;
   }
   getFlavor()
   {
      const outer = this;

      const id = this.getParameterValue('openstack_flavor_id');

      const retry = utils.getFaultTolerantOperation(this.inputParameters);
      const retryPromise = new Promise((resolve, reject) =>
      {
         retry.attempt(() =>
         {
            try
            {
               outer.getClient().getFlavor(id, (err, flavor) =>
               {
                  if (retry.retry(err))
                  {
                     return;
                  }
                  if (err)
                  {
                     reject(new Error(`While getting flavor: ${OpenstackComputeClient.generateErrorMessage(err)}`));
                  }
                  resolve(flavor);
               });
            }
            catch (err)
            {
               retry.stop();
               reject(new Error(err));
            }
         }, NodeUtilities.getFaultTolerantTimeoutOpts(outer.inputParameters, () =>
         {
            if (retry.retry('Timed out while attempting to get Openstack VM Flavor.'))
            {
               return;
            }
            retry.stop();
            reject(new Error('Timed out while attempting to get Openstack VM Flavor.'));
         }));
      });
      return retryPromise;
   }
   createFlavor()
   {
      const outer = this;

      const name = this.getParameterValue('openstack_flavor_name');
      const description = this.getParameterValue('openstack_flavor_description');
      const ram = this.getParameterValue('openstack_flavor_ram');
      const disk = this.getParameterValue('openstack_flavor_disk');
      const vcpus = this.getParameterValue('openstack_flavor_vcpus');
      const ephemeralDisk = this.getParameterValue('openstack_flavor_ephemeral_disk');
      const swap = this.getParameterValue('openstack_flavor_swap');
      const rxtxFactor = this.getParameterValue('openstack_flavor_rxtx_factor');
      const isPublic = this.getParameterValue('openstack_flavor_is_public');

      const options = {
         name: name,
         description: description,
         ram: ram,
         disk: disk,
         vcpus: vcpus,
         'OS-FLV-EXT-DATA:ephemeral': ephemeralDisk,
         swap: swap,
         rxtx_factor: rxtxFactor,
         'os-flavor-access:is_public': isPublic
      };

      const retry = utils.getFaultTolerantOperation(this.inputParameters);
      const retryPromise = new Promise((resolve, reject) =>
      {
         retry.attempt(() =>
         {
            try
            {
               outer.getClient().createFlavor(options, (err, flavor) =>
               {
                  if (retry.retry(err))
                  {
                     return;
                  }
                  if (err)
                  {
                     reject(new Error(`While creating flavor: ${OpenstackComputeClient.generateErrorMessage(err)}`));
                  }
                  resolve(flavor);
               });
            }
            catch (err)
            {
               retry.stop();
               reject(new Error(err));
            }
         }, NodeUtilities.getFaultTolerantTimeoutOpts(outer.inputParameters, () =>
         {
            if (retry.retry('Timed out while attempting to create Openstack VM Flavor.'))
            {
               return;
            }
            retry.stop();
            reject(new Error('Timed out while attempting to create Openstack VM Flavor.'));
         }));
      });
      return retryPromise;
   }
   deleteFlavor()
   {
      const outer = this;

      const id = this.getParameterValue('openstack_flavor_id');

      const retry = utils.getFaultTolerantOperation(this.inputParameters);
      const retryPromise = new Promise((resolve, reject) =>
      {
         retry.attempt(() =>
         {
            try
            {
               outer.getClient().deleteFlavor(id, (err) =>
               {
                  if (retry.retry(err))
                  {
                     return;
                  }
                  if (err)
                  {
                     reject(new Error(`While deleting flavor: ${OpenstackComputeClient.generateErrorMessage(err)}`));
                  }
                  resolve();
               });
            }
            catch (err)
            {
               retry.stop();
               reject(new Error(err));
            }
         }, NodeUtilities.getFaultTolerantTimeoutOpts(outer.inputParameters, () =>
         {
            if (retry.retry('Timed out while attempting to delete Openstack Flavor.'))
            {
               return;
            }
            retry.stop();
            reject(new Error('Timed out while attempting to delete Openstack Flavor.'));
         }));
      });
      return retryPromise;
   }
   createFlavorExtraSpecs()
   {
      const outer = this;

      const id = this.getParameterValue('openstack_flavor_id');
      const extraSpecs = this.getParameterValue('openstack_flavor_extra_specs');

      const retry = utils.getFaultTolerantOperation(this.inputParameters);
      const retryPromise = new Promise((resolve, reject) =>
      {
         retry.attempt(() =>
         {
            try
            {
               outer.getClient().createFlavorExtraSpecs(id, extraSpecs, (err, specs) =>
               {
                  if (retry.retry(err))
                  {
                     return;
                  }
                  if (err)
                  {
                     reject(new Error(`While creating flavor extra specs: ${OpenstackComputeClient.generateErrorMessage(err)}`));
                  }
                  resolve(specs);
               });
            }
            catch (err)
            {
               retry.stop();
               reject(new Error(err));
            }
         }, NodeUtilities.getFaultTolerantTimeoutOpts(outer.inputParameters, () =>
         {
            if (retry.retry('Timed out while attempting to create Openstack Flavor Extra Specs.'))
            {
               return;
            }
            retry.stop();
            reject(new Error('Timed out while attempting to create Openstack Flavor Extra Specs.'));
         }));
      });
      return retryPromise;
   }

   updateFlavorExtraSpec()
   {
      const outer = this;

      const id = this.getParameterValue('openstack_flavor_id');
      const key = this.getParameterValue('openstack_flavor_extra_spec_key');
      const value = this.getParameterValue('openstack_flavor_extra_spec_value');

      const options =
      {
         key: key,
         value: value
      };

      const retry = utils.getFaultTolerantOperation(this.inputParameters);
      const retryPromise = new Promise((resolve, reject) =>
      {
         retry.attempt(() =>
         {
            try
            {
               outer.getClient().updateFlavorExtraSpec(id, options, (err, specs) =>
               {
                  if (retry.retry(err))
                  {
                     return;
                  }
                  if (err)
                  {
                     reject(new Error(`While updating flavor extra spec: ${OpenstackComputeClient.generateErrorMessage(err)}`));
                  }
                  resolve(specs);
               });
            }
            catch (err)
            {
               retry.stop();
               reject(new Error(err));
            }
         }, NodeUtilities.getFaultTolerantTimeoutOpts(outer.inputParameters, () =>
         {
            if (retry.retry('Timed out while attempting to update Openstack Flavor Extra Spec.'))
            {
               return;
            }
            retry.stop();
            reject(new Error('Timed out while attempting to update Openstack Flavor Extra Spec.'));
         }));
      });
      return retryPromise;
   }
   deleteFlavorExtraSpec()
   {
      const outer = this;

      const id = this.getParameterValue('openstack_flavor_id');
      const key = this.getParameterValue('openstack_flavor_extra_spec_key');

      const retry = utils.getFaultTolerantOperation(this.inputParameters);
      const retryPromise = new Promise((resolve, reject) =>
      {
         retry.attempt(() =>
         {
            try
            {
               outer.getClient().deleteFlavorExtraSpec(id, key, (err) =>
               {
                  if (retry.retry(err))
                  {
                     return;
                  }
                  if (err)
                  {
                     reject(new Error(`While deleting flavor extra specs: ${OpenstackComputeClient.generateErrorMessage(err)}`));
                  }
                  resolve();
               });
            }
            catch (err)
            {
               retry.stop();
               reject(new Error(err));
            }
         }, NodeUtilities.getFaultTolerantTimeoutOpts(outer.inputParameters, () =>
         {
            if (retry.retry('Timed out while attempting to delete Openstack Flavor Extra Spec.'))
            {
               return;
            }
            retry.stop();
            reject(new Error('Timed out while attempting to delete Openstack Flavor Extra Spec.'));
         }));
      });
      return retryPromise;
   }

   // TODO: This is using a deprecated API on the compute service. Switch to new Image client which calls the Glance API directly
   getImages()
   {
      const outer = this;
      const retry = utils.getFaultTolerantOperation(this.inputParameters);
      const retryPromise = new Promise((resolve, reject) =>
      {
         retry.attempt(() =>
         {
            try
            {
               outer.getClient().getImages((err, images) =>
               {
                  if (retry.retry(err))
                  {
                     return;
                  }
                  if (err)
                  {
                     reject(new Error(`While getting available images: ${OpenstackComputeClient.generateErrorMessage(err)}`));
                  }
                  resolve(images);
               });
            }
            catch (err)
            {
               retry.stop();
               reject(new Error(err));
            }
         }, NodeUtilities.getFaultTolerantTimeoutOpts(outer.inputParameters, () =>
         {
            if (retry.retry('Timed out while attempting to get the list of Openstack VM Images.'))
            {
               return;
            }
            retry.stop();
            reject(new Error('Timed out while attempting to get the list of Openstack VM Images.'));
         }));
      });
      return retryPromise;
   }

   attachVolume()
   {
      const outer = this;

      const vmId = this.getParameterValue('openstack_vm_id');
      const volumeId = this.getParameterValue('openstack_volume_id');

      const retry = utils.getFaultTolerantOperation(this.inputParameters);
      const retryPromise = new Promise((resolve, reject) =>
      {
         retry.attempt(() =>
         {
            try
            {
               outer.getClient().attachVolume(vmId, volumeId, (err, volumeAttachment) =>
               {
                  if (retry.retry(err))
                  {
                     return;
                  }
                  if (err)
                  {
                     reject(new Error(`While attaching a volume to a VM: ${OpenstackComputeClient.generateErrorMessage(err)}`));
                  }
                  resolve(volumeAttachment);
               });
            }
            catch (err)
            {
               retry.stop();
               reject(new Error(err));
            }
         }, NodeUtilities.getFaultTolerantTimeoutOpts(outer.inputParameters, () =>
         {
            if (retry.retry('Timed out while attempting to attach a volume to a VM.'))
            {
               return;
            }
            retry.stop();
            reject(new Error('Timed out while attempting to attach a volume to a VM.'));
         }));
      });
      return retryPromise;
   }

   detachVolume()
   {
      const outer = this;

      const vmId = this.getParameterValue('openstack_vm_id');
      const volumeId = this.getParameterValue('openstack_volume_id');

      const retry = utils.getFaultTolerantOperation(this.inputParameters);
      const retryPromise = new Promise((resolve, reject) =>
      {
         retry.attempt(() =>
         {
            try
            {
               outer.getClient().detachVolume(vmId, volumeId, (err) =>
               {
                  if (retry.retry(err))
                  {
                     return;
                  }
                  if (err)
                  {
                     reject(new Error(`While detaching a volume from a VM: ${OpenstackComputeClient.generateErrorMessage(err)}`));
                  }
                  resolve(true);
               });
            }
            catch (err)
            {
               retry.stop();
               reject(new Error(err));
            }
         }, NodeUtilities.getFaultTolerantTimeoutOpts(outer.inputParameters, () =>
         {
            if (retry.retry('Timed out while attempting to detach a volume from a VM.'))
            {
               return;
            }
            retry.stop();
            reject(new Error('Timed out while attempting to detach a volume from a VM.'));
         }));
      });
      return retryPromise;
   }

   attachInterface(theVmId, thePortId, theNetworkId)
   {
      const outer = this;

      const vmId = theVmId || this.getParameterValue('openstack_vm_id');
      const portId = thePortId || this.getParameterValue('openstack_port_id');
      const networkId = theNetworkId || this.getParameterValue('openstack_network_id');

      const retry = utils.getFaultTolerantOperation(this.inputParameters);
      const retryPromise = new Promise((resolve, reject) =>
      {
         let iface = null;
         if (portId && networkId)
         {
            reject(new Error('Only one of [port id] and [network id] may be specified. Make sure your configuration only sends one or the other.'));
         }
         else if (portId)
         {
            iface = { port_id: portId };
         }
         else if (networkId)
         {
            iface = { net_id: networkId };
         }
         else
         {
            reject(new Error('You must specify one of [port id] or [network id]. Please make sure your configuration sends one of those values.'));
         }
         retry.attempt(() =>
         {
            try
            {
               outer.getClient().attachInterface(vmId, iface, (err, interfaceAttachment) =>
               {
                  if (retry.retry(err))
                  {
                     return;
                  }
                  if (err)
                  {
                     reject(new Error(`While attaching an interface to a VM: ${OpenstackComputeClient.generateErrorMessage(err)}`));
                  }
                  resolve(interfaceAttachment);
               });
            }
            catch (err)
            {
               retry.stop();
               reject(new Error(err));
            }
         }, NodeUtilities.getFaultTolerantTimeoutOpts(outer.inputParameters, () =>
         {
            if (retry.retry('Timed out while attempting to attach an interface to a VM.'))
            {
               return;
            }
            retry.stop();
            reject(new Error('Timed out while attempting to attach an interface to a VM.'));
         }));
      });
      return retryPromise;
   }

   detachInterface()
   {
      const outer = this;

      const vmId = this.getParameterValue('openstack_vm_id');
      const portId = this.getParameterValue('openstack_port_id');

      const retry = utils.getFaultTolerantOperation(this.inputParameters);
      const retryPromise = new Promise((resolve, reject) =>
      {
         retry.attempt(() =>
         {
            try
            {
               outer.getClient().detachInterface(vmId, portId, (err) =>
               {
                  if (retry.retry(err))
                  {
                     return;
                  }
                  if (err)
                  {
                     reject(new Error(`While detaching an interface from a VM: ${OpenstackComputeClient.generateErrorMessage(err)}`));
                  }
                  resolve(true);
               });
            }
            catch (err)
            {
               retry.stop();
               reject(new Error(err));
            }
         }, NodeUtilities.getFaultTolerantTimeoutOpts(outer.inputParameters, () =>
         {
            if (retry.retry('Timed out while attempting to detach an interface from a VM.'))
            {
               return;
            }
            retry.stop();
            reject(new Error('Timed out while attempting to detach an interface from a VM.'));
         }));
      });
      return retryPromise;
   }
   getServerGroups()
   {
      const outer = this;
      const retry = utils.getFaultTolerantOperation(this.inputParameters);
      const retryPromise = new Promise((resolve, reject) =>
      {
         retry.attempt(() =>
         {
            try
            {
               outer.getClient().getServerGroups((err, results) =>
               {
                  if (retry.retry(err))
                  {
                     return;
                  }
                  if (err)
                  {
                     reject(new Error(`While getting server groups: ${OpenstackComputeClient.generateErrorMessage(err)}`));
                  }
                  resolve(results);
               });
            }
            catch (err)
            {
               retry.stop();
               reject(new Error(err));
            }
         }, NodeUtilities.getFaultTolerantTimeoutOpts(outer.inputParameters, () =>
         {
            if (retry.retry('Timed out while attempting to get server groups.'))
            {
               return;
            }
            retry.stop();
            reject(new Error('Timed out while attempting to get server groups.'));
         }));
      });
      return retryPromise;
   }
   getServerGroup()
   {
      const outer = this;

      const serverGroupId = this.getParameterValue('openstack_server_group_id');

      const retry = utils.getFaultTolerantOperation(this.inputParameters);
      const retryPromise = new Promise((resolve, reject) =>
      {
         retry.attempt(() =>
         {
            try
            {
               outer.getClient().getServerGroup(serverGroupId, (err, result) =>
               {
                  if (retry.retry(err))
                  {
                     return;
                  }
                  if (err)
                  {
                     reject(new Error(`While getting server group: ${OpenstackComputeClient.generateErrorMessage(err)}`));
                  }
                  resolve(result);
               });
            }
            catch (err)
            {
               retry.stop();
               reject(new Error(err));
            }
         }, NodeUtilities.getFaultTolerantTimeoutOpts(outer.inputParameters, () =>
         {
            if (retry.retry('Timed out while attempting to get server group.'))
            {
               return;
            }
            retry.stop();
            reject(new Error('Timed out while attempting to get server group.'));
         }));
      });
      return retryPromise;
   }
   createServerGroup()
   {
      const outer = this;

      const name = this.getParameterValue('openstack_server_group_name');
      const policy = this.getParameterValue('openstack_server_group_policy');
      const rules = this.getParameterValue('openstack_server_group_rules');

      const options = {
         name: name,
         policy: policy,
         rules: rules
      };

      const retry = utils.getFaultTolerantOperation(this.inputParameters);
      const retryPromise = new Promise((resolve, reject) =>
      {
         retry.attempt(() =>
         {
            try
            {
               outer.getClient().createServerGroup(options, (err, result) =>
               {
                  if (retry.retry(err))
                  {
                     return;
                  }
                  if (err)
                  {
                     reject(new Error(`While creating server group: ${OpenstackComputeClient.generateErrorMessage(err)}`));
                  }
                  resolve(result);
               });
            }
            catch (err)
            {
               retry.stop();
               reject(new Error(err));
            }
         }, NodeUtilities.getFaultTolerantTimeoutOpts(outer.inputParameters, () =>
         {
            if (retry.retry('Timed out while attempting to create server group.'))
            {
               return;
            }
            retry.stop();
            reject(new Error('Timed out while attempting to create server group.'));
         }));
      });
      return retryPromise;
   }
   deleteServerGroup()
   {
      const outer = this;

      const serverGroupId = this.getParameterValue('openstack_server_group_id');

      const retry = utils.getFaultTolerantOperation(this.inputParameters);
      const retryPromise = new Promise((resolve, reject) =>
      {
         retry.attempt(() =>
         {
            try
            {
               outer.getClient().destroyServerGroup(serverGroupId, (err) =>
               {
                  if (retry.retry(err))
                  {
                     return;
                  }
                  if (err)
                  {
                     reject(new Error(`While deleting server group: ${OpenstackComputeClient.generateErrorMessage(err)}`));
                  }
                  resolve(true);
               });
            }
            catch (err)
            {
               retry.stop();
               reject(new Error(err));
            }
         }, NodeUtilities.getFaultTolerantTimeoutOpts(outer.inputParameters, () =>
         {
            if (retry.retry('Timed out while attempting to delete server group.'))
            {
               return;
            }
            retry.stop();
            reject(new Error('Timed out while attempting to delete server group.'));
         }));
      });
      return retryPromise;
   }
   getRemoteConsole()
   {
      const outer = this;

      const vmId = this.getParameterValue('openstack_vm_id');
      const type = this.getParameterValue('openstack_remote_console_type');
      const protocol = this.getParameterValue('openstack_remote_console_protocol');

      const options = { type: type, protocol: protocol };

      const retry = utils.getFaultTolerantOperation(this.inputParameters);
      const retryPromise = new Promise((resolve, reject) =>
      {
         retry.attempt(() =>
         {
            try
            {
               outer.getClient().getRemoteConsole(vmId, options, (err, result) =>
               {
                  if (retry.retry(err))
                  {
                     return;
                  }
                  if (err)
                  {
                     reject(new Error(`While getting remote console: ${OpenstackComputeClient.generateErrorMessage(err)}`));
                  }
                  resolve(result);
               });
            }
            catch (err)
            {
               retry.stop();
               reject(new Error(err));
            }
         }, NodeUtilities.getFaultTolerantTimeoutOpts(outer.inputParameters, () =>
         {
            if (retry.retry('Timed out while getting remote console.'))
            {
               return;
            }
            retry.stop();
            reject(new Error('Timed out while getting remote console.'));
         }));
      });
      return retryPromise;
   }

   getManagementInterface(vmId)
   {
      const outer = this;
      let vmIdentifier;
      if (vmId)
      {
         vmIdentifier = vmId;
      }
      else
      {
         vmIdentifier = this.getParameterValue('openstack_vm_id');
      }
      const managementInterfaceType = this.getParameterValue('openstack_vm_management_network_type');
      const managementId = this.getParameterValue('openstack_vm_management_network');
      if (managementInterfaceType.toLowerCase() === 'none')
      {
         return {
            fixed_ips: [
               { ip_address: '0.0.0.0' }
            ]
         };
      }
      const retry = utils.getFaultTolerantOperation(this.inputParameters);
      const retryPromise = new Promise((resolve, reject) =>
      {
         retry.attempt(() =>
         {
            try
            {
               outer.getClient().getInterfaceAttachments(vmIdentifier, (err, interfaces) =>
               {
                  if (retry.retry(err))
                  {
                     return;
                  }
                  if (err)
                  {
                     reject(new Error(`While getting the management interface for a VM: ${OpenstackComputeClient.generateErrorMessage(err)}`));
                  }
                  let managementIface = null;
                  if (interfaces && Array.isArray(interfaces))
                  {
                     for (const iface of interfaces)
                     {
                        if (managementInterfaceType.toLowerCase() === 'network' && iface.net_id === managementId)
                        {
                           managementIface = iface;
                        }
                        else if (managementInterfaceType.toLowerCase() === 'port' && iface.port_id === managementId)
                        {
                           managementIface = iface;
                        }
                     }
                  }
                  if (managementIface)
                  {
                     resolve(managementIface);
                  }
                  else
                  {
                     reject(new Error('Could not find the designated management interface in the list of interfaces attached to the VM.'));
                  }
               });
            }
            catch (err)
            {
               retry.stop();
               reject(new Error(err));
            }
         }, NodeUtilities.getFaultTolerantTimeoutOpts(outer.inputParameters, () =>
         {
            if (retry.retry('Timed out while attempting to get the management interface for the VM.'))
            {
               return;
            }
            retry.stop();
            reject(new Error('Timed out while attempting to get the management interface for the VM.'));
         }));
      });
      return retryPromise;
   }

   getKeypairs()
   {
      const outer = this;
      const retry = utils.getFaultTolerantOperation(this.inputParameters);
      const retryPromise = new Promise((resolve, reject) =>
      {
         retry.attempt(() =>
         {
            try
            {
               outer.getClient().listKeys((err, keypairs) =>
               {
                  if (retry.retry(err))
                  {
                     return;
                  }
                  if (err)
                  {
                     reject(new Error(`While getting the list of Keypairs: ${OpenstackComputeClient.generateErrorMessage(err)}`));
                  }
                  resolve(keypairs);
               });
            }
            catch (err)
            {
               retry.stop();
               reject(new Error(err));
            }
         }, NodeUtilities.getFaultTolerantTimeoutOpts(outer.inputParameters, () =>
         {
            if (retry.retry('Timed out while attempting to get the list of Openstack Keypairs.'))
            {
               return;
            }
            retry.stop();
            reject(new Error('Timed out while attempting to get the list of Openstack Keypairs.'));
         }));
      });
      return retryPromise;
   }

   async createKeypair()
   {
      const outer = this;

      const name = this.getParameterValue('openstack_keypair_name');
      const publicKey = this.getParameterValue('openstack_public_key');

      const keypairObject = {};
      keypairObject.name = name;
      if (publicKey && publicKey !== '')
      {
         keypairObject.key = publicKey;
      }

      const retry = utils.getFaultTolerantOperation(this.inputParameters);
      const retryPromise = new Promise((resolve, reject) =>
      {
         retry.attempt(() =>
         {
            try
            {
               outer.getClient().addKey(keypairObject, (err, keypair) =>
               {
                  if (retry.retry(err))
                  {
                     return;
                  }
                  if (err)
                  {
                     reject(new Error(`While creating a keypair: ${OpenstackComputeClient.generateErrorMessage(err)}`));
                  }
                  resolve(keypair);
               });
            }
            catch (err)
            {
               retry.stop();
               reject(new Error(err));
            }
         }, NodeUtilities.getFaultTolerantTimeoutOpts(outer.inputParameters, () =>
         {
            if (retry.retry('Timed out while attempting to create an Openstack Keypair.'))
            {
               return;
            }
            retry.stop();
            reject(new Error('Timed out while attempting to create an Openstack Keypair.'));
         }));
      });
      let keypair = null;
      keypair = await retryPromise;
      return keypair;
   }

   destroyKeypair()
   {
      const outer = this;

      const name = this.getParameterValue('openstack_keypair_name');
      const retry = utils.getFaultTolerantOperation(this.inputParameters);
      const retryPromise = new Promise((resolve, reject) =>
      {
         retry.attempt(() =>
         {
            try
            {
               outer.getClient().destroyKey(name, (err, keypair) =>
               {
                  if (retry.retry(err))
                  {
                     return;
                  }
                  if (err)
                  {
                     reject(new Error(`While destroying a Keypair: ${OpenstackComputeClient.generateErrorMessage(err)}`));
                  }
                  resolve(keypair);
               });
            }
            catch (err)
            {
               retry.stop();
               reject(new Error(err));
            }
         }, NodeUtilities.getFaultTolerantTimeoutOpts(outer.inputParameters, () =>
         {
            if (retry.retry('Timed out while attempting to destroy an Openstack Keypair.'))
            {
               return;
            }
            retry.stop();
            reject(new Error('Timed out while attempting to destroy an Openstack Keypair.'));
         }));
      });
      return retryPromise;
   }

   getKeypair()
   {
      const outer = this;

      const name = this.getParameterValue('openstack_keypair_name');
      const retry = utils.getFaultTolerantOperation(this.inputParameters);
      const retryPromise = new Promise((resolve, reject) =>
      {
         retry.attempt(() =>
         {
            try
            {
               outer.getClient().getKey(name, (err, keypair) =>
               {
                  if (retry.retry(err))
                  {
                     return;
                  }
                  if (err)
                  {
                     reject(new Error(`While getting details on a keypair: ${OpenstackComputeClient.generateErrorMessage(err)}`));
                  }
                  resolve(keypair);
               });
            }
            catch (err)
            {
               retry.stop();
               reject(new Error(err));
            }
         }, NodeUtilities.getFaultTolerantTimeoutOpts(outer.inputParameters, () =>
         {
            if (retry.retry('Timed out while attempting to get the details of an Openstack Keypair.'))
            {
               return;
            }
            retry.stop();
            reject(new Error('Timed out while attempting to get the details of an Openstack Keypair.'));
         }));
      });
      return retryPromise;
   }

   getProjects()
   {
      const outer = this;
      const retry = utils.getFaultTolerantOperation(this.inputParameters);
      const retryPromise = new Promise((resolve, reject) =>
      {
         retry.attempt(() =>
         {
            try
            {
               outer.getIdentityClient().getProjects(outer.getIdentityClient().version, (err, projects) =>
               {
                  if (retry.retry(err))
                  {
                     return;
                  }
                  if (err)
                  {
                     reject(new Error(`While getting the list of Projects: ${OpenstackComputeClient.generateErrorMessage(err)}`));
                  }
                  resolve(projects);
               });
            }
            catch (err)
            {
               retry.stop();
               reject(new Error(err));
            }
         }, NodeUtilities.getFaultTolerantTimeoutOpts(outer.inputParameters, () =>
         {
            if (retry.retry('Timed out while attempting to get the list of Openstack Projects.'))
            {
               return;
            }
            retry.stop();
            reject(new Error('Timed out while attempting to get the list of Openstack Projects.'));
         }));
      });
      return retryPromise;
   }

   getProject()
   {
      const outer = this;

      const name = this.getParameterValue('openstack_project_name');
      const retry = utils.getFaultTolerantOperation(this.inputParameters);
      const retryPromise = new Promise((resolve, reject) =>
      {
         retry.attempt(() =>
         {
            try
            {
               outer.getIdentityClient().getProject(outer.getIdentityClient().version, name, (err, project) =>
               {
                  if (retry.retry(err))
                  {
                     return;
                  }
                  if (err)
                  {
                     reject(new Error(`While getting details on a project: ${OpenstackComputeClient.generateErrorMessage(err)}`));
                  }
                  resolve(project);
               });
            }
            catch (err)
            {
               retry.stop();
               reject(new Error(err));
            }
         }, NodeUtilities.getFaultTolerantTimeoutOpts(outer.inputParameters, () =>
         {
            if (retry.retry('Timed out while attempting to get the details of an Openstack Project.'))
            {
               return;
            }
            retry.stop();
            reject(new Error('Timed out while attempting to get the details of an Openstack Project.'));
         }));
      });
      return retryPromise;
   }
};
