"use strict";

function handler(routeConfig) {
    const eventProcessorMapping = extractEventProcessorMapping(routeConfig);
    return (request, callback) => {
        if (routeConfig.debug) {
            console.log("Lambda invoked with request:", request)
        }
        for (const eventProcessorName of eventProcessorMapping.keys()) {

            try {
                const result = eventProcessorMapping.get(eventProcessorName)(routeConfig[eventProcessorName], request);
                if (result) {
                    return Promise.resolve(result)
                        .then(result => callback(null, result))
                        .catch(error => {
                            console.log(error.stack);
                            callback(error.toString());
                        });
                } else {
                    if (routeConfig.debug) {
                        console.log("Event processor couldn't handle request.")
                    }
                }
            } catch (error) {
                if (error.stack) {
                    console.log(error.stack);
                }
                callback(error.toString());
                return;
            }
        }
        callback('No event processor found to handle this kind of event!');
    }
}

function extractEventProcessorMapping(routeConfig) {
    const processorMap = new Map();
    for (let key of Object.keys(routeConfig)) {
        try {
            processorMap.set(key, require(`./lib/${key}`));
        } catch (error) {
            throw new Error(`The event processor '${key}', that is mentioned in the routerConfig, cannot be instantiated (${error.toString()})`);
        }
    }
    return processorMap;
}

module.exports = {handler: handler};
