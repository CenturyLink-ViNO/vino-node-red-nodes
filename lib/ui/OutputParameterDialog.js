if (!ctl.ui.createAddOutputParameterDialog) {
   ctl.ui.createAddOutputParameterDialog = function() {
      let newOutputParameter, newOutputDetails;
      return jQuery(
         '<form class="add-output-parameter-dialog">' +
         '<div class="row">' +
             '<div class="span2"<label>Name</label></div>' +
             '<div class="span6"><input type="text" class="output-name-field" style="width:100%;"/></div>' +
         '</div>' +
         '<div class="row">' +
             '<div class="span2"<label>Key</label></div>' +
             '<div class="span6"><input type="text" class="output-key-field" ' +
             'style="width:100%;" /></div>' +
         '</div>' +
         '<div class="row">' +
             '<div class="span2"<label>Description</label></div>' +
             '<div class="span6"><textarea class="output-description-field" ' +
             'style="width:100%; height:50px; resize: both;" /></div>' +
         '</div>' +
         '<div class="row">' +
             '<div class="span2"<label>Type</label></div>' +
             '<div class="span6"><select class="output-type-field">' +
                 '<option value="string">String</option>' +
                 '<option value="boolean">Boolean</option>' +
                 '<option value="number">Number</option>' +
                 '<option value="json">JSON</option>' +
                 '<option value="stringList">String List</option>' +
                 '<option value="booleanList">Boolean List</option>' +
                 '<option value="numberList">Number List</option>' +
             '</select></div>' +
         '</div>' +
         '<div class="row">' +
             '<div class="span2"<label>Extraction Method</label></div>' +
             '<div class="span6"><select class="output-extraction-type-field">' +
                 '<option value="REGEX">REGEX</option>' +
                 '<option value="XPATH">XPATH-VALUE</option>' +
                 '<option value="XPATHFULL">XPATH-FULL</option>' +
                 '<option value="JSONPATH">JSONPATH</option>' +
                 '<option value="CUSTOM">CUSTOM</option>' +
             '</select></div>' +
         '</div>' +
         '<div class="row">' +
             '<div class="span2"<label>Format</label></div>' +
             '<div class="span6"><textarea class="output-format-field" ' +
             'style="height:50px; resize: both;"></textarea></div>' +
         '</div>' +
         '<div class="row output-msgPropertyMapping-row">' +
             '<div class="span2"><label>Inject into msg as</label></div>' +
             '<div class="span6"><input type="text" class="output-msgPropertyMapping-field" ' +
             'style="width:100%;" value=""></div>' +
         '</div>' +
         '<div class="row">' +
             '<div class="span2"><input type="checkbox" class="output-private-field" ' +
             'style="margin-right:10px;">Private</input></div>' +
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
                     newOutputParameter = new Object();
                     newOutputDetails = new Object();
                     newOutputParameter.parameterName = jQuery(this).find('.output-name-field').val();
                     newOutputParameter.parameterType = jQuery(this).find('.output-type-field').val();
                     newOutputParameter.parameterKey = jQuery(this).find('.output-key-field').val();
                     newOutputParameter.parameterDescription = jQuery(this).find('.output-description-field').val();
                     newOutputParameter.msgPropertyMapping = jQuery(this).find('.output-msgPropertyMapping-field').val().trim();
                     newOutputDetails.type = jQuery(this).find('.output-extraction-type-field').val();
                     newOutputDetails.format = jQuery(this).find('.output-format-field').val();
                     newOutputDetails.isPrivate = jQuery(this).find('.output-private-field').is(':checked');
                     newOutputParameter.outputDetails = newOutputDetails;
                     if (jQuery(this).data('new')) {
                        newOutputParameter.userAdded = true;
                        jQuery(this).data('table').row.add(newOutputParameter).draw(false);
                     }
                     else {
                        if (jQuery(this).data('userAdded')) {
                            newOutputParameter.userAdded = true;
                        }
                        jQuery(this).data('table').rows({selected: true}).remove();
                        jQuery(this).data('table').row.add(newOutputParameter).draw(false);
                     }
                     jQuery(this).dialog('close');
                  }
               },
            open: function (event, ui) {
               let dialog = jQuery(this);
               let command = node.baseTypes.find(baseType => {
                 return baseType.key === node.selectedBaseType;
               });
               if (command && command.allowedExtractionMethods && Array.isArray(command.allowedExtractionMethods))
               {
                  jQuery('.output-extraction-type-field').empty();
                  for (let allowedMethod of command.allowedExtractionMethods)
                  {
                     switch (allowedMethod)
                     {
                        case 'XPATH':
                           jQuery('.output-extraction-type-field').append('<option value="XPATH">XPATH-VALUE</option>');
                           break;
                        case 'XPATHFULL':
                           jQuery('.output-extraction-type-field').append('<option value="XPATHFULL">XPATH-FULL</option>');
                           break;
                        default:
                           jQuery('.output-extraction-type-field').append('<option value="' + allowedMethod + '">' + allowedMethod + '</option>');
                           break;
                     }
                  }
               }
               let userAdded = jQuery(this).data('userAdded');
               if (userAdded) {
                   dialog.find('.output-key-field').prop('disabled', false);
                   dialog.find('.output-name-field').on('keyup', function () {
                        let name = jQuery(this).val();
                        let key = '';
                        if (name.length > 0) {
                           key = name.trim().replace(/\s/g, '_').replace(/[\\"']/g, '');
                        }
                        dialog.find('.output-key-field').val(key);
                   });
               } else {

                   dialog.find('.output-key-field').prop('disabled', true);
                   dialog.find('.output-name-field').off('keyup');
               }

            },
            close: function (event, ui) {
               jQuery(this).trigger('reset');
               jQuery(this).find('textarea').val('');
            }
         });
   };
}
