// DEPRECATED

if (!ctl.ui.buildConditionalEndOutputTable) {
   ctl.ui.buildConditionalEndOutputTable = function(table, data, conditionalOutputParameterDialog)
   {
      let tbl2 = table.DataTable(
         {
            dom: 'Bfrtip',
            select:
               {
                  style: 'single'
               },
            destroy: true,
            ajax: function(tblData, callback)
            {
               callback(data);
            },
            pageLength: 10,
            order: [[0, 'desc']],
            columns:
               [
                  {data: 'parameterName'},
                  {data: 'parameterKey'},
                  {data: 'parameterDescription'},
                  {
                     data: 'inputDetails.conditionalMappedFrom.trueMapping',
                     render: function(data)
                     {
                        let node = ctl.ui.getNode(data.nodeId);
                        if (!node)
                        {
                           return 'ERROR: mapped from non-existing node';
                        }
                        return node.name + ' : ' + data.key;
                     }
                  },
                  {
                     data: 'inputDetails.conditionalMappedFrom.falseMapping',
                     render: function(data)
                     {
                        let node = ctl.ui.getNode(data.nodeId);
                        if (!node)
                        {
                           return 'ERROR: mapped from non-existing node';
                        }
                        return node.name + ' : ' + data.key;
                     }
                  }
               ],
            responsive:
               {
                  details:
                     {
                        type: 'column',
                        target: 'tr'
                     }
               },
            autoWidth: false,
            buttons:
               [
                  {
                     text: 'Add Parameter',
                     action: function(e, dt)
                     {
                        conditionalOutputParameterDialog.data('table', dt).data('new', true).dialog('open');
                        return false;
                     }
                  },
                  {
                     text: 'Edit Parameter',
                     action: function(e, dt)
                     {
                        let selData = dt.rows({selected: true}).data()[0];
                        ctl.ui.editConditionalOutputParameter(dt, selData, conditionalOutputParameterDialog);
                        return false;
                     },
                     enabled: false
                  },
                  {
                     text: 'Remove Parameter',
                     action: function(e, dt)
                     {
                        let selData = dt.rows({selected: true}).data()[0];
                        if (selData.userAdded)
                        {
                           dt.rows({selected: true}).remove().draw(false);
                        }
                        dt.button(1).disable();
                        this.disable();
                        return false;
                     },
                     enabled: false
                  }
               ]
         });
      tbl2.on('select', function()
      {
         let selData = tbl2.rows({selected: true}).data()[0];
         tbl2.buttons(0, null).enable();
         if (selData)
         {
            if (selData.userAdded)
            {
               tbl2.button(3).disable();
            }
            else
            {
               tbl2.button(2).disable();
            }
         }
         else
         {
            tbl2.button(2).disable();
            tbl2.button(3).disable();
         }
      });
      tbl2.on('deselect', function()
      {
         let selectedRows = tbl2.rows({selected: true}).count();
         if (selectedRows <= 0)
         {
            tbl2.button(1).disable();
            tbl2.button(2).disable();
            tbl2.button(3).disable();
         }
      });
      tbl2.on('dblclick', 'tr', function () {
         tbl2.rows(this).select();
         var selData = tbl2.row(this).data();
         ctl.ui.editConditionalOutputParameter(tbl2, selData, conditionalOutputParameterDialog);
      });
      return tbl2;
   }
}