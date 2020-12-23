/*
    Author: RLNT
    Requested by: tomislav
    License: GNU GPL v3.0
    Discord: https://discord.com/invite/Q3qxws6
*/
registerPlugin(
    {
        name: 'Support Lock',
        version: '1.0.0',
        description: 'With this script, the bot will automatically open and close a configurable support channel if atleast one member of configurable supporter groups is online.',
        author: 'RLNT',
        backends: ['ts3'],
        vars: [
            {
                name: 'required',
                title: 'All fields that are marked with (*) are required!'
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
                title: 'Support-Channel > Define the channel that should be modified with the script! (*)',
                type: 'channel'
            },
            {
                name: 'groups',
                title: 'Support-Groups > Define the support groups here that are checked for the status change of the channel! (*)',
                type: 'strings'
            },
            {
                name: 'commandPersist',
                title:
                    'Persistent-Command > Do you want to disable automatic reopening/closing of the support channel after someone changed its status via command? If yes, the channel has to be manually opened/closed to activate the automation again.',
                type: 'select',
                options: ['Yes', 'No']
            },
            {
                name: 'spacer1',
                title: ''
            },
            {
                name: 'header1',
                title: '->>> Text Options <<<-'
            },
            {
                name: 'commandOpen',
                title: 'Open Command > Define the command that can be used for manually opening the channel.',
                type: 'string',
                placeholder: '!opensupport'
            },
            {
                name: 'commandClose',
                title: 'Close Command > Define the command that can be used for manually closing the channel.',
                type: 'string',
                placeholder: '!closesupport'
            },
            {
                name: 'phraseUnlocked',
                title: "Unlocked-Phrase > Define the name of the channel if it's unlocked!",
                type: 'string',
                placeholder: 'Support > open'
            },
            {
                name: 'phraseLocked',
                title: "Locked-Phrase > Define the name of the channel if it's locked!",
                type: 'string',
                placeholder: 'Support > closed'
            },
            {
                name: 'phraseNoPermissionOpen',
                title: 'NoPermission-Open-Phrase > Define the phrase that is sent to someone that tries to open the support but has no permission!',
                type: 'string',
                placeholder: "You don't have permission to open the support channel!"
            },
            {
                name: 'phraseNoPermissionClose',
                title: 'NoPermission-Close-Phrase > Define the phrase that is sent to someone that tries to close the support but has no permission!',
                type: 'string',
                placeholder: "You don't have permission to close the support channel!"
            },
            {
                name: 'phraseAlreadyOpen',
                title: "Already-Opened-Phrase > Define the phrase that is sent to someone that tries to open the support but it's already opened!",
                type: 'string',
                placeholder: 'The support channel is already opened!'
            },
            {
                name: 'phraseAlreadyClose',
                title: "Already-Closed-Phrase > Define the phrase that is sent to someone that tries to close the support but it's already closed!",
                type: 'string',
                placeholder: 'The support channel is already closed!'
            },
            {
                name: 'phraseOpen',
                title: 'Opened-Phrase > Define the phrase that is sent to someone that successfully opened the support channel!',
                type: 'string',
                placeholder: 'The support channel has been opened!'
            },
            {
                name: 'phraseClose',
                title: 'Closed-Phrase > Define the phrase that is sent to someone that successfully closed the support channel!',
                type: 'string',
                placeholder: 'The support channel has been closed!'
            }
        ]
    },
    (_, { channel, groups, persist, commandOpen, commandClose, pUnlocked, pLocked, pPermOpen, pPermClose, pAlrOpen, pAlrClose, pOpen, pClose }) => {
        // DEPENDENCIES
        const engine = require('engine');
        const backend = require('backend');
        const event = require('event');

        // GLOBAL VARS
        const prefix = 'Support-Lock';
        const messages = {
            commandOpen: varDef(commandOpen, '!opensupport'),
            commandClose: varDef(commandClose, '!closesupport'),
            nameOpen: varDef(pUnlocked, 'Support - open'),
            nameClose: varDef(pLocked, 'Support - closed'),
            permOpen: varDef(pPermOpen, "You don't have permission to open the support channel!"),
            permClose: varDef(pPermClose, "You don't have permission to close the support channel!"),
            alrOpen: varDef(pAlrOpen, 'The support channel is already opened!'),
            alrClose: varDef(pAlrClose, 'The support channel is already closed!'),
            opened: varDef(pOpen, 'The support channel has been opened!'),
            closed: varDef(pClose, 'The support channel has been closed!')
        };
        persist = varDef(persist, 1) == 0;
        let locked = true;
        let commandModified = false;

        // FUNCTIONS
        function log(message) {
            engine.log(prefix + ' > ' + message);
        }

        function varDef(v, defVal) {
            if (v === undefined || v === null || v === '') {
                return defVal;
            } else {
                return v;
            }
        }

        function waitForBackend() {
            return new Promise(done => {
                const timer = setInterval(() => {
                    if (backend.isConnected()) {
                        clearInterval(timer);
                        done();
                    }
                }, 1000);
            });
        }

        function isLocked() {
            return channel.maxClients() === 0;
        }

        function validateGroups() {
            let supportGroups = [];

            groups.forEach(group => {
                if (backend.getServerGroupByID(group) === undefined) return;
                if (!supportGroups.includes(group)) supportGroups.push(group);
            });

            return supportGroups;
        }

        function supportOnline() {
            let result = false;
            backend.getClients().forEach(client => {
                if (client.isSelf()) return;
                if (isSupporter(client)) {
                    result = true;
                    return;
                }
            });

            return result;
        }

        function isSupporter(client) {
            let result = false;
            client.getServerGroups().forEach(group => {
                if (groups.includes(group.id())) {
                    result = true;
                    return;
                }
            });

            return result;
        }

        function toggleChannel() {
            if (locked) {
                channel.setName(messages.nameOpen);
                channel.setMaxClients(-1);
                locked = false;
            } else {
                channel.setName(messages.nameClose);
                channel.setMaxClients(0);
                locked = true;
            }
        }

        // LOADING EVENT
        event.on('load', () => {
            if (channel === undefined) {
                log('There was no channel selected to display the staff list! Deactivating script...');
                return;
            } else if (groups === undefined || groups.length === 0) {
                log('There are no support groups configured! Deactivating script...');
                return;
            } else {
                log('The script has loaded successfully!');

                // start the script
                waitForBackend().then(() => {
                    main();
                });
            }
        });

        // MAIN FUNCTION
        function main() {
            // VARIABLES
            groups = validateGroups();
            channel = backend.getChannelByID(channel);
            locked = isLocked();

            // check the channel status on startup and adjust it
            if (locked && supportOnline()) toggleChannel();
            if (!locked && !supportOnline()) toggleChannel();

            // MOVE EVENT
            event.on('clientMove', event => {
                const client = event.client;
                if (client.isSelf()) return;
                const fromChannel = event.fromChannel;
                const toChannel = event.toChannel;

                if (fromChannel === undefined || toChannel === undefined) {
                    log(persist);
                    log(commandModified);
                    if (persist && commandModified) return;
                    if (supportOnline() === locked) toggleChannel();
                }
            });

            // CHAT EVENT
            event.on('chat', event => {
                const client = event.client;
                if (client.isSelf()) return;
                if (event.mode !== 1) return;

                // support open command
                if (event.text === messages.commandOpen) {
                    if (isSupporter(client)) {
                        if (locked) {
                            toggleChannel();
                            client.chat(messages.opened);
                            log('open command successful ' + commandModified);
                            commandModified = !commandModified;
                        } else {
                            client.chat(messages.alrOpen);
                        }
                    } else {
                        client.chat(messages.permOpen);
                    }
                }

                // support close command
                if (event.text === messages.commandClose) {
                    if (isSupporter(client)) {
                        if (!locked) {
                            toggleChannel();
                            client.chat(messages.closed);
                            log('close command successful ' + commandModified);
                            commandModified = !commandModified;
                        } else {
                            client.chat(messages.alrClose);
                        }
                    } else {
                        client.chat(messages.permClose);
                    }
                }
            });
        }
    }
);
