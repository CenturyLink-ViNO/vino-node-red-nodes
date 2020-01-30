/*globals module*/

class Group
{

   constructor(data)
   {
      this.displayName = data.displayName;
      this.name = data.name;
      this.groups = [];
      let outer = this;
      if (data.groups && Array.isArray(data.groups))
      {
        data.groups.forEach(function(group)
        {
           outer.groups.push(new Group(group));
        });
      }
      this.scalars = data.scalars;
      this.scalarLists = data.scalarLists;
   }

   findSubGroup(parent, groupName)
   {
       var i;
       if (parent.hasOwnProperty('groups'))
       {
          for (i = 0; i < parent.groups.length; i = i + 1)
          {
             if (parent.groups[i].name === groupName)
             {
                return parent.groups[i];
             }
          }
       }
       if (parent.hasOwnProperty('scalarLists'))
       {
          for (i = 0; i < parent.scalarLists.length; i = i + 1)
          {
             if (parent.scalarLists[i].name === groupName)
             {
                return parent.scalarLists[i];
             }
          }
       }
   }

   findGroup(path)
   {
      var pathSplit = path.split('/');
      var i;
      var currentGroup = this;
      for (i = 0; i < pathSplit.length; i = i + 1)
      {
         currentGroup = this.findSubGroup(currentGroup, pathSplit[i]);
      }
      return currentGroup;
   }

   findConstantInGroup(group, constantName)
   {
       var i;
       if (group.hasOwnProperty('scalars'))
       {
          for (i = 0; i < group.scalars.length; i = i + 1)
          {
             if (group.scalars[i].name === constantName)
             {
                return group.scalars[i].value;
             }
          }
       }
       else if (group.hasOwnProperty('entries'))
       {
          for (i = 0; i < group.entries.length; i = i + 1)
          {
             if (group.entries[i].name === constantName)
             {
                return group.entries[i].value;
             }
          }
       }
   }

   findConstant(path, constantName)
   {
      var ret;

      if (path === '/')
      {
         ret = this.findConstantInGroup(this, constantName);
      }
      else
      {
         var group = this.findGroup(path);
         if (group)
         {
           ret = this.findConstantInGroup(group, constantName);
         }
      }
      return ret;
   }

}

module.exports = Group;
