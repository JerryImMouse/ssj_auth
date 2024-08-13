require("dotenv").config()

const port = process.env.LOCAL_PORT || 3000;
const discordEndPoint = process.env.DISCORD_API_ENDPOINT;
const redirectUri = process.env.REDIRECT_URI;

const discordLinkTemplate = process.env.DISCORD_AUTH_LINK_TEMPLATE;

const api_key = process.env.API_KEY;

const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;

module.exports = {
    port,
    discordEndPoint,
    redirectUri,
    clientId,
    clientSecret,
    discordLinkTemplate,
    api_key
}