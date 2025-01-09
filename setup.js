const { readJsonSync, pathExistsSync, writeFileSync } = require('fs-extra');

exports.setup = async (path) => {
    if (!pathExistsSync(path)) {
        throw new Error('configuration file wasn\'t created');
    }

    // get configuration
    const config = readJsonSync(path);

    console.log(config)

    if (!config.token || !config.action_id) {
        throw new Error('config file improperly formatted');
    }

    // get user data
    const user = config.user;

    // get action data
    const action = config.action;

    if (!action.hash) {
        throw new Error('no code has been uploaded');
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