// DEPRECATED

if (!ctl.ui.createAddConditionalOutputParameterDialog) {
   ctl.ui.createAddConditionalOutputParameterDialog = function (node) {
      let newInputParameter, newInputDetails;
      let conditionalOutputParameterDialog = jQuery(
         '<form class="add-input-parameter-dialog">' +
            '<div class="row">' +
                '<div class="span2"<label>Name</label></div>' +
                '<div class="span6"><input type="text" class="input-name-field" style="width:100%;"/></div>' +
            '</div>' +
            '<div class="row">' +
                '<div class="span2"<label>Key</label></div>' +
                '<div class="span6"><input type="text" class="input-key-field" style="width:100%;" /></div>' +
            '</div>' +
            '<div class="row">' +
                '<div class="span2"<label>Description</label></div>' +
                '<div class="span6"><textarea class="input-description-field" ' +
                'style="width:100%; height:50px; resize: both;" /></div>' +
            '</div>' +
            '<div class="row">' +
                '<div class="span2"<label>Type</label></div>' +
                '<div class="span6"><select class="input-type-field">' +
                    '<option value="string">String</option>' +
                    '<option value="boolean">Boolean</option>' +
                    '<option value="number">Number</option>' +
                    '<option value="json">JSON</option>' +
                    '<option value="encodedString">Encoded String</option>' +
                    '<option value="enumerated">Enumerated</option>' +
                    '<option value="stringList">String List</option>' +
                    '<option value="booleanList">Boolean List</option>' +
                    '<option value="numberList">Number List</option>' +
                '</select></div>' +
            '</div>' +
            '<div class="row input-mappedFromTrueNode-field-row">' +
                '<div class="span2"<label>Mapped From Node (True)</label></div>' +
                '<div class="span6"><select class="input-mappedFromTrueNode-field" style="width:100%;">' +
                '</select></div>' +
            '</div>' +
            '<div class="row input-mappedFromKey-field-row">' +
                '<div class="span2"<label>Mapped From Key (True)</label></div>' +
                '<div class="span6"><select class="input-mappedFromTrueKey-field" style="width:100%;">' +
                '</select></div>' +
            '</div>' +
            '<div class="row input-mappedFromFalseNode-field-row">' +
                '<div class="span2"<label>Mapped From Node (False)</label></div>' +
                '<div class="span6"><select class="input-mappedFromFalseNode-field" style="width:100%;">' +
                '</select></div>' +
            '</div>' +
            '<div class="row input-mappedFromKey-field-row">' +
                '<div class="span2"<label>Mapped From Key (False)</label></div>' +
                '<div class="span6"><select class="input-mappedFromFalseKey-field" style="width:100%;">' +
                '</select></div>' +
            '</div>' +
         '</form>').dialog(
         {
            width: 'auto',
            autoOpen: false,
            modal: true,
            buttons:
               {
                 'Cancel': function() {
                     jQuery(this).dialog('close');
                  },
                  'OK': function () {
                     let dialog = jQuery(this);
                     newInputParameter = new Object();
                     newInputDetails = new Object();
                     mappedFrom =
                        {
                           trueMapping: {},
                           falseMapping: {}
                        };
                     newInputParameter.parameterName = dialog.find('.input-name-field').val();
                     newInputParameter.parameterType = dialog.find('.input-type-field').val();
                     newInputParameter.parameterKey = dialog.find('.input-key-field').val();
                     newInputParameter.parameterDescription = dialog.find('.input-description-field').val();

                     mappedFrom.trueMapping.nodeId = dialog.find('.input-mappedFromTrueNode-field').val();
                     mappedFrom.trueMapping.key = dialog.find('.input-mappedFromTrueKey-field').val();
                     if (mappedFrom.trueMapping.key.includes(':')) {
                        //A semi-colon in the key indicates this is from a subflow and the key contains the true
                        //source node ID as well as the target parameter key
                        mappedFrom.trueMapping.nodeId = mappedFrom.trueMapping.key.split(':')[0];
                        mappedFrom.trueMapping.key = mappedFrom.trueMapping.key.split(':')[1];
                        mappedFrom.trueMapping.isSubflowNode = true;
                        mappedFrom.trueMapping.subflowNodeId = dialog.find('.input-mappedFromTrueNode-field').val();
                     }
                     else {
                        mappedFrom.trueMapping.isSubflowNode = false;
                        mappedFrom.trueMapping.subflowNodeId = undefined;
                     }

                     mappedFrom.falseMapping.nodeId = dialog.find('.input-mappedFromFalseNode-field').val();
                     mappedFrom.falseMapping.key = dialog.find('.input-mappedFromFalseKey-field').val();
                     if (mappedFrom.falseMapping.key.includes(':')) {
                        //A semi-colon in the key indicates this is from a subflow and the key contains the true
                        //source node ID as well as the target parameter key
                        mappedFrom.falseMapping.nodeId = mappedFrom.falseMapping.key.split(':')[0];
                        mappedFrom.falseMapping.key = mappedFrom.falseMapping.key.split(':')[1];
                        mappedFrom.falseMapping.isSubflowNode = true;
                        mappedFrom.falseMapping.subflowNodeId = dialog.find('.input-mappedFromFalseNode-field').val();
                     }
                     else {
                        mappedFrom.falseMapping.isSubflowNode = false;
                        mappedFrom.falseMapping.subflowNodeId = undefined;
                     }
                     newInputDetails.conditionalMappedFrom = mappedFrom;
                     newInputDetails.fromMappedParam = true;
                     newInputParameter.inputDetails = newInputDetails;

                     if (jQuery(this).data('new')) {
                        newInputParameter.userAdded = true;
                        jQuery(this).data('table').row.add(newInputParameter).draw(false);
                     }
                     else {
                        jQuery(this).data('table').rows({selected: true}).remove();
                        jQuery(this).data('table').row.add(newInputParameter).draw(false);
                     }
                     jQuery(this).dialog('close');
                  }
               },
            open: function (event, ui) {
               let dialog = jQuery(this);
               dialog.find('.input-name-field').on('keyup', function () {
                  let name = jQuery(this).val();
                  let key = '';
                  if (name.length > 0) {
                     key = name.trim().replace(/\s/g, '_').replace(/[\\"']/g, '');
                  }
                  dialog.find('.input-key-field').val(key);
               });

               let previousTrueNodes = {};
               node.conditionalStartNode.trueSteps.forEach(function (node) {
                  if (node.type.includes('subflow')) {
                     node.subFlowOutputParams = ctl.ui.getSubFlowOutputParams(node);
                     if (node.subFlowOutputParams.length < 1) {
                         return;
                     }
                  }
                  previousTrueNodes[node.id] = node;
               });
               let previousFalseNodes = {};
               node.conditionalStartNode.falseSteps.forEach(function (node) {
                  if (node.type.includes('subflow')) {
                     node.subFlowOutputParams = ctl.ui.getSubFlowOutputParams(node);
                     if (node.subFlowOutputParams.length < 1) {
                         return;
                     }
                  }
                  previousFalseNodes[node.id] = node;
               });
               let trueNodeField = dialog.find('.input-mappedFromTrueNode-field');
               let trueKeyField = dialog.find('.input-mappedFromTrueKey-field');
               ctl.ui.populateParameterMappingFields(previousTrueNodes, trueNodeField, trueKeyField);
               let falseNodeField = dialog.find('.input-mappedFromFalseNode-field');
               let falseKeyField = dialog.find('.input-mappedFromFalseKey-field');
               ctl.ui.populateParameterMappingFields(previousFalseNodes, falseNodeField, falseKeyField);

               dialog.find('.input-mappedFromTrueNode-field').trigger('change');
               dialog.find('.input-mappedFromFalseNode-field').trigger('change');
            },
            close: function (event, ui) {
               jQuery(this).trigger('reset');
               jQuery(this).find('textarea').val('');
            }
         });
         return conditionalOutputParameterDialog;
   };
}
