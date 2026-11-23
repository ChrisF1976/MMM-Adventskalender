const NodeHelper = require("node_helper");
const fs = require("fs");
const path = require("path");

const DOOR_COUNT = 24;

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

    // Fisher-Yates shuffle of the numbers 1..24
    shuffledNumbers() {
        const numbers = Array.from({ length: DOOR_COUNT }, (_, i) => i + 1);
        for (let i = numbers.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
        }
        return numbers;
    },

    createInitialState() {
        return {
            year: new Date().getFullYear(),
            numbers: this.shuffledNumbers(),
            opened: Array(DOOR_COUNT).fill(false),
            autoOpened: Array(DOOR_COUNT).fill(false)
        };
    },

    isBoolArray(value) {
        return Array.isArray(value) && value.length === DOOR_COUNT && value.every((v) => typeof v === "boolean");
    },

    isValidState(state) {
        if (!state || typeof state !== "object") return false;
        if (state.year !== new Date().getFullYear()) return false; // new year -> new calendar
        if (!Array.isArray(state.numbers) || state.numbers.length !== DOOR_COUNT) return false;
        const sorted = [...state.numbers].sort((a, b) => a - b);
        if (!sorted.every((n, i) => n === i + 1)) return false;
        if (!this.isBoolArray(state.opened)) return false;
        if (state.autoOpened === undefined) state.autoOpened = Array(DOOR_COUNT).fill(false);
        return this.isBoolArray(state.autoOpened);
    },

    loadDoorState() {
        fs.readFile(this.stateFilePath, "utf8", (err, data) => {
            let state = null;
            if (!err && data) {
                try {
                    state = JSON.parse(data);
                } catch (parseErr) {
                    console.error("MMM-Adventskalender: error parsing state.json:", parseErr);
                }
            }

            if (this.isValidState(state)) {
                console.log("MMM-Adventskalender: state file loaded successfully");
            } else {
                console.warn("MMM-Adventskalender: state file missing, invalid or from a previous year, creating a new one");
                state = this.createInitialState();
                this.saveDoorState(state);
            }

            this.sendSocketNotification("DOOR_STATE_LOADED", state);
        });
    },

    saveDoorState(state) {
        if (!this.isValidState(state)) {
            console.warn("MMM-Adventskalender: refusing to save invalid door state");
            return;
        }
        fs.writeFile(this.stateFilePath, JSON.stringify(state, null, 2), (err) => {
            if (err) {
                console.error("MMM-Adventskalender: error saving door state:", err);
            }
        });
    }
});
