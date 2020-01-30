/* eslint max-lines: ["off"] */
/* eslint dot-notation: ["off"] */

const pkgcloud = require('../../../lib/openstack/vendor/pkgcloud/lib/pkgcloud');
const NodeUtilities = require('../../../lib/driver-utils/index');
const utils = NodeUtilities.Utils;
const Parameter = require('../../../lib/driver-utils/parameter');

module.exports = class OpenstackNetworkClient
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
         const keystoneAuthVersion = this.getParameterValue('openstack_api_version');
         const authUrl = this.getParameterValue('openstack_auth_url');
         const region = this.getParameterValue('openstack_region_name');
         const strictSSL = !this.getParameterValue('openstack_allow_insecure_connections');
         const tenantName = this.getParameterValue('openstack_tenant_name');
         this.client = pkgcloud.network.createClient({
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

   static generateErrorMessage(err)
   {
      if (err.hasOwnProperty('result'))
      {
         if (err.result.hasOwnProperty('NeutronError'))
         {
            let msg = err.result.NeutronError.message;
            if (err.result.NeutronError.hasOwnProperty('detail'))
            {
               msg = msg + err.result.NeutronError.detail;
            }
            return msg;
         }
         else if (err.result.hasOwnProperty('error'))
         {
            return err.result.error.message;
         }
         return err.toString();
      }
      return err.toString();
   }

   getNetworks()
   {
      const outer = this;
      const retry = utils.getFaultTolerantOperation(this.inputParameters);
      const retryPromise = new Promise((resolve, reject) =>
      {
         retry.attempt(() =>
         {
            try
            {
               outer.getClient().getNetworks((err, networks) =>
               {
                  if (retry.retry(err))
                  {
                     return;
                  }
                  if (err)
                  {
                     reject(OpenstackNetworkClient.generateErrorMessage(err));
                  }
                  resolve(networks);
               });
            }
            catch (err)
            {
               retry.stop();
               reject(new Error(err));
            }
         }, NodeUtilities.getFaultTolerantTimeoutOpts(outer.inputParameters, () =>
         {
            if (retry.retry('Timed out while attempting to get the list of Openstack Networks.'))
            {
               return;
            }
            retry.stop();
            reject(new Error('Timed out while attempting to get the list of Openstack Networks.'));
         }));
      });
      return retryPromise;
   }

   getNetwork()
   {
      const outer = this;
      const networkId = this.getParameterValue('openstack_network_id');
      const retry = utils.getFaultTolerantOperation(this.inputParameters);
      const retryPromise = new Promise((resolve, reject) =>
      {
         retry.attempt(() =>
         {
            try
            {
               outer.getClient().getNetwork(networkId, (err, network) =>
               {
                  if (retry.retry(err))
                  {
                     return;
                  }
                  if (err)
                  {
                     reject(OpenstackNetworkClient.generateErrorMessage(err));
                  }
                  resolve(network);
               });
            }
            catch (err)
            {
               retry.stop();
               reject(new Error(err));
            }
         }, NodeUtilities.getFaultTolerantTimeoutOpts(outer.inputParameters, () =>
         {
            if (retry.retry('Timed out while attempting to get the details of an Openstack Network.'))
            {
               return;
            }
            retry.stop();
            reject(new Error('Timed out while attempting to get the details of an Openstack Network.'));
         }));
      });
      return retryPromise;
   }

   createNetwork()
   {
      const outer = this;

      const name = this.getParameterValue('openstack_network_name');
      const adminStateUp = this.getParameterValue('openstack_network_admin_state_up');
      const shared = this.getParameterValue('opesntack_network_shared') ? 1 : 0; // 0 or 1?
      const tenantId = this.getParameterValue('openstack_tenant_id');
      const dnsDomain = this.getParameterValue('openstack_network_dns_domain');
      const portSecurityEnabled = this.getParameterValue('openstack_port_security_enabled');
      const projectId = this.getParameterValue('openstack_project_id');
      const providerNetworkType = this.getParameterValue('openstack_network_type');
      const providerPhysicalNetwork = this.getParameterValue('physical_network_name');
      const providerSegmentationId = this.getParameterValue('openstack_network_segmentation_id');
      const qosPolicyId = this.getParameterValue('openstack_network_qos_policy_id');
      const routerExternal = this.getParameterValue('openstack_network_router_external');
      // let segments = {}; TODO: Do we want to implement segments?
      const vlanTransparent = this.getParameterValue('openstack_network_vlan_transparent');
      const description = this.getParameterValue('openstack_network_description');
      const isDefault = this.getParameterValue('openstack_network_is_default');
      const avalibilityZoneHints = this.getParameterValue('openstack_network_availability_zone_hints');

      const options = {
         name: name,
         adminStateUp: adminStateUp,
         shared: shared,
         tenantId: tenantId,
         dnsDomain: dnsDomain,
         portSecurityEnabled: portSecurityEnabled,
         projectId: projectId,
         providerNetworkType: providerNetworkType,
         providerPhysicalNetwork: providerPhysicalNetwork,
         providerSegmentationId: providerSegmentationId,
         qosPolicyId: qosPolicyId,
         routerExternal: routerExternal,
         vlanTransparent: vlanTransparent,
         description: description,
         isDefault: isDefault,
         availabilityZoneHints: avalibilityZoneHints
      };

      const retry = utils.getFaultTolerantOperation(this.inputParameters);
      const retryPromise = new Promise((resolve, reject) =>
      {
         retry.attempt(() =>
         {
            try
            {
               outer.getClient().createNetwork(options, (err, network) =>
               {
                  if (retry.retry(err))
                  {
                     return;
                  }
                  if (err)
                  {
                     reject(OpenstackNetworkClient.generateErrorMessage(err));
                  }
                  resolve(network);
               });
            }
            catch (err)
            {
               retry.stop();
               reject(new Error(err));
            }
         }, NodeUtilities.getFaultTolerantTimeoutOpts(outer.inputParameters, () =>
         {
            if (retry.retry('Timed out while attempting to create an Openstack Network.'))
            {
               return;
            }
            retry.stop();
            reject(new Error('Timed out while attempting to create an Openstack Network.'));
         }));
      });
      return retryPromise;
   }

   updateNetwork()
   {
      const outer = this;

      const id = this.getParameterValue('openstack_network_id');
      const name = this.getParameterValue('openstack_network_name');
      const adminStateUp = this.getParameterValue('openstack_network_admin_state_up');
      const shared = this.getParameterValue('opesntack_network_shared') ? 1 : 0; // 0 or 1?
      const dnsDomain = this.getParameterValue('openstack_network_dns_domain');
      const portSecurityEnabled = this.getParameterValue('openstack_network_port_security_enabled');
      const providerNetworkType = this.getParameterValue('openstack_network_type');
      const providerPhysicalNetwork = this.getParameterValue('openstack_network_physical_network');
      const providerSegmentationId = this.getParameterValue('openstack_network_segmentation_id');
      const qosPolicyId = this.getParameterValue('openstack_network_qos_policy_id');
      const routerExternal = this.getParameterValue('openstack_network_router_external');
      // let segments = {}; TODO: Do we want to implement segments?
      const description = this.getParameterValue('openstack_network_description');
      const isDefault = this.getParameterValue('openstack_network_is_default');

      const options = {
         id: id,
         name: name,
         adminStateUp: adminStateUp,
         shared: shared,
         dnsDomain: dnsDomain,
         portSecurityEnabled: portSecurityEnabled,
         providerNetworkType: providerNetworkType,
         providerPhysicalNetwork: providerPhysicalNetwork,
         providerSegmentationId: providerSegmentationId,
         qosPolicyId: qosPolicyId,
         routerExternal: routerExternal,
         description: description,
         isDefault: isDefault
      };

      const retry = utils.getFaultTolerantOperation(this.inputParameters);
      const retryPromise = new Promise((resolve, reject) =>
      {
         retry.attempt(() =>
         {
            try
            {
               outer.getClient().updateNetwork(options, (err, network) =>
               {
                  if (retry.retry(err))
                  {
                     return;
                  }
                  if (err)
                  {
                     reject(OpenstackNetworkClient.generateErrorMessage(err));
                  }
                  resolve(network);
               });
            }
            catch (err)
            {
               retry.stop();
               reject(new Error(err));
            }
         }, NodeUtilities.getFaultTolerantTimeoutOpts(outer.inputParameters, () =>
         {
            if (retry.retry('Timed out while attempting to update an Openstack Network.'))
            {
               return;
            }
            retry.stop();
            reject(new Error('Timed out while attempting to update an Openstack Network.'));
         }));
      });
      return retryPromise;
   }

   destroyNetwork()
   {
      const outer = this;

      const networkId = this.getParameterValue('openstack_network_id');
      const retry = utils.getFaultTolerantOperation(this.inputParameters);
      const retryPromise = new Promise((resolve, reject) =>
      {
         retry.attempt(() =>
         {
            try
            {
               outer.getClient().destroyNetwork(networkId, (err, network) =>
               {
                  if (retry.retry(err))
                  {
                     return;
                  }
                  if (err)
                  {
                     reject(OpenstackNetworkClient.generateErrorMessage(err));
                  }
                  resolve(network);
               });
            }
            catch (err)
            {
               retry.stop();
               reject(new Error(err));
            }
         }, NodeUtilities.getFaultTolerantTimeoutOpts(outer.inputParameters, () =>
         {
            if (retry.retry('Timed out while attempting to destroy an Openstack Network.'))
            {
               return;
            }
            retry.stop();
            reject(new Error('Timed out while attempting to destroy an Openstack Network.'));
         }));
      });
      return retryPromise;
   }

   getSubnets()
   {
      const outer = this;
      const retry = utils.getFaultTolerantOperation(this.inputParameters);
      const retryPromise = new Promise((resolve, reject) =>
      {
         retry.attempt(() =>
         {
            try
            {
               outer.getClient().getSubnets((err, networks) =>
               {
                  if (retry.retry(err))
                  {
                     return;
                  }
                  if (err)
                  {
                     reject(OpenstackNetworkClient.generateErrorMessage(err));
                  }
                  resolve(networks);
               });
            }
            catch (err)
            {
               retry.stop();
               reject(new Error(err));
            }
         }, NodeUtilities.getFaultTolerantTimeoutOpts(outer.inputParameters, () =>
         {
            if (retry.retry('Timed out while attempting to get the list of Openstack Subnets.'))
            {
               return;
            }
            retry.stop();
            reject(new Error('Timed out while attempting to get the list of Openstack Subnets.'));
         }));
      });
      return retryPromise;
   }

   getSubnet()
   {
      const outer = this;
      const subnetId = this.getParameterValue('openstack_subnet_id');
      const retry = utils.getFaultTolerantOperation(this.inputParameters);
      const retryPromise = new Promise((resolve, reject) =>
      {
         retry.attempt(() =>
         {
            try
            {
               outer.getClient().getSubnet(subnetId, (err, subnet) =>
               {
                  if (retry.retry(err))
                  {
                     return;
                  }
                  if (err)
                  {
                     reject(OpenstackNetworkClient.generateErrorMessage(err));
                  }
                  resolve(subnet);
               });
            }
            catch (err)
            {
               retry.stop();
               reject(new Error(err));
            }
         }, NodeUtilities.getFaultTolerantTimeoutOpts(outer.inputParameters, () =>
         {
            if (retry.retry('Timed out while attempting to get the details of an Openstack Subnet.'))
            {
               return;
            }
            retry.stop();
            reject(new Error('Timed out while attempting to get the details of an Openstack Subnet.'));
         }));
      });
      return retryPromise;
   }

   createSubnet()
   {
      const outer = this;

      const name = this.getParameterValue('openstack_subnet_name');
      const projectId = this.getParameterValue('openstack_project_id');
      const enableDhcp = this.getParameterValue('openstack_subnet_enable_dhcp');
      const networkId = this.getParameterValue('openstack_subnet_network_id');
      const dnsNameservers = this.getParameterValue('openstack_subnet_dns_nameservers');
      // let allocationPools = this.getParameterValue('openstack_subnet_allocation_pools'); // TODO: implement?
      // let hostRoutes = this.getParameterValue('openstack_subnet_host_routes');
      // For backwards compatibility, this cannot follow the openstack_subnet_<param name> pattern
      const ipVersion = this.getParameterValue('ip_version') || '4';
      const gatewayIp = this.getParameterValue('openstack_subnet_gateway_ip');
      const cidr = this.getParameterValue('openstack_subnet_cidr');
      const prefixlen = this.getParameterValue('openstack_subnet_prefixlen');
      const description = this.getParameterValue('openstack_subnet_description');
      const ipv6AddressMode = this.getParameterValue('openstack_subnet_ipv6_address_mode');
      const ipv6RaMode = this.getParameterValue('openstack_subnet_ipv6_ra_mode');
      // let segmentId = this.getParameterValue('openstack_subnet_segment_id'); // TODO: implement?
      // let subnetPoolId = this.getParameterValue('openstack_subnet_subnetpool_id'); // TODO: implement?
      // let useDefaultSubnetpool = this.getParameterValue('openstack_subnet_use_default_subnetpool'); // TODO: implement?
      // let serviceTypes = this.getParameterValue('openstack_subnet_service_types'); // TODO: implement?

      const options = {
         name: name,
         projectId: projectId,
         enableDhcp: enableDhcp,
         networkId: networkId,
         dnsNameservers: dnsNameservers,
         // allocationPools: allocationPools,
         // hostRoutes: hostRoutes,
         ipVersion: ipVersion,
         gatewayIp: gatewayIp,
         cidr: cidr,
         description: description
      };

      if (ipVersion === '6')
      {
         options.ipv6AddressMode = ipv6AddressMode;
         options.ipv6RaMode = ipv6RaMode;
      }

      if (prefixlen)
      {
         options.prefixlen = prefixlen;
      }

      const retry = utils.getFaultTolerantOperation(this.inputParameters);
      const retryPromise = new Promise((resolve, reject) =>
      {
         retry.attempt(() =>
         {
            try
            {
               outer.getClient().createSubnet(options, (err, subnet) =>
               {
                  if (retry.retry(err))
                  {
                     return;
                  }
                  if (err)
                  {
                     reject(OpenstackNetworkClient.generateErrorMessage(err));
                  }
                  resolve(subnet);
               });
            }
            catch (err)
            {
               retry.stop();
               reject(new Error(err));
            }
         }, NodeUtilities.getFaultTolerantTimeoutOpts(outer.inputParameters, () =>
         {
            if (retry.retry('Timed out while attempting to create an Openstack Subnet.'))
            {
               return;
            }
            retry.stop();
            reject(new Error('Timed out while attempting to create an Openstack Subnet.'));
         }));
      });
      return retryPromise;
   }

   updateSubnet()
   {
      const outer = this;

      const id = this.getParameterValue('openstack_subnet_id');
      const name = this.getParameterValue('openstack_subnet_name');
      const enableDhcp = this.getParameterValue('openstack_subnet_enable_dhcp');
      const dnsNameservers = this.getParameterValue('openstack_subnet_dns_nameservers');
      // let allocationPools = this.getParameterValue('openstack_subnet_allocation_pools'); // TODO: implement?
      // let hostRoutes = this.getParameterValue('openstack_subnet_host_routes'); // TODO: implement?
      const gatewayIp = this.getParameterValue('openstack_subnet_gateway_ip');
      const description = this.getParameterValue('openstack_subnet_description');

      const options = {
         id: id,
         name: name,
         enableDhcp: enableDhcp,
         dnsNameservers: dnsNameservers,
         // allocationPools: allocationPools,
         // hostRoutes: hostRoutes,
         gatewayIp: gatewayIp,
         description: description
      };

      const retry = utils.getFaultTolerantOperation(this.inputParameters);
      const retryPromise = new Promise((resolve, reject) =>
      {
         retry.attempt(() =>
         {
            try
            {
               outer.getClient().updateSubnet(options, (err, subnet) =>
               {
                  if (retry.retry(err))
                  {
                     return;
                  }
                  if (err)
                  {
                     reject(OpenstackNetworkClient.generateErrorMessage(err));
                  }
                  resolve(subnet);
               });
            }
            catch (err)
            {
               retry.stop();
               reject(new Error(err));
            }
         }, NodeUtilities.getFaultTolerantTimeoutOpts(outer.inputParameters, () =>
         {
            if (retry.retry('Timed out while attempting to update an Openstack Subnet.'))
            {
               return;
            }
            retry.stop();
            reject(new Error('Timed out while attempting to update an Openstack Subnet.'));
         }));
      });
      return retryPromise;
   }

   destroySubnet()
   {
      const outer = this;

      const subnetId = this.getParameterValue('openstack_subnet_id');
      const retry = utils.getFaultTolerantOperation(this.inputParameters);
      const retryPromise = new Promise((resolve, reject) =>
      {
         retry.attempt(() =>
         {
            try
            {
               outer.getClient().destroySubnet(subnetId, (err, subnet) =>
               {
                  if (retry.retry(err))
                  {
                     return;
                  }
                  if (err)
                  {
                     reject(OpenstackNetworkClient.generateErrorMessage(err));
                  }
                  resolve(subnet);
               });
            }
            catch (err)
            {
               retry.stop();
               reject(new Error(err));
            }
         }, NodeUtilities.getFaultTolerantTimeoutOpts(outer.inputParameters, () =>
         {
            if (retry.retry('Timed out while attempting to destroy an Openstack Subnet.'))
            {
               return;
            }
            retry.stop();
            reject(new Error('Timed out while attempting to destroy an Openstack Subnet.'));
         }));
      });
      return retryPromise;
   }

   getPorts()
   {
      const outer = this;
      const retry = utils.getFaultTolerantOperation(this.inputParameters);
      const retryPromise = new Promise((resolve, reject) =>
      {
         retry.attempt(() =>
         {
            try
            {
               outer.getClient().getPorts((err, ports) =>
               {
                  if (retry.retry(err))
                  {
                     return;
                  }
                  if (err)
                  {
                     reject(OpenstackNetworkClient.generateErrorMessage(err));
                  }
                  resolve(ports);
               });
            }
            catch (err)
            {
               retry.stop();
               reject(new Error(err));
            }
         }, NodeUtilities.getFaultTolerantTimeoutOpts(outer.inputParameters, () =>
         {
            if (retry.retry('Timed out while attempting to get the list of Openstack Ports.'))
            {
               return;
            }
            retry.stop();
            reject(new Error('Timed out while attempting to get the list of Openstack Ports.'));
         }));
      });
      return retryPromise;
   }

   getPort()
   {
      const outer = this;
      const portId = this.getParameterValue('openstack_port_id');
      const retry = utils.getFaultTolerantOperation(this.inputParameters);
      const retryPromise = new Promise((resolve, reject) =>
      {
         retry.attempt(() =>
         {
            try
            {
               outer.getClient().getPort(portId, (err, port) =>
               {
                  if (retry.retry(err))
                  {
                     return;
                  }
                  if (err)
                  {
                     reject(OpenstackNetworkClient.generateErrorMessage(err));
                  }
                  resolve(port);
               });
            }
            catch (err)
            {
               retry.stop();
               reject(new Error(err));
            }
         }, NodeUtilities.getFaultTolerantTimeoutOpts(outer.inputParameters, () =>
         {
            if (retry.retry('Timed out while attempting to get the details of an Openstack Port.'))
            {
               return;
            }
            retry.stop();
            reject(new Error('Timed out while attempting to get the details of an Openstack Port.'));
         }));
      });
      return retryPromise;
   }

   async createPort()
   {
      const processIps = function(ips)
      {
         const ret = [];
         if (ips)
         {
            ips.forEach(function(ipAddress)
            {
               ret.push({ 'ip_address': ipAddress });
            });
         }
         return ret;
      };

      const name = this.getParameterValue('openstack_port_name');
      // let allowed_address_pairs = this.getParameterValue('openstack_port_allowed_address_pairs'); // TODO: Implement?
      const outer = this;
      const adminStateUp = this.getParameterValue('openstack_port_admin_state_up');
      // let bindingHostID = this.getParameterValue('openstack_port_binding_host_id'); // binding:host_id // TODO: Implement?
      // let bindingProfile = this.getParameterValue('openstack_port_binding_profile'); // TODO: Implement?
      // let bindingVnicType = this.getParameterValue('openstack_port_vnic_type'); //binding:vnic_type // TODO: Implement?
      const description = this.getParameterValue('openstack_port_description');
      const deviceId = this.getParameterValue('openstack_port_device_id');
      // let extraDhcpOpts = this.getParameterValue('openstack_port_extra_dhcp_opts'); // TODO: Implement?
      const fixedIps = processIps(this.getParameterValue('openstack_port_fixed_ips'));
      // let deviceOwner = this.getParameterValue('openstack_port_device_owner'); // TODO: Implement?
      const networkId = this.getParameterValue('openstack_port_network_id');
      if (fixedIps.length === 0)
      {
         try
         {
            this.setParameterValue('openstack_network_id', 'string', networkId);
            const network = await this.getNetwork();
            if (network && network.subnets && Array.isArray(network.subnets) && network.subnets.length > 0)
            {
               fixedIps.push({ 'subnet_id': network.subnets[0] });  // Mimic the CLI and add a fixed IP for the first subnet in the list
            }
         }
         catch (getNetworkErr)
         {
            console.warn(`Failed to query for details on network ${networkId}. ${getNetworkErr}`);
         }
      }
      const macAddress = this.getParameterValue('openstack_port_mac_address');
      const portSecurityEnabled = this.getParameterValue('openstack_port_security_enabled');
      const securityGroups = this.getParameterValue('openstack_port_security_groups');

      const options = {
         'admin_state_up': adminStateUp,
         description: description,
         'device_id': deviceId,
         // extra_dhcp_opts: extraDhcpOpts,
         'fixed_ips': fixedIps,
         'mac_address': macAddress,
         name: name,
         'network_id': networkId,
         'port_security_enabled': portSecurityEnabled,
         'security_groups': securityGroups
      };

      const retry = utils.getFaultTolerantOperation(this.inputParameters);
      const retryPromise = new Promise((resolve, reject) =>
      {
         retry.attempt(() =>
         {
            try
            {
               outer.getClient().createPort(options, (err, port) =>
               {
                  if (retry.retry(err))
                  {
                     return;
                  }
                  if (err)
                  {
                     reject(OpenstackNetworkClient.generateErrorMessage(err));
                  }
                  resolve(port);
               });
            }
            catch (err)
            {
               retry.stop();
               reject(new Error(err));
            }
         }, NodeUtilities.getFaultTolerantTimeoutOpts(outer.inputParameters, () =>
         {
            if (retry.retry('Timed out while attempting to create an Openstack Port.'))
            {
               return;
            }
            retry.stop();
            reject(new Error('Timed out while attempting to create an Openstack Port.'));
         }));
      });
      return retryPromise;
   }

   updatePort()
   {
      const outer = this;

      const processIps = function(ips)
      {
         const ret = [];
         if (ips)
         {
            ips.forEach(function(ipAddress)
            {
               ret.push({ 'ip_address': ipAddress });
            });
         }
         return ret;
      };

      const id = this.getParameterValue('openstack_port_id');
      const adminStateUp = this.getParameterValue('openstack_port_admin_state_up');
      // let allowed_address_pairs = this.getParameterValue('openstack_port_allowed_address_pairs'); // TODO: Implement?
      // let bindingHostID = this.getParameterValue('openstack_port_binding_host_id'); // binding:host_id // TODO: Implement?
      // let bindingProfile = this.getParameterValue('openstack_port_binding_profile'); // TODO: Implement?
      // let bindingVnicType = this.getParameterValue('openstack_port_vnic_type'); //binding:vnic_type // TODO: Implement?
      const description = this.getParameterValue('openstack_port_description');
      const deviceId = this.getParameterValue('openstack_port_device_id');
      // let deviceOwner = this.getParameterValue('openstack_port_device_owner'); // TODO: Implement?
      // let extraDhcpOpts = this.getParameterValue('openstack_port_extra_dhcp_opts'); // TODO: Implement
      const fixedIps = processIps(this.getParameterValue('openstack_port_fixed_ips'));
      const macAddress = this.getParameterValue('openstack_port_mac_address');
      const name = this.getParameterValue('openstack_port_name');
      const portSecurityEnabled = this.getParameterValue('openstack_port_security_enabled');
      const qosPolicyId = this.getParameterValue('openstack_port_qos_policy_id');
      const securityGroups = this.getParameterValue('openstack_port_security_groups');

      const options = {
         id: id,
         // 'admin_state_up': adminStateUp,
         // description: description,
         // 'device_id': deviceId,
         // extra_dhcp_opts: extraDhcpOpts,
         // 'fixed_ips': fixedIps,
         // 'mac_address': macAddress,
         name: name
         // 'port_security_enabled': portSecurityEnabled,
         // 'qos_policy_id': qosPolicyId,
         // 'security_groups': securityGroups
      };
      if (adminStateUp)
      {
         options['admin_state_up'] = adminStateUp;
      }
      if (description)
      {
         options['description'] = description;
      }
      if (deviceId)
      {
         options['device_id'] = deviceId;
      }
      if (fixedIps && Array.isArray(fixedIps) && fixedIps.length > 0)
      {
         options['fixed_ips'] = fixedIps;
      }
      if (macAddress)
      {
         options['mac_address'] = macAddress;
      }
      if (portSecurityEnabled)
      {
         options['port_security_enabled'] = portSecurityEnabled;
      }
      if (qosPolicyId)
      {
         options['qos_policy_id'] = qosPolicyId;
      }
      if (securityGroups)
      {
         options['security_groups'] = securityGroups;
      }

      const retry = utils.getFaultTolerantOperation(this.inputParameters);
      const retryPromise = new Promise((resolve, reject) =>
      {
         retry.attempt(() =>
         {
            try
            {
               outer.getClient().updatePort(options, (err, port) =>
               {
                  if (retry.retry(err))
                  {
                     return;
                  }
                  if (err)
                  {
                     reject(OpenstackNetworkClient.generateErrorMessage(err));
                  }
                  resolve(port);
               });
            }
            catch (err)
            {
               retry.stop();
               reject(new Error(err));
            }
         }, NodeUtilities.getFaultTolerantTimeoutOpts(outer.inputParameters, () =>
         {
            if (retry.retry('Timed out while attempting to update an Openstack Port.'))
            {
               return;
            }
            retry.stop();
            reject(new Error('Timed out while attempting to update an Openstack Port.'));
         }));
      });
      return retryPromise;
   }

   // Note this block of code is no longer in use for attaching ports to VMs, but may be useful in the future.
   async attachPort()
   {
      const outer = this;

      const existingPort = await outer.getPort();

      if (existingPort)
      {
         const id = this.getParameterValue('openstack_port_id');
         const adminStateUp = existingPort.adminStateUp;
         const description = existingPort.description;
         const deviceId = this.getParameterValue('openstack_port_device_id');
         const fixedIps = existingPort.fixedIps;
         const macAddress = existingPort.macAddress;
         const name = existingPort.name;
         const portSecurityEnabled = existingPort.portSecurityEnabled;
         const qosPolicyId = existingPort.qosPolicyId;
         const securityGroups = existingPort.securityGroups;

         const options = {
            id: id,
            'admin_state_up': adminStateUp,
            description: description,
            'device_id': deviceId,
            'fixed_ips': fixedIps,
            'mac_address': macAddress,
            name: name,
            'port_security_enabled': portSecurityEnabled,
            'qos_policy_id': qosPolicyId,
            'security_groups': securityGroups,
            bindingVnicType: 'normal'
         };

         const retry = utils.getFaultTolerantOperation(this.inputParameters);
         const retryPromise = new Promise((resolve, reject) =>
         {
            retry.attempt(() =>
            {
               try
               {
                  outer.getClient().updatePort(options, (err, port) =>
                  {
                     if (retry.retry(err))
                     {
                        return;
                     }
                     if (err)
                     {
                        reject(OpenstackNetworkClient.generateErrorMessage(err));
                     }
                     resolve(port);
                  });
               }
               catch (err)
               {
                  retry.stop();
                  reject(new Error(err));
               }
            }, NodeUtilities.getFaultTolerantTimeoutOpts(outer.inputParameters, () =>
            {
               if (retry.retry('Timed out while attempting to update an Openstack Port.'))
               {
                  return;
               }
               retry.stop();
               reject(new Error('Timed out while attempting to update an Openstack Port.'));
            }));
         });
         return retryPromise;
      }

      throw new Error('Failed to get existing port data');
   }

   destroyPort()
   {
      const outer = this;

      const portId = this.getParameterValue('openstack_port_id');
      const retry = utils.getFaultTolerantOperation(this.inputParameters);
      const retryPromise = new Promise((resolve, reject) =>
      {
         retry.attempt(() =>
         {
            try
            {
               outer.getClient().destroyPort(portId, (err, port) =>
               {
                  if (retry.retry(err))
                  {
                     return;
                  }
                  if (err)
                  {
                     reject(OpenstackNetworkClient.generateErrorMessage(err));
                  }
                  resolve(port);
               });
            }
            catch (err)
            {
               retry.stop();
               reject(new Error(err));
            }
         }, NodeUtilities.getFaultTolerantTimeoutOpts(outer.inputParameters, () =>
         {
            if (retry.retry('Timed out while attempting to destroy an Openstack Port.'))
            {
               return;
            }
            retry.stop();
            reject(new Error('Timed out while attempting to destroy an Openstack Port.'));
         }));
      });
      return retryPromise;
   }

   getSecurityGroups()
   {
      const outer = this;
      const retry = utils.getFaultTolerantOperation(this.inputParameters);
      const retryPromise = new Promise((resolve, reject) =>
      {
         retry.attempt(() =>
         {
            try
            {
               outer.getClient().getSecurityGroups((err, securityGroups) =>
               {
                  if (retry.retry(err))
                  {
                     return;
                  }
                  if (err)
                  {
                     reject(OpenstackNetworkClient.generateErrorMessage(err));
                  }
                  resolve(securityGroups);
               });
            }
            catch (err)
            {
               retry.stop();
               reject(new Error(err));
            }
         }, NodeUtilities.getFaultTolerantTimeoutOpts(outer.inputParameters, () =>
         {
            if (retry.retry('Timed out while attempting to get the list of Openstack Security Groups.'))
            {
               return;
            }
            retry.stop();
            reject(new Error('Timed out while attempting to get the list of Openstack Security Groups.'));
         }));
      });
      return retryPromise;
   }

   getSecurityGroup()
   {
      const outer = this;
      const securityGroupId = this.getParameterValue('openstack_security_group_id');
      const retry = utils.getFaultTolerantOperation(this.inputParameters);
      const retryPromise = new Promise((resolve, reject) =>
      {
         retry.attempt(() =>
         {
            try
            {
               outer.getClient().getSecurityGroup(securityGroupId, (err, securityGroup) =>
               {
                  if (retry.retry(err))
                  {
                     return;
                  }
                  if (err)
                  {
                     reject(OpenstackNetworkClient.generateErrorMessage(err));
                  }
                  resolve(securityGroup);
               });
            }
            catch (err)
            {
               retry.stop();
               reject(new Error(err));
            }
         }, NodeUtilities.getFaultTolerantTimeoutOpts(outer.inputParameters, () =>
         {
            if (retry.retry('Timed out while attempting to get the details of an Openstack Security Group.'))
            {
               return;
            }
            retry.stop();
            reject(new Error('Timed out while attempting to get the details of an Openstack Security Group.'));
         }));
      });
      return retryPromise;
   }

   createSecurityGroup()
   {
      const outer = this;

      const name = this.getParameterValue('openstack_security_group_name');
      const description = this.getParameterValue('openstack_security_group_description');
      const tenantId = this.getParameterValue('openstack_tenant_id');

      const options = {
         name: name,
         description: description,
         tenantId: tenantId
      };

      const retry = utils.getFaultTolerantOperation(this.inputParameters);
      const retryPromise = new Promise((resolve, reject) =>
      {
         retry.attempt(() =>
         {
            try
            {
               outer.getClient().createSecurityGroup(options, (err, securityGroup) =>
               {
                  if (retry.retry(err))
                  {
                     return;
                  }
                  if (err)
                  {
                     reject(OpenstackNetworkClient.generateErrorMessage(err));
                  }
                  resolve(securityGroup);
               });
            }
            catch (err)
            {
               retry.stop();
               reject(new Error(err));
            }
         }, NodeUtilities.getFaultTolerantTimeoutOpts(outer.inputParameters, () =>
         {
            if (retry.retry('Timed out while attempting to create an Openstack Security Group.'))
            {
               return;
            }
            retry.stop();
            reject(new Error('Timed out while attempting to create an Openstack Security Group.'));
         }));
      });
      return retryPromise;
   }

   destroySecurityGroup()
   {
      const outer = this;

      const securityGroupId = this.getParameterValue('openstack_security_group_id');
      const retry = utils.getFaultTolerantOperation(this.inputParameters);
      const retryPromise = new Promise((resolve, reject) =>
      {
         retry.attempt(() =>
         {
            try
            {
               outer.getClient().destroySecurityGroup(securityGroupId, (err, securityGroup) =>
               {
                  if (retry.retry(err))
                  {
                     return;
                  }
                  if (err)
                  {
                     reject(OpenstackNetworkClient.generateErrorMessage(err));
                  }
                  resolve(securityGroup);
               });
            }
            catch (err)
            {
               retry.stop();
               reject(new Error(err));
            }
         }, NodeUtilities.getFaultTolerantTimeoutOpts(outer.inputParameters, () =>
         {
            if (retry.retry('Timed out while attempting to destroy an Openstack Security Group.'))
            {
               return;
            }
            retry.stop();
            reject(new Error('Timed out while attempting to destroy an Openstack Security Group.'));
         }));
      });
      return retryPromise;
   }

   getSecurityGroupRules()
   {
      const outer = this;
      const retry = utils.getFaultTolerantOperation(this.inputParameters);
      const retryPromise = new Promise((resolve, reject) =>
      {
         retry.attempt(() =>
         {
            try
            {
               outer.getClient().getSecurityGroupRules((err, rules) =>
               {
                  if (retry.retry(err))
                  {
                     return;
                  }
                  if (err)
                  {
                     reject(OpenstackNetworkClient.generateErrorMessage(err));
                  }
                  resolve(rules);
               });
            }
            catch (err)
            {
               retry.stop();
               reject(new Error(err));
            }
         }, NodeUtilities.getFaultTolerantTimeoutOpts(outer.inputParameters, () =>
         {
            if (retry.retry('Timed out while attempting to get the list of Openstack Security Group Rules.'))
            {
               return;
            }
            retry.stop();
            reject(new Error('Timed out while attempting to get the list of Openstack Security Group Rules.'));
         }));
      });
      return retryPromise;
   }

   getSecurityGroupRule()
   {
      const outer = this;
      const ruleId = this.getParameterValue('openstack_security_group_rule_id');
      const retry = utils.getFaultTolerantOperation(this.inputParameters);
      const retryPromise = new Promise((resolve, reject) =>
      {
         retry.attempt(() =>
         {
            try
            {
               outer.getClient().getSecurityGroupRule(ruleId, (err, rule) =>
               {
                  if (retry.retry(err))
                  {
                     return;
                  }
                  if (err)
                  {
                     reject(OpenstackNetworkClient.generateErrorMessage(err));
                  }
                  resolve(rule);
               });
            }
            catch (err)
            {
               retry.stop();
               reject(new Error(err));
            }
         }, NodeUtilities.getFaultTolerantTimeoutOpts(outer.inputParameters, () =>
         {
            if (retry.retry('Timed out while attempting to get the details of an Openstack Security Group Rule.'))
            {
               return;
            }
            retry.stop();
            reject(new Error('Timed out while attempting to get the details of an Openstack Security Group Rule.'));
         }));
      });
      return retryPromise;
   }

   createSecurityGroupRule()
   {
      const outer = this;

      const securityGroupId = this.getParameterValue('openstack_security_group_id');
      const direction = this.getParameterValue('openstack_security_group_rule_direction');
      const ethertype = this.getParameterValue('openstack_security_group_rule_ether_type');
      const portRangeMin = this.getParameterValue('openstack_security_group_rule_port_range_min');
      const portRangeMax = this.getParameterValue('openstack_security_group_rule_port_range_max');
      const protocol = this.getParameterValue('openstack_security_group_rule_protocol');
      const remoteGroupId = this.getParameterValue('openstack_security_group_rule_remote_group_id');
      const remoteIpPrefix = this.getParameterValue('openstack_security_group_rule_remote_ip_prefix');
      const tenantId = this.getParameterValue('openstack_tenant_id');

      const options = {
         securityGroupId: securityGroupId,
         direction: direction,
         ethertype: ethertype,
         portRangeMin: portRangeMin,
         portRangeMax: portRangeMax,
         protocol: protocol,
         remoteGroupId: remoteGroupId,
         remoteIpPrefix: remoteIpPrefix,
         tenantId: tenantId
      };

      const retry = utils.getFaultTolerantOperation(this.inputParameters);
      const retryPromise = new Promise((resolve, reject) =>
      {
         retry.attempt(() =>
         {
            try
            {
               outer.getClient().createSecurityGroupRule(options, (err, rule) =>
               {
                  if (retry.retry(err))
                  {
                     return;
                  }
                  if (err)
                  {
                     reject(OpenstackNetworkClient.generateErrorMessage(err));
                  }
                  resolve(rule);
               });
            }
            catch (err)
            {
               retry.stop();
               reject(new Error(err));
            }
         }, NodeUtilities.getFaultTolerantTimeoutOpts(outer.inputParameters, () =>
         {
            if (retry.retry('Timed out while attempting to create an Openstack Security Group Rule.'))
            {
               return;
            }
            retry.stop();
            reject(new Error('Timed out while attempting to create an Openstack Security Group Rule.'));
         }));
      });
      return retryPromise;
   }

   destroySecurityGroupRule()
   {
      const outer = this;

      const ruleId = this.getParameterValue('openstack_security_group_rule_id');
      const retry = utils.getFaultTolerantOperation(this.inputParameters);
      const retryPromise = new Promise((resolve, reject) =>
      {
         retry.attempt(() =>
         {
            try
            {
               outer.getClient().destroySecurityGroupRule(ruleId, (err, rule) =>
               {
                  if (retry.retry(err))
                  {
                     return;
                  }
                  if (err)
                  {
                     reject(OpenstackNetworkClient.generateErrorMessage(err));
                  }
                  resolve(rule);
               });
            }
            catch (err)
            {
               retry.stop();
               reject(new Error(err));
            }
         }, NodeUtilities.getFaultTolerantTimeoutOpts(outer.inputParameters, () =>
         {
            if (retry.retry('Timed out while attempting to destroy an Openstack Security Group Rule.'))
            {
               return;
            }
            retry.stop();
            reject(new Error('Timed out while attempting to destroy an Openstack Security Group Rule.'));
         }));
      });
      return retryPromise;
   }

   getTrunks()
   {
      const outer = this;
      const retry = utils.getFaultTolerantOperation(this.inputParameters);
      const retryPromise = new Promise((resolve, reject) =>
      {
         retry.attempt(() =>
         {
            try
            {
               outer.getClient().getTrunks((err, trunks) =>
               {
                  if (retry.retry(err))
                  {
                     return;
                  }
                  if (err)
                  {
                     reject(OpenstackNetworkClient.generateErrorMessage(err));
                  }
                  resolve(trunks);
               });
            }
            catch (err)
            {
               retry.stop();
               reject(new Error(err));
            }
         }, NodeUtilities.getFaultTolerantTimeoutOpts(outer.inputParameters, () =>
         {
            if (retry.retry('Timed out while attempting to get the list of Openstack Trunks.'))
            {
               return;
            }
            retry.stop();
            reject(new Error('Timed out while attempting to get the list of Openstack Trunks.'));
         }));
      });
      return retryPromise;
   }

   getTrunk()
   {
      const outer = this;
      const trunkId = this.getParameterValue('openstack_network_trunk_id');
      const retry = utils.getFaultTolerantOperation(this.inputParameters);
      const retryPromise = new Promise((resolve, reject) =>
      {
         retry.attempt(() =>
         {
            try
            {
               outer.getClient().getTrunk(trunkId, (err, trunk) =>
               {
                  if (retry.retry(err))
                  {
                     return;
                  }
                  if (err)
                  {
                     reject(OpenstackNetworkClient.generateErrorMessage(err));
                  }
                  resolve(trunk);
               });
            }
            catch (err)
            {
               retry.stop();
               reject(new Error(err));
            }
         }, NodeUtilities.getFaultTolerantTimeoutOpts(outer.inputParameters, () =>
         {
            if (retry.retry('Timed out while attempting to get the details of an Openstack Trunk.'))
            {
               return;
            }
            retry.stop();
            reject(new Error('Timed out while attempting to get the details of an Openstack Trunk.'));
         }));
      });
      return retryPromise;
   }

   createTrunk()
   {
      const outer = this;

      const name = this.getParameterValue('openstack_trunk_name');
      const projectId = this.getParameterValue('openstack_project_id');
      const portId = this.getParameterValue('openstack_trunk_port_id');
      const tenantId = this.getParameterValue('openstack_tenant_id');
      const description = this.getParameterValue('openstack_trunk_description');
      const adminStateUp = this.getParameterValue('openstack_trunk_admin_state_up');
      const subPorts = this.getParameterValue('openstack_trunk_sub_ports');

      const subPortObjects = [];

      if (subPorts !== null && Array.isArray(subPorts))
      {
         for (const idx in subPorts)
         {
            if (subPorts.hasOwnProperty(idx))
            {
               subPortObjects.push({ 'port_id': subPorts[idx] });
            }
         }
      }

      const options = {
         name: name,
         'project_id': projectId,
         'port_id': portId,
         'tenant_id': tenantId,
         description: description,
         'admin_state_up': adminStateUp,
         'sub_ports': subPortObjects
      };

      const retry = utils.getFaultTolerantOperation(this.inputParameters);
      const retryPromise = new Promise((resolve, reject) =>
      {
         retry.attempt(() =>
         {
            try
            {
               outer.getClient().createTrunk(options, (err, trunk) =>
               {
                  if (retry.retry(err))
                  {
                     return;
                  }
                  if (err)
                  {
                     reject(OpenstackNetworkClient.generateErrorMessage(err));
                  }
                  resolve(trunk);
               });
            }
            catch (err)
            {
               retry.stop();
               reject(new Error(err));
            }
         }, NodeUtilities.getFaultTolerantTimeoutOpts(outer.inputParameters, () =>
         {
            if (retry.retry('Timed out while attempting to create an Openstack Trunk.'))
            {
               return;
            }
            retry.stop();
            reject(new Error('Timed out while attempting to create an Openstack Trunk.'));
         }));
      });
      return retryPromise;
   }

   updateTrunk()
   {
      const outer = this;

      const id = this.getParameterValue('openstack_trunk_id');
      const name = this.getParameterValue('openstack_trunk_name');
      const description = this.getParameterValue('openstack_trunk_description');
      const adminStateUp = this.getParameterValue('openstack_trunk_admin_state_up');

      const options = {
         id: id,
         name: name,
         description: description,
         'admin_state_up': adminStateUp
      };

      const retry = utils.getFaultTolerantOperation(this.inputParameters);
      const retryPromise = new Promise((resolve, reject) =>
      {
         retry.attempt(() =>
         {
            try
            {
               outer.getClient().updateTrunk(options, (err, trunk) =>
               {
                  if (retry.retry(err))
                  {
                     return;
                  }
                  if (err)
                  {
                     reject(OpenstackNetworkClient.generateErrorMessage(err));
                  }
                  resolve(trunk);
               });
            }
            catch (err)
            {
               retry.stop();
               reject(new Error(err));
            }
         }, NodeUtilities.getFaultTolerantTimeoutOpts(outer.inputParameters, () =>
         {
            if (retry.retry('Timed out while attempting to update an Openstack Trunk.'))
            {
               return;
            }
            retry.stop();
            reject(new Error('Timed out while attempting to update an Openstack Trunk.'));
         }));
      });
      return retryPromise;
   }

   destroyTrunk()
   {
      const outer = this;

      const trunkId = this.getParameterValue('openstack_trunk_id');
      const retry = utils.getFaultTolerantOperation(this.inputParameters);
      const retryPromise = new Promise((resolve, reject) =>
      {
         retry.attempt(() =>
         {
            try
            {
               outer.getClient().destroyTrunk(trunkId, (err, trunk) =>
               {
                  if (retry.retry(err))
                  {
                     return;
                  }
                  if (err)
                  {
                     reject(OpenstackNetworkClient.generateErrorMessage(err));
                  }
                  resolve(trunk);
               });
            }
            catch (err)
            {
               retry.stop();
               reject(new Error(err));
            }
         }, NodeUtilities.getFaultTolerantTimeoutOpts(outer.inputParameters, () =>
         {
            if (retry.retry('Timed out while attempting to destroy an Openstack Trunk.'))
            {
               return;
            }
            retry.stop();
            reject(new Error('Timed out while attempting to destroy an Openstack Trunk.'));
         }));
      });
      return retryPromise;
   }

   addSubPortToTrunk()
   {
      const outer = this;

      const trunkId = this.getParameterValue('openstack_trunk_id');
      const subPortId = this.getParameterValue('openstack_trunk_sub_port_id');
      const subPortSegmentationType = this.getParameterValue('openstack_trunk_sub_port_segmentation_type');
      const subPortSegmentationId = this.getParameterValue('openstack_trunk_sub_port_segmentation_id');

      const subPortObjects = [];
      subPortObjects.push({ 'port_id': subPortId, 'segmentation_type': subPortSegmentationType, 'segmentation_id': subPortSegmentationId });

      const options = {
         id: trunkId,
         'sub_ports': subPortObjects
      };

      const retry = utils.getFaultTolerantOperation(this.inputParameters);
      const retryPromise = new Promise((resolve, reject) =>
      {
         retry.attempt(() =>
         {
            try
            {
               outer.getClient().addSubports(options, (err, trunk) =>
               {
                  if (retry.retry(err))
                  {
                     return;
                  }
                  if (err)
                  {
                     reject(OpenstackNetworkClient.generateErrorMessage(err));
                  }
                  resolve(trunk);
               });
            }
            catch (err)
            {
               retry.stop();
               reject(new Error(err));
            }
         }, NodeUtilities.getFaultTolerantTimeoutOpts(outer.inputParameters, () =>
         {
            if (retry.retry('Timed out while attempting to add a sub port to an Openstack Trunk.'))
            {
               return;
            }
            retry.stop();
            reject(new Error('Timed out while attempting to add a sub port to an Openstack Trunk.'));
         }));
      });
      return retryPromise;
   }

   removeSubPortFromTrunk()
   {
      const outer = this;

      const trunkId = this.getParameterValue('openstack_trunk_id');
      const subPorts = this.getParameterValue('openstack_trunk_sub_ports');

      const subPortObjects = [];

      if (subPorts !== null && Array.isArray(subPorts))
      {
         for (const idx in subPorts)
         {
            if (subPorts.hasOwnProperty(idx))
            {
               subPortObjects.push({ 'port_id': subPorts[idx] });
            }
         }
      }

      const options = {
         id: trunkId,
         'sub_ports': subPortObjects
      };

      const retry = utils.getFaultTolerantOperation(this.inputParameters);
      const retryPromise = new Promise((resolve, reject) =>
      {
         retry.attempt(() =>
         {
            try
            {
               outer.getClient().removeSubports(options, (err, trunk) =>
               {
                  if (retry.retry(err))
                  {
                     return;
                  }
                  if (err)
                  {
                     reject(OpenstackNetworkClient.generateErrorMessage(err));
                  }
                  resolve(trunk);
               });
            }
            catch (err)
            {
               retry.stop();
               reject(new Error(err));
            }
         }, NodeUtilities.getFaultTolerantTimeoutOpts(outer.inputParameters, () =>
         {
            if (retry.retry('Timed out while attempting to remove sub ports from an Openstack Trunk.'))
            {
               return;
            }
            retry.stop();
            reject(new Error('Timed out while attempting to remove sub ports from an Openstack Trunk.'));
         }));
      });
      return retryPromise;
   }

   getSubPortsFromTrunk()
   {
      const outer = this;

      const trunkId = this.getParameterValue('openstack_trunk_id');

      const retry = utils.getFaultTolerantOperation(this.inputParameters);
      const retryPromise = new Promise((resolve, reject) =>
      {
         retry.attempt(() =>
         {
            try
            {
               outer.getClient().getSubports(trunkId, (err, trunk) =>
               {
                  if (retry.retry(err))
                  {
                     return;
                  }
                  if (err)
                  {
                     reject(OpenstackNetworkClient.generateErrorMessage(err));
                  }
                  resolve(trunk);
               });
            }
            catch (err)
            {
               retry.stop();
               reject(new Error(err));
            }
         }, NodeUtilities.getFaultTolerantTimeoutOpts(outer.inputParameters, () =>
         {
            if (retry.retry('Timed out while attempting to get sub ports from an Openstack Trunk.'))
            {
               return;
            }
            retry.stop();
            reject(new Error('Timed out while attempting to get sub ports from an Openstack Trunk.'));
         }));
      });
      return retryPromise;
   }
};
