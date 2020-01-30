
if (!ctl.ui.getSettingsGroupPaths) {
   ctl.ui.getSettingsGroupPaths = function()
   {
       var def = jQuery.Deferred(function(deferred)
       {
           var url = '/rest/settings/all';
           var success = function(json)
           {
               if (json === undefined)
               {
                   deferred.reject();
               }
               else
               {
                   var data = ctl.ui.generateAllPotentialSettingsPathsStrings(json.entries.value);
                   deferred.resolve(data);
               }
           };
           var err = function()
           {
               deferred.reject();
           };
           jQuery.ajax(url, {success: success, error: err});
       });
       return def.promise();
   };
}
if (!ctl.ui.generateAllPotentialSettingsPathsStrings) {
   ctl.ui.generateAllPotentialSettingsPathsStrings = function(json)
   {
      var pathStrings = [];
      if (json !== undefined && Array.isArray(json))
      {
         var i;
         for (i = 0; i < json.length; i = i + 1)
         {
            json[i].name = '/' + json[i].name;
            pathStrings = pathStrings.concat(ctl.ui.generateAllPotentialPathsForGroup(json[i], null, []));
         }
      }
      return pathStrings;
   };
}
if (!ctl.ui.generateAllPotentialPathsForGroup) {
   ctl.ui.generateAllPotentialPathsForGroup = function(root, parentString, seen)
   {
      var groupString = parentString ? parentString + '/' + root.name : root.name;
      if (seen.indexOf(groupString) > -1) {
         return [];
      }
      seen.push(groupString);
      var subStrings = [];
      if (root.groups && Array.isArray(root.groups))
      {
         var i, subGroup;
         for (i = 0; i < root.groups.length; i = i + 1)
         {
            subGroup = root.groups[i];
   
            subStrings = subStrings.concat(ctl.ui.generateAllPotentialPathsForGroup(subGroup, groupString, seen));
            subStrings = subStrings.concat(ctl.ui.generateAllPotentialPathsForGroup(subGroup, null, seen));
         }
      }
      if (root.scalars && Array.isArray(root.scalars))
      {
         var i, scalar;
         for (i = 0; i < root.scalars.length; i = i + 1)
         {
            scalar = root.scalars[i];
            subStrings = subStrings.concat(groupString + '/' + scalar.name);
         }
      }
      if (root.scalarLists && Array.isArray(root.scalarLists))
      {
         var i, scalarList;
         for (i = 0; i < root.scalarLists.length; i = i + 1)
         {
            scalarList = root.scalarLists[i];
            subStrings = subStrings.concat(groupString + '/' + scalarList.name);
         }
      }
      return subStrings;
   };
}