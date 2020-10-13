//let ctl;
try
{
   if (window.ctl === undefined)
   {
      window.ctl = { ui: {}, nodes: { dirty: true } };
   }
   ctl = window.ctl;
} catch (err)
{
   ctl = { ui: {}, nodes: { dirty: true } };
}


if (!ctl.ui.jsLoaded)
{
   const jsFiles = ['ConditionalOutputParameterDialog.js', 'ConditionalOutputParameterTable.js', 'ConstantsCompletion.js',
                    'InputParameterDialog.js', 'InputParameterTable.js', 'OutputParameterDialog.js', 'OutputParameterTable.js',
                    'StatusConfigurationDialog.js', 'ParameterMapping.js', 'VinoUtils.js', 'dataTables/datatables.min.js',
                    'dataTables/RowReorder-1.2.7/js/dataTables.rowReorder.js', 'selectize/selectize.min.js' ];
   var head  = document.getElementsByTagName('head')[0];
   jsFiles.forEach(function(file)
   {
      let link = document.createElement('script');
      link.type = 'text/javascript';
      link.src = 'nodes/lib/ui/' + file;
      link.async = false;
      head.appendChild(link);
   });
   ctl.ui.jsLoaded = true;
}

if (!ctl.ui.cssLoaded)
{
   const cssFiles = ['dataTables/datatables.min.css', 'selectize/selectize.css' ];
   var head  = document.getElementsByTagName('head')[0];
   cssFiles.forEach(function(file)
   {
      let head = document.getElementsByTagName('head')[0];
      let link = document.createElement('link');
      link.rel = 'stylesheet';
      link.type = 'text/css';
      link.href = 'nodes/lib/ui/' + file;
      link.media = 'all';
      head.appendChild(link);
   });
   ctl.ui.cssLoaded = true;
}

if (!ctl.ui.categorizeBaseTypes)
{
   ctl.ui.categorizeBaseTypes = function (baseTypes)
   {
      let ret = new Map();
      let getCategory = function (category)
      {
         let array;
         if (!ret.has(category))
         {
            array = new Array();
            ret.set(category, array);
         } else
         {
            array = ret.get(category);
         }
         return array;
      };
      baseTypes.forEach(function (baseType)
      {
         if (baseType.hasOwnProperty('category'))
         {
            getCategory(baseType.category).push(baseType);
         } else
         {
            getCategory('Commands').push(baseType);
         }
      });
      return ret;
   };
}

if (!ctl.ui.renderUI)
{
   ctl.ui.renderUI = function (node, commands, commonParameters)
   {
      node.configCommands = commands;
      node.commands = commands;
      if (commonParameters === null || commonParameters === undefined || !Array.isArray(commonParameters))
      {
         commonParameters = [];
      }
      node.commonParameters = commonParameters;
      let baseTypeSelect = jQuery('#baseType-select');
      let statusOptionsButton = jQuery('#statusOptions-button');
      node.commands = ctl.ui.mergeSavedDataWithConfiguration(node.commands, node.baseTypes, commonParameters);
      let categorizedBaseTypes = ctl.ui.categorizeBaseTypes(node.commands);
      categorizedBaseTypes.forEach(function (value, key)
      {
         let optGroup = jQuery('<optgroup>', {
            label: key
         });
         baseTypeSelect.append(optGroup);
         for (let baseTypeIndex in value)
         {
            if (value.hasOwnProperty(baseTypeIndex))
            {
               let baseType = value[baseTypeIndex];
               optGroup.append(jQuery('<option>',
                  {
                     value: baseType.key,
                     text: baseType.name
                  }));
            }
         }
      });
      if (node.selectedBaseType !== '' && node.selectedBaseType !== null && node.selectedBaseType !== undefined)
      {
         baseTypeSelect.val(node.selectedBaseType);
      }
      let baseTypeDiv = jQuery(
         '<div class="baseType">' +
         '<label> Input Parameters</label>' +
         '<div class="input-parameters" style="border:1px solid gray; padding: 10px;" overflow="auto">' +
         '</div><br>' +
         '<label> Output Parameters</label>' +
         '<div class="output-parameters" style="border:1px solid gray; padding: 10px;" overflow="auto">' +
         '</div>' +
         '</div>');
      let domInputTable = jQuery('<table>')
         .addClass('display input-parameter-table')
         .append(jQuery('<thead>')
            .append(jQuery('<tr>')
               .append(jQuery('<th>').addClass('all').text('Index'))
               .append(jQuery('<th>').addClass('all').text('Parameter Name'))
               .append(jQuery('<th>').addClass('all').text('Parameter Description'))
               .append(jQuery('<th>').addClass('all').text('Parameter Key'))
               .append(jQuery('<th>').addClass('all').text('Parameter Value'))
               .append(jQuery('<th>').addClass('all').text('Display Order'))
            ));
      let domOutputTable = jQuery('<table>')
         .addClass('display output-parameter-table')
         .append(jQuery('<thead>')
            .append(jQuery('<tr>')
               .append(jQuery('<th>').addClass('all').text('Parameter Name'))
               .append(jQuery('<th>').addClass('all').text('Parameter Description'))
               .append(jQuery('<th>').addClass('all').text('Parameter Key'))
               .append(jQuery('<th>').addClass('all').text('Parameter Format'))
               .append(jQuery('<th>').addClass('all').text('Extraction Method'))
               .append(jQuery('<th>').addClass('all').text('Inject Into msg as'))
            ));
      baseTypeDiv.find('.input-parameters').append(domInputTable);
      baseTypeDiv.find('.output-parameters').append(domOutputTable);
      jQuery('#baseTypes').append(baseTypeDiv);
      node.selectedBaseType = baseTypeSelect.val();
      let inputParameterDialog = ctl.ui.createAddInputParameterDialog(node);
      let outputParameterDialog = ctl.ui.createAddOutputParameterDialog();
      if (node.statusConfiguration === undefined)
      {
         node.statusConfiguration = {};
      }
      let statusConfigurationDialog = ctl.ui.createStatusConfigurationDialog(node.statusConfiguration);
      node.inputTable = ctl.ui.buildInputTable(domInputTable, { data: [] }, inputParameterDialog, node.commands);
      node.outputTable = ctl.ui.buildOutputTable(domOutputTable, { data: [] }, outputParameterDialog, node.commands);

      baseTypeSelect.change(function (e)
      {
         var selectedBaseType = jQuery(this).val();
         ctl.ui.selectBaseType(node, selectedBaseType);
      });
      baseTypeSelect.change();
      statusOptionsButton.click(function ()
      {
         statusConfigurationDialog.dialog('open');
      });
      jQuery('.loading-div').hide();
   };
}

