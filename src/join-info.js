/*
    Author: RLNT
    Requested by: nongbookza12
    License: GNU GPL v3.0
    Discord: https://discord.com/invite/Q3qxws6
*/
registerPlugin(
    {
        name: 'Join Information',
        version: '1.0.0',
        description: 'Send a client specific information when they join.',
        author: 'RLNT',
        backends: ['ts3'],
        vars: [
            {
                name: 'required',
                title: 'All fields that are marked with (*) are required. All others are optional and have a default value.'
            },
            {
                name: 'spacer0',
                title: ''
            },
            {
                name: 'channel',
                title: 'Channel > Define the default channel where clients are connecting to! (*)',
                type: 'channel'
            },
            {
                name: 'placeholders',
                title:
                    'Available placeholders: %name% - nickname, %uid% - unique id, %ip% - ip address, %country% - location, %fcon% - first connect, %tcon% - total connections, %ver% - client version, %os% - operating system/platform'
            },
            {
                name: 'message',
                title: 'Message > Define what the message that should be sent to the client who joins should look like!',
                type: 'multiline',
                placeholder: '-\nName: %name%\nUID: %uid%\nIP: %ip%\nLocation: %country%\nFirst Connection: %fcon%\nTotal Connections: %tcon%\nVersion: %ver%\nPlatform: %os%'
            }
        ]
    },
    (_, config) => {
        // DEPENDENCIES
        const engine = require('engine');
        const event = require('event');

        // FUNCTIONS
        function log(message) {
            engine.log('Join-Info > ' + message);
        }

        function hasEmptyProp(obj) {
            for (let key in obj) {
                if (obj[key] === '') return true;
            }
            return false;
        }

        function getFcon(client) {
            let unix = client.getCreationTime();
            let date = new Date(unix);
            return date.toLocaleString();
        }

        function loadInfo(client) {
            return new Promise(done => {
                let msg;
                let attempt = 0;

                const timer = setInterval(() => {
                    msg = {
                        name: client.nick(),
                        uid: client.uid(),
                        ip: client.getIPAddress(),
                        country: client.country(),
                        fcon: getFcon(client),
                        tcon: client.getTotalConnections(),
                        ver: client.getVersion(),
                        os: client.getPlatform()
                    };

                    if (!hasEmptyProp(msg)) {
                        clearInterval(timer);
                        done(msg);
                        return;
                    } else if (attempt++ >= 5) {
                        msg.country = 'unknown';
                        clearInterval(timer);
                        done(msg);
                        return;
                    }
                }, 100);
            });
        }

        // LOADING EVENT
        event.on('load', () => {
            // error prevention that needs script deactivation
            if (config.channel === undefined || config.channel === '') {
                log('You have no default channel selected! Deactivating the script...');
                return;
            }

            // error prevention for default variables
            if (config.message === undefined || !config.message)
                config.message = '-\nName: %name%\nUID: %uid%\nIP: %ip%\nLocation: %country%\nFirst Connection: %fcon%\nTotal Connections: %tcon%\nVersion: %ver%\nPlatform: %os%';

            // start the script
            main();
        });

        // MAIN FUNCTION
        function main() {
            // log start
            log('The script has loaded successfully!');

            /**
             * MOVE EVENT
             * fired when a client switches channels or joins/leaves the server
             */
            event.on('clientMove', event => {
                const client = event.client;
                if (client.isSelf()) return;

                // detect if client joins the server
                if (event.fromChannel === undefined && event.toChannel.id() === config.channel) {
                    loadInfo(client).then(clientInfo => {
                        // send message to client
                        client.chat(
                            config.message
                                .replace('%name%', clientInfo.name)
                                .replace('%uid%', clientInfo.uid)
                                .replace('%ip%', clientInfo.ip)
                                .replace('%country%', clientInfo.country)
                                .replace('%fcon%', clientInfo.fcon)
                                .replace('%tcon%', clientInfo.tcon)
                                .replace('%ver%', clientInfo.ver)
                                .replace('%os%', clientInfo.os)
                        );
                    });
                }
            });
        }
    }
);
