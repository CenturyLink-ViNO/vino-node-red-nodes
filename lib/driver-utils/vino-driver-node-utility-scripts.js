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
    constructor(name, description, baseTypes, selectedBaseType, RED)
    {
        this.RED = RED;
        this.name = name;
        this.description = description;
        this.baseTypes = baseTypes;
        this.selectedBaseType = selectedBaseType;

        this.inputParameters = [];
        this.outputParameters = [];

        let outer = this;
        for (let baseTypeIndex in this.baseTypes)
        {
            let baseType = outer.baseTypes[baseTypeIndex];
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
                param.setValue(resolvedSettings[param.inputDetails.constantsPath]);
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
                summaryParams.push({
                    parameterKey: param.parameterKey,
                    value: param.getValue(),
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
                    let value = serviceActivation.resolvedSettings[configParam.inputDetails.constantsPath];
                    configParam.setValue(value);
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
            return {
                parameterKey: param.parameterKey,
                value: param.getValue(),
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
