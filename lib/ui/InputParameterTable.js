if (!ctl.ui.buildInputTable) {
   ctl.ui.buildInputTable = function (table, data, inputParameterDialog, baseTypes) {
      let tbl1 = table.DataTable(
         {
            dom: 'Bfrtip',
            select:
               {
                  style: 'single'
               },
            destroy: true,
            ajax: function (tblData, callback) {
               callback(data);
            },
            pageLength: 10,
            order: [[0, 'desc']],
            columns:
               [
                  {data: 'parameterName'},
                  {
                        data: 'parameterDescription',
                        render: function(data)
                        {
                          const shortened = data.length > 200 ? data.substr(0, 200) +'...' : data;
                          return '<span class="ellipsis" title="' + data + '">' + shortened + '</span>';
                        }
                    },

                  {data: 'parameterKey'},
                  {
                      data: null,
                      render: function(data)
                      {
                          let source = 'node'
                          if (data.inputDetails && data.inputDetails.parameterSource)
                          {
                             source = data.inputDetails.parameterSource
                          }
                          if (data.inputDetails && data.inputDetails.fromMappedParam && data.inputDetails.mappedFrom) {
                             source = 'mapping';
                          } else if (data.inputDetails && data.inputDetails.fromConstants) {
                              source = 'constants'
                          }

                        switch(source) {
                           case 'node':
                              if (data.displayValue !== null && data.displayValue !== undefined)
                              {
                                const shortened = data.displayValue.length > 200 ? data.displayValue.substr(0, 200) + '...' : data.displayValue;
                                return '<span class="ellipsis" title="' + data.displayValue + '">' +
                                        jQuery('<div/>').text(shortened).html() + 
                                       '</span>';
                              }
                              return '';
                           case 'msg':
                              return 'Taken from msg.' + data.msgPropertyMapping;
                           case 'constants':
                              return 'From constants<br \>' + data.inputDetails.constantsPath;
                           case 'file':
                              return 'From file<br \>' + data.displayValue;
                           case 'mapping':
                              var node = ctl.ui.getNode(data.inputDetails.mappedFrom.nodeId);
                              if (!node) {
                                  return 'ERROR: mapped from non-existing node';
                              }
                              return 'Mapped from previous node<br/>' +
                                  node.name + ' : ' + data.inputDetails.mappedFrom.key;
                          }
                      }
                  },
                  {
                      //Column config for Display order
                      data: null,
                      render: function(data)
                      {
                          if (data.inputDetails && data.inputDetails.displayOrder)
                          {
                              return data.inputDetails.displayOrder;
                          }
                          return '';
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
                     action: function (e, dt, node, config) {
                        inputParameterDialog.data('table', dt).data('new', true).data('userAdded', true).dialog('open');
                        return false;
                     }
                  },
                  {
                     text: 'Edit Parameter',
                     action: function (e, dt, node, config) {
                        let selData = dt.rows({selected: true}).data()[0];
                        ctl.ui.editInputParameter(dt, selData, inputParameterDialog);
                        return false;
                     },
                     enabled: false
                  },
                  {
                     text: 'Remove Parameter',
                     action: function (e, dt, node, config) {
                        let selData = dt.rows({selected: true}).data()[0];
                        if (selData.userAdded) {
                           dt.rows({selected: true}).remove().draw(false);
                        }
                        dt.button(1).disable();
                        this.disable();
                        return false;
                     },
                     enabled: false
                  },
                  {
                     text: 'Restore Defaults',
                     action: function (e, dt, node, config) {
                        let selData = dt.rows({selected: true}).data()[0];
                        let defaultParameter = ctl.ui.getParameterFromBaseType('input', selData.parameterKey, baseTypes);
                        if (defaultParameter !== null) {
                           dt.rows({selected: true}).remove();
                           dt.row.add(defaultParameter).draw(false);
                           dt.button(1).disable();
                           dt.button(2).disable();
                           this.disable();
                        }
                        return false;
                     },
                     enabled: false
                  },
                  {
                     text: 'Unset Parameter',
                     action: function (e, dt, node, config) {
                        let selData = dt.rows({selected: true}).data()[0];
                        let unsetParameter = ctl.ui.unsetInputParameter(selData);
                        if (unsetParameter !== null) {
                           dt.rows({selected: true}).remove();
                           dt.row.add(unsetParameter).draw(false);
                           this.disable();
                        }
                        return false;
                     },
                     enabled: false
                  }
               ]
         });
      tbl1.on('select', function () {
         let selData = tbl1.rows({selected: true}).data()[0];
         tbl1.buttons(0, null).enable();
         if (selData) {
            if (selData.userAdded) {
               tbl1.button(3).disable();
            }
            else {
               tbl1.button(2).disable();
            }
         }
         else {
            tbl1.button(2).disable();
            tbl1.button(3).disable();
         }
      });
      tbl1.on('deselect', function () {
         let selectedRows = tbl1.rows({selected: true}).count();
         if (selectedRows <= 0) {
            tbl1.button(1).disable();
            tbl1.button(2).disable();
            tbl1.button(3).disable();
            tbl1.button(4).disable();
         }
      });
      tbl1.on('dblclick', 'tr', function () {
          tbl1.rows(this).select();
          var selData = tbl1.row(this).data();
          ctl.ui.editInputParameter(tbl1, selData, inputParameterDialog);
      });
      return tbl1;
   };
}