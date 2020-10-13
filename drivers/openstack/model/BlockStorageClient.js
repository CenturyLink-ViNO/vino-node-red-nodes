/* eslint max-lines: ["off"] */

const pkgcloud = require('../../../lib/openstack/vendor/pkgcloud/lib/pkgcloud');
const NodeUtilities = require('../../../lib/driver-utils/index');
const utils = NodeUtilities.Utils;
const Parameter = require('../../../lib/driver-utils/parameter');

module.exports = class OpenstackBlockStorageClient
{
   constructor(inputParameters)
   {
      this.inputParameters = inputParameters;
   }

   static generateErrorMessage(err)
   {
      if (err.hasOwnProperty('result'))
      {
         return JSON.stringify(err.result, null, 3);
      }
      return err.toString();
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
         this.client = pkgcloud.blockstorage.createClient({
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

   getParameterValue(parameterName)
   {
      let ret = null;
      const parameter = utils.findParameter(this.inputParameters, parameterName);
      if (parameter !== null && parameter !== undefined && parameter.hasValue())
      {
         ret = parameter.getValue();
      }
      return ret;
   }

   getVolumes()
   {
      const outer = this;
      const retry = utils.getFaultTolerantOperation(this.inputParameters);
      const retryPromise = new Promise((resolve, reject) =>
      {
         retry.attempt(() =>
         {
            try
            {
               outer.getClient().getVolumes((err, volumes) =>
               {
                  if (retry.retry(err))
                  {
                     return;
                  }
                  if (err)
                  {
                     reject(new Error(`While getting the list of volumes: ${OpenstackBlockStorageClient.generateErrorMessage(err)}`));
                  }
                  resolve(volumes);
               });
            }
            catch (err)
            {
               retry.stop();
               reject(new Error(err));
            }
         }, NodeUtilities.getFaultTolerantTimeoutOpts(outer.inputParameters, () =>
         {
            if (retry.retry('Timed out while attempting to get the list of Openstack Volumes.'))
            {
               return;
            }
            retry.stop();
            reject(new Error('Timed out while attempting to get the list of Openstack Volumes.'));
         }));
      });
      return retryPromise;
   }

   getVolume()
   {
      const outer = this;
      const volumeId = this.getParameterValue('openstack_volume_id');

      const retry = utils.getFaultTolerantOperation(this.inputParameters);
      const retryPromise = new Promise((resolve, reject) =>
      {
         retry.attempt(() =>
         {
            try
            {
               outer.getClient().getVolume(volumeId, (err, volume) =>
               {
                  if (retry.retry(err))
                  {
                     return;
                  }
                  if (err)
                  {
                     reject(new Error(`While getting the details of a Volume: ${OpenstackBlockStorageClient.generateErrorMessage(err)}`));
                  }
                  resolve(volume);
               });
            }
            catch (err)
            {
               retry.stop();
               reject(new Error(err));
            }
         }, NodeUtilities.getFaultTolerantTimeoutOpts(outer.inputParameters, () =>
         {
            if (retry.retry('Timed out while attempting to get the details of an Openstack Volume.'))
            {
               return;
            }
            retry.stop();
            reject(new Error('Timed out while attempting to get the details of an Openstack Volume.'));
         }));
      });
      return retryPromise;
   }

   async createVolume()
   {
      const outer = this;

      const name = this.getParameterValue('openstack_volume_name');
      const description = this.getParameterValue('openstack_volume_description');
      const size = this.getParameterValue('openstack_volume_size');
      const volumeType = this.getParameterValue('openstack_volume_type');
      const snapshotId = this.getParameterValue('openstack_volume_snapshot_id');
      const imageId = this.getParameterValue('openstack_volume_image_id');

      const options = {
         name: name,
         description: description,
         size: size,
         volumeType: volumeType,
         snapshotId: snapshotId,
         imageRef: imageId
      };

      const retry = utils.getFaultTolerantOperation(this.inputParameters);
      const retryPromise = new Promise((resolve, reject) =>
      {
         retry.attempt(() =>
         {
            try
            {
               outer.getClient().createVolume(options, (err, volume) =>
               {
                  if (retry.retry(err))
                  {
                     return;
                  }
                  if (err)
                  {
                     reject(new Error(`While creating a volume: ${OpenstackBlockStorageClient.generateErrorMessage(err)}`));
                  }
                  resolve(volume);
               });
            }
            catch (err)
            {
               retry.stop();
               reject(new Error(err));
            }
         }, NodeUtilities.getFaultTolerantTimeoutOpts(outer.inputParameters, () =>
         {
            if (retry.retry('Timed out while attempting to create an Openstack Volume.'))
            {
               return;
            }
            retry.stop();
            reject(new Error('Timed out while attempting to create an Openstack Volume.'));
         }));
      });
      let volume = null;
      volume = await retryPromise;
      if (volume && volume.id)
      {
         const readyVolume = await this.waitForVolumeAvailable(volume.id);
         if (typeof readyVolume === 'string')
         {
            throw new Error(readyVolume);
         }
         else
         {
            volume = readyVolume;
         }
      }
      return volume;
   }

   waitForVolumeAvailable(id)
   {
      const outer = this;
      this.setParameterValue('openstack_volume_id', 'string', id);
      const retry = utils.getFaultTolerantOperation(this.inputParameters);
      const retryPromise = new Promise((resolve, reject) =>
      {
         retry.attempt(async() =>
         {
            try
            {
               const volume = await outer.getVolume();
               if (volume && volume.status.toLowerCase() === 'available')
               {
                  retry.stop();
                  resolve(volume);
               }
               else
               {
                  if (retry.retry('Volume is not ready'))
                  {
                     return;
                  }
                  reject(new Error('Failed to determine if the volume is ready to be attached. Timeout limit exceeded.'));
               }
            }
            catch (err)
            {
               if (retry.retry(err))
               {
                  return;
               }
               reject(new Error('Failed to query for volume. Could not determine if the volume is available.'));
            }
         }, NodeUtilities.getFaultTolerantTimeoutOpts(outer.inputParameters, () =>
         {
            if (retry.retry('Timed out while attempting to determine if a volume is available.'))
            {
               return;
            }
            retry.stop();
            reject(new Error('Timed out while attempting to determine if a volume is available.'));
         }));
      });
      return retryPromise;
   }

   updateVolume()
   {
      const outer = this;

      const id = this.getParameterValue('openstack_volume_id');
      const name = this.getParameterValue('openstack_volume_name');
      const description = this.getParameterValue('openstack_volume_description');

      const options = {
         id: id,
         name: name,
         description: description
      };

      const retry = utils.getFaultTolerantOperation(this.inputParameters);
      const retryPromise = new Promise((resolve, reject) =>
      {
         retry.attempt(() =>
         {
            try
            {
               outer.getClient().updateVolume(options, (err, volume) =>
               {
                  if (retry.retry(err))
                  {
                     return;
                  }
                  if (err)
                  {
                     reject(new Error(`While updating a Volume: ${OpenstackBlockStorageClient.generateErrorMessage(err)}`));
                  }
                  resolve(volume);
               });
            }
            catch (err)
            {
               retry.stop();
               reject(new Error(err));
            }
         }, NodeUtilities.getFaultTolerantTimeoutOpts(outer.inputParameters, () =>
         {
            if (retry.retry('Timed out while attempting to update an Openstack Volume.'))
            {
               return;
            }
            retry.stop();
            reject(new Error('Timed out while attempting to update an Openstack Volume.'));
         }));
      });
      return retryPromise;
   }

   destroyVolume()
   {
      const outer = this;

      const volumeId = this.getParameterValue('openstack_volume_id');
      const retry = utils.getFaultTolerantOperation(this.inputParameters);
      const retryPromise = new Promise((resolve, reject) =>
      {
         retry.attempt(() =>
         {
            try
            {
               outer.getClient().deleteVolume(volumeId, (err, volume) =>
               {
                  if (retry.retry(err))
                  {
                     return;
                  }
                  if (err)
                  {
                     reject(new Error(`While destroying a Volume: ${OpenstackBlockStorageClient.generateErrorMessage(err)}`));
                  }
                  resolve(volume);
               });
            }
            catch (err)
            {
               retry.stop();
               reject(new Error(err));
            }
         }, NodeUtilities.getFaultTolerantTimeoutOpts(outer.inputParameters, () =>
         {
            if (retry.retry('Timed out while attempting to destroy an Openstack Volume.'))
            {
               return;
            }
            retry.stop();
            reject(new Error('Timed out while attempting to destroy an Openstack Volume.'));
         }));
      });
      return retryPromise;
   }

   getSnapshots()
   {
      const outer = this;
      const retry = utils.getFaultTolerantOperation(this.inputParameters);
      const retryPromise = new Promise((resolve, reject) =>
      {
         retry.attempt(() =>
         {
            try
            {
               outer.getClient().getSnapshots((err, snapshots) =>
               {
                  if (retry.retry(err))
                  {
                     return;
                  }
                  if (err)
                  {
                     reject(new Error(`While getting the list of snapshots: ${OpenstackBlockStorageClient.generateErrorMessage(err)}`));
                  }
                  resolve(snapshots);
               });
            }
            catch (err)
            {
               retry.stop();
               reject(new Error(err));
            }
         }, NodeUtilities.getFaultTolerantTimeoutOpts(outer.inputParameters, () =>
         {
            if (retry.retry('Timed out while attempting to get the list of Openstack Snapshots.'))
            {
               return;
            }
            retry.stop();
            reject(new Error('Timed out while attempting to get the list of Openstack Snapshots.'));
         }));
      });
      return retryPromise;
   }

   getSnapshot()
   {
      const outer = this;
      const snapshotId = this.getParameterValue('openstack_snapshot_id');

      const retry = utils.getFaultTolerantOperation(this.inputParameters);
      const retryPromise = new Promise((resolve, reject) =>
      {
         retry.attempt(() =>
         {
            try
            {
               outer.getClient().getSnapshot(snapshotId, (err, snapshots) =>
               {
                  if (retry.retry(err))
                  {
                     return;
                  }
                  if (err)
                  {
                     reject(new Error(`While getting the details for a Snapshot: ${OpenstackBlockStorageClient.generateErrorMessage(err)}`));
                  }
                  resolve(snapshots);
               });
            }
            catch (err)
            {
               retry.stop();
               reject(new Error(err));
            }
         }, NodeUtilities.getFaultTolerantTimeoutOpts(outer.inputParameters, () =>
         {
            if (retry.retry('Timed out while attempting to get the details of an Openstack Snapshot.'))
            {
               return;
            }
            retry.stop();
            reject(new Error('Timed out while attempting to get the details of an Openstack Snapshot.'));
         }));
      });
      return retryPromise;
   }

   async createSnapshot()
   {
      const outer = this;

      const name = this.getParameterValue('openstack_snapshot_name');
      const description = this.getParameterValue('openstack_snapshot_description');
      const volumeId = this.getParameterValue('openstack_volume_id');
      const force = this.getParameterValue('openstack_snapshot_force');
      const projectId = this.getParameterValue('openstack_project_id');

      const options = {
         name: name,
         description: description,
         volumeId: volumeId,
         projectId: projectId,
         force: force
      };

      const retry = utils.getFaultTolerantOperation(this.inputParameters);
      const retryPromise = new Promise((resolve, reject) =>
      {
         retry.attempt(() =>
         {
            try
            {
               outer.getClient().createSnapshot(options, (err, snapshot) =>
               {
                  if (retry.retry(err))
                  {
                     return;
                  }
                  if (err)
                  {
                     reject(new Error(`While creating a snapshot: ${OpenstackBlockStorageClient.generateErrorMessage(err)}`));
                  }
                  resolve(snapshot);
               });
            }
            catch (err)
            {
               retry.stop();
               reject(new Error(err));
            }
         }, NodeUtilities.getFaultTolerantTimeoutOpts(outer.inputParameters, () =>
         {
            if (retry.retry('Timed out while attempting to create an Openstack Snapshot.'))
            {
               return;
            }
            retry.stop();
            reject(new Error('Timed out while attempting to create an Openstack Snapshot.'));
         }));
      });
      let snapshot = null;
      snapshot = await retryPromise;
      if (snapshot && snapshot.id)
      {
         outer.waitForSnapshotAvailable(snapshot.id);
      }
      return snapshot;
   }

   waitForSnapshotAvailable(id)
   {
      const outer = this;
      this.setParameterValue('openstack_snapshot_id', 'string', id);
      const retry = utils.getFaultTolerantOperation(this.inputParameters);
      const retryPromise = new Promise((resolve, reject) =>
      {
         retry.attempt(async() =>
         {
            try
            {
               const snapshot = await outer.getSnapshot();
               if (snapshot && snapshot.status.toLowerCase() === 'available')
               {
                  retry.stop();
                  resolve(snapshot);
               }
               else
               {
                  if (retry.retry('Snapshot is not ready'))
                  {
                     return;
                  }
                  reject(new Error('Failed to determine if the snapshot is ready to be attached. Timeout limit exceeded.'));
               }
            }
            catch (err)
            {
               if (retry.retry(err))
               {
                  return;
               }
               reject(new Error('Failed to query for volume. Could not determine if the snapshot is available.'));
            }
         }, NodeUtilities.getFaultTolerantTimeoutOpts(outer.inputParameters, () =>
         {
            if (retry.retry('Timed out while attempting to determine if a snapshot is available.'))
            {
               return;
            }
            retry.stop();
            reject(new Error('Timed out while attempting to determine if a snapshot is available.'));
         }));
      });
      return retryPromise;
   }

   updateSnapshot()
   {
      const outer = this;

      const id = this.getParameterValue('openstack_volume_id');
      const name = this.getParameterValue('openstack_volume_name');
      const description = this.getParameterValue('openstack_volume_description');

      const options = {
         id: id,
         name: name,
         description: description
      };

      const retry = utils.getFaultTolerantOperation(this.inputParameters);
      const retryPromise = new Promise((resolve, reject) =>
      {
         retry.attempt(() =>
         {
            try
            {
               outer.getClient().updateSnapshot(options, (err, snapshot) =>
               {
                  if (retry.retry(err))
                  {
                     return;
                  }
                  if (err)
                  {
                     reject(new Error(`While updating a Snapshot: ${OpenstackBlockStorageClient.generateErrorMessage(err)}`));
                  }
                  resolve(snapshot);
               });
            }
            catch (err)
            {
               retry.stop();
               reject(new Error(err));
            }
         }, NodeUtilities.getFaultTolerantTimeoutOpts(outer.inputParameters, () =>
         {
            if (retry.retry('Timed out while attempting to update an Openstack Snapshot.'))
            {
               return;
            }
            retry.stop();
            reject(new Error('Timed out while attempting to update an Openstack Snapshot.'));
         }));
      });
      return retryPromise;
   }

   destroySnapshot()
   {
      const outer = this;

      const snapshotId = this.getParameterValue('openstack_snapshot_id');
      const retry = utils.getFaultTolerantOperation(this.inputParameters);
      const retryPromise = new Promise((resolve, reject) =>
      {
         retry.attempt(() =>
         {
            try
            {
               outer.getClient().deleteSnapshot(snapshotId, (err, snapshot) =>
               {
                  if (retry.retry(err))
                  {
                     return;
                  }
                  if (err)
                  {
                     reject(new Error(`While destroying a Snapshot: ${OpenstackBlockStorageClient.generateErrorMessage(err)}`));
                  }
                  resolve(snapshot);
               });
            }
            catch (err)
            {
               retry.stop();
               reject(new Error(err));
            }
         }, NodeUtilities.getFaultTolerantTimeoutOpts(outer.inputParameters, () =>
         {
            if (retry.retry('Timed out while attempting to destroy an Openstack Snapshot.'))
            {
               return;
            }
            retry.stop();
            reject(new Error('Timed out while attempting to destroy an Openstack Snapshot.'));
         }));
      });
      return retryPromise;
   }

   getVolumeTypes()
   {
      const outer = this;
      const retry = utils.getFaultTolerantOperation(this.inputParameters);
      const retryPromise = new Promise((resolve, reject) =>
      {
         retry.attempt(() =>
         {
            try
            {
               outer.getClient().getVolumeTypes((err, volumeTypes) =>
               {
                  if (retry.retry(err))
                  {
                     return;
                  }
                  if (err)
                  {
                     reject(new Error(`While getting a list of Volume Types: ${OpenstackBlockStorageClient.generateErrorMessage(err)}`));
                  }
                  resolve(volumeTypes);
               });
            }
            catch (err)
            {
               retry.stop();
               reject(new Error(err));
            }
         }, NodeUtilities.getFaultTolerantTimeoutOpts(outer.inputParameters, () =>
         {
            if (retry.retry('Timed out while attempting to get the list of Openstack Volume Types.'))
            {
               return;
            }
            retry.stop();
            reject(new Error('Timed out while attempting to get the list of Openstack Volume Types.'));
         }));
      });
      return retryPromise;
   }

   getVolumeType()
   {
      const outer = this;
      const volumeTypeId = this.getParameterValue('openstack_volume_type_id');

      const retry = utils.getFaultTolerantOperation(this.inputParameters);
      const retryPromise = new Promise((resolve, reject) =>
      {
         retry.attempt(() =>
         {
            try
            {
               outer.getClient().getVolumeType(volumeTypeId, (err, volumeType) =>
               {
                  if (retry.retry(err))
                  {
                     return;
                  }
                  if (err)
                  {
                     reject(new Error(`While getting the details for a Volume Type: ${OpenstackBlockStorageClient.generateErrorMessage(err)}`));
                  }
                  resolve(volumeType);
               });
            }
            catch (err)
            {
               retry.stop();
               reject(new Error(err));
            }
         }, NodeUtilities.getFaultTolerantTimeoutOpts(outer.inputParameters, () =>
         {
            if (retry.retry('Timed out while attempting to get the details of an Openstack Volume Type.'))
            {
               return;
            }
            retry.stop();
            reject(new Error('Timed out while attempting to get the details of an Openstack Volume Type.'));
         }));
      });
      return retryPromise;
   }
};
