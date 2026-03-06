      import { weekdayMap, weekdayOrder, timeToMins, padTime } from "./helpers.js";
      
      //-- Load CSV + render Available Now + All Schedules --
     export function loadAndRenderSchedule(){
        fetch('../schedule.csv')
        .then(response => response.text())
        .then(text => {
          const now = new Date();
          const today = weekdayMap[now.getDay()];
          const currentMins = now.getHours() * 60 + now.getMinutes();

          const lines = text.trim().split(/\r?\n/);
          const rows = lines.slice(1); // skip header

          const busyRooms = new Set();
          const allRooms = new Set();
          const entries = []; // for schedule table

          for (const row of rows) {
            if (!row.trim()) continue; // skip empty rows

            const [course, section, weekday, start, end, building, room] =
              row.split(',').map(x => x.trim());

            // defensive: skip incomplete rows
            if (!building || !room) continue;

            // optionally skip non-ENG if you only want engineering building:
            // if (building !== "ENG") continue;

            const roomName = `${building}-${room}`;
            allRooms.add(roomName);

            // push entry for schedule table
            entries.push({ room: roomName, weekday, start, end, course, section });

            // is it busy right now?
            if (weekday === today) {
              const startMins = timeToMins(start);
              const endMins = timeToMins(end);
              if (currentMins >= startMins && currentMins < endMins) {
                busyRooms.add(roomName);
              }
            }
          }

          // Render Available Now
          document.getElementById('rooms').innerHTML =
            [...allRooms].sort().map(room =>
              busyRooms.has(room)
                ? `<div class="room occupied">${room} - Occupied</div>`
                : `<div class="room available">${room} - Available</div>`
            ).join('');

          // Render Schedule Table with search
          function renderScheduleTable(){
            //get search text and lowercase it all
            const q = (document.getElementById("searchInput").value || "").toLowerCase().trim();

            //keep only entries matching the search
            let filtered = entries.filter(e => {
              if (!q) return true;
              //makes one big searchable string "haystack" and checks if it contains the query
              const hay = `${e.room} ${e.weekday} ${e.start} ${e.end} ${e.course} ${e.section}`.toLowerCase();
              return hay.includes(q);
            });

            //sort by room, weekday, then start time
            filtered.sort((a, b) =>
              a.room.localeCompare(b.room) ||
              (weekdayOrder[a.weekday] ?? 99) - (weekdayOrder[b.weekday] ?? 99) ||
              timeToMins(a.start) - timeToMins(b.start)
            );

            //make table rows
            const rowsHtml = filtered.map(e => `
              <tr>
                <td><strong>${e.room}</strong></td>
                <td>${e.weekday}</td>
                <td class="time">${padTime(e.start)}</td>
                <td class="time">${padTime(e.end)}</td>
                <td>${e.course} <span class="small">(Sec ${e.section})</span></td>
              </tr>
            `).join("");

            //injuects full table into the page
            document.getElementById("scheduleTable").innerHTML = `
              <div class="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Room</th>
                      <th>Day</th>
                      <th>Start</th>
                      <th>End</th>
                      <th>Course</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${rowsHtml || `<tr><td colspan="5">No matches.</td></tr>`}
                  </tbody>
                </table>
              </div>
            `;
          }

          //render once initially
          renderScheduleTable();
          //re-render every time user types
          document.getElementById("searchInput").addEventListener("input", renderScheduleTable);

        })
        .catch(err => {
          console.error(err);
          document.getElementById('rooms').textContent =
            "Could not load schedule.csv. Make sure you're using Live Server and the CSV filename matches.";
        });
     }
      