/*globals module */
/*globals require */

const request = require('request');
const Group = require('./Group');

class SettingsServer
{
   constructor(host, port, protocol)
   {
      this.rootGroups = {};
   }


   async getRootGroup(rootGroupName)
   {
      let url = this.getFullUrl('/group/' + rootGroupName);
      let outer = this;
      let promise = new Promise(function(resolve, reject)
      {
         if (outer.rootGroups[rootGroupName])
         {
             resolve(outer.rootGroups[rootGroupName]);
         }
         /*
         request(url, function(error, response, body)
         {
            if (error)
            {
                reject(error);
            }
            else if (response.statusCode && response.statusCode !== 200)
            {
                reject(`Recieved HTTP ${response.statusCode} from Settings Server`);
            }
            else
            {
               outer.rootGroups[rootGroupName] = new Group(JSON.parse(body));
               resolve(outer.rootGroups[rootGroupName]);
            }
         });*/
      });
      return promise;
   }

   clearCache()
   {
       this.rootGroups = {};
   }

   getConstant(pathAsArray, rootGroup)
   {
      let constantName = pathAsArray.pop();
      pathAsArray.splice(0, 1); //Remove root group name from path
      let path = pathAsArray.join('/');

      if (!rootGroup)
      {
         throw 'No root group provided';
      }
      return rootGroup.findConstant(path, constantName);

   }

}

module.exports = SettingsServer;
