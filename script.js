/* ============================= */
/* CONFIG                        */
/* ============================= */

const TABLE_TIMEZONES = [
    "UTC",
    "America/New_York",
    "America/Chicago",
    "America/Los_Angeles",
    "Europe/London",
    "Europe/Paris",
    "Asia/Tokyo",
    "Asia/Kolkata",
    "Australia/Sydney"
];

let selectedTimeZone = "";
let allTimeZones = [];

/* ============================= */
/* TIME ZONE DROPDOWN           */
/* ============================= */

function populateTimeZoneDropdown() {
    const select = document.getElementById("timezoneSelect");
    const search = document.getElementById("timezoneSearch");
  
    allTimeZones = Intl.supportedValuesOf("timeZone");
  
    renderTimeZoneOptions("");
  
    search.addEventListener("input", () => {
        renderTimeZoneOptions(search.value.toLowerCase());
    });
  
    select.value = Intl.DateTimeFormat().resolvedOptions().timeZone;
}

function renderTimeZoneOptions(filterText) {
    const select = document.getElementById("timezoneSelect");
    select.innerHTML = "";
  
    const now = new Date();
    const groups = {};
  
    allTimeZones.forEach(zone => {
        if (filterText && !zone.toLowerCase().includes(filterText)) return;
    
        const region = zone.split("/")[0];
        if (!groups[region]) groups[region] = [];
        groups[region].push(zone);
    });
  
    Object.keys(groups).sort().forEach(region => {
        const optgroup = document.createElement("optgroup");
        optgroup.label = region;
    
        groups[region].sort().forEach(zone => {
            const option = document.createElement("option");
            option.value = zone;
      
            const city = zone.split("/")[1]?.replace(/_/g, " ") || zone;
            const offset = getUTCOffset(zone, now);
      
            option.textContent = `${city} (${offset})`;
            optgroup.appendChild(option);
        });
    
        select.appendChild(optgroup);
    });
}

function getUTCOffset(timeZone, date) {
    const parts = new Intl.DateTimeFormat("en-US", {
        timeZone,
        timeZoneName: "shortOffset"
    }).formatToParts(date);
  
    const offsetPart = parts.find(p => p.type === "timeZoneName");
    return offsetPart ? offsetPart.value.replace("GMT", "UTC") : "";
}

/* ============================= */
/* CLOCKS                        */
/* ============================= */

function startClocks() {
    const localElement = document.getElementById("localTime");
    const localZoneElement = document.getElementById("localZone");
    const secondaryElement = document.getElementById("secondaryTime");
    const select = document.getElementById("timezoneSelect");
  
    const localZone =
        Intl.DateTimeFormat().resolvedOptions().timeZone;
  
    localZoneElement.textContent = localZone;
    selectedTimeZone = select.value;
  
    select.addEventListener("change", () => {
        selectedTimeZone = select.value;
    });
  
    setInterval(() => {
        const now = new Date();
  
        localElement.textContent = now.toLocaleString("en-US", {
            timeZone: localZone,
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
            second: "2-digit"
        });
  
        secondaryElement.textContent = now.toLocaleString("en-US", {
            timeZone: selectedTimeZone,
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
            second: "2-digit"
        });
  
    }, 1000);
}

/* ============================= */
/* TIME ZONE TABLE               */
/* ============================= */

function buildTimeZoneTable() {
    const tableBody = document.getElementById("timezoneTable");
    tableBody.innerHTML = "";
  
    const localZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
    TABLE_TIMEZONES.forEach(zone => {
        const row = document.createElement("tr");
    
        row.innerHTML = `
            <td>${zone}</td>
            <td id="tz_time_${zone.replace(/\//g, "_")}"></td>
            <td id="tz_diff_${zone.replace(/\//g, "_")}"></td>
        `;
    
        tableBody.appendChild(row);
    });
  
    setInterval(() => {
        const now = new Date();
    
        const localOffset =
            -new Date(
              now.toLocaleString("en-US", { timeZone: localZone })
            ).getTimezoneOffset();
    
        TABLE_TIMEZONES.forEach(zone => {
            const timeCell = document.getElementById(
                `tz_time_${zone.replace(/\//g, "_")}`
            );
    
            const diffCell = document.getElementById(
                `tz_diff_${zone.replace(/\//g, "_")}`
            );
    
            const formatted = new Intl.DateTimeFormat("en-US", {
                timeZone: zone,
                hour: "numeric",
                minute: "2-digit",
                second: "2-digit",
                hour12: false
            }).format(now);
      
            timeCell.textContent = formatted;
      
            const zoneOffset =
                -new Date(
                  now.toLocaleString("en-US", { timeZone: zone })
                ).getTimezoneOffset();
      
            const diffHours = (zoneOffset - localOffset) / 60;
            const sign = diffHours > 0 ? "+" : "";
      
            diffCell.textContent = `${sign}${diffHours}h`;
        });
  
    }, 1000);
}

/* ============================= */
/* COUNTDOWNS                    */
/* ============================= */

async function loadEvents() {
    try {
        const response = await fetch("dates.json");
        let events = await response.json();
    
        const now = new Date();
    
        events.forEach(event => {
            event._targetDate = event.timezone
                  ? new Date(
                    new Date(event.date).toLocaleString("en-US", {
                      timeZone: event.timezone
                    })
                  )
                : new Date(event.date);
        });
  
        events.sort((a, b) => a._targetDate - b._targetDate);
  
        startCountdowns(events);
  
    } catch (error) {
        document.getElementById("countdowns").innerHTML = "Error loading dates.json";
    }
}

function startCountdowns(events) {
    const container = document.getElementById("countdowns");
    container.innerHTML = "";
  
    events.forEach(event => {
        const id = event.name.replace(/\s+/g, "") + "_" + Date.now();
    
        const div = document.createElement("div");
        div.innerHTML = `
          <h3>${event.name} ${event.timezone ? "(" + event.timezone + ")" : ""}</h3>
          <p id="${id}"></p>
          <hr>
        `;

        container.appendChild(div);
        event._elementId = id;
    });
    setInterval(() => {
        const now = new Date();

        events.forEach(event => {
            const diff = event._targetDate - now;
            const output = document.getElementById(event._elementId);
      
            if (diff <= 0) {
              output.textContent = "Event has passed.";
              return;
            }
  
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
            const minutes = Math.floor((diff / (1000 * 60)) % 60);
            const seconds = Math.floor((diff / 1000) % 60);
  
            output.textContent = `${days}d ${hours}h ${minutes}m ${seconds}s`;
        });

    }, 1000);
}

/* ============================= */
/* START EVERYTHING              */
/* ============================= */

populateTimeZoneDropdown();
startClocks();
buildTimeZoneTable();
loadEvents();
