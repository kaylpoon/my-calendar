let events=[]
let selectedZone=null
let localZone=Intl.DateTimeFormat().resolvedOptions().timeZone
let tableZones=[]

/* ---------------- DATE FORMATTING ---------------- */

function formatDate(date){

    const day=String(date.getDate()).padStart(2,"0")

    const months=[
        "January","February","March","April","May","June",
        "July","August","September","October","November","December"
    ]

    const month=months[date.getMonth()]
    const year=date.getFullYear()

    return `${day} ${month} ${year}`
}

/* ---------------- CITY NAME ---------------- */

function getCityFromZone(zone){
    return zone.split("/").pop().replaceAll("_"," ")
}

/* ---------------- UTC OFFSET ---------------- */

function getUTCOffset(zone){

    const now=new Date()

    const parts=new Intl.DateTimeFormat("en-US",{
        timeZone:zone,
        timeZoneName:"shortOffset"
    }).formatToParts(now)

    const tzPart=parts.find(p=>p.type==="timeZoneName").value

    return tzPart.replace("GMT","UTC")
}

/* ---------------- TIMEZONE NAME ---------------- */

function getTimeZoneName(zone){

    const now=new Date()

    const fullParts=new Intl.DateTimeFormat("en-US",{
        timeZone:zone,
        timeZoneName:"long"
    }).formatToParts(now)

    const full=fullParts.find(p=>p.type==="timeZoneName").value

    const shortParts=new Intl.DateTimeFormat("en-US",{
        timeZone:zone,
        timeZoneName:"short"
    }).formatToParts(now)

    const abbr=shortParts.find(p=>p.type==="timeZoneName").value

    return `${full} (${abbr})`
}

/* ---------------- HEADER CLOCK ---------------- */

function updateHeader(){

    const now=new Date()

    const date=formatDate(now)

    const hours=String(now.getHours()).padStart(2,"0")
    const minutes=String(now.getMinutes()).padStart(2,"0")
    const seconds=String(now.getSeconds()).padStart(2,"0")

    document.getElementById("currentDateTime").innerText=
        `${date} ${hours}:${minutes}:${seconds}`

    document.getElementById("localZone").innerText=
        `Local Time Zone: ${getCityFromZone(localZone)} (${getUTCOffset(localZone)})`
}

/* ---------------- EVENT SORTING ---------------- */

function sortEvents(){

    const now=new Date()

    events.sort((a,b)=>{

        const startA=new Date(a.start)
        const startB=new Date(b.start)

        const endA=new Date(a.end)
        const endB=new Date(b.end)

        const pastA=endA<now
        const pastB=endB<now

        if(pastA&&!pastB) return 1
        if(!pastA&&pastB) return -1

        return startA-startB
    })
}

/* ---------------- COUNTDOWN ---------------- */

function getCountdown(start){

    const now=new Date()
    const startDate=new Date(start)

    const diff=startDate-now

    if(diff<=0) return "Started"

    const totalSeconds=Math.floor(diff/1000)

    const days=Math.floor(totalSeconds/86400)
    const minutes=Math.floor((totalSeconds%3600)/60)
    const seconds=totalSeconds%60

    return `${days}d ${minutes}m ${seconds}s`
}

/* ---------------- EVENT TILES ---------------- */

function renderEvents(){

    const container=document.getElementById("eventsContainer")
    container.innerHTML=""

    const now=new Date()

    events.forEach(event=>{

        const start=new Date(event.start)
        const end=new Date(event.end)

        const tile=document.createElement("div")
        tile.className="eventTile"

        const countdown=end<now?"Ended":getCountdown(event.start)

        let dateHTML=""

        const sameDate=start.toDateString()===end.toDateString()

        if(sameDate){

            dateHTML=`<div>Date: ${formatDate(start)}</div>
            <div>Start: ${start.toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"})}</div>
            <div>End: ${end.toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"})}</div>`

        }else{

            dateHTML=`
            <div>Start: ${formatDate(start)} | ${start.toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"})}</div>
            <div>End: ${formatDate(end)} | ${end.toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"})}</div>
            `
        }

        let timezoneHTML=""
        if(event.timeZone){
            timezoneHTML=`<div>Time Zone: ${getCityFromZone(event.timeZone)} (${getUTCOffset(event.timeZone)})</div>`
        }

        let locationHTML=""
        if(event.locationName && event.mapLink){
            locationHTML=`<div>Location: <a href="${event.mapLink}" target="_blank">${event.locationName}</a></div>`
        }

        tile.innerHTML=`
        <h3>${event.name}</h3>
        <div>${countdown}</div>
        ${dateHTML}
        ${timezoneHTML}
        ${locationHTML}
        `

        container.appendChild(tile)
    })
}

