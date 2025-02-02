const Joi = require('joi');

const rechargeSchema = Joi.object({
    circlecode: Joi.string().required(),
    operatorcode: Joi.string().required(),
    number: Joi.string().required(),
    amount: Joi.number().positive().required(),
    member_id: Joi.string().required()
});

function validateRechargeInput(data) {
    const { error, value } = rechargeSchema.validate(data);
    return {
        error: error ? error.details[0].message : null,
        value
    };
}

function containsSQLInjection(input) {
    const sqlKeywords = [
        /SELECT/i, /INSERT/i, /UPDATE/i, /DELETE/i, 
        /DROP/i, /TRUNCATE/i, /--/i, /;/i
    ];
    return sqlKeywords.some(pattern => pattern.test(input));
}

module.exports = {
    validateRechargeInput,
    containsSQLInjection
};