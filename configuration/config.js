require("dotenv").config()

const port = process.env.CLIENT_API_PORT || 2424;

const discordEndPoint = process.env.DISCORD_API_ENDPOINT;
const redirectUri = process.env.REDIRECT_URI;

const discordLinkTemplate = process.env.DISCORD_AUTH_LINK_TEMPLATE;

const api_key = process.env.API_KEY;

const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;

const use_given_table = !!+process.env.USE_GIVEN;
const use_caching = !!+process.env.USE_CACHE;
const cache_size = parseInt(process.env.CACHE_MAX_SIZE || '100', 10);
const cache_update_timeout = parseInt(process.env.CACHE_UPDATE_TIMEOUT || '3600', 10);
const checkGuild = !!+process.env.IS_IN_GUILD;
const guildId = process.env.GUILD_ID;

const deletionAllowed = !!+process.env.DELETION_ALLOWED;

module.exports = {
    port,
    discordEndPoint,
    redirectUri,
    clientId,
    clientSecret,
    discordLinkTemplate,
    api_key,
    use_given_table,
    use_caching,
    cache_size,
    cache_update_timeout,
    checkGuild,
    guildId,
    deletionAllowed,
}