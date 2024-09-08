const guidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const discordIdRegex = /^\d{17,19}$/;

const validateGuid = async (guidStr) => {
    return guidRegex.test(guidStr);
}

const validateDiscordId = async (discordId) => {
    return discordIdRegex.test(discordId);
}

module.exports = {
    validateGuid,
    validateDiscordId,
};