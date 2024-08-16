require("dotenv").config()

const port = process.env.CLIENT_API_PORT || 2424;
const host = process.env.CLIENT_API_URL || '127.0.0.1';

const discordEndPoint = process.env.DISCORD_API_ENDPOINT;
const redirectUri = process.env.REDIRECT_URI;

const discordLinkTemplate = process.env.DISCORD_AUTH_LINK_TEMPLATE;

const api_key = process.env.API_KEY;

const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;

module.exports = {
    port,
    host,
    discordEndPoint,
    redirectUri,
    clientId,
    clientSecret,
    discordLinkTemplate,
    api_key
}