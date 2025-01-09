const startTime = performance.now();
const axios = require('axios');
const { setup } = require('./setup');
const { join } = require('path');

const runtime = async (context, fn) => {
    return fn(context);
}

const main = async () => {
    const errors = [];

    let sdata;
    try {
        sdata = await setup(join(__dirname, 'config.json'));
    } catch (error) {
        errors.push(error, new Error('initial setup failed'));
    }

    // create action result with API
    const { config, ...data } = sdata;
    let result;
    try {
        result = (await axios.post(`${config.api_base_url}/results`, {
            action_id: data.context.action.action_id,
            ...data
        }, {
            headers: { Authorization: `Bearer ${sdata.config.token}` }
        })).data;
    } catch (error) {
        errors.push(error);
    }

    // handle setup failures
    if (errors.length !== 0) {
        result.duration = performance.now() - startTime;
        throw new Error('initial setup has failed', errors);
    }

    // get result
    let dataJson = null;
    try {
        const fnResult = await runtime(result.context, sdata.context.fn);

        // store it
        dataJson = JSON.stringify(fnResult);
    } catch (error) {
        errors.push(error);
    }

    const endTime = performance.now();

    result.data = dataJson;
    result.errors = errors;
    result.duration = endTime - startTime;
    result.status = errors.length !== 0 ? 'failed' : 'completed';

    console.log(result);

    const { result_id, context, ...rest } = result;
    await axios.patch(`${config.api_base_url}/results/${result.result_id}`, rest, {
        headers: { Authorization: `Bearer ${config.token}`}
    });
};
main();