if (!ctl.ui.selectBaseType)
{
   ctl.ui.selectBaseType = function (node, selectedBaseType)
   {
      for (let baseTypeIndex in node.commands)
      {
         let baseType = node.commands[baseTypeIndex];
         if (baseType.key === selectedBaseType)
         {
            let inputParameters = baseType.inputParameters;
            for (parameterIndex in inputParameters)
            {
               if (inputParameters.hasOwnProperty(parameterIndex))
               {
                  let parameter = inputParameters[parameterIndex];
                  switch (parameter.parameterType)
                  {
                     case 'string':
                        parameter.displayValue = parameter.stringValue;
                        break;
                     case 'number':
                        parameter.displayValue = parameter.numberValue;
                        break;
                     case 'boolean':
                        parameter.displayValue = parameter.booleanValue;
                        break;
                     case 'json':
                        parameter.displayValue = parameter.jsonValue;
                        break;
                     case 'encodedString':
                        parameter.displayValue = parameter.encodedStringValue;
                        break;
                     case 'enumerated':
                        parameter.displayValue = parameter.enumeratedValue;
                        break;
                     case 'stringList':
                        parameter.displayValue = parameter.stringListValue;
                        break;
                     case 'numberList':
                        parameter.displayValue = parameter.numberListValue;
                        break;
                     case 'booleanList':
                        parameter.displayValue = parameter.booleanListValue;
                        break;
                     default:
                        break;
                  }
                  if (parameter.displayValue === null || parameter.displayValue === undefined)
                  {
                     parameter.displayValue = '';
                  }
               }
               jQuery('.loading-div').hide();
            }
            node.inputTable.clear();
            inputParameters.forEach(function(param, indx){
               if (param.index === undefined)
               {
                  param.index = indx;
               }
            });
            node.inputTable.rows.add(inputParameters);
            node.inputTable.draw();
            node.outputTable.clear();
            node.outputTable.rows.add(baseType.outputParameters);
            node.outputTable.draw();
         }
      }
   };
};

