Module.register("MMM-Adventskalender", {
    defaults: {
        backgroundImage: null,
        doorMargin: 30,
        moduleWidth: 800,
        moduleHeight: 600,
        autopen: false,
        autoopenat: "00:00"
    },

    start() {
        Log.info("Starting module: " + this.name);
        this.doorState = null;
        this.loadDoorState();
        if (this.config.autopen) {
            this.scheduleAutoOpen();
        }
    },

    getStyles() {
        return ["MMM-Adventskalender.css"];
    },

    getDom() {
        const wrapper = document.createElement("div");
        wrapper.style.width = `${this.config.moduleWidth}px`;
        wrapper.style.height = `${this.config.moduleHeight}px`;
        wrapper.style.position = "relative";
        wrapper.style.overflow = "hidden";
        wrapper.style.boxShadow = "4px 8px 16px rgba(0, 0, 0, 0.5)";
        wrapper.className = "advent-calendar";

        if (this.config.backgroundImage) {
            const background = document.createElement("img");
            background.src = this.config.backgroundImage;
            background.style.width = "100%";
            background.style.height = "100%";
            background.style.objectFit = "cover";
            background.style.position = "absolute";
            background.style.left = "0";
            background.style.top = "0";
            background.style.zIndex = "0";
            background.style.boxShadow = "4px 8px 16px rgba(0, 0, 0, 0.5)";
            wrapper.appendChild(background);
        }

        const doors = this.createDoors();
        wrapper.appendChild(doors);
        return wrapper;
    },

    createDoors() {
        const doorsContainer = document.createElement("div");
        doorsContainer.style.position = "relative";
        doorsContainer.style.zIndex = "1";

        const doorWidth = (this.config.moduleWidth - (this.config.doorMargin * 7)) / 6;
        const doorHeight = (this.config.moduleHeight - (this.config.doorMargin * 5)) / 4;

        const today = new Date().getDate();
        const [hours, minutes] = this.config.autoopenat.split(":").map(Number);
        const autoopenTime = new Date();
        autoopenTime.setHours(hours, minutes, 0);

        for (let i = 0; i < 24; i++) {
            const door = document.createElement("div");
            door.className = "door";
            door.style.width = `${doorWidth}px`;
            door.style.height = `${doorHeight}px`;

            const col = i % 6;
            const row = Math.floor(i / 6);

            door.style.left = `${col * (doorWidth + this.config.doorMargin) + this.config.doorMargin}px`;
            door.style.top = `${row * (doorHeight + this.config.doorMargin) + this.config.doorMargin}px`;
            door.style.position = "absolute";

            const number = document.createElement("span");
            number.textContent = this.doorState.numbers[i];
            number.style.position = "absolute";
            number.style.top = "50%";
            number.style.left = "50%";
            number.style.transform = "translate(-50%, -50%)";
            number.style.fontSize = "1.5rem";
            number.style.color = "#000";
            door.appendChild(number);

            const img = document.createElement("img");
            img.src = `${this.file("images")}/${String(this.doorState.numbers[i]).padStart(2, "0")}.jpg`;
            img.style.width = "100%";
            img.style.height = "100%";
            img.style.objectFit = "cover";
            img.style.display = "none";
            door.appendChild(img);

            const doorNumber = this.doorState.numbers[i];

            // Open all doors older than today's date
            if (doorNumber < today || 
                (this.config.autopen && doorNumber === today && new Date() >= autoopenTime)) {
                this.doorState.opened[i] = true;
            }

            if (this.doorState.opened[i]) {
                door.classList.add("opened");
                img.style.display = "block";
            } else if (doorNumber > today) {
                door.style.pointerEvents = "none";
            }

            door.addEventListener("click", () => {
                if (!door.classList.contains("opened")) {
                    door.classList.add("opened");
                    img.style.display = "block";
                    this.doorState.opened[i] = true;
                    this.sendSocketNotification("SAVE_DOOR_STATE", this.doorState);
                }
            });

            doorsContainer.appendChild(door);
        }

        return doorsContainer;
    },

    scheduleAutoOpen() {
        const [hours, minutes] = this.config.autoopenat.split(":").map(Number);
        const now = new Date();
        const targetTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0);

        if (now >= targetTime) {
            targetTime.setDate(targetTime.getDate() + 1);
        }

        const timeUntilAutoOpen = targetTime - now;

        setTimeout(() => {
            this.autoOpenDoor();
            this.scheduleAutoOpen();
        }, timeUntilAutoOpen);
    },

    autoOpenDoor() {
        const today = new Date().getDate();
        const doorIndex = this.doorState.numbers.indexOf(today);

        if (doorIndex !== -1 && !this.doorState.opened[doorIndex]) {
            this.doorState.opened[doorIndex] = true;
            this.sendSocketNotification("SAVE_DOOR_STATE", this.doorState);

            const door = document.querySelectorAll(".door")[doorIndex];
            if (door) {
                door.classList.add("opened");
                const img = door.querySelector("img");
                if (img) {
                    img.style.display = "block";
                }
            }
        }
    },

    loadDoorState() {
        this.sendSocketNotification("LOAD_DOOR_STATE");
    },

    socketNotificationReceived(notification, payload) {
        if (notification === "DOOR_STATE_LOADED") {
            this.doorState = payload;
            this.updateDom();
        }
    }
});
