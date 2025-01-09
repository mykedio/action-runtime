const { readJsonSync, pathExistsSync, writeFileSync } = require('fs-extra');
const { createHash } = require('crypto');
const axios = require('axios');
const { join } = require('path');

exports.setup = async (path) => {
    if (!pathExistsSync(path)) {
        throw new Error('configuration file wasn\'t created');
    }

    // get configuration
    const config = readJsonSync(path);

    if (!config.token || !config.action_id) {
        throw new Error('config file improperly formatted');
    }

    const headers = {
        Authorization: `Bearer ${config.token}`
    }

    // get user data
    const user = (await axios.get(`${config.id_base_url}/userinfo`, { headers })).data;

    // get action data
    const action = (await axios.get(`${config.api_base_url}/actions/${config.action_id}`, { headers })).data;

    if (!action.hash) {
        throw new Error('no code has been uploaded');
    }

    // get user code from action (if exists)
    const usercode = (await axios.get(`${config.api_base_url}/actions/${config.action_id}/usercode`, { headers })).data.user_code;
    writeFileSync(join(__dirname, 'action.js'), Buffer.from(usercode, 'base64'));

    // check hashes
    const usercodeBuf = Buffer.from(usercode, 'base64');
    const hash = Buffer.from(action.hash, 'base64');
    const cmp = createHash('sha256').update(usercodeBuf).digest();

    if (!hash.equals(cmp)) {
        throw new Error('usercode failed checksum match');
    }

    return {
        context: {
            user,
            action,
            variables: action ? action.variables : {},
            secrets: action ? action.secrets : {},
            fn: require('./action')[action.entry]
        },
        config,
        data: null,
        errors: [],
        status: 'pending',
        duration: 0
    };
}