if (!ctl.ui.mergeSavedDataWithConfiguration)
{
   ctl.ui.mergeSavedDataWithConfiguration = function (configurationDataFromNode, activeDataFromFlow, commonParameters)
   {
      /*let getValueFieldName = function(parameter) {
         return parameter.parameterType + 'Value';
      };*/

      let deepCopy = function (obj)
      {
         return JSON.parse(JSON.stringify(obj));
      };

      let getCommandMap = function (array)
      {
         let ret = new Map();
         for (let idx in array)
         {
            if (array.hasOwnProperty(idx))
            {
               ret.set(deepCopy(array[idx].key), deepCopy(array[idx]));
            }
         }
         return ret;
      };

      let mergeCommand = function (configCommand, activeCommand)
      {
         let getParameterMap = function (parameterArray)
         {
            let ret = new Map();
            if (Array.isArray(parameterArray))
            {
               for (let paramIdx in parameterArray)
               {
                  if (parameterArray.hasOwnProperty(paramIdx))
                  {
                     let param = parameterArray[paramIdx];
                     ret.set(param.parameterKey, deepCopy(param));
                  }
               }
            }
            return ret;
         };
         let mergeInputParameters = function (configParametersMap, activeParametersMap)
         {
            let ret = new Map();
            let keys = configParametersMap.keys();
            let iter = keys.next();
            while (!iter.done)
            {
               let key = iter.value;
               let target = deepCopy(configParametersMap.get(key));
               if (activeParametersMap.has(key))
               {
                  let source = deepCopy(activeParametersMap.get(key));
                  if (source.index !== undefined) target.index = source.index;
                  if (source.parameterName) target.parameterName = source.parameterName;
                  if (source.msgPropertyMapping) target.msgPropertyMapping = source.msgPropertyMapping;
                  if (source[`${target.parameterType}Value`] !== undefined) target[`${target.parameterType}Value`] = source[`${target.parameterType}Value`];
                  if (source.encrypt !== undefined) target.encrypt = source.encrypt;
                  if (!target.inputDetails) target.inputDetails = {};
                  if (source.inputDetails)
                  {
                     target.inputDetails.fromConstants = source.inputDetails.fromConstants !== undefined ? source.inputDetails.fromConstants : target.inputDetails.fromConstants;
                     target.inputDetails.constantsPath = source.inputDetails.constantsPath || target.inputDetails.constantsPath;
                     target.inputDetails.isFinal = source.inputDetails.isFinal !== undefined ? source.inputDetails.isFinal : target.inputDetails.isFinal;
                     target.inputDetails.isOptional = source.inputDetails.isOptional !== undefined ? source.inputDetails.isOptional : target.inputDetails.isOptional;
                     target.inputDetails.fromMappedParam = source.inputDetails.fromMappedParam !== undefined ? source.inputDetails.fromMappedParam : target.inputDetails.fromMappedParam;
                     target.inputDetails.mappedFrom = source.inputDetails.mappedFrom || null;
                     target.inputDetails.parameterSource = source.inputDetails.parameterSource || 'node';
                  }
               }
               ret.set(deepCopy(key), target);
               iter = keys.next();
            }
            // Add the input parameters that are exclusively in the active data set
            let activeKeysOnly = [...(new Set([...activeParametersMap.keys()].filter(x => !(new Set([...configParametersMap.keys()])).has(x))))];
            for (let idx in activeKeysOnly)
            {
               if (activeKeysOnly.hasOwnProperty(idx))
               {
                  ret.set(deepCopy(activeKeysOnly[idx]), deepCopy(activeParametersMap.get(activeKeysOnly[idx])));
               }
            }
            return ret;
         };
         let mergeOutputParameters = function (configParametersMap, activeParametersMap)
         {
            let ret = new Map();
            let keys = configParametersMap.keys();
            let iter = keys.next();
            while (!iter.done)
            {
               let key = iter.value;
               let target = deepCopy(configParametersMap.get(key));
               if (activeParametersMap.has(key))
               {
                  let source = deepCopy(activeParametersMap.get(key));
                  if (source.parameterName) target.parameterName = source.parameterName;
                  if (source.msgPropertyMapping) target.msgPropertyMapping = source.msgPropertyMapping;
                  if (source[`${target.parameterType}Value`]) target[`${target.parameterType}Value`] = source[`${target.parameterType}Value`];
                  if (source.outputDetails)
                  {
                     if (source.outputDetails.type) target.outputDetails.type = source.outputDetails.type;
                     if (source.outputDetails.format) target.outputDetails.format = source.outputDetails.type;
                     target.outputDetails.isPrivate = source.outputDetails.isPrivate !== undefined ? source.outputDetails.isPrivate : target.outputDetails.isPrivate;
                  }
               }
               ret.set(deepCopy(key), target);
               iter = keys.next();
            }
            // Add the input parameters that are exclusively in the active data set
            let activeKeysOnly = [...(new Set([...activeParametersMap.keys()].filter(x => !(new Set([...configParametersMap.keys()])).has(x))))];
            for (let idx in activeKeysOnly)
            {
               if (activeKeysOnly.hasOwnProperty(idx))
               {
                  ret.set(deepCopy(activeKeysOnly[idx]), deepCopy(activeParametersMap.get(activeKeysOnly[idx])));
               }
            }
            return ret;
         };

         let inputParameters = configCommand.inputParameters.concat(deepCopy(commonParameters));

         let inputParametersMap = mergeInputParameters(getParameterMap(inputParameters), getParameterMap(activeCommand.inputParameters));
         let outputParameters = mergeOutputParameters(getParameterMap(configCommand.outputParameters), getParameterMap(activeCommand.outputParameters));

         let ret = deepCopy(configCommand);
         ret.inputParameters = [...inputParametersMap.values()];
         ret.outputParameters = [...outputParameters.values()];

         return ret;
      };

      let configMap = getCommandMap(configurationDataFromNode);
      let activeMap = getCommandMap(activeDataFromFlow);

      let mergedData = [];

      let keys = configMap.keys();
      let iter = keys.next();
      while (!iter.done)
      {
         let key = iter.value;
         if (activeMap.has(key))
         {
            mergedData.push(mergeCommand(deepCopy(configMap.get(key)), deepCopy(activeMap.get(key))));
         } else
         {
            mergedData.push(mergeCommand(deepCopy(configMap.get(key)), new Map()));
         }
         iter = keys.next();
      }

      /* Empty the active flow data and replace it with the newly merged data */
      activeDataFromFlow = mergedData;
      return activeDataFromFlow;
   };
}

