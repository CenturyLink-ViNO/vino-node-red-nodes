const AnsibleConfig = require('./drivers/ansible/config');
const NetconfConfig = require('./drivers/netconf/config');
const OpenstackConfig = require('./drivers/openstack/nodeConfig');
module.exports = {
   types: ['vino-driver-ansible', 'vino-driver-netconf', 'vino-driver-openstack'],
   config: {
      'vino-driver-ansible': {
         configCommands: AnsibleConfig.settings.vinoDriverAnsibleCommands,
         commonParameters: AnsibleConfig.settings.vinoDriverAnsibleCommonParameters
      },
      'vino-driver-netconf': {
         configCommands: NetconfConfig.settings.vinoDriverNetconfCommands,
         commonParameters: NetconfConfig.settings.vinoDriverNetconfCommonParameters
      },
      'vino-driver-openstack': {
         configCommands: OpenstackConfig.settings.vinoDriverOpenstackCommands,
         commonParameters: OpenstackConfig.settings.vinoDriverOpenstackCommonParameters
      }
   }
};