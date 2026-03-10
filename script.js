const localZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

let events = [];
let timeZones = Intl.supportedValuesOf("timeZone").sort();

let tableZones = [];
let selectedZone = null;

/* DATE FORMAT */

function formatDate(date){
    const day = String(date.getDate()).padStart(2,"0");
    const month = date.toLocaleString("en-US",{month:"long"});
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
}

/* TIME FORMAT (NO SECONDS) */

function formatTime(date){
    const hours = String(date.getHours()).padStart(2,"0");
    const minutes = String(date.getMinutes()).padStart(2,"0");
    return `${hours}:${minutes}`;
}

/* CITY + UTC HELPERS */

function getCityFromZone(zone){
    return zone.split("/").pop().replaceAll("_"," ");
}

function getUTCOffset(zone){

    const now = new Date();

    const zoneTime = new Date(
        now.toLocaleString("en-US",{timeZone:zone})
    );

    const diff = Math.round((zoneTime-now)/(1000*60*60));

    return `UTC${diff>=0?"+":""}${diff}`;
}

/* HEADER CLOCK */

function updateHeader(){

    const now = new Date();

    const date = formatDate(now);

    const h = String(now.getHours()).padStart(2,"0");
    const m = String(now.getMinutes()).padStart(2,"0");
    const s = String(now.getSeconds()).padStart(2,"0");

    document.getElementById("currentDateTime").innerText =
        `${date} ${h}:${m}:${s}`;

    document.getElementById("localZone").innerText =
        `${getCityFromZone(localZone)} (${getUTCOffset(localZone)})`;
}

/* EVENT SORTING */

function sortEvents(){

    const now = new Date();

    events.sort((a,b)=>{

        const aStart = new Date(a.start);
        const aEnd = new Date(a.end);

        const bStart = new Date(b.start);
        const bEnd = new Date(b.end);

        const aLive = now >= aStart && now <= aEnd;
        const bLive = now >= bStart && now <= bEnd;

        const aPast = now > aEnd;
        const bPast = now > bEnd;

        if(aLive && !bLive) return -1;
        if(!aLive && bLive) return 1;

        if(aPast && !bPast) return 1;
        if(!aPast && bPast) return -1;

        return aStart - bStart;
    });
}

/* LOAD EVENTS */

function loadEvents(){

    fetch("dates.json")
    .then(res=>res.json())
    .then(data=>{
        events=data;
        sortEvents();
        renderEvents();
    });

}

/* RENDER EVENTS */

function renderEvents(){

    const container=document.getElementById("eventsContainer");
    container.innerHTML="";

    events.forEach((event,index)=>{

        const start=new Date(event.start);
        const end=new Date(event.end);

        const startDate=formatDate(start);
        const endDate=formatDate(end);

        const startTime=formatTime(start);
        const endTime=formatTime(end);

        const tile=document.createElement("div");
        tile.className="event-tile";

        let timezoneHTML="";
        if(event.timeZone && event.timeZone.trim()!==""){
            timezoneHTML=`<div>${getCityFromZone(event.timeZone)} (${getUTCOffset(event.timeZone)})</div>`;
        }

        let locationHTML="";
        if(event.locationName && event.locationLink){
            locationHTML=`<div>Location: <a href="${event.locationLink}" target="_blank">${event.locationName}</a></div>`;
        }

        let dateSection="";
        let startEndSection="";

        if(startDate===endDate){

            dateSection=`<div>Date: ${startDate}</div>`;

            startEndSection=`
            <div>Start: ${startTime}</div>
            <div>End: ${endTime}</div>
            `;

        } else {

            startEndSection=`
            <div>Start: ${startDate} | ${startTime}</div>
            <div>End: ${endDate} | ${endTime}</div>
            `;

        }

        tile.innerHTML=`
        <div class="event-title">${event.name}</div>
        <div class="countdown" id="cd-${index}"></div>
        ${dateSection}
        ${startEndSection}
        ${timezoneHTML}
        ${locationHTML}
        `;

        container.appendChild(tile);

    });

}

/* COUNTDOWN */

function updateCountdowns(){

    const now=new Date();

    events.forEach((event,index)=>{

        const start=new Date(event.start);
        const end=new Date(event.end);

        const cd=document.getElementById(`cd-${index}`);
        if(!cd) return;

        if(now>=start && now<=end){
            cd.innerText="Event live";
            return;
        }

        if(now>end){
            cd.innerText="Event ended";
            return;
        }

        const diff=start-now;

        const d=Math.floor(diff/(1000*60*60*24));
        const h=Math.floor((diff/(1000*60*60))%24);
        const m=Math.floor((diff/(1000*60))%60);
        const s=Math.floor((diff/1000)%60);

        cd.innerText=`${d}d ${h}h ${m}m ${s}s`;

    });

}

/* DROPDOWN */

function populateDropdown(){

    const select=document.getElementById("tzSelect");

    timeZones.forEach(zone=>{
        const option=document.createElement("option");
        option.value=zone;
        option.textContent=zone;
        select.appendChild(option);
    });

}

function filterZones(){

    const input=document.getElementById("tzSearch").value.toLowerCase();
    const select=document.getElementById("tzSelect");

    Array.from(select.options).forEach(option=>{
        option.style.display=
        option.value.toLowerCase().includes(input)?"":"none";
    });

}

function toggleDropdown(){
    document.getElementById("dropdownContainer").classList.toggle("hidden");
}

/* SELECTED TIMEZONE */

function displaySelectedZone(){

    const zone=document.getElementById("tzSelect").value;
    selectedZone=zone;

    updateSelectedZone();

}

function updateSelectedZone(){

    if(!selectedZone) return;

    const now=new Date();

    const time=now.toLocaleTimeString("en-GB",{
        timeZone:selectedZone,
        hour12:false
    });

    const zoneTime=new Date(
        now.toLocaleString("en-US",{timeZone:selectedZone})
    );

    const diff=Math.round((zoneTime-now)/(1000*60*60));

    const conversion=`${diff>=0?"+":""}${diff}h`;

    const city=getCityFromZone(selectedZone);
    const utc=getUTCOffset(selectedZone);

    document.getElementById("selectedZoneDisplay").innerHTML=
    `${city} (${utc})<br>
    Current Time: ${time}<br>
    Conversion: ${conversion}`;

}

/* TIMEZONE TABLE */

function buildTable(){

    const tbody=document.getElementById("tzTableBody");
    tbody.innerHTML="";

    const majorZones=[
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

    tableZones=majorZones;

    majorZones.forEach((entry,index)=>{

        const row=document.createElement("tr");

        row.innerHTML=`
        <td>${entry.city} (${getUTCOffset(entry.zone)})</td>
        <td id="tz-time-${index}"></td>
        <td id="tz-diff-${index}"></td>
        `;

        tbody.appendChild(row);

    });

}

/* UPDATE TABLE TIMES */

function updateTableTimes(){

    const now=new Date();

    tableZones.forEach((entry,index)=>{

        const time=now.toLocaleTimeString("en-GB",{
            timeZone:entry.zone,
            hour12:false
        });

        const zoneTime=new Date(
            now.toLocaleString("en-US",{timeZone:entry.zone})
        );

        const diff=Math.round((zoneTime-now)/(1000*60*60));

        const cell=document.getElementById(`tz-time-${index}`);
        const diffCell=document.getElementById(`tz-diff-${index}`);

        if(cell) cell.innerText=time;
        if(diffCell) diffCell.innerText=`${diff>=0?"+":""}${diff}h`;

    });

}

/* RESORT EVENTS */

function resortEvents(){

    sortEvents();
    renderEvents();

}

/* GLOBAL CLOCK */

setInterval(()=>{

    updateHeader();
    updateCountdowns();
    updateSelectedZone();
    updateTableTimes();

},1000);

setInterval(resortEvents,60000);

/* INIT */

updateHeader();
loadEvents();
populateDropdown();
buildTable();
updateTableTimes();