if (!ctl.ui.editInputParameter)
{
   ctl.ui.editInputParameter = function (table, parameter, inputParameterDialog)
   {
      let parameterValue, optionsInputValue;
      inputParameterDialog.data('table', table).data('new', false).data('userAdded', parameter.userAdded || false).data('index', parameter.index).dialog('open');
      let displayOrder = null;
      let source = 'node';
      let constantsPath = '';
      let isOptionalStatus = false;
      let isFinalStatus = false;
      let mappedNode = '';
      let mappedKey = '';
      let itemIndex, item;
      if (parameter.hasOwnProperty('inputDetails'))
      {
         if (parameter.inputDetails.displayOrder)
         {
            displayOrder = parameter.inputDetails.displayOrder;
         }
         if (parameter.inputDetails.parameterSource)
         {
            source = parameter.inputDetails.parameterSource;
         }
         if (parameter.inputDetails.fromConstants === true || parameter.inputDetails.parameterSource === 'constants')
         {
            constantsPath = parameter.inputDetails.constantsPath;
            source = 'constants';
         }
         if (parameter.inputDetails.isOptional === true)
         {
            isOptionalStatus = true;
         }
         if (parameter.inputDetails.isFinal === true)
         {
            isFinalStatus = true;
         }
         if (parameter.inputDetails.fromMappedParam === true || parameter.inputDetails.parameterSource === 'mapping')
         {
            source = 'mapping';
            if (parameter.inputDetails.mappedFrom.isSubflowNode)
            {
               mappedNode = parameter.inputDetails.mappedFrom.subflowNodeId;
               mappedKey = parameter.inputDetails.mappedFrom.nodeId + ':' + parameter.inputDetails.mappedFrom.key;
            }
            else
            {
               mappedNode = parameter.inputDetails.mappedFrom.nodeId;
               mappedKey = parameter.inputDetails.mappedFrom.key;
            }
         }

         optionsInputValue = '';


         if (parameter.inputDetails.hasOwnProperty('options'))
         {
            let optionsArray = parameter.inputDetails.options;
            let enumeratedSelect = inputParameterDialog.find('.parameter-input-enumeratedValue');
            enumeratedSelect.find('option').remove();
            for (i = 0; i < optionsArray.length; i = i + 1)
            {
               enumeratedSelect.append('<option value="' + optionsArray[i].trim() + '">' +
                  optionsArray[i].trim() + '</option>');
            }
            optionsInputValue = parameter.inputDetails.options.join();
            if (optionsInputValue === undefined || optionsInputValue === null)
            {
               optionsInputValue = '';
            }
         }
      }
      switch (parameter.parameterType)
      {
         case 'string':
            parameterValue = parameter.stringValue;
            if (parameterValue != undefined)
            {
               inputParameterDialog.find('.parameter-input-stringValue').val(parameterValue);
            }
            break;
         case 'number':
            parameterValue = parameter.numberValue;
            if (parameterValue != undefined)
            {
               inputParameterDialog.find('.parameter-input-numberValue').val(parameterValue);
            }
            break;
         case 'boolean':
            parameterValue = '' + parameter.booleanValue;
            if (parameterValue != undefined)
            {
               inputParameterDialog.find('.parameter-input-booleanValue').val(parameterValue);
            }
            break;
         case 'json':
            parameterValue = parameter.jsonValue;
            if (parameterValue != undefined)
            {
               inputParameterDialog.find('.parameter-input-jsonValue').val(parameterValue);
            }
            break;
         case 'encodedString':
            parameterValue = parameter.encodedStringValue;
            if (parameterValue != undefined)
            {
               inputParameterDialog.find('.parameter-input-encodedStringValue')
                  .val(parameterValue).text(parameterValue);
            }
            break;
         case 'enumerated':
            parameterValue = parameter.enumeratedValue;
            if (parameterValue != undefined)
            {
               inputParameterDialog.find('.parameter-input-enumeratedValue').val(parameterValue);
            }
            break;
         case 'stringList':
            parameterValue = [];
            if (parameter.stringListValue != undefined)
            {
               parameterValue = parameter.stringListValue;
               for (itemIndex in parameter.stringListValue)
               {
                  item = parameter.stringListValue[itemIndex];
                  inputParameterDialog.find('.parameter-input-stringListValue')[0]
                     .selectize.addOption({ text: item, value: item });
               }
               inputParameterDialog.find('.parameter-input-stringListValue')[0]
                  .selectize.setValue(parameter.stringListValue, true);
            }
            break;
         case 'numberList':
            parameterValue = [];
            if (parameter.numberListValue != undefined)
            {
               parameterValue = parameter.numberListValue;
               for (itemIndex in parameter.numberListValue)
               {
                  item = parameter.numberListValue[itemIndex];
                  inputParameterDialog.find('.parameter-input-numberListValue')[0]
                     .selectize.addOption({ text: item, value: item });
               }
               inputParameterDialog.find('.parameter-input-numberListValue')[0]
                  .selectize.setValue(parameter.numberListValue, true);

            }
            break;
         case 'boolList':
            parameterValue = [];
            if (parameter.booleanListValue != undefined)
            {
               parameterValue = parameter.booleanListValue;
               for (itemIndex in parameter.booleanListValue)
               {
                  item = parameter.booleanListValue[itemIndex];
                  inputParameterDialog.find('.parameter-input-booleanListValue')[0]
                     .selectize.addOption({ text: item, value: item });
               }
               inputParameterDialog.find('.parameter-input-booleanListValue')[0]
                  .selectize.setValue(parameter.booleanListValue, true);
            }
            break;
      }
      if (parameterValue === undefined)
      {
         parameterValue = '';
      }
      inputParameterDialog.find('.input-name-field').val(parameter.parameterName);
      inputParameterDialog.find('.input-key-field').val(parameter.parameterKey);
      inputParameterDialog.find('.input-description-field').val(parameter.parameterDescription)
         .text(parameter.parameterDescription);
      inputParameterDialog.find('.input-type-field').val(parameter.parameterType);
      inputParameterDialog.find('.input-source-field').val(source);
      inputParameterDialog.find('.parameter-input-options').val(optionsInputValue);
      inputParameterDialog.find('.input-encrypt-field').val('' + (parameter.encrypt === true));
      inputParameterDialog.find('.input-displayOrder-field').val(displayOrder);
      inputParameterDialog.find('.input-msgPropertyMapping-field').val(parameter.msgPropertyMapping);
      inputParameterDialog.find('.input-optional-field').prop('checked', isOptionalStatus);
      inputParameterDialog.find('.input-final-field').prop('checked', isFinalStatus);
      inputParameterDialog.find('.input-mappedFromNode-field').val(mappedNode).trigger('change');
      inputParameterDialog.find('.input-mappedFromKey-field').val(mappedKey);
      inputParameterDialog.find('.input-constantsPath-field').val(constantsPath);
      if (source === 'constants' && constantsPath)
      {
         inputParameterDialog.find('.input-constantsPath-field')[0]
            .selectize.addOption({ text: constantsPath, value: constantsPath });
         inputParameterDialog.find('.input-constantsPath-field')[0]
            .selectize.setValue(constantsPath, true);
      }
      inputParameterDialog.find('.input-type-field').trigger('change');
      inputParameterDialog.find('.input-source-field').trigger('change');
      if (!parameter.userAdded)
      {
         inputParameterDialog.find('.input-key-field').prop('disabled', true);
         inputParameterDialog.find('.input-encrypt-field').prop('disabled', true);
         inputParameterDialog.find('.input-description-field').prop('disabled', true);
         inputParameterDialog.find('.input-type-field').prop('disabled', true);
         inputParameterDialog.find('.parameter-input-options').prop('disabled', true);
         inputParameterDialog.find('.input-optional-field').prop('disabled', true);
      } else
      {
         inputParameterDialog.find('.input-key-field').prop('disabled', false);
         inputParameterDialog.find('.input-encrypt-field').prop('disabled', false);
         inputParameterDialog.find('.input-description-field').prop('disabled', false);
         inputParameterDialog.find('.input-type-field').prop('disabled', false);
         inputParameterDialog.find('.parameter-input-options').prop('disabled', false);
         inputParameterDialog.find('.input-optional-field').prop('disabled', false);
      }
   };
}

