const NodeHelper = require("node_helper");
const fs = require("fs");
const path = require("path");

module.exports = NodeHelper.create({
    start() {
        this.stateFilePath = path.join(__dirname, "state.json");
        console.log("MMM-Adventskalender node_helper started");
    },

    socketNotificationReceived(notification, payload) {
        if (notification === "LOAD_DOOR_STATE") {
            this.loadDoorState();
        } else if (notification === "SAVE_DOOR_STATE") {
            this.saveDoorState(payload);
        }
    },

    loadDoorState() {
        fs.readFile(this.stateFilePath, "utf8", (err, data) => {
            if (err || !data) {
                console.warn("State file not found or empty, creating a new one...");
                const initialState = {
                    numbers: Array.from({ length: 24 }, (_, i) => i + 1).sort(() => Math.random() - 0.5),
                    opened: Array(24).fill(false) // All doors closed initially
                };

                // Write initial state to the file
                fs.writeFile(this.stateFilePath, JSON.stringify(initialState, null, 2), (writeErr) => {
                    if (writeErr) {
                        console.error("Error creating state.json:", writeErr);
                    } else {
                        console.log("state.json created with initial state");
                    }
                });

                this.sendSocketNotification("DOOR_STATE_LOADED", initialState);
            } else {
                try {
                    const parsedData = JSON.parse(data);
                    console.log("State file loaded successfully");
                    this.sendSocketNotification("DOOR_STATE_LOADED", parsedData);
                } catch (parseErr) {
                    console.error("Error parsing state.json:", parseErr);

                    // Reinitialize state in case of parsing error
                    const initialState = {
                        numbers: Array.from({ length: 24 }, (_, i) => i + 1).sort(() => Math.random() - 0.5),
                        opened: Array(24).fill(false)
                    };
                    fs.writeFile(this.stateFilePath, JSON.stringify(initialState, null, 2), (writeErr) => {
                        if (writeErr) {
                            console.error("Error recreating state.json:", writeErr);
                        } else {
                            console.log("state.json recreated with initial state");
                        }
                    });

                    this.sendSocketNotification("DOOR_STATE_LOADED", initialState);
                }
            }
        });
    },

    saveDoorState(state) {
        fs.writeFile(this.stateFilePath, JSON.stringify(state, null, 2), (err) => {
            if (err) {
                console.error("Error saving door state:", err);
            } else {
                console.log("Door state saved successfully");
            }
        });
    }
});
