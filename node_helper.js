const NodeHelper = require("node_helper");
const fs = require("fs");
const path = require("path");

module.exports = NodeHelper.create({
    start() {
        this.stateFilePath = path.join(__dirname, "state.json");
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
                const initialState = {
                    numbers: Array.from({ length: 24 }, (_, i) => i + 1).sort(() => Math.random() - 0.5),
                    opened: Array(24).fill(false)
                };
                fs.writeFileSync(this.stateFilePath, JSON.stringify(initialState, null, 2));
                this.sendSocketNotification("DOOR_STATE_LOADED", initialState);
            } else {
                this.sendSocketNotification("DOOR_STATE_LOADED", JSON.parse(data));
            }
        });
    },

    saveDoorState(state) {
        fs.writeFile(this.stateFilePath, JSON.stringify(state, null, 2), (err) => {
            if (err) {
                console.error("Error saving door state:", err);
            }
        });
    }
});