if (!ctl.ui.unsetInputParameter)
{
   ctl.ui.unsetInputParameter = function (parameter)
   {
      let unsetParameter = JSON.parse(JSON.stringify(parameter)); // Deep copy
      switch (unsetParameter.parameterType)
      {
         case 'string':
            delete unsetParameter.stringValue;
            break;
         case 'number':
            delete unsetParameter.numberValue;
            break;
         case 'boolean':
            delete unsetParameter.booleanValue;
            break;
         case 'json':
            delete unsetParameter.jsonValue;
            break;
         case 'encodedString':
            delete unsetParameter.encodedStringValue;
            break;
         case 'enumerated':
            delete unsetParameter.enumeratedValue;
            break;
         case 'stringList':
            delete unsetParameter.stringListValue;
            break;
         case 'numberList':
            delete unsetParameter.numberListValue;
            break;
         case 'boolList':
            delete unsetParameter.booleanListValue;
            break;
      }
      unsetParameter.displayValue = '';
      return unsetParameter;
   };
}

if (!ctl.ui.editOutputParameter)
{
   ctl.ui.editOutputParameter = function (table, parameter, outputParameterDialog)
   {
      outputParameterDialog.data('userAdded', parameter.userAdded || false);

      let isPrivateStatus = false;
      if (parameter.outputDetails.isPrivate == true)
      {
         isPrivateStatus = true;
      }
      outputParameterDialog.find('.output-private-field').prop('checked', isPrivateStatus);
      outputParameterDialog.data('table', table).data('new', false).dialog('open');
      outputParameterDialog.find('.output-name-field').val(parameter.parameterName);
      outputParameterDialog.find('.output-key-field').val(parameter.parameterKey);
      outputParameterDialog.find('.output-description-field').val(parameter.parameterDescription)
         .text(parameter.parameterDescription);
      outputParameterDialog.find('.output-msgPropertyMapping-field').val(parameter.msgPropertyMapping);
      outputParameterDialog.find('.output-type-field').val(parameter.parameterType);
      if (parameter.hasOwnProperty('outputDetails'))
      {
         outputParameterDialog.find('.output-extraction-type-field').val(parameter.outputDetails.type);
         outputParameterDialog.find('.output-format-field').val(parameter.outputDetails.format);
      }
   };
}

if (!ctl.ui.convertStringToList)
{
   ctl.ui.convertStringToList = function (string, delimiter, listType)
   {
      ret = [];
      list = string.split(delimiter);
      if (listType === 'booleanList')
      {
         for (listIndex in list)
         {
            if (list.hasOwnProperty(listIndex))
            {
               let boolean = list[listIndex].trim();
               ret.push(boolean === 'true');
            }
         }
      }
      else if (listType === 'numberList')
      {
         for (listIndex in list)
         {
            if (list.hasOwnProperty(listIndex))
            {
               let number = list[listIndex].trim();
               ret.push(parseFloat(number));
            }
         }
      }
      else
      {
         for (listIndex in list)
         {
            if (list.hasOwnProperty(listIndex))
            {
               ret.push(list[listIndex].trim());
            }
         }
      }
      return ret;
   };
}

if (!ctl.ui.getParameterFromBaseType)
{
   ctl.ui.getParameterFromBaseType = function (type, parameterKey, baseTypes)
   {
      let selectedBaseType = jQuery('#baseType-select').val();
      for (baseTypeIndex in baseTypes)
      {
         if (baseTypes.hasOwnProperty(baseTypeIndex))
         {
            let baseType = baseTypes[baseTypeIndex];
            if (baseType.key === selectedBaseType)
            {
               if (type === 'input')
               {
                  for (parameterIndex in baseType.inputParameters)
                  {
                     if (baseType.inputParameters.hasOwnProperty(parameterIndex))
                     {
                        let parameter = baseType.inputParameters[parameterIndex];
                        if (parameter.parameterKey === parameterKey)
                        {
                           return parameter;
                        }
                     }
                  }
               }
               else
               {
                  for (parameterIndex in baseType.outputParameters)
                  {
                     if (baseType.outputParameters.hasOwnProperty(parameterIndex))
                     {
                        let parameter = baseType.outputParameters[parameterIndex];
                        if (parameter.parameterKey === parameterKey)
                        {
                           return parameter;
                        }
                     }
                  }
               }
            }
         }
      }
      return null;
   };
}

if (!ctl.ui.getOutputParams)
{
   ctl.ui.getOutputParams = function (node)
   {
      if (node.type === 'conditional end')
      {
         return node.outputParameters;
      }
      if (node.commands)
      {
         for (let baseTypeIndex in node.commands)
         {
            if (node.commands.hasOwnProperty(baseTypeIndex))
            {
               let baseType = node.commands[baseTypeIndex];
               if (baseType.key === node.selectedBaseType)
               {
                  return baseType.outputParameters;
               }
            }
         }
      }
   };
}
if (!ctl.ui.getInputParams)
{
   ctl.ui.getInputParams = function (node)
   {
      if (node.commands)
      {
         for (let baseTypeIndex in node.commands)
         {
            let baseType = node.commands[baseTypeIndex];
            if (baseType.key === node.selectedBaseType)
            {
               return baseType.inputParameters;
            }
         }
      }
   };
}

if (!ctl.ui.createConditionalEndDiv)
{
   ctl.ui.createConditionalEndDiv = function (node)
   {
      let baseTypeDiv = jQuery(
         '<div class="baseType" id="conditional-end" >' +
         '<label> Output Parameters</label>' +
         '<div class="output-parameters" style="border:1px solid gray; padding: 10px;" overflow="auto">' +
         '</div>' +
         '</div>');

      let domOutputTable = jQuery('<table>')
         .addClass('display output-parameter-table')
         .append(jQuery('<thead>')
            .append(jQuery('<tr>')
               .append(jQuery('<th>').addClass('all').text('Parameter Name'))
               .append(jQuery('<th>').addClass('all').text('Parameter Key'))
               .append(jQuery('<th>').addClass('all').text('Parameter Description'))
               .append(jQuery('<th>').addClass('all').text('Parameter True Source'))
               .append(jQuery('<th>').addClass('all').text('Parameter False Source'))
            ));


      baseTypeDiv.find('.output-parameters').append(domOutputTable);
      jQuery('#baseTypes').append(baseTypeDiv);

      let dialog = ctl.ui.createAddConditionalOutputParameterDialog(node);
      ctl.ui.buildConditionalEndOutputTable(domOutputTable, { data: node.outputParameters }, dialog);
   }
}

if (!ctl.ui.saveConditionalOutputParameters)
{
   ctl.ui.saveConditionalOutputParameters = function (node)
   {
      let baseTypeDiv = jQuery('#conditional-end');
      node.outputParameters = jQuery('table', baseTypeDiv).DataTable().rows().data().toArray();
      node.lastModified = Date.now();
   };
}

if (!ctl.ui.editConditionalOutputParameter)
{
   ctl.ui.editConditionalOutputParameter = function (table, parameter, conditionalOutputParameterDialog)
   {
      let parameterValue, optionsInputValue;
      conditionalOutputParameterDialog.data('table', table).data('new', false).dialog('open');
      let trueMappedNode = '';
      let trueMappedKey = '';
      let falseMappedNode = '';
      let falseMappedKey = '';
      if (parameter.hasOwnProperty('inputDetails'))
      {
         if (parameter.inputDetails.fromMappedParam === true)
         {
            fromMappedParamStatus = true;
            if (parameter.inputDetails.conditionalMappedFrom.trueMapping.isSubflowNode)
            {
               trueMappedNode = parameter.inputDetails.conditionalMappedFrom.trueMapping.subflowNodeId;
               trueMappedKey = parameter.inputDetails.conditionalMappedFrom.trueMapping.nodeId + ':' +
                  parameter.inputDetails.conditionalMappedFrom.trueMapping.key;
            }
            else
            {
               trueMappedNode = parameter.inputDetails.conditionalMappedFrom.trueMapping.nodeId;
               trueMappedKey = parameter.inputDetails.conditionalMappedFrom.trueMapping.key;
            }
         }
         if (parameter.inputDetails.fromMappedParam === true)
         {
            fromMappedParamStatus = true;
            if (parameter.inputDetails.conditionalMappedFrom.falseMapping.isSubflowNode)
            {
               falseMappedNode = parameter.inputDetails.conditionalMappedFrom.falseMapping.subflowNodeId;
               falseMappedKey = parameter.inputDetails.conditionalMappedFrom.falseMapping.nodeId + ':' +
                  parameter.inputDetails.conditionalMappedFrom.falseMapping.key;
            }
            else
            {
               falseMappedNode = parameter.inputDetails.conditionalMappedFrom.falseMapping.nodeId;
               falseMappedKey = parameter.inputDetails.conditionalMappedFrom.falseMapping.key;
            }
         }
      }
      conditionalOutputParameterDialog.find('.input-name-field').val(parameter.parameterName);
      conditionalOutputParameterDialog.find('.input-key-field').val(parameter.parameterKey);
      conditionalOutputParameterDialog.find('.input-description-field').val(parameter.parameterDescription)
         .text(parameter.parameterDescription);
      conditionalOutputParameterDialog.find('.input-type-field').val(parameter.parameterType);
      conditionalOutputParameterDialog.find('.input-mappedFromTrueNode-field').val(trueMappedNode).trigger('change');
      conditionalOutputParameterDialog.find('.input-mappedFromTrueKey-field').val(trueMappedKey);
      conditionalOutputParameterDialog.find('.input-mappedFromFalseNode-field').val(falseMappedNode).trigger('change');
      conditionalOutputParameterDialog.find('.input-mappedFromFalseKey-field').val(falseMappedKey);
      conditionalOutputParameterDialog.find('.input-type-field').trigger('change');
   };
}

if (!ctl.ui.save)
{
   ctl.ui.save = function (node)
   {
      let deepCopy = function (obj)
      {
         return JSON.parse(JSON.stringify(obj));
      };
      const isEmptyObject = function(obj)
      {
         var name;
         for (name in obj) {
            if (obj.hasOwnProperty(name)) {
               return false;
            }
         }
         return true;
      };
      const isDifferent = function(obj)
      {
         const safe = deepCopy(obj);
         delete safe.parameterKey;
         return !isEmptyObject(safe);
      };
      const getInputDiffArray = function(parameters, baseType)
      {
         const inputDiffArray = [];
         for (let i = 0; i < parameters.length; i = i + 1)
         {
            const newParameter = parameters[i];
            let paramFound = false;
            for (let j = 0; j < baseType.inputParameters.length; j = j + 1)
            {
               if (baseType.inputParameters[j].parameterKey === parameters[i].parameterKey)
               {
                  paramFound = true;
                  const originalParameter = baseType.inputParameters[j];
                  const diff = {};
                  diff.parameterKey = newParameter.parameterKey;
                  if (newParameter.index !== originalParameter.index) diff.index = newParameter.index;
                  if (newParameter.parameterName !== originalParameter.parameterName) diff.parameterName = newParameter.parameterName;
                  if (newParameter.parameterDescription !== originalParameter.parameterDescription) diff.parameterDescription = newParameter.parameterDescription;
                  if (newParameter.msgPropertyMapping !== originalParameter.msgPropertyMapping) diff.msgPropertyMapping = newParameter.msgPropertyMapping;
                  if (newParameter.parameterType !== originalParameter.parameterType) diff.parameterType = newParameter.parameterType;
                  if (newParameter.encrypt !== originalParameter.encrypt) diff.encrypt = newParameter.encrypt;
                  if (newParameter.stringValue !== originalParameter.stringValue) diff.stringValue = newParameter.stringValue;
                  if (newParameter.numberValue !== originalParameter.numberValue) diff.numberValue = newParameter.numberValue;
                  if (newParameter.booleanValue !== originalParameter.booleanValue) diff.booleanValue = newParameter.booleanValue;
                  if (newParameter.encodedStringValue !== originalParameter.encodedStringValue) diff.encodedStringValue = newParameter.encodedStringValue;
                  if (newParameter.enumeratedValue !== originalParameter.enumeratedValue) diff.enumeratedValue = newParameter.enumeratedValue;
                  if (JSON.stringify(newParameter.stringListValue) !== JSON.stringify(originalParameter.stringListValue)) diff.stringListValue = newParameter.stringListValue;
                  if (JSON.stringify(newParameter.numberListValue) !== JSON.stringify(originalParameter.numberListValue)) diff.numberListValue = newParameter.numberListValue;
                  if (JSON.stringify(newParameter.booleanListValue) !== JSON.stringify(originalParameter.booleanListValue)) diff.booleanListValue = newParameter.booleanListValue;
                  if (newParameter.jsonValue !== originalParameter.jsonValue) diff.jsonValue = newParameter.jsonValue;
                  diff.inputDetails = {};
                  if (newParameter.inputDetails)
                  {
                     if (originalParameter.inputDetails)
                     {
                        if (newParameter.inputDetails.fromConstants !== originalParameter.inputDetails.fromConstants) diff.inputDetails.fromConstants = newParameter.inputDetails.fromConstants;
                        if (newParameter.inputDetails.constantsPath !== originalParameter.inputDetails.constantsPath) diff.inputDetails.constantsPath = newParameter.inputDetails.constantsPath;
                        if (newParameter.inputDetails.isOptional !== originalParameter.inputDetails.isOptional) diff.inputDetails.isOptional = newParameter.inputDetails.isOptional;
                        if (newParameter.inputDetails.isFinal !== originalParameter.inputDetails.isFinal) diff.inputDetails.isFinal = newParameter.inputDetails.isFinal;
                        if (JSON.stringify(newParameter.inputDetails.options) !== JSON.stringify(originalParameter.inputDetails.options)) diff.inputDetails.options = newParameter.inputDetails.options;
                        if (newParameter.inputDetails.fromMappedParam !== originalParameter.inputDetails.fromMappedParam) diff.inputDetails.fromMappedParam = newParameter.inputDetails.fromMappedParam;
                        if (newParameter.inputDetails.mappedFrom !== originalParameter.inputDetails.mappedFrom) diff.inputDetails.mappedFrom = newParameter.inputDetails.mappedFrom;
                        if (newParameter.inputDetails.parameterSource !== originalParameter.inputDetails.parameterSource) diff.inputDetails.parameterSource = newParameter.inputDetails.parameterSource;
                     }
                     else
                     {
                        diff.inputDetails = newParameter.inputDetails;
                     }
                  }
                  if (isEmptyObject(diff.inputDetails)) delete diff.inputDetails;
                  if (isDifferent(diff)) inputDiffArray.push(diff);
                  break;
               }
            }
            if (!paramFound)
            {
               inputDiffArray.push(newParameter);
            }
         }
         return inputDiffArray;
      };

      const getOutputDiffArray = function(parameters, baseType)
      {
         const outputDiffArray = [];
         for (let i = 0; i < parameters.length; i = i + 1)
         {
            const newParameter = parameters[i];
            let paramFound = false;
            for (let j = 0; j < baseType.inputParameters.length; j = j + 1)
            {
               if (baseType.inputParameters[j].parameterKey === parameters[i].parameterKey)
               {
                  paramFound = true;
                  const originalParameter = baseType.inputParameters[j];
                  const diff = {};
                  diff.parameterKey = newParameter.parameterKey;
                  if (newParameter.index !== originalParameter.index) diff.index = newParameter.index;
                  if (newParameter.parameterName !== originalParameter.parameterName) diff.parameterName = newParameter.parameterName;
                  if (newParameter.parameterDescription !== originalParameter.parameterDescription) diff.parameterDescription = newParameter.parameterDescription;
                  if (newParameter.msgPropertyMapping !== originalParameter.msgPropertyMapping) diff.msgPropertyMapping = newParameter.msgPropertyMapping;
                  if (newParameter.parameterType !== originalParameter.parameterType) diff.parameterType = newParameter.parameterType;
                  if (newParameter.encrypt !== originalParameter.encrypt) diff.encrypt = newParameter.encrypt;
                  if (newParameter.stringValue !== originalParameter.stringValue) diff.stringValue = newParameter.stringValue;
                  if (newParameter.numberValue !== originalParameter.numberValue) diff.numberValue = newParameter.numberValue;
                  if (newParameter.booleanValue !== originalParameter.booleanValue) diff.booleanValue = newParameter.booleanValue;
                  if (newParameter.encodedStringValue !== originalParameter.encodedStringValue) diff.encodedStringValue = newParameter.encodedStringValue;
                  if (newParameter.enumeratedValue !== originalParameter.enumeratedValue) diff.enumeratedValue = newParameter.enumeratedValue;
                  if (JSON.stringify(newParameter.stringListValue) !== JSON.stringify(originalParameter.stringListValue)) diff.stringListValue = newParameter.stringListValue;
                  if (JSON.stringify(newParameter.numberListValue) !== JSON.stringify(originalParameter.numberListValue)) diff.numberListValue = newParameter.numberListValue;
                  if (JSON.stringify(newParameter.booleanListValue) !== JSON.stringify(originalParameter.booleanListValue)) diff.booleanListValue = newParameter.booleanListValue;
                  if (newParameter.jsonValue !== originalParameter.jsonValue) diff.jsonValue = newParameter.jsonValue;
                  diff.outputDetails = {};
                  if (newParameter.outputDetails)
                  {
                     if (originalParameter.outputDetails)
                     {
                        if (newParameter.outputDetails.type !== originalParameter.outputDetails.type) diff.outputDetails.type = newParameter.outputDetails.type;
                        if (newParameter.outputDetails.format !== originalParameter.outputDetails.type) diff.outputDetails.format = newParameter.outputDetails.format;
                        if (newParameter.outputDetails.isPrivate !== originalParameter.outputDetails.isPrivate) diff.outputDetails.isPrivate = newParameter.outputDetails.isPrivate;
                     }
                     else
                     {
                        diff.outputDetails = newParameter.outputDetails;
                     }
                  }
                  if (isEmptyObject(diff.outputDetails)) delete diff.outputDetails;
                  if (isDifferent(diff)) outputDiffArray.push(diff);
                  break;
               }
            }
            if (!paramFound)
            {
               outputDiffArray.push(newParameter);
            }
         }
         return outputDiffArray;
      };

      let selectedBaseType = jQuery('#baseType-select').val();
      let baseTypeDiv = jQuery('#' + selectedBaseType);
      let inputParameters, outputParameters;
      if (node.inputTable)
      {
         inputParameters = node.inputTable.rows().data().toArray();
         inputParameters.forEach(function(param, indx) {
            param.index = indx;
         });
      }
      if (node.outputTable)
      {
         outputParameters = node.outputTable.rows().data().toArray();
      }
      for (let i = 0; i < node.configCommands.length; i = i + 1)
      {
         if (node.configCommands[i].key === selectedBaseType)
         {
            node.selectedBaseType = selectedBaseType;
            const configCommand = node.configCommands[i];
            configCommand.inputParameters = configCommand.inputParameters.concat(node.commonParameters);
            let foundBaseType = false;
            for (let j = 0; j < node.baseTypes.length; j = j + 1)
            {
               if (node.baseTypes[j].key === node.selectedBaseType)
               {
                  foundBaseType = true;
                  if (inputParameters) {
                     node.baseTypes[j].inputParameters = JSON.parse(JSON.stringify(getInputDiffArray(inputParameters, configCommand)));
                  }
                  if (outputParameters) {
                     node.baseTypes[j].outputParameters = JSON.parse(JSON.stringify(getOutputDiffArray(outputParameters, configCommand)));
                  }
                  break;
               }
            }
            if (!foundBaseType)
            {
               node.baseTypes.push({
                  key: node.selectedBaseType,
                  inputParameters: JSON.parse(JSON.stringify(getInputDiffArray(inputParameters, configCommand))),
                  outputParameters: JSON.parse(JSON.stringify(getOutputDiffArray(outputParameters, configCommand)))
               });
            }
            break;
         }
      }
      node.lastModified = Date.now();
   }
}
if (!ctl.ui.close)
{
   ctl.ui.close = function (node)
   {
      if (node.inputTable)
      {
         node.inputTable.destroy();
      }
      if (node.outputTable)
      {
         node.outputTable.destroy();
      }
   }
}
