if (!ctl.ui.buildOutputTable) {
   ctl.ui.buildOutputTable = function (table, data, outputParameterDialog, baseTypes) {
      let tbl2 = table.DataTable(
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
                  {data: 'outputDetails.format'},
                  {data: 'outputDetails.type'},
                  {
                      data: null,
                      render: function(data)
                      {
                          if (data.msgPropertyMapping)
                          {
                              return data.msgPropertyMapping;
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
                        outputParameterDialog.data('table', dt).data('new', true).data('userAdded', true).dialog('open');
                        return false;
                     }
                  },
                  {
                     text: 'Edit Parameter',
                     action: function (e, dt, node, config) {
                        let selData = dt.rows({selected: true}).data()[0];
                        ctl.ui.editOutputParameter(dt, selData, outputParameterDialog);
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
                        let defaultParameter = ctl.ui.getParameterFromBaseType('output', selData.parameterKey, baseTypes);
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
                  }
               ]
         });
      tbl2.on('select', function () {
         let selData = tbl2.rows({selected: true}).data()[0];
         tbl2.buttons(0, null).enable();
         if (selData) {
            if (selData.userAdded) {
               tbl2.button(3).disable();
            }
            else {
               tbl2.button(2).disable();
            }
         }
         else {
            tbl2.button(2).disable();
            tbl2.button(3).disable();
         }
      });
      tbl2.on('deselect', function () {
         let selectedRows = tbl2.rows({selected: true}).count();
         if (selectedRows <= 0) {
            tbl2.button(1).disable();
            tbl2.button(2).disable();
            tbl2.button(3).disable();
         }
      });
      tbl2.on('dblclick', 'tr', function () {
          tbl2.rows(this).select();
          var selData = tbl2.row(this).data();
          ctl.ui.editOutputParameter(tbl2, selData, outputParameterDialog);
      });
      return tbl2;
   };
}

