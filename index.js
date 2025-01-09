const fs = require('fs');
const axios = require('axios');

const runtime = async (context, fn) => {
    // log result
    return fn(context);
}

const main = async () => {
    // load action.json
    const action = require('./action.json');
    const errors = [];

    const token = fs.readFileSync('token');

    // load userdata from Auth0
    // TODO: use user token/refresh token instead of machine token?
    // this would reduce number of machine tokens + ensure user is authenticated.
    let response;
    let user;
    try {
        response = await axios.get('https://id.myked.io/userinfo', { headers: {Authorization: `Bearer ${token}`}});
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
        fn = require('./action')[action.entry];
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

    console.log(JSON.stringify(result));
};
main();