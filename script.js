const localZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
let events = [];
let timeZones = Intl.supportedValuesOf('timeZone').sort();

/* DATE FORMATTER */

function formatDate(date) {
    const day = String(date.getDate()).padStart(2, "0");
    const month = date.toLocaleString("en-US", { month: "long" });
    const year = date.getFullYear();

    return `${day} ${month} ${year}`;
}

/* HEADER CLOCK */

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

/* RENDER EVENTS */

function renderEvents() {

    const container = document.getElementById("eventsContainer");
    container.innerHTML = "";

    events.forEach((event, index) => {

        const start = new Date(event.start);
        const end = new Date(event.end);

        const startDate = formatDate(start);
        const endDate = formatDate(end);

        const startTime = start.toLocaleTimeString("en-GB", { hour12:false });
        const endTime = end.toLocaleTimeString("en-GB", { hour12:false });

        const tile = document.createElement("div");
        tile.className = "event-tile";

        let timezoneHTML = "";
        if (event.timeZone && event.timeZone.trim() !== "") {
            timezoneHTML = `<div>Time Zone: ${event.timeZone}</div>`;
        }

        let locationHTML = "";
        if (event.locationName && event.locationLink) {
            locationHTML =
                `<div>Location: <a href="${event.locationLink}" target="_blank">${event.locationName}</a></div>`;
        }

        tile.innerHTML = `
            <div class="event-title">${event.name}</div>
            <div class="countdown" id="cd-${index}"></div>
            <div>Start: ${startDate} ${startTime}</div>
            <div>End: ${endDate} ${endTime}</div>
            ${timezoneHTML}
            ${locationHTML}
        `;

        container.appendChild(tile);

    });
}

/* COUNTDOWN */

function updateCountdowns() {

    const now = new Date();

    events.forEach((event, index) => {

        const start = new Date(event.start);
        const diff = start - now;

        const cd = document.getElementById(`cd-${index}`);
        if (!cd) return;

        if (diff <= 0) {
            cd.innerText = "Event started";
            return;
        }

        const d = Math.floor(diff / (1000*60*60*24));
        const h = Math.floor((diff/(1000*60*60))%24);
        const m = Math.floor((diff/(1000*60))%60);
        const s = Math.floor((diff/1000)%60);

        cd.innerText = `${d}d ${h}h ${m}m ${s}s`;
    });

}

/* DROPDOWN */

function populateDropdown() {

    const select = document.getElementById("tzSelect");

    timeZones.forEach(zone=>{
        const option = document.createElement("option");
        option.value = zone;
        option.textContent = zone;
        select.appendChild(option);
    });

}

function filterZones() {

    const input = document.getElementById("tzSearch").value.toLowerCase();
    const select = document.getElementById("tzSelect");

    Array.from(select.options).forEach(option=>{
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
        hour12:false
    });

    document.getElementById("selectedZoneDisplay").innerHTML =
        `Time Zone: ${zone}<br>Current Time: ${time}`;
}

/* TIMEZONE TABLE */

function buildTable() {

    const tbody = document.getElementById("tzTableBody");
    tbody.innerHTML = "";

    const now = new Date();

    const majorZones = [
        {city:"Los Angeles",zone:"America/Los_Angeles"},
        {city:"Denver",zone:"America/Denver"},
        {city:"Chicago",zone:"America/Chicago"},
        {city:"New York",zone:"America/New_York"},
        {city:"London",zone:"Europe/London"},
        {city:"Paris",zone:"Europe/Paris"},
        {city:"Dubai",zone:"Asia/Dubai"},
        {city:"Mumbai",zone:"Asia/Kolkata"},
        {city:"Tokyo",zone:"Asia/Tokyo"},
        {city:"Sydney",zone:"Australia/Sydney"}
    ];

    majorZones.forEach(entry=>{

        const zoneTime = new Date(
            now.toLocaleString("en-US",{timeZone:entry.zone})
        );

        const diff = Math.round((zoneTime-now)/(1000*60*60));

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${entry.city} (${entry.zone})</td>
            <td>${now.toLocaleTimeString("en-GB",{timeZone:entry.zone,hour12:false})}</td>
            <td>${diff>=0?"+":""}${diff}h</td>
        `;

        tbody.appendChild(row);

    });

}

/* INIT */

setInterval(()=>{
    updateHeader();
    updateCountdowns();
},1000);

updateHeader();
loadEvents();
populateDropdown();
buildTable();
