const localZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
let events = [];
let timeZones = Intl.supportedValuesOf('timeZone').sort();

/* HEADER (YYYY-MM-DD 24hr) */
function updateHeader() {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");

    document.getElementById("currentDateTime").innerText =
        `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

    const offset = -now.getTimezoneOffset() / 60;
    const sign = offset >= 0 ? "+" : "-";

    document.getElementById("localZone").innerText =
        `Local Time Zone: ${localZone} (UTC ${sign}${Math.abs(offset)})`;
}

/* LOAD EVENTS */
function loadEvents() {
    fetch("dates.json")
        .then(res => res.json())
        .then(data => {
            events = data;
            renderEvents();
        });
}

/* SORT + RENDER EVENTS */
function renderEvents() {
    const container = document.getElementById("eventsContainer");
    container.innerHTML = "";

    const now = new Date();

    const processedEvents = events.map(event => {
        const start = new Date(`${event.date}T${event.startTime}`);
        const end = new Date(`${event.date}T${event.endTime}`);

        let status;
        if (now >= start && now <= end) status = "live";
        else if (now < start) status = "upcoming";
        else status = "past";

        return { ...event, start, end, status };
    });

    processedEvents.sort((a, b) => {
        const order = { live: 0, upcoming: 1, past: 2 };
        if (order[a.status] !== order[b.status])
            return order[a.status] - order[b.status];

        if (a.status === "upcoming") return a.start - b.start;
        if (a.status === "past") return b.start - a.start;
        return 0;
    });

    processedEvents.forEach(event => {
        const tile = document.createElement("div");
        tile.className = `event-tile ${event.status}`;

        tile.innerHTML = `
            <div class="event-title">${event.name}</div>
            <div>${event.date}</div>
            <div>Start Time: ${event.startTime} End Time: ${event.endTime}</div>
            ${event.timeZone !== localZone ? `<div>Zone: ${event.timeZone}</div>` : ""}
            <div><a href="${event.location}" target="_blank">Maps Location</a></div>
            <div class="countdown" id="cd-${event.name}"></div>
        `;

        container.appendChild(tile);
    });
}

/* COUNTDOWN */
function updateCountdowns() {
    const now = new Date();

    events.forEach(event => {
        const start = new Date(`${event.date}T${event.startTime}`);
        const end = new Date(`${event.date}T${event.endTime}`);
        const cdElement = document.getElementById(`cd-${event.name}`);
        if (!cdElement) return;

        if (now >= start && now <= end) {
            cdElement.innerText = "Event is LIVE";
            return;
        }

        if (now > end) {
            cdElement.innerText = "Event Ended";
            return;
        }

        const diff = start - now;

        const d = Math.floor(diff / (1000*60*60*24));
        const h = Math.floor((diff / (1000*60*60)) % 24);
        const m = Math.floor((diff / (1000*60)) % 60);
        const s = Math.floor((diff / 1000) % 60);

        cdElement.innerText = `${d}d ${h}h ${m}m ${s}s`;
    });
}

/* DROPDOWN */
function populateDropdown() {
    const select = document.getElementById("tzSelect");
    timeZones.forEach(zone => {
        const option = document.createElement("option");
        option.value = zone;
        option.textContent = zone;
        select.appendChild(option);
    });
}

function filterZones() {
    const input = document.getElementById("tzSearch").value.toLowerCase();
    const select = document.getElementById("tzSelect");

    Array.from(select.options).forEach(option => {
        option.style.display =
            option.value.toLowerCase().includes(input) ? "" : "none";
    });
}

function toggleDropdown() {
    document.getElementById("dropdownContainer").classList.toggle("hidden");
}

function displaySelectedZone() {
    const zone = document.getElementById("tzSelect").value;
    const now = new Date();

    const time = now.toLocaleTimeString("en-GB", {
        timeZone: zone,
        hour12: false
    });

    document.getElementById("selectedZoneDisplay").innerHTML =
        `Time Zone: ${zone}<br>Current Time: ${time}`;
}

/* TABLE (MAJOR CITIES ONLY) */
function buildTable() {
    const tbody = document.getElementById("tzTableBody");
    tbody.innerHTML = "";

    const now = new Date();

    const majorZones = [
        { city: "Los Angeles", zone: "America/Los_Angeles" },
        { city: "Denver", zone: "America/Denver" },
        { city: "Chicago", zone: "America/Chicago" },
        { city: "New York", zone: "America/New_York" },
        { city: "London", zone: "Europe/London" },
        { city: "Paris", zone: "Europe/Paris" },
        { city: "Dubai", zone: "Asia/Dubai" },
        { city: "Mumbai", zone: "Asia/Kolkata" },
        { city: "Tokyo", zone: "Asia/Tokyo" },
        { city: "Sydney", zone: "Australia/Sydney" }
    ];

    majorZones.forEach(entry => {
        const zoneTime = new Date(
            now.toLocaleString("en-US", { timeZone: entry.zone })
        );

        const zoneOffset =
            (zoneTime - now) / (1000 * 60 * 60);

        const roundedDiff = Math.round(zoneOffset);

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${entry.city} (${entry.zone})</td>
            <td>${now.toLocaleTimeString("en-GB", { timeZone: entry.zone, hour12: false })}</td>
            <td>${roundedDiff >= 0 ? "+" : ""}${roundedDiff}h</td>
        `;

        tbody.appendChild(row);
    });
}

/* INIT */
setInterval(() => {
    updateHeader();
    updateCountdowns();
    buildTable();
    renderEvents();
}, 1000);

updateHeader();
loadEvents();
populateDropdown();
buildTable();
