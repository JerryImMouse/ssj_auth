const {api_key} = require("../configuration/config");

const checkAccess = (api_token) => {
    return api_key === api_token;
}

module.exports = {checkAccess}