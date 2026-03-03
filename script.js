const localZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
let events = [];
let timeZones = Intl.supportedValuesOf('timeZone').sort();

/* ================= HEADER ================= */

function updateHeader() {
    const now = new Date();

    document.getElementById("currentDateTime").innerText =
        now.toLocaleString();

    const localOffset = getTimezoneOffsetInMinutes(localZone);
    const hours = Math.trunc(localOffset / 60);
    const minutes = Math.abs(localOffset % 60);
    const sign = localOffset >= 0 ? "+" : "-";

    let offsetString = `${sign}${Math.abs(hours)}`;
    if (minutes !== 0) offsetString += `:${minutes.toString().padStart(2,"0")}`;

    document.getElementById("localZone").innerText =
        `Local Time Zone: ${localZone} (UTC ${offsetString})`;
}

/* ================= DST SAFE OFFSET ================= */

function getTimezoneOffsetInMinutes(timeZone) {
    const now = new Date();

    const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone,
        hour12: false,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    });

    const parts = formatter.formatToParts(now);
    const values = {};
    parts.forEach(p => {
        if (p.type !== "literal") values[p.type] = p.value;
    });

    const asUTC = Date.UTC(
        values.year,
        values.month - 1,
        values.day,
        values.hour,
        values.minute,
        values.second
    );

    return (asUTC - now.getTime()) / 60000;
}

/* ================= EVENTS ================= */

function loadEvents() {
    fetch("dates.json")
        .then(res => res.json())
        .then(data => {
            events = data;
            renderEvents();
        });
}

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

/* ================= TIME ZONE DROPDOWN ================= */

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
    const time = now.toLocaleTimeString("en-US", { timeZone: zone });

    document.getElementById("selectedZoneDisplay").innerHTML =
        `Time Zone: ${zone}<br>Current Time: ${time}`;
}

/* ================= TIME ZONE TABLE ================= */

function buildTable() {
    const tbody = document.getElementById("tzTableBody");
    tbody.innerHTML = "";

    const now = new Date();
    const localOffset = getTimezoneOffsetInMinutes(localZone);

    timeZones.forEach(zone => {
        const zoneOffset = getTimezoneOffsetInMinutes(zone);
        const diffMinutes = zoneOffset - localOffset;

        const hours = Math.trunc(diffMinutes / 60);
        const minutes = Math.abs(diffMinutes % 60);

        let diffString = "0h";
        if (diffMinutes !== 0) {
            const sign = diffMinutes > 0 ? "+" : "-";
            diffString = `${sign}${Math.abs(hours)}h`;
            if (minutes !== 0) diffString += ` ${minutes}m`;
        }

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${zone}</td>
            <td>${now.toLocaleTimeString("en-US", { timeZone: zone })}</td>
            <td>${diffString}</td>
        `;

        tbody.appendChild(row);
    });
}

/* ================= INITIALIZE ================= */

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
