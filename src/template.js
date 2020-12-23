/*
    Author: RLNT
    Requested by: Anyone
    License: GNU GPL v3.0
    Repository: https://github.com/RLNT/sinus-template
    Resource-Page: https://forum.sinusbot.com/resources/todo/
    Discord: https://discord.com/invite/Q3qxws6
*/
registerPlugin(
    {
        name: 'Sinus Template',
        version: '1.0.0',
        description: 'With this script, the bot will automatically ...',
        author: 'RLNT',
        backends: ['ts3'],
        vars: [
            {
                name: 'required',
                title: 'All fields that are marked with (*) are required, fields with [*] are semi-required and all others are optional and have a default value.'
            },
            {
                name: 'configuration',
                title: 'A guide how to configure the script to your needs can be found here: https://github.com/RLNT/sinus-template/blob/master/CONFIGURATION.md'
            },
            {
                name: 'spacer0',
                title: ''
            },
            {
                name: 'header0',
                title: '->>> General Options <<<-'
            },
            {
                name: 'channel',
                title: 'Example-Channel > Define the channel! (*)',
                type: 'channel'
            },
            {
                name: 'spacer1',
                title: ''
            },
            {
                name: 'header1',
                title: '->>> Dev Options <<<-'
            },
            {
                name: 'developer',
                title: "Don't change any of the following values if you have not been told to! This section is to identify problems faster and will drain performance."
            },
            {
                name: 'devEnabled',
                title: 'Do you want to enable the developer mode?',
                type: 'select',
                options: ['Yes', 'No']
            }
        ]
    },
    (_, scriptConfig) => {
        // DEPENDENCIES
        const engine = require('engine');
        const backend = require('backend');
        const event = require('event');
        //const store = require('store');

        // GLOBAL VARS
        //const uidPattern = new RegExp('^[a-zA-Z0-9+\\/]{27}=$');

        // CONFIG OPTIONS
        let config = {
            channel: scriptConfig.channel,
            dev: scriptConfig.devEnabled
        };

        // merge configs into one object
        // config = Object.assign(config, subconfig1, subconfig2);

        // FUNCTIONS
        /**
         * Send a message to the SinusBot instance log
         * @param {String} message > the message to send
         * @returns {void} > nothing
         */
        function log(message) {
            engine.log('Template > ' + message);
        }

        /**
         * Wait for the backend to be online/connected each given amount of time for a given amount of tries
         * @param {Number} attempts > the amount of tries the function should check for the backend to be online/connected
         * @param {Number} wait > the amount of time (in seconds) that should be waited between each try
         * @returns {Promise} > resolve when the backend is online/connected, reject when the backend was not online/connected in time
         */
        function waitForBackend(attempts, wait) {
            return new Promise((success, fail) => {
                let attempt = 1;
                const timer = setInterval(() => {
                    if (backend.isConnected()) {
                        clearInterval(timer);
                        if (config.dev) log('waitForBackend() took ' + attempt + ' attempts with a timer of ' + wait + ' seconds to resolve');
                        success();
                        return;
                    } else if (attempt > attempts) {
                        clearInterval(timer);
                        if (config.dev) log('waitForBackend() failed at ' + attempt + '. attempt with a timer of ' + wait + ' seconds');
                        fail('backend');
                        return;
                    }

                    attempt++;
                }, wait * 1000);
            });
        }

        // LOADING EVENT
        event.on('load', () => {
            // dev mode config dump
            if (config.dev) {
                console.log('Script-Config:', Object.entries(scriptConfig));
                console.log('Validated-Config:', Object.entries(config));
            }

            // error prevention that needs script deactivation
            if (!engine.version().includes('1.0.0')) {
                return log(
                    'This script is only compatible with SinusBot 1.0.0 and above! Please upgrade to the latest version. | Linux: https://forum.sinusbot.com/resources/internal-linux-beta.1/ | Windows: https://forum.sinusbot.com/resources/internal-windows-beta-64bit.150/'
                );
            } else if (engine.version().toLowerCase().includes('alpha')) {
                return log(
                    'This script is not compatible with the alpha version of the SinusBot! Please upgrade to the beta version. | Linux: https://forum.sinusbot.com/resources/internal-linux-beta.1/ | Windows: https://forum.sinusbot.com/resources/internal-windows-beta-64bit.150/'
                );
            } else if (config.channel === undefined) {
                return log('There was no channel selected to display the staff list! Deactivating script...');
            } else {
                // error prevention that needs feature deactivation

                // start the script
                waitForBackend(10, 3)
                    .then(() => {
                        log('The script has loaded successfully!');
                        main();
                    })
                    .catch(error => {
                        if (error === 'backend') {
                            log(
                                'The bot was not able to connect to the backend in time! To use this script, the bot needs to be connected to your TeamSpeak server. Make sure it can connect. Deactivating script...'
                            );
                        } else {
                            log('Unknown error occured! Please report this to the script author: https://discord.com/invite/Q3qxws6');
                            console.log(error);
                        }
                    });
            }
        });

        // MAIN FUNCTION
        function main() {
            // VARIABLES
            //const channel = backend.getChannelByID(config.channel);
        }
    }
);
