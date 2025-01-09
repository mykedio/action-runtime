const axios = require('axios');

const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
const USER_INFO_URL = process.env.USER_INFO_URL;

if (!ACCESS_TOKEN || !USER_INFO_URL) {
    throw new Error('access token and user info url required');
}

const runtime = async (context, fn) => {
    // log result
    return await fn(context);
}

const main = async () => {
    // load action.json
    const action = require('./action.json');
    const errors = [];

    // load userdata from Auth0
    // TODO: use user token/refresh token instead of machine token?
    // this would reduce number of machine tokens + ensure user is authenticated.
    let response;
    let user;
    try {
        response = await axios.get('https://id.myked.io/userinfo', { headers: {Authorization: `Bearer ${accessToken}`}});
        user = response.data;
    } catch (error) {
        errors.push(error);
    }

    const context = {
        user,
        variables: action.variables,
        secrets: action.secrets,
    };

    // load fn from action.js
    let fn;
    try {
        fn = require('./action')[action.action.entry];
        context['fn'] = fn;
    } catch (error) {
        errors.push(error);
    }

    // get result
    let dataJson = null;
    try {
        const result = await runtime(context, fn);

        // store it
        dataJson = JSON.stringify(result);
    } catch (error) {
        errors.push(error);
    }

    const result = {
        context,
        data: dataJson,
        errors: errors,
        status: errors.length !== 0 ? 'failed' : 'completed'
    };

    console.log(result);
};
main();