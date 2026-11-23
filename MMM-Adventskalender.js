Module.register("MMM-Adventskalender", {
    defaults: {
        backgroundImage: null,
        doorMargin: 30,
        moduleWidth: 800,
        moduleHeight: 600,
        autopen: true,
        autoopenat: "00:00",
        openAnimationTime: "5s",
        showCursor: true
    },

    start() {
        Log.info("Starting module: " + this.name);
        this.doorState = null;
        this.doorElements = [];

        // Support the old (capitalized) option name as well
        const animationTime = this.config.OpenAnimationTime || this.config.openAnimationTime;
        document.documentElement.style.setProperty("--advent-animation-time", animationTime);

        this.loadDoorState();
        this.scheduleMidnightReload();
        if (this.config.autopen) {
            this.scheduleAutoOpen();
        }
    },

    getStyles() {
        return ["MMM-Adventskalender.css"];
    },

    /* ---------- date helpers ---------- */

    // Day of December (1-31), or 0 when it is not December.
    getAdventDay() {
        const now = new Date();
        return now.getMonth() === 11 ? now.getDate() : 0;
    },

    getAutoOpenTime() {
        const [hours, minutes] = String(this.config.autoopenat).split(":").map(Number);
        const time = new Date();
        time.setHours(hours || 0, minutes || 0, 0, 0);
        return time;
    },

    // Should the door with this number be opened automatically right now?
    isAutoOpenDue(doorNumber) {
        const today = this.getAdventDay();
        if (!this.config.autopen || today === 0) return false;
        return doorNumber < today || (doorNumber === today && new Date() >= this.getAutoOpenTime());
    },

    /* ---------- rendering ---------- */

    getDom() {
        const wrapper = document.createElement("div");
        wrapper.className = "advent-calendar";
        if (this.config.showCursor) {
            wrapper.classList.add("show-cursor");
        }
        wrapper.style.width = `${this.config.moduleWidth}px`;
        wrapper.style.height = `${this.config.moduleHeight}px`;

        if (this.config.backgroundImage) {
            const background = document.createElement("img");
            background.className = "advent-background";
            background.src = this.config.backgroundImage;
            wrapper.appendChild(background);
        }

        if (!this.doorState) {
            const loading = document.createElement("div");
            loading.className = "advent-loading dimmed small";
            loading.textContent = "Loading…";
            wrapper.appendChild(loading);
            return wrapper;
        }

        wrapper.appendChild(this.createDoors());
        return wrapper;
    },

    createDoors() {
        const doorsContainer = document.createElement("div");
        doorsContainer.className = "advent-doors";
        this.doorElements = [];

        const margin = this.config.doorMargin;
        const doorWidth = (this.config.moduleWidth - margin * 7) / 6;
        const doorHeight = (this.config.moduleHeight - margin * 5) / 4;
        const today = this.getAdventDay();
        let stateChanged = false;

        for (let i = 0; i < 24; i++) {
            const doorNumber = this.doorState.numbers[i];

            const door = document.createElement("div");
            door.className = "door";
            door.style.width = `${doorWidth}px`;
            door.style.height = `${doorHeight}px`;
            door.style.left = `${(i % 6) * (doorWidth + margin) + margin}px`;
            door.style.top = `${Math.floor(i / 6) * (doorHeight + margin) + margin}px`;

            const number = document.createElement("span");
            number.className = "number";
            number.textContent = doorNumber;
            door.appendChild(number);

            const img = document.createElement("img");
            img.src = `${this.file("images")}/${String(doorNumber).padStart(2, "0")}.jpg`;
            door.appendChild(img);

            // Auto-open each door only once, so a door closed manually stays closed
            if (this.isAutoOpenDue(doorNumber) && !this.doorState.autoOpened[i]) {
                this.doorState.opened[i] = true;
                this.doorState.autoOpened[i] = true;
                stateChanged = true;
            }

            if (this.doorState.opened[i]) {
                door.classList.add("opened");
            } else if (doorNumber > today) {
                door.classList.add("locked");
            }

            door.addEventListener("click", () => this.onDoorClick(door, i));
            door.addEventListener("animationend", (event) => this.onDoorAnimationEnd(event, door, i));

            this.doorElements[i] = door;
            doorsContainer.appendChild(door);
        }

        if (stateChanged) {
            this.saveDoorState();
        }
        return doorsContainer;
    },

    /* ---------- interaction ---------- */

    onDoorClick(door, i) {
        if (door.classList.contains("locked")) return;
        if (door.classList.contains("opening") || door.classList.contains("closing")) return;

        if (door.classList.contains("opened")) {
            door.classList.remove("opened");
            door.classList.add("closing");
        } else {
            door.classList.add("opening");
        }
    },

    onDoorAnimationEnd(event, door, i) {
        if (event.animationName !== "rotate-door") return;

        if (door.classList.contains("opening")) {
            door.classList.remove("opening");
            door.classList.add("opened");
            this.doorState.opened[i] = true;
            this.saveDoorState();
        } else if (door.classList.contains("closing")) {
            door.classList.remove("closing");
            this.doorState.opened[i] = false;
            this.saveDoorState();
        }
    },

    /* ---------- timers ---------- */

    scheduleAutoOpen() {
        const now = new Date();
        const target = this.getAutoOpenTime();
        if (now >= target) {
            target.setDate(target.getDate() + 1);
        }

        setTimeout(() => {
            this.autoOpenDoor();
            this.scheduleAutoOpen();
        }, target - now);
    },

    // Reload state shortly after midnight: unlocks the new day's door and
    // lets the node_helper reset the calendar when a new year starts.
    scheduleMidnightReload() {
        const now = new Date();
        const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 5);

        setTimeout(() => {
            this.loadDoorState();
            this.scheduleMidnightReload();
        }, nextMidnight - now);
    },

    autoOpenDoor() {
        if (!this.config.autopen || !this.doorState) return;

        const today = this.getAdventDay();
        if (today < 1 || today > 24) return;

        const i = this.doorState.numbers.indexOf(today);
        if (i === -1 || this.doorState.autoOpened[i]) return;

        const wasOpened = this.doorState.opened[i];
        // Save immediately, so a re-render during the animation keeps the door open
        this.doorState.autoOpened[i] = true;
        this.doorState.opened[i] = true;
        this.saveDoorState();
        if (wasOpened) return;

        const door = this.doorElements[i];
        if (door && door.isConnected && !door.classList.contains("opening")) {
            door.classList.remove("locked");
            door.classList.add("opening");
        } else {
            this.updateDom();
        }
    },

    /* ---------- state ---------- */

    loadDoorState() {
        this.sendSocketNotification("LOAD_DOOR_STATE");
    },

    saveDoorState() {
        this.sendSocketNotification("SAVE_DOOR_STATE", this.doorState);
    },

    socketNotificationReceived(notification, payload) {
        if (notification === "DOOR_STATE_LOADED") {
            this.doorState = payload;
            this.updateDom();
        }
    }
});
