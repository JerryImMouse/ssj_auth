const {api_key} = require("../configuration/config");

const checkAccess = (api_token) => {
    return api_key === api_token;
}

const validateToken = (req, res, next) => {
    if (!req.query.api_token)
        return res.status(401).json({ error: "Unauthorized" })

    if (!checkAccess(req.query.api_token))
        return res.status(401).json({ error: "Unauthorized" })

    next();
}

module.exports = {checkAccess, validateToken}