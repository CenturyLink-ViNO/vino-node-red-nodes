if (!ctl.ui.createAddInputParameterDialog) {
   ctl.ui.createAddInputParameterDialog = function() {
      let newInputParameter, newInputDetails;
      return jQuery(
         '<form class="add-input-parameter-dialog">' +
            '<div class="row">' +
                '<div class="span2"><label>Name</label></div>' +
                '<div class="span6"><input type="text" class="input-name-field" style="width:100%;"/></div>' +
            '</div>' +
            '<div class="row">' +
                '<div class="span2"><label>Key</label></div>' +
                '<div class="span6"><input type="text" class="input-key-field" style="width:100%;" /></div>' +
            '</div>' +
            '<div class="row">' +
                '<div class="span2"><label>Description</label></div>' +
                '<div class="span6"><textarea class="input-description-field" ' +
                'style="width:100%; height:50px; resize: both;" ></textarea></div>' +
            '</div>' +
            '<div class="row">' +
                '<div class="span2"><label>Type</label></div>' +
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
            '<div class="row input-source-row">' +
                '<div class="span2"><label>Parameter Source</label></div>' +
                '<div class="span6"><select class="input-source-field" ' +
                'style="width:100%;">' +
                    '<option value="node">Node Configuration</option>' +
                    '<option value="msg">Message</option>' +
                    '<option value="file">File Reference</option>' +
                    '<option value="constants">Constants</option>' +
                    '<option value="mapping">Mapped from another Node (ViNO Service only)</option>' +
                '</select></div>' +
            '</div>' +
            '<div class="row file-select-row">' +
               '<div class="span2"><label>Project Files</label></div>' +
               '<div class="span6"><select class="input-fileSelect-field" style="width:100%;"></select></div>' +
            '</div>' +
            '<div class="row parameter-value string-value">' +
                '<div class="span2"><label>Value</label></div>' +
                '<div class="span6"><input type="text" class="parameter-input-stringValue" ' +
                'style="width:100%;" value=""></div>' +
            '</div>' +
            '<div class="row parameter-value boolean-value">' +
                '<div class="span2"><label>Value</label></div>' +
                '<div class="span6"><select class="parameter-input-booleanValue">' +
                    '<option value="true">True</option>' +
                    '<option value="false">False</option>' +
                '</select></div>' +
            '</div>' +
            '<div class="row parameter-value number-value">' +
                '<div class="span2"><label>Value</label></div>' +
                '<div class="span6"><input type="number" class="parameter-input-numberValue" ' +
                'style="width:100%;" value=""></div>' +
            '</div>' +
            '<div class="row parameter-value json-value">' +
                '<div class="span2"><label>Value</label></div>' +
                '<div class="span6"><textarea class="parameter-input-jsonValue" ' +
                'style="height:50px; resize: both;" value=""></textarea></div>' +
            '</div>' +
            '<div class="row parameter-value encodedString-value">' +
                '<div class="span2"><label>Value</label></div>' +
                '<div class="span6"><textarea class="parameter-input-encodedStringValue" ' +
                'style="height:50px; resize: both;" value=""></textarea></div>' +
            '</div>' +
            '<div class="row parameter-value encodedString-value">' +
                '<div class="span2"><label>Upload From File</label></div>' +
                '<div class="span3"><input type="file" id="encodedString-fileUpload"/></div>' +
                '<div class="span2"><button id="encodedString-clear">Clear</button></div>' +
            '</div>' +
            '<div class="row encryptedField-warning">' +
                '<p>For security reasons, encrypted parameter values cannot be set within the node itself</p>' +
            '</div>' +
            '<div class="row parameter-value enumerated-value">' +
                '<div class="span2"><label>Value</label></div>' +
                '<div class="span6"><select class="parameter-input-enumeratedValue" ' +
                'style="width:100%;"></select></div>' +
            '</div>' +
            '<div class="row parameter-value stringList-value">' +
                '<div class="span2"><label>Value</label></div>' +
                '<div class="span6"><select class="parameter-input-stringListValue" ' +
                'style="width:100%;"></select></div>' +
            '</div>' +
            '<div class="row parameter-value booleanList-value">' +
                '<div class="span2"><label>Value</label></div>' +
                '<div class="span6"><select class="parameter-input-booleanListValue" ' +
                'style="width:100%;"></select></div>' +
            '</div>' +
            '<div class="row parameter-value numberList-value">' +
                '<div class="span2"><label>Value</label></div>' +
                '<div class="span6"><select class="parameter-input-numberListValue" ' +
                 'style="width:100%;"></select></div>' +
            '</div>' +
            '<div class="row file-upload-row">' +
               '<label>Upload files</label><br/>' +
               '<input type="file" id="file-upload" name="filetoupload"><br/>' +
               '<button class="file-upload-button">Upload</button>' +
            '</div>' +
            '<div class="options-value">' +
                '<div class="span2"><label>Options</label></div>' +
                '<div class="span6"><input type="text" class="parameter-input-options" ' +
                'style="width:100%;" value=""></div>' +
            '</div>' +
            '<div class="row input-msgPropertyMapping-field-row">' +
                '<div class="span2"><label>Message Property Name</label></div>' +
                '<div class="span6"><input type="text" class="input-msgPropertyMapping-field" ' +
                'style="width:100%;" value=""></div>' +
            '</div>' +
            '<div class="row input-constantsPath-field-row">' +
                '<div class="span2"><label>Constants Path</label></div>' +
                '<div class="span6"><select class="input-constantsPath-field" style="width:100%;"></select></div>' +
                '<div class="clearfix"></div>' +
                '<p>Note: Paths starting with \'/\' are treated as absolute, otherwise the path is relative to the ' +
                'setting root provided at activation time</p>' +
            '</div>' +
            '<div class="row input-mappedFromNode-field-row">' +
                '<div class="span2"><label>Mapped From Node</label></div>' +
                '<div class="span6"><select class="input-mappedFromNode-field" style="width:100%;">' +
                '</select></div>' +
            '</div>' +
            '<div class="row input-mappedFromKey-field-row">' +
                '<div class="span2"><label>Mapped From Key</label></div>' +
                '<div class="span6"><select class="input-mappedFromKey-field" style="width:100%;">' +
                '</select></div>' +
            '</div>' +
            '<div class="row input-encrypt-field-row">' +
                '<div class="span2"><label>Encrypt</label></div>' +
                '<div class="span6"><select class="input-encrypt-field">' +
                    '<option value="true">True</option>' +
                    '<option value="false" selected="selected">False</option>' +
                '</select></div>' +
            '</div>' +
            '<div class="row input-displayOrder-row">' +
                '<div class="span2"><label>Display Order Index</label></div>' +
                '<div class="span6"><input type="number" class="input-displayOrder-field" ' +
                'style="width:100%;" value=""></div>' +
            '</div>' +
            '<div class="row">' +
                '<div class="span2"><input type="checkbox" class="input-optional-field" ' +
                'style="margin-right:10px;">Optional</input></div>' +
                '<div class="span2"><input type="checkbox" class="input-final-field" ' +
                'style="margin-right:10px;">Final</input></div>' +
            '</div>' +

         '</form>').dialog(
         {
            width: 'auto',
            autoOpen: false,
            modal: true,
            title: 'Edit Input Parameter',
            buttons:
               {
                  'Cancel': function() {
                     jQuery(this).dialog('close');
                  },
                  'OK': function () {
                     let dialog = jQuery(this);
                     newInputParameter = new Object();
                     newInputDetails = new Object();
                     let mappedFrom = new Object();
                     newInputParameter.index = jQuery(this).data('index');
                     newInputParameter.parameterName = dialog.find('.input-name-field').val().trim();
                     newInputParameter.parameterType = dialog.find('.input-type-field').val();
                     const key = dialog.find('.input-key-field').val().trim();
                     if (/^\w+$/.test(key))
                     {
                          newInputParameter.parameterKey = key;
                     }
                     else
                     {
                         return window.alert('Parameter key may only contain alphanumeric characters and underscores');
                     }
                     newInputParameter.parameterDescription = dialog.find('.input-description-field').val();
                     newInputParameter.encrypt = (dialog.find('.input-encrypt-field').val() == 'true');
                     newInputDetails.displayOrder = Number(dialog.find('.input-displayOrder-field').val());
                     newInputParameter.msgPropertyMapping = dialog.find('.input-msgPropertyMapping-field').val().trim();
                     if (isNaN(newInputDetails.displayOrder) || newInputDetails.displayOrder < 1) {
                        delete newInputDetails.displayOrder;
                     }
                     newInputDetails.parameterSource = dialog.find('.input-source-field').val();
                     newInputDetails.fromConstants = dialog.find('.input-fromConstants-field').is(':checked');
                     newInputDetails.fromMappedParam = dialog.find('.input-fromMappedParam-field').is(':checked');
                     newInputDetails.isOptional = dialog.find('.input-optional-field').is(':checked');
                     newInputDetails.isFinal = dialog.find('.input-final-field').is(':checked');
                     newInputDetails.constantsPath = dialog.find('.input-constantsPath-field').val().trim();
                     if (newInputParameter.parameterType === 'enumerated' &&
                         dialog.find('.parameter-input-options').val() === '') {
                         var inputErrorDialog = jQuery('<div>'+
                         'The "options" field for an enumerated type parameter cannot be blank'+
                         '</div>');
                         inputErrorDialog.dialog({
                             autoOpen: false,
                             modal: true,
                             buttons:
                             {
                                 'OK': function() {
                                     jQuery(this).dialog('close');
                                 }
                             },
                             open: function() {},
                             close: function() {}
                         });

                         inputErrorDialog.dialog('open');
                     }
                     else {
                         if (newInputDetails.fromMappedParam || newInputDetails.parameterSource === 'mapping') {
                             mappedFrom.nodeId = dialog.find('.input-mappedFromNode-field').val();
                             mappedFrom.key = dialog.find('.input-mappedFromKey-field').val();
                             if (mappedFrom.key.includes(':')) {
                                 //A semi-colon in the key indicates this is from a subflow and the key contains the true
                                 //source node ID as well as the target parameter key
                                 mappedFrom.nodeId = mappedFrom.key.split(':')[0];
                                 mappedFrom.key = mappedFrom.key.split(':')[1];
                                 mappedFrom.isSubflowNode = true;
                                 mappedFrom.subflowNodeId = dialog.find('.input-mappedFromNode-field').val();
                             } else {
                                 mappedFrom.isSubflowNode = false;
                                 mappedFrom.subflowNodeId = undefined;
                             }
                             newInputDetails.mappedFrom = mappedFrom;
                         }
                         newInputParameter.inputDetails = newInputDetails;
                         if (newInputDetails.parameterSource === 'node' || newInputDetails.parameterSource === 'file')
                         {
                           switch (newInputParameter.parameterType) {
                               case 'string':
                                   if (newInputParameter.encrypt)
                                   {
                                      newInputParameter.displayValue = '';
                                   }
                                   else
                                   {
                                      newInputParameter.displayValue = dialog.find('.parameter-input-stringValue').val().trim();
                                   }
                                   if (newInputParameter.displayValue != '') {
                                      newInputParameter.stringValue = newInputParameter.displayValue;
                                   }
                                   break;
                               case 'number':
                                   newInputParameter.displayValue = dialog.find('.parameter-input-numberValue').val();
                                   newInputParameter.numberValue = newInputParameter.displayValue;
                                   break;
                               case 'boolean':
                                   newInputParameter.displayValue =
                                   (dialog.find('.parameter-input-booleanValue').val() == 'true');
                                   newInputParameter.booleanValue = newInputParameter.displayValue;
                                   break;
                               case 'json':
                                   newInputParameter.displayValue = dialog.find('.parameter-input-jsonValue').val();
                                   if (newInputParameter.displayValue != '') {
                                       newInputParameter.jsonValue = newInputParameter.displayValue;
                                   }
                                   break;
                               case 'encodedString':
                                   if (newInputParameter.encrypt)
                                   {
                                      newInputParameter.displayValue = '';
                                   }
                                   else
                                   {
                                      newInputParameter.displayValue = dialog.find('.parameter-input-encodedStringValue').val();
                                   }
                                   if (newInputParameter.displayValue != '') {
                                       newInputParameter.encodedStringValue = newInputParameter.displayValue;
                                   }
                                   break;
                               case 'enumerated':
                                   newInputParameter.displayValue =
                                   dialog.find('.parameter-input-enumeratedValue').val().trim();
                                   newInputParameter.enumeratedValue = newInputParameter.displayValue;
                                   var optionsValue = dialog.find('.parameter-input-options').val();
                                   if (optionsValue != '') {
                                       newInputDetails.options = ctl.ui.convertStringToList(optionsValue, ',', 'stringList');
                                   }
                                   break;
                               case 'stringList':
                                   newInputParameter.displayValue = dialog.find('.parameter-input-stringListValue').val();
                                   if (newInputParameter.displayValue != '') {
                                       newInputParameter.stringListValue = newInputParameter.displayValue;
                                   }
                                   break;
                               case 'numberList':
                                   newInputParameter.displayValue = dialog.find('.parameter-input-numberListValue').val();
                                   if (newInputParameter.displayValue != '') {
                                       newInputParameter.numberListValue = [];
                                       for (i in newInputParameter.displayValue) {
                                           var number = Number(newInputParameter.displayValue[i]);
                                           newInputParameter.numberListValue.push(number);
                                       }
                                   }
                                   break;
                               case 'booleanList':
                                   newInputParameter.displayValue = dialog.find('.parameter-input-booleanListValue').val();
                                   if (newInputParameter.displayValue != '') {
                                       newInputParameter.booleanListValue = [];
                                       for (var i in newInputParameter.displayValue) {
                                           var boolean = newInputParameter.displayValue[i].toLowerCase() === 'true';
                                           newInputParameter.booleanListValue.push(boolean);
                                       }
                                   }
                                   break;
                               default:
                                   break;
                           }
                         }
                         if (newInputDetails.displayOrder) {
                             ctl.ui.reorderDisplayIndex(newInputDetails.displayOrder, jQuery(this).data('table').rows().data());
                             //Need to redraw entire table since ordering index may have been updated
                             jQuery(this).data('table').rows().invalidate('data').draw(false);
                         }
                         if (jQuery(this).data('new')) {
                             newInputParameter.userAdded = true;
                             jQuery(this).data('table').row.add(newInputParameter).draw(false);
                         } else {
                             if (jQuery(this).data('userAdded')) {
                                 newInputParameter.userAdded = true;
                             }
                             if (jQuery(this).data('common')) {
                                 newInputParameter.common = true;
                                 node.commonInputParameters = node.commonInputParameters.filter(function(item) {
                                     return item.parameterKey != newInputParameter.parameterKey;
                                 });
                                 node.commonInputParameters.push(newInputParameter);
                             }
                             jQuery(this).data('table').rows({selected: true}).remove();
                             jQuery(this).data('table').row.add(newInputParameter).draw(false);
                         }
                         jQuery(this).dialog('close');
                     }
                 }
            },
            open: function (event, ui) {
               let dialog = jQuery(this);
               let isUserAdded = jQuery(this).data('userAdded');
               if (isUserAdded) {
                   dialog.find('.input-name-field').prop('disabled', false);
                   dialog.find('.input-key-field').prop('disabled', false);
                   dialog.find('.input-encrypt-field').prop('disabled', false);
                   dialog.find('.input-description-field').prop('disabled', false);
                   dialog.find('.input-type-field').prop('disabled', false);
                   dialog.find('.parameter-input-options').prop('disabled', false);
                   dialog.find('.input-optional-field').prop('disabled', false);

                   dialog.find('.input-name-field').on('keyup', function() {
                       let name = jQuery(this).val();
                       let key = '';
                       if (name.length > 0) {
                           key = name.trim().replace(/\s/g, '_').replace(/[\\"']/g, '');
                       }
                       if (/^\w+$/.test(key))
                       {
                            dialog.find('.input-key-field').val(key);
                       }
                    });
               } else {
                  dialog.find('.input-key-field').prop('disabled', true);
                  dialog.find('.input-name-field').off('keyup');
               }


               dialog.find('.input-source-field').on('change', function() {
                  let select = jQuery(this);
                  dialog.find('.input-msgPropertyMapping-field-row').hide();
                  dialog.find('.parameter-value').hide();
                  dialog.find('.input-constantsPath-field-row').hide();
                  dialog.find('.input-mappedFromNode-field-row').hide();
                  dialog.find('.input-mappedFromKey-field-row').hide();
                  dialog.find('.input-displayOrder-field').prop('disabled', false);
                  dialog.find('.input-final-field').prop('disabled', false);
                  dialog.find('.file-select-row').hide();
                  dialog.find('.file-upload-row').hide();
                  dialog.find('.encryptedField-warning').hide();

                  switch (select.val()) {
                     case 'msg':
                        dialog.find('.input-msgPropertyMapping-field-row').show();
                        if (dialog.find('.input-msgPropertyMapping-field').val() === '') {
                           dialog.find('.input-msgPropertyMapping-field').val(dialog.find('.input-key-field').val());
                        }
                        break;
                     case 'node':
                        dialog.find('.input-type-field').trigger('change');
                        break;
                     case 'constants':
                        dialog.find('.input-displayOrder-field').val('').prop('disabled', true);
                        dialog.find('.input-constantsPath-field-row').show();
                        break;
                     case 'file':
                        dialog.find('.file-select-row').show();
                        dialog.find('.file-upload-row').show();
                        dialog.find('.input-type-field').val('string');
                        dialog.find('.input-type-field').trigger('change');
                        break;
                     case 'mapping':
                        dialog.find('.input-fromConstants-field').prop('disabled', true);
                        dialog.find('.input-final-field').prop('checked', false).prop('disabled', true);
                        dialog.find('.input-displayOrder-field').val('').prop('disabled', true);
                        dialog.find('.input-mappedFromNode-field-row').show();
                        dialog.find('.input-mappedFromKey-field-row').show();
                        break;
                  }
               });

               dialog.find('.input-encrypt-field').on('change', function()
               {
                  if (jQuery(this).val() === 'true')
                  {
                     dialog.find('.parameter-input-stringValue').prop('disabled', true);
                     dialog.find('.parameter-input-encodedStringValue').prop('disabled', true);
                     dialog.find('.parameter-input-stringValue').val('');
                     dialog.find('.parameter-input-encodedStringValue').val('');
                     const source = dialog.find('.input-source-field').val();
                     if (source === 'node')
                     {
                        dialog.find('.encryptedField-warning').show();
                     }
                  }
                  else
                  {
                     dialog.find('.parameter-input-stringValue').prop('disabled', false);
                     dialog.find('.parameter-input-encodedStringValue').prop('disabled', false);;
                     dialog.find('.encryptedField-warning').hide();
                  }
               });

               dialog.find('.input-type-field').on('change', function() {
                   let select = jQuery(this);
                   let source = dialog.find('.input-source-field').val();
                   dialog.find('.parameter-value').hide();
                   dialog.find('.input-encrypt-field-row').hide();
                   dialog.find('.options-value').hide();

                   if (source === 'node' || source === 'file') {
                     switch (select.val()) {
                         case 'string':
                             dialog.find('.string-value').show();
                             dialog.find('.input-encrypt-field-row').show();
                             break;
                         case 'number':
                             dialog.find('.number-value').show();
                             break;
                         case 'boolean':
                             dialog.find('.boolean-value').show();
                             break;
                         case 'json':
                             dialog.find('.json-value').show();
                             break;
                         case 'encodedString':
                             dialog.find('.encodedString-value').show();
                             dialog.find('.input-encrypt-field-row').show();
                             break;
                         case 'enumerated':
                             dialog.find('.enumerated-value').show();
                             dialog.find('.options-value').show();
                             dialog.find('.input-encrypt-field-row').show();
                             break;
                         case 'stringList':
                             dialog.find('.stringList-value').show();
                             dialog.find('.input-encrypt-field-row').show();
                             break;
                         case 'numberList':
                             dialog.find('.numberList-value').show();
                             break;
                         case 'booleanList':
                             dialog.find('.booleanList-value').show();
                             break;
                         default:
                             break;
                     }
                  }
                  dialog.find('.input-encrypt-field').trigger('change');
               });
               dialog.find('.file-upload-button').click(function(e){
                  e.preventDefault();
                  var file = dialog.find('#file-upload')[0].files[0];
                  if (file) {
                     var formData = new FormData();
                     formData.append("file", file)
                     jQuery.when(ctl.ui.uploadFile(formData)).done(function(){
                        var projectFiles = [];
                        dialog.find('.input-fileSelect-field')[0].selectize.clear();
                        jQuery.when(ctl.ui.getProjectFiles()).done(function(data) {
                            var match;
                            data.forEach(function(item){
                               projectFiles.push({ value: item.path, text: item.fileName});
                               if (item.fileName === file.name) {
                                  match = item;
                               }
                            });
                            dialog.find('.input-fileSelect-field')[0].selectize.addOption(projectFiles);
                            dialog.find('.input-fileSelect-field')[0].selectize.setValue(match.path);
                        });
                     });
                  }
               })
               dialog.find('#encodedString-fileUpload').change(function(){
                  var fileReader = new FileReader();
                  var file = this.files[0];
                  fileReader.onload = function() {
                     dialog.find('.parameter-input-encodedStringValue').val(fileReader.result);
                  };
                  fileReader.readAsText(file);
               });
               dialog.find('#encodedString-clear').click(function(){
                  dialog.find('#encodedString-fileUpload').val(null);
                  dialog.find('.parameter-input-encodedStringValue').val('');
               });
               dialog.find('.parameter-input-options').on('change', function() {
                   let optionsArray = jQuery(this).val().split(',');
                   let enumeratedSelect = dialog.find('.parameter-input-enumeratedValue');
                   enumeratedSelect.find('option').remove();
                   for (var i = 0; i < optionsArray.length; i = i + 1) {
                       enumeratedSelect.append('<option value="' + optionsArray[i].trim() + '">' +
                       optionsArray[i].trim() + '</option>');
                   }
               });
               dialog.find('.parameter-input-stringListValue').selectize(
                   {
                       maxItems: 100,
                       create: true,
                       createOnBlur: true,
                       duplicates: true,
                       onChange: function(value) {
                           if (typeof value === 'string') {
                               value = ctl.ui.convertStringToList(value, ',', 'stringList');
                           }
                           dialog.find('.parameter-input-stringListValue').val(value);
                       }
                   });
               dialog.find('.parameter-input-numberListValue').selectize({
                       maxItems: 100,
                       create: true,
                       createOnBlur: true,
                       duplicates: true,
                       onChange: function(value) {
                           if (typeof value === 'string') {
                               value = ctl.ui.convertStringToList(value, ',', 'numberList');
                           }
                           dialog.find('.parameter-input-numberListValue').val(value);
                       }
                   });
               dialog.find('.parameter-input-booleanListValue').selectize({
                       maxItems: 100,
                       create: true,
                       createOnBlur: true,
                       duplicates: true,
                       onChange: function(value) {
                           if (typeof value === 'string') {
                               value = ctl.ui.convertStringToList(value, ',', 'booleanList');
                           }
                           dialog.find('.parameter-input-booleanListValue').val(value);
                       }
                   });
               dialog.find('.input-constantsPath-field').selectize({
                       maxItems: 1,
                       create: true,
                       maxOptions: 3,
                       createOnBlur: true,
                       duplicates: true,
                       onChange: function(value) {
                           dialog.find('.input-constantsPath-field').val(value);
                       }
                   });
               let options = [];
               jQuery.when(ctl.ui.getSettingsGroupPaths()).done(function(data) {
                   data.forEach(function(item){
                      options.push({ value: item, text: item });
                   });
                   dialog.find('.input-constantsPath-field')[0].selectize.addOption(options);
               });
               let projectFiles = [];
               dialog.find('.input-fileSelect-field').selectize({
                       maxItems: 1,
                       onChange: function(value) {
                           dialog.find('.parameter-input-stringValue').val(value);
                       }
                   });
               jQuery.when(ctl.ui.getProjectFiles()).done(function(data) {
                   data.forEach(function(item){
                      projectFiles.push({ value: item.path, text: item.fileName});
                   });
                   dialog.find('.input-fileSelect-field')[0].selectize.addOption(projectFiles);
               });
               dialog.find('.input-type-field').trigger('change');
               dialog.find('.input-source-field').trigger('change');


               let previousNodes = ctl.ui.getValidParametersAndSteps(node.id, node.z, node.isDeactivationNode);
               let mappedNodeSelect = dialog.find('.input-mappedFromNode-field');
               let mappedKeySelect = dialog.find('.input-mappedFromKey-field');
               ctl.ui.populateParameterMappingFields(previousNodes, mappedNodeSelect, mappedKeySelect);

               dialog.find('.input-mappedFromNode-field').trigger('change');
               dialog.find('.input-encrypt-field').trigger('change');
            },
            close: function (event, ui) {
               jQuery(this).trigger('reset');
               jQuery(this).find('.parameter-input-stringListValue')[0].selectize.destroy();
               jQuery(this).find('.parameter-input-numberListValue')[0].selectize.destroy();
               jQuery(this).find('.parameter-input-booleanListValue')[0].selectize.destroy();
               jQuery(this).find('.input-constantsPath-field')[0].selectize.destroy();
               jQuery(this).find('.input-fileSelect-field')[0].selectize.destroy();
               jQuery(this).find('.input-source-field').off();
               jQuery(this).find('.input-type-field').off();
               jQuery(this).find('.file-upload-button').off();
               jQuery(this).find('#encodedString-fileUpload').off();
               jQuery(this).find('textarea').val('');
            }
         });
   };
}
