/*globals module */

const types = ['string', 'number', 'boolean', 'enumerated', 'json', 'encodedString',
               'stringList', 'numberList', 'booleanList'];
class Parameter
{
    constructor(param)
    {
        this.parameterName = param.parameterName;
        this.parameterKey = param.parameterKey;
        this.parameterType = param.parameterType;
        this.parameterDescription = param.parameterDescription;
        this.msgPropertyMapping = param.msgPropertyMapping;

        if (param.inputDetails)
        {
            this.inputDetails = param.inputDetails;

            if (!this.inputDetails.parameterSource)
            {
                if (this.inputDetails && this.inputDetails.fromConstants)
                {
                    this.inputDetails.parameterSource = 'constants';
                }
                else if (this.inputDetails && this.inputDetails.fromMappedParam)
                {
                    this.inputDetails.parameterSource = 'mapping';
                }
                else
                {
                    this.inputDetails.parameterSource = 'node';
                }
            }
        }
        if (param.outputDetails)
        {
            this.outputDetails = param.outputDetails;
        }

        let fieldName = this.getValueFieldName();
        if (param.hasOwnProperty(fieldName) && param[fieldName] !== '')
        {
            this[fieldName] = param[fieldName];
        }
    }

    hasValue()
    {
        let fieldName = this.getValueFieldName();
        return !((this[fieldName] === undefined || this[fieldName] === null) || (Array.isArray(this[fieldName]) && this[fieldName].length === 0));
    }

    isFromConstants()
    {
        return this.inputDetails && (this.inputDetails.parameterSource === 'constants' || this.inputDetails.fromConstants);
    }
    isFromMappedParam()
    {
        return this.inputDetails  && (this.inputDetails.parameterSource === 'mapping' || this.inputDetails.fromMappedParam);
    }

    isFinal()
    {
        return this.inputDetails && this.inputDetails.isFinal;
    }

    isOptional()
    {
        return this.inputDetails && this.inputDetails.isOptional;
    }

    getValue()
    {
        let fieldName = this.getValueFieldName();
        return this[fieldName];
    }

    setValue(value)
    {
        if (value === '')
        {
            return;
        }
        let fieldName = this.getValueFieldName();
        //Handle "fake" list types like enumeratedList and encodedStringList
        if (Array.isArray(value) && types.indexOf(this.parameterType) === -1 )
        {
            fieldName = 'stringListValue';
        }

        switch (this.parameterType)
        {
            case 'number':
                if (typeof value !== 'number')
                {
                    value = Number(value);
                    if (isNaN(value))
                    {
                        throw new Error('Value is not a valid number');
                    }
                }
                break;
            case 'boolean':
                if (typeof value !== 'boolean')
                {
                    if (value === 'false')
                    {
                        value = false;
                    }
                    else if (value === 'true')
                    {
                        value = true;
                    }
                    else
                    {
                        throw new Error('Value cannot be converted to boolean');
                    }
                }
                break;
            case 'json':
               if (typeof value !== 'object')
               {
                  if (typeof value === 'string')
                  {
                     value = JSON.parse(value);
                  }
                  if (typeof value !== 'object')
                  {
                     throw new Error('Value is not a valid json');
                  }
               }
               break;
            case 'stringList':
            case 'numberList':
            case 'booleanList':
                if (!Array.isArray(value))
                {
                    throw new Error('Provided value is not an array');
                }
                break;

        }

        this[fieldName] = value;
    }

    getValueFieldName()
    {
        return this.parameterType + 'Value';
    }
}

module.exports = Parameter;
