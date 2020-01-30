if (!ctl.ui.createStatusConfigurationDialog) {
   ctl.ui.createStatusConfigurationDialog = function(statusConfigurationObject) {
      return jQuery(
         '<form class="status-configuration-dialog">' +
         '<div class="row">' +
             '<div class="span4"<label>Display Node Starting Messages</label></div>' +
             '<div class="span6"><select class="starting-messages-field">' +
                 '<option value="always">Always</option>' +
                 '<option value="debug">Debug mode only</option>' +
                 '<option value="never">Never</option>' +
             '</select></div>' +
         '</div>' +
         '<div class="row">' +
             '<div class="span4"<label>Display Node Completed Messages</label></div>' +
             '<div class="span6"><select class="completed-messages-field">' +
                 '<option value="always">Always</option>' +
                 '<option value="debug">Debug mode only</option>' +
                 '<option value="never">Never</option>' +
             '</select></div>' +
         '</div>' +
         '<div class="row">' +
             '<div class="span4"<label>Display Retry Messages</label></div>' +
             '<div class="span6"><select class="retry-messages-field">' +
                 '<option value="always">Always</option>' +
                 '<option value="debug">Debug mode only</option>' +
                 '<option value="never">Never</option>' +
             '</select></div>' +
         '</div>' +
         '</form>').dialog(
         {
            width: 'auto',
            autoOpen: false,
            modal: true,
            buttons:
               {
                  'Cancel': function () {
                     jQuery(this).dialog('close');
                  },
                  'OK': function () {
                     statusConfigurationObject.starting = jQuery(this).find('.starting-messages-field').val();
                     statusConfigurationObject.completed = jQuery(this).find('.completed-messages-field').val();
                     statusConfigurationObject.retries = jQuery(this).find('.retry-messages-field').val();
                     jQuery(this).dialog('close');
                  }
               },
            open: function (event, ui) {
               if (statusConfigurationObject.starting)
               {
                  jQuery(this).find('.starting-messages-field').val(statusConfigurationObject.starting);
               }
               else
               {
                  jQuery(this).find('.starting-messages-field').val('always');
               }
               if (statusConfigurationObject.completed)
               {
                  jQuery(this).find('.completed-messages-field').val(statusConfigurationObject.completed);
               }
               else
               {
                  jQuery(this).find('.completed-messages-field').val('always');
               }
               if (statusConfigurationObject.retries)
               {
                  jQuery(this).find('.retry-messages-field').val(statusConfigurationObject.retries);
               }
               else
               {
                  jQuery(this).find('.retry-messages-field').val('always');
               }
            },
            close: function (event, ui) {
            }
         });
   };
}
