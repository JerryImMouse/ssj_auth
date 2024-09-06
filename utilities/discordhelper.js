const {redirectUri, clientId, clientSecret, discordEndPoint} = require("../configuration/config");
const {getUserBySS14Id, updateUserById} = require("../database/sqlite");
const logger = require("./logger");

const getDiscordIdentifyScope = async (netUserId) => {
    if (!await checkTokenValid(netUserId, false)) {
        logger.error("Unable to refresh token");
        return;
    }

    const user = await getUserBySS14Id(userId);

    const res = await fetch(`${discordEndPoint}/oauth2/@me`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${user.access_token}`,
        }
    })

    return await res.json();
}

const getDiscordIdentifyScopeUnsafe = async (token) => {
    const res = await fetch(`${discordEndPoint}/oauth2/@me`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
        }
    });

    return await res.json();
}

const getGuildMemberRoles = async (userId,guild_id) => {
    if (!await checkTokenValid(userId, false)) {
        logger.error('Unable to refresh token');
        return;
    }

    const user = await getUserBySS14Id(userId);

    const res = await fetch(`${discordEndPoint}/users/@me/guilds/${guild_id}/member`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${user.access_token}`
        }
    })

    return await res.json();
}

const checkInGuild = async (userId, guild_id) => {
    if (!await checkTokenValid(userId, false)) {
        logger.error('Unable to refresh token');
        return;
    }

    const user = await getUserBySS14Id(userId);

    const res = await fetch(`${discordEndPoint}/users/@me/guilds`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${user.access_token}`
        }
    })

    if (!res.ok) {
        return false;
    }

    const guilds = await res.json();

    return guilds.some(guild => guild.id === guild_id);
}

const exchangeCode = async(code) => {
    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('code', code);
    params.append('redirect_uri', redirectUri);

    const discordRes = await fetch(`${discordEndPoint}/oauth2/token`, {
        method: 'POST',
        body: params.toString(),
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
        }
    });

    if (!discordRes.ok) {
        const error = await discordRes.json();
        logger.error(`Failed to exchange code for token: ${error.error_description}`);
        return;
    }

    const tokenData = await discordRes.json();
    logger.info(`Successfully exchanged code for token: ${JSON.stringify(tokenData)}`);

    return tokenData;
}

const checkTokenValid = async (userid, force = false) => {
    const userObj = await getUserBySS14Id(userid);
    if (!userObj)
        return false;

    const lastRefreshedTime = new Date(userObj.last_refreshed_time);
    const now = new Date();
    const timeDifference = now - lastRefreshedTime;

    if (timeDifference < 7 * 24 * 60 * 60 * 1000 && !force)
        return true;

    return await refreshToken(userObj);
}

const refreshToken = async (userObj) => {
    const refresh_token = userObj.refresh_token;

    const params = new URLSearchParams();
    params.append('grant_type', 'refresh_token');
    params.append('refresh_token', refresh_token);

    const response = await fetch(`${discordEndPoint}/oauth2/token`, {
        method: 'POST',
        body: params.toString(),
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
        }
    });

    if (!response.ok) {
        const error = await response.json();
        logger.error(`Failed to exchange code for token: ${error.error_description}`);
        return false;
    }

    const tokenData = await response.json();
    logger.info(`Successfully refreshed token: ${JSON.stringify(tokenData)}`);

    await updateUserById(
        userObj.id,
        userObj.discord_name,
        userObj.discord_id,
        userObj.ss14_userid,
        tokenData['refresh_token'],
        tokenData['access_token'],
        new Date().toISOString());

    return true;
}

module.exports = {
    getDiscordIdentifyScope,
    exchangeCode,
    getGuildMemberRoles,
    getDiscordIdentifyScopeUnsafe,
    checkInGuild
}