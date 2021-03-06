/*globals module */
/*globals require */
const Parameter = require('./parameter');
const utils = require('./utils');
let RootGroup, SettingsUtility, typeorm;
let settingsServerAvailable = true;
try
{
    RootGroup = require('../../../entities/settings/rootGroup').RootGroup;
    SettingUtilities = new (require('../../../routes/services/utility/settingsUtility').SettingsUtility);
    typeorm = require('typeorm');
}
catch (e)
{
    settingsServerAvailable = false;
}

class VinoNodeUtility
{
    constructor(name, description, baseTypes, selectedBaseType, configuration, commonParameters, RED)
    {
        this.RED = RED;
        this.name = name;
        this.description = description;
        this.baseTypes = baseTypes;
        this.selectedBaseType = selectedBaseType;
        this.configuration = configuration;
        this.commonParameters = commonParameters;

        this.inputParameters = [];
        this.outputParameters = [];

        let selectedBaseTypeObject = null;
        let selectedConfigObject = null;

        let outer = this;
        const mergedConfig = this.mergeSavedDataWithConfiguration(this.configuration, this.baseTypes, this.commonParameters);
        for (let baseTypeIndex in mergedConfig)
        {
            let baseType = mergedConfig[baseTypeIndex];
            if (baseType.key === outer.selectedBaseType)
            {
                baseType.inputParameters.forEach(function(param)
                {
                    outer.inputParameters.push(new Parameter(param));
                });
                baseType.outputParameters.forEach(function(param)
                {
                    outer.outputParameters.push(new Parameter(param));
                });
                break;
            }
        }
    }

    mergeSavedDataWithConfiguration(configurationDataFromNode, activeDataFromFlow, commonParameters)
    {
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
                    if (!target.inputDetails)
                    {
                        target.inputDetails = {};
                    }
                    if (activeParametersMap.has(key))
                    {
                        let source = deepCopy(activeParametersMap.get(key));
                        if (source.index !== undefined) target.index = source.index;
                        if (source.parameterName) target.parameterName = source.parameterName;
                        if (source.msgPropertyMapping) target.msgPropertyMapping = source.msgPropertyMapping;
                        if (source[`${target.parameterType}Value`] !== undefined) target[`${target.parameterType}Value`] = source[`${target.parameterType}Value`];
                        if (source.encrypt !== undefined) target.encrypt = source.encrypt;
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
                    if (!target.outputDetails)
                    {
                        target.outputDetails = {};
                    }
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
                mergedData.push(deepCopy(configMap.get(key)));
            }
            iter = keys.next();
        }

        /* Empty the active flow data and replace it with the newly merged data */
        activeDataFromFlow = mergedData;
        return activeDataFromFlow;
    };

    copyParameters(params)
    {
        let ret = [];
        if (params && Array.isArray(params))
        {
            params.forEach(function(param)
            {
                ret.push(new Parameter(param));
            });
        }
        return ret;
    }

    async resolveSettingsFromSettingsServer(inputParams, defaultSettingsRootPath)
    {
        let resolvedSettings = {};
        let defaultRootGroup = null;
        let defaultPathSplit;
        for (let param of inputParams)
        {
            if (param.isFromConstants())
            {
                if (!settingsServerAvailable)
                {
                    throw `Settings server is unavailable`;
                }
                if (!defaultRootGroup && defaultSettingsRootPath)
                {
                    defaultPathSplit = defaultSettingsRootPath.replace(/^\/+/g, '').split('/');
                    try
                    {
                        defaultRootGroup = await typeorm.getRepository(RootGroup)
                                            .findOne({name: defaultPathSplit[0]}, { relations: ['defaults', 'defaults.groups', 'groups'] });
                        if (defaultRootGroup)
                        {
                            defaultRootGroup = await SettingUtilities.expandRootGroup(defaultRootGroup);
                            defaultRootGroup.inheritDefaults();
                        }
                    }
                    catch (err)
                    {
                        throw (`Error loading root group ${defaultPathSplit[0]} from settings. ${err}`);
                    }
                }
                let rootGroup = defaultRootGroup;
                let subPath = param.inputDetails.constantsPath.split('/');
                let fullPath;
                //Handle absolute paths
                if (param.inputDetails.constantsPath.startsWith('/') && subPath.length >= 1)
                {
                    try
                    {
                        rootGroup = await typeorm.getRepository(RootGroup)
                                    .findOne({name: subPath[1]}, { relations: ['defaults', 'defaults.groups', 'groups'] });
                        if (rootGroup)
                        {
                            rootGroup = await SettingUtilities.expandRootGroup(rootGroup);
                            rootGroup.inheritDefaults();
                        }
                    }
                    catch (err)
                    {
                        throw (`Error loading root group ${subPath[1]} from settings. ${err}`);
                    }
                    fullPath = subPath;
                }
                else if (!defaultSettingsRootPath)
                {
                    throw (`Parameter "${param.parameterName}" has a relative constants path
                           "${param.inputDetails.constantsPath}", but no default root group was specified with
                           activation input`);
                }
                else
                {
                    fullPath = defaultPathSplit.concat(subPath);
                }
                fullPath = fullPath.filter(function(element)
                {
                    return element;
                });
                let constant = rootGroup.getConstant(fullPath);

                if (constant)
                {
                    resolvedSettings[param.inputDetails.constantsPath] = constant;
                }
                else
                {
                    throw (`Could not find constant "${param.inputDetails.constantsPath}" in root group
                           "${rootGroup.name}"`);
                }
            }
        }
        return resolvedSettings;
    }

    async resolveParametersFromSettingsServer(inputParams, defaultSettingsRootPath)
    {
        let resolvedSettings = await this.resolveSettingsFromSettingsServer(inputParams, defaultSettingsRootPath);
        inputParams.forEach(function(param)
        {
            if (param.isFromConstants())
            {
                param.setValue(resolvedSettings[param.inputDetails.constantsPath].value);
                param.encrypt = resolvedSettings[param.inputDetails.constantsPath].encrypt;
            }
        });
    }

    verifyAllRequiredParams(inputParams)
    {
        inputParams.forEach(function(param)
        {
            if (!param.hasValue() && !param.isOptional())
            {
                throw new Error(`Parameter ${param.parameterName} is missing a value.`);
            }
        })
    }

    resolveParametersFromMsg(inputParams, msg)
    {
        inputParams.forEach(function(configParam)
        {
            try
            {
                if (configParam.inputDetails.parameterSource !== 'msg')
                {
                    return;
                }
                if (configParam.msgPropertyMapping && configParam.msgPropertyMapping !== '')
                {
                    let foundProp = configParam.msgPropertyMapping.split('.').reduce((o, i) => o[i], msg);
                    if (typeof foundProp !== 'undefined')
                    {
                        configParam.setValue(foundProp);
                    }
                }
            }
            catch (error)
            {
                throw new Error(`Error while processing parameter '${configParam.parameterName}'. ${error}`);
            }
        });
    }
    async processInputParameters(msg, node)
    {
        //Make a copy of the configuration params, this will be our final target that we return
        let ret = this.copyParameters(this.inputParameters);
        if (msg.vino)
        {
            let vinoServiceActivation = node.context().global.vinoServiceActivations[msg.vino.serviceActivationId];
            if (!vinoServiceActivation)
            {
               throw new Error('No valid service activation was found for the ID: ' + msg.vino.serviceActivationId);
            }
            let activationInput = vinoServiceActivation.getStepActivationInput(node.id);
            let activationInputParams = activationInput ? activationInput.inputParameters : [];
            this._vinoProcessInputParameters(activationInputParams, ret, node, msg, vinoServiceActivation);
        }
        else
        {
            this.resolveParametersFromMsg(ret, msg);
            await this.resolveParametersFromSettingsServer(ret, msg['defaultSettingsRootPath']);
        }
        const emptyParams = [];
        const summaryParams = [];
        ret.forEach((param) =>
        {
            if (param.hasValue())
            {
                let summaryValue = param.getValue();
                if (param.encrypt)
                {
                    summaryValue = '******';
                }
                summaryParams.push({
                    encrypt: param.encrypt,
                    parameterKey: param.parameterKey,
                    value: summaryValue,
                    inputDetails: param.inputDetails
                });
            }
            else
            {
                emptyParams.push(param.parameterKey);
            }
        });
        utils.debug(`Processed input parameters for node ${node.id}:\n ${JSON.stringify(summaryParams)}`, node, msg);
        utils.debug(`Empty input parameters for node ${node.id}: ${JSON.stringify(emptyParams)}`, node, msg);
        this.verifyAllRequiredParams(ret);

        return ret;
    }

    _vinoProcessInputParameters(activationParams, configParams, node, msg, serviceActivation)
    {
        let ctx = this;

        //Note parameters from the settings server are expected to be resolved by this point and included as part of
        //the activation parameters

        //First resolve anything coming from the msg
        this.resolveParametersFromMsg(configParams, msg);

        configParams.forEach(function(configParam)
        {
            try
            {
                //First resolve any mapped params
                if (configParam.isFromMappedParam())
                {
                    let mappedFrom = configParam.inputDetails.mappedFrom;
                    if (!mappedFrom || !mappedFrom.nodeId || !mappedFrom.key)
                    {
                        throw (`Parameter is marked as mapped from previous step, but does
                                not contain a valid mapping in it's configuration.`);
                    }
                    let mappedFromNode = ctx.RED.nodes.getNode(mappedFrom.nodeId);
                    if (mappedFrom.isSubflowNode)
                    {
                        mappedFromNode = ctx.RED.nodes.getNode(mappedFrom.subflowNodeId);
                    }
                    //Leaving this undefined means it will always pull the value from the most recent activation of a
                    //particular node. This is needed for loops and multiple instances of the same subflow.
                    let iteration = undefined;
                    if (mappedFromNode && mappedFromNode.partOfCondtional)
                    {
                        //Mapping to a node within a conditional is only allowable when both nodes are in the same branch
                        if (!node.partOfConditional || (mappedFromNode.conditionalStartId !== node.condtionalStartId))
                        {
                             throw (`Cannot map to a node within a conditional from outside the conditional.
                             Outside nodes must map to the list of available outputs provided by the conditional
                             end node instead`);
                        }
                    }
                    //First check the output params, if nothing found there then go to the input params
                    let mappedParam = serviceActivation.getOutputParameter(mappedFrom.nodeId,
                                                                           mappedFrom.key, iteration);
                    if (!mappedParam)
                    {
                        mappedParam = serviceActivation.getInputParameter(mappedFrom.nodeId,
                                                                          mappedFrom.key, iteration);
                    }
                    if (mappedParam)
                    {
                        ctx.copyParameterValue(configParam, mappedParam);
                    }
                    else
                    {
                         throw (`Could not find the target mapping value from node '${mappedFrom.nodeId} '
                                 using the parameter key '${mappedFrom.key}'`);
                      }
                }
                //All constant should be resolved in the service start node
                if (configParam.isFromConstants() && serviceActivation.resolvedSettings)
                {
                    let constant = serviceActivation.resolvedSettings[configParam.inputDetails.constantsPath];
                    configParam.setValue(constant.value);
                    configParam.encrypt = constant.encrypt;
                }
                //Now compare this param to the ones provided with the activation input
                //These have the highest precedence and can override any param unless it's marked as final
                if (!configParam.isFinal())
                {
                    if (activationParams)
                    {
                        activationParams.forEach(function(param)
                        {
                            if (param.parameterKey === configParam.parameterKey && param.parameterType ===
                                configParam.parameterType && param.hasValue())
                            {
                                ctx.copyParameterValue(configParam, param);
                            }
                        });
                    }
                }
            }
            catch (error)
            {
                throw new Error(`Error while processing parameter '${configParam.parameterName}'. ${error}`);
            }
        });
    }

    insertOutputParametersOnMsg(params, msg)
    {
        params.forEach(function(param){
            //Inject into msg object
            if (param.msgPropertyMapping && param.msgPropertyMapping !== '')
            {

                let propertyMappingSplit = param.msgPropertyMapping.split('.');

                if (propertyMappingSplit.length > 1)
                {
                    let lastKeyIndex = propertyMappingSplit.length - 1;
                    let key;
                    let obj = msg;
                    for (let i = 0; i < lastKeyIndex; i++ ) {
                        key = propertyMappingSplit[i];
                        if (!(key in obj) || (typeof obj[key] !== 'object'))
                        {
                          obj[key] = {};
                        }
                        obj = obj[key];
                    }
                    obj[propertyMappingSplit[lastKeyIndex]] = param.getValue();
                }
                else
                {
                    msg[param.msgPropertyMapping] = param.getValue();
                }
            }
        });
    }

    processOutputParameters(params, node, msg)
    {
        let ctx = this;
        let ret = this.copyParameters(ctx.outputParameters);
        ret.forEach(function(configParam)
        {
            if (params !== null && params !== undefined)
            {
               params.forEach(function(param)
               {
                  //The output params from the API are still just plain objects right now
                  param = new Parameter(param); //TODO I don'think we need this anymore
                  if (param.parameterKey === configParam.parameterKey && param.parameterType ===
                     configParam.parameterType)
                  {
                     ctx.copyParameterValue(configParam, param);
                  }
               });
            }
            if (!configParam.hasValue())
            {
                 throw new Error('Not all required output parameters were present' +
                 ` in activation response. (${configParam.parameterName} has no value).`);
            }
        });
        const summaryParams = ret.map((param) =>
        {
            let summaryValue = param.getValue();
            if (param.encrypt)
            {
                summaryValue = '******';
            }
            return {
                encrypt: param.encrypt,
                parameterKey: param.parameterKey,
                value: summaryValue,
                outputDetails: param.outputDetails
            }
        });
        utils.debug(`Processed output parameters for node ${node.id}:\n ${JSON.stringify(summaryParams)}`, node, msg);
        this.insertOutputParametersOnMsg(ret, msg);

        return ret;
    }


    copyParameterValue(target, source)
    {
        target.setValue(source.getValue());
    }

    getInputParameters()
    {
        return this.inputParameters;
    }
    getOutputParameters()
    {
        return this.outputParameters;
    }
}

module.exports = VinoNodeUtility;
