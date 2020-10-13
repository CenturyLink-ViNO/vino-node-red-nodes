/* eslint camelcase: 0 */
/* eslint max-lines: ["off"] */
/* eslint no-await-in-loop: ["off"] */

const openstackImage = require('../../../lib/openstack/vendor/pkgcloud/lib/pkgcloud/openstack/image');
const NodeUtilities = require('../../../lib/driver-utils/index');
const utils = NodeUtilities.Utils;
const Parameter = require('../../../lib/driver-utils/parameter');

module.exports = class OpenstackImageClient
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
         this.imageClient = openstackImage.createClient({
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
      return this.imageClient;
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
                     reject(new Error(`While getting available images: ${OpenstackImageClient.generateErrorMessage(err)}`));
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

   getImage()
   {
      const outer = this;
      const retry = utils.getFaultTolerantOperation(this.inputParameters);
      const imageId = this.getParameterValue('openstack_image_id');
      const retryPromise = new Promise((resolve, reject) =>
      {
         retry.attempt(() =>
         {
            try
            {
               outer.getClient().getImage(imageId, (err, image) =>
               {
                  if (retry.retry(err))
                  {
                     return;
                  }
                  if (err)
                  {
                     reject(new Error(`While getting image: ${OpenstackImageClient.generateErrorMessage(err)}`));
                  }
                  resolve(image);
               });
            }
            catch (err)
            {
               retry.stop();
               reject(new Error(err));
            }
         }, NodeUtilities.getFaultTolerantTimeoutOpts(outer.inputParameters, () =>
         {
            if (retry.retry('Timed out while attempting to get the Openstack Image.'))
            {
               return;
            }
            retry.stop();
            reject(new Error('Timed out while attempting to get the Openstack Image.'));
         }));
      });
      return retryPromise;
   }

   createImage()
   {
      const outer = this;

      const name = this.getParameterValue('openstack_image_name');
      const containerFormat = this.getParameterValue('openstack_image_container_format');
      const diskFormat = this.getParameterValue('openstack_image_disk_format');
      const minDisk = this.getParameterValue('openstack_image_min_disk');
      const minRam = this.getParameterValue('openstack_image_min_ram');
      const isProtected = this.getParameterValue('openstack_image_protected');
      const tags = this.getParameterValue('openstack_image_tags');
      const visibility = this.getParameterValue('openstack_image_visibility');
      const additionalProperties = this.getParameterValue('openstack_image_additional_properties');
      const options = {
         name: name,
         container_format: containerFormat,
         disk_format: diskFormat,
         min_disk: minDisk,
         min_ram: minRam,
         protected: isProtected,
         tags: tags,
         visibility: visibility
      };
      if (additionalProperties && Array.isArray(additionalProperties))
      {
         additionalProperties.forEach((element) =>
         {
            const split = element.split(':');
            if (split.length !== 2)
            {
               throw new Error('Invalid element in additional properties. Additional properties must be specified as key:value');
            }
            options[split[0]] = split[1];
         });
      }
      const retry = utils.getFaultTolerantOperation(this.inputParameters);
      const retryPromise = new Promise((resolve, reject) =>
      {
         retry.attempt(() =>
         {
            try
            {
               outer.getClient().createImage(options, (err, image) =>
               {
                  if (retry.retry(err))
                  {
                     return;
                  }
                  if (err)
                  {
                     reject(OpenstackImageClient.generateErrorMessage(err));
                  }
                  resolve(image);
               });
            }
            catch (err)
            {
               retry.stop();
               reject(new Error(err));
            }
         }, NodeUtilities.getFaultTolerantTimeoutOpts(outer.inputParameters, () =>
         {
            if (retry.retry('Timed out while attempting to create an Openstack Image.'))
            {
               return;
            }
            retry.stop();
            reject(new Error('Timed out while attempting to create an Openstack Image.'));
         }));
      });
      return retryPromise;
   }

   updateImage()
   {
      const outer = this;

      const id = this.getParameterValue('openstack_image_id');
      const operation = this.getParameterValue('openstack_image_update_operation');
      const path = this.getParameterValue('openstack_image_update_path');
      const value = this.getParameterValue('openstack_image_update_value');

      const options = {
         op: operation, // eslint-disable-line
         path: path,
         value: value
      };

      const retry = utils.getFaultTolerantOperation(this.inputParameters);
      const retryPromise = new Promise((resolve, reject) =>
      {
         retry.attempt(() =>
         {
            try
            {
               outer.getClient().updateImage(id, [options], (err, image) =>
               {
                  if (retry.retry(err))
                  {
                     return;
                  }
                  if (err)
                  {
                     reject(OpenstackImageClient.generateErrorMessage(err));
                  }
                  resolve(image);
               });
            }
            catch (err)
            {
               retry.stop();
               reject(new Error(err));
            }
         }, NodeUtilities.getFaultTolerantTimeoutOpts(outer.inputParameters, () =>
         {
            if (retry.retry('Timed out while attempting to update an Openstack Image.'))
            {
               return;
            }
            retry.stop();
            reject(new Error('Timed out while attempting to update an Openstack Image.'));
         }));
      });
      return retryPromise;
   }

   destroyImage()
   {
      const outer = this;

      const id = this.getParameterValue('openstack_image_id');

      const retry = utils.getFaultTolerantOperation(this.inputParameters);
      const retryPromise = new Promise((resolve, reject) =>
      {
         retry.attempt(() =>
         {
            try
            {
               outer.getClient().destroyImage(id, (err, image) =>
               {
                  if (retry.retry(err))
                  {
                     return;
                  }
                  if (err)
                  {
                     reject(OpenstackImageClient.generateErrorMessage(err));
                  }
                  resolve(image);
               });
            }
            catch (err)
            {
               retry.stop();
               reject(new Error(err));
            }
         }, NodeUtilities.getFaultTolerantTimeoutOpts(outer.inputParameters, () =>
         {
            if (retry.retry('Timed out while attempting to destroy an Openstack Image.'))
            {
               return;
            }
            retry.stop();
            reject(new Error('Timed out while attempting to destroy an Openstack Image.'));
         }));
      });
      return retryPromise;
   }
   async importImage()
   {
      const outer = this;

      const id = this.getParameterValue('openstack_image_id');
      const method = this.getParameterValue('openstack_image_import_method');
      const uri = this.getParameterValue('openstack_image_import_uri');
      const allStoresMustSucceed = this.getParameterValue('openstack_image_import_all_stores_must_succeed');
      const allStores = this.getParameterValue('openstack_image_import_all_stores');
      const stores = this.getParameterValue('openstack_image_import_stores');

      const options =
      {
         method: { name: method },
         all_stores_must_succeed: allStoresMustSucceed,
         all_stores: allStores,
         stores: stores
      };
      if (method === 'web-download')
      {
         if (!uri)
         {
            throw new Error('Image URI must be provided for web-download method.');
         }
         options.method.uri = uri;
      }
      const retry = utils.getFaultTolerantOperation(this.inputParameters);
      const retryPromise = new Promise((resolve, reject) =>
      {
         retry.attempt(() =>
         {
            try
            {
               outer.getClient().importImageData(id, options, (err) =>
               {
                  if (retry.retry(err))
                  {
                     return;
                  }
                  if (err)
                  {
                     reject(OpenstackImageClient.generateErrorMessage(err));
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
            if (retry.retry('Timed out while attempting to upload an Openstack Image.'))
            {
               return;
            }
            retry.stop();
            reject(new Error('Timed out while attempting to upload an Openstack Image.'));
         }));
      });
      await retryPromise;
      image = await this.waitForImageUpload(id);
      return image;
   }
   waitForImageUpload(id)
   {
      const outer = this;
      this.setParameterValue('openstack_image_id', 'string', id);
      const retry = utils.getFaultTolerantOperation(this.inputParameters);
      const retryPromise = new Promise((resolve, reject) =>
      {
         retry.attempt(async() =>
         {
            try
            {
               const image = await outer.getImage();
               if (image && image.status === 'active')
               {
                  retry.stop();
                  resolve(image);
               }
               else
               {
                  if (retry.retry('Image not uploaded'))
                  {
                     return;
                  }
                  reject(new Error('Failed to determine if image was uploaded. Retry timeout exceeded'));
               }
            }
            catch (err)
            {
               if (retry.retry(err))
               {
                  return;
               }
               reject(new Error('Failed to query for server. Could not determine if the image was uploaded.'));
            }
         }, NodeUtilities.getFaultTolerantTimeoutOpts(outer.inputParameters, () =>
         {
            if (retry.retry('Timed out while attempting to determine if an image was uploaded.'))
            {
               return;
            }
            retry.stop();
            reject(new Error('Timed out while attempting to determine if an image was uploaded.'));
         }));
      });
      return retryPromise;
   }
   getTask()
   {
      const outer = this;
      const retry = utils.getFaultTolerantOperation(this.inputParameters);
      const taskId = this.getParameterValue('openstack_task_id');
      const retryPromise = new Promise((resolve, reject) =>
      {
         retry.attempt(() =>
         {
            try
            {
               outer.getClient().getTask(taskId, (err, task) =>
               {
                  if (retry.retry(err))
                  {
                     return;
                  }
                  if (err)
                  {
                     reject(new Error(`While getting task: ${OpenstackImageClient.generateErrorMessage(err)}`));
                  }
                  resolve(task);
               });
            }
            catch (err)
            {
               retry.stop();
               reject(new Error(err));
            }
         }, NodeUtilities.getFaultTolerantTimeoutOpts(outer.inputParameters, () =>
         {
            if (retry.retry('Timed out while attempting to get the Openstack Task.'))
            {
               return;
            }
            retry.stop();
            reject(new Error('Timed out while attempting to get the Openstack Task.'));
         }));
      });
      return retryPromise;
   }

   async createImageImportTask()
   {
      const outer = this;

      const name = this.getParameterValue('openstack_image_name');
      const importFrom = this.getParameterValue('openstack_image_import_from');
      const importFromFormat = this.getParameterValue('openstack_image_import_from_format');
      const containerFormat = this.getParameterValue('openstack_image_container_format');
      const diskFormat = this.getParameterValue('openstack_image_disk_format');
      const minDisk = this.getParameterValue('openstack_image_min_disk');
      const minRam = this.getParameterValue('openstack_image_min_ram');
      const isProtected = this.getParameterValue('openstack_image_protected');
      const tags = this.getParameterValue('openstack_image_tags');
      const visibility = this.getParameterValue('openstack_image_visibility');
      const additionalProperties = this.getParameterValue('openstack_image_additional_properties');
      const options = {
         type: 'import',
         input: {
            import_from: importFrom,
            import_from_format: importFromFormat,
            image_properties: {
               name: name,
               container_format: containerFormat,
               disk_format: diskFormat,
               min_disk: minDisk,
               min_ram: minRam,
               protected: isProtected,
               tags: tags,
               visibility: visibility
            }
         }
      };
      if (additionalProperties && Array.isArray(additionalProperties))
      {
         additionalProperties.forEach((element) =>
         {
            const split = element.split(':');
            if (split.length !== 2)
            {
               throw new Error('Invalid element in additional properties. Additional properties must be specified as key:value');
            }
            options.input.image_properties[split[0]] = split[1];
         });
      }
      const retry = utils.getFaultTolerantOperation(this.inputParameters);
      const retryPromise = new Promise((resolve, reject) =>
      {
         retry.attempt(() =>
         {
            try
            {
               outer.getClient().createTask(options, (err, task) =>
               {
                  if (retry.retry(err))
                  {
                     return;
                  }
                  if (err)
                  {
                     reject(OpenstackImageClient.generateErrorMessage(err));
                  }
                  resolve(task);
               });
            }
            catch (err)
            {
               retry.stop();
               reject(new Error(err));
            }
         }, NodeUtilities.getFaultTolerantTimeoutOpts(outer.inputParameters, () =>
         {
            if (retry.retry('Timed out while attempting to create an Openstack Image.'))
            {
               return;
            }
            retry.stop();
            reject(new Error('Timed out while attempting to create an Openstack Image.'));
         }));
      });
      const task = await retryPromise;
      const image = await this.waitForTaskCompletion(task.id);
      return image;
   }
   waitForTaskCompletion(id)
   {
      const outer = this;
      this.setParameterValue('openstack_task_id', 'string', id);
      const retry = utils.getFaultTolerantOperation(this.inputParameters);
      const retryPromise = new Promise((resolve, reject) =>
      {
         retry.attempt(async() =>
         {
            try
            {
               const task = await outer.getTask();
               if (task && task.status === 'success')
               {
                  retry.stop();
                  resolve(task);
               }
               else if (task && task.status === 'failure')
               {
                  retry.stop();
                  reject(new Error('Task returned a failure status'));
               }
               else
               {
                  if (retry.retry('Task not successful'))
                  {
                     return;
                  }
                  reject(new Error('Failed to determine if task was successful. Retry timeout exceeded'));
               }
            }
            catch (err)
            {
               if (retry.retry(err))
               {
                  return;
               }
               reject(new Error('Failed to query for server. Could not determine if the image was uploaded.'));
            }
         }, NodeUtilities.getFaultTolerantTimeoutOpts(outer.inputParameters, () =>
         {
            if (retry.retry('Timed out while attempting to determine if an image was uploaded.'))
            {
               return;
            }
            retry.stop();
            reject(new Error('Timed out while attempting to determine if an image was uploaded.'));
         }));
      });
      return retryPromise;
   }
};