/* ---------------- LOAD EVENTS ---------------- */

async function loadEvents(){

    const response=await fetch("dates.json")
    events=await response.json()

    sortEvents()
    renderEvents()
}

/* ---------------- SEARCH ZONE ---------------- */

function updateSelectedZone(){

    if(!selectedZone) return

    const now=new Date()

    const time=now.toLocaleTimeString("en-GB",{
        timeZone:selectedZone,
        hour12:false
    })

    const zoneTime=new Date(
        now.toLocaleString("en-US",{timeZone:selectedZone})
    )

    const diffMs=zoneTime-now
    const diffMinutes=Math.round(diffMs/(1000*60))

    const hours=Math.trunc(diffMinutes/60)
    const minutes=Math.abs(diffMinutes%60)

    let conversion=`${hours>=0?"+":""}${hours}h`
    if(minutes!==0) conversion+=` ${minutes}m`

    const city=getCityFromZone(selectedZone)
    const utc=getUTCOffset(selectedZone)

    document.getElementById("selectedZoneDisplay").innerHTML=
    `Time Zone: ${city} (${utc})<br>
    Current Time: ${time}<br>
    Conversion: ${conversion}`
}

/* ---------------- TABLE BUILD ---------------- */

function buildTable(){

    const tbody=document.getElementById("tzTableBody")
    tbody.innerHTML=""

    const majorZones=[

        {city:"Los Angeles",zone:"America/Los_Angeles"},
        {city:"Denver",zone:"America/Denver"},
        {city:"Chicago / Dallas",zone:"America/Chicago"},
        {city:"New York",zone:"America/New_York"},
        {city:"São Paulo / Buenos Aires",zone:"America/Sao_Paulo"},
        {city:"London",zone:"Europe/London"},
        {city:"Paris / Berlin",zone:"Europe/Paris"},
        {city:"Riyadh / Moscow",zone:"Asia/Riyadh"},
        {city:"Delhi",zone:"Asia/Kolkata"},
        {city:"Beijing / Singapore",zone:"Asia/Shanghai"},
        {city:"Tokyo",zone:"Asia/Tokyo"},
        {city:"Sydney",zone:"Australia/Sydney"}

    ]

    tableZones=majorZones

    majorZones.forEach((entry,index)=>{

        const row=document.createElement("tr")

        row.innerHTML=`
        <td>${entry.city} (${getUTCOffset(entry.zone)})</td>
        <td>${getTimeZoneName(entry.zone)}</td>
        <td id="tz-time-${index}"></td>
        <td id="tz-diff-${index}"></td>
        `

        tbody.appendChild(row)
    })
}

/* ---------------- TABLE LIVE UPDATE ---------------- */

function updateTableTimes(){

    const now=new Date()

    tableZones.forEach((entry,index)=>{

        const zoneTime=new Date(
            now.toLocaleString("en-US",{timeZone:entry.zone})
        )

        const diffMs=zoneTime-now
        const diffMinutes=Math.round(diffMs/(1000*60))

        const hours=Math.trunc(diffMinutes/60)
        const minutes=Math.abs(diffMinutes%60)

        let conversion=`${hours>=0?"+":""}${hours}h`
        if(minutes!==0) conversion+=` ${minutes}m`

        const time=now.toLocaleTimeString("en-GB",{
            timeZone:entry.zone,
            hour12:false
        })

        const cell=document.getElementById(`tz-time-${index}`)
        const diffCell=document.getElementById(`tz-diff-${index}`)

        if(cell) cell.innerText=time
        if(diffCell) diffCell.innerText=conversion

    })
}

/* ---------------- TIMEZONE DROPDOWN ---------------- */

function populateTimeZones(){

    const select=document.getElementById("timezoneSelect")

    const zones=Intl.supportedValuesOf("timeZone").sort()

    zones.forEach(zone=>{

        const option=document.createElement("option")
        option.value=zone
        option.textContent=zone

        select.appendChild(option)
    })

    select.addEventListener("change",()=>{
        selectedZone=select.value
        updateSelectedZone()
    })
}

/* ---------------- INITIALIZE ---------------- */

function init(){

    updateHeader()
    loadEvents()

    buildTable()
    populateTimeZones()

    setInterval(()=>{
        updateHeader()
        updateTableTimes()
        updateSelectedZone()
        renderEvents()
    },1000)

    setInterval(()=>{
        sortEvents()
    },60000)
}

document.addEventListener("DOMContentLoaded",init)
