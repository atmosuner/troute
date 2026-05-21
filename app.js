const STORAGE_KEY = "troute-itinerary-v1";

const sampleTrip = {
  name: "Istanbul Long Weekend",
  traveler: "Atmos",
  days: [
    {
      date: "2026-06-12",
      title: "Arrival and old city",
      stops: [
        {
          id: crypto.randomUUID(),
          time: "09:30",
          title: "Check in",
          location: "Sirkeci Mansion, Istanbul",
          notes: "Leave bags, refresh, confirm Bosphorus timing.",
          reservation: "Hotel booking",
          confirmation: "SM-2048"
        },
        {
          id: crypto.randomUUID(),
          time: "11:00",
          title: "Hagia Sophia and Sultanahmet",
          location: "Hagia Sophia, Istanbul",
          notes: "Walk the square and keep the afternoon flexible.",
          reservation: "",
          confirmation: ""
        },
        {
          id: crypto.randomUUID(),
          time: "19:30",
          title: "Dinner",
          location: "Aheste, Istanbul",
          notes: "Ask for the tasting menu.",
          reservation: "Table for 2",
          confirmation: "AH-772"
        }
      ]
    },
    {
      date: "2026-06-13",
      title: "Bosphorus and Galata",
      stops: [
        {
          id: crypto.randomUUID(),
          time: "10:00",
          title: "Ferry to Kadikoy",
          location: "Eminonu Ferry Terminal, Istanbul",
          notes: "Use Istanbulkart and sit outside if weather is clear.",
          reservation: "",
          confirmation: ""
        },
        {
          id: crypto.randomUUID(),
          time: "15:00",
          title: "Galata Tower",
          location: "Galata Tower, Istanbul",
          notes: "Sunset photos from nearby streets.",
          reservation: "Timed entry",
          confirmation: "GT-913"
        }
      ]
    }
  ]
};

let trip = loadTrip();
let selectedDate = trip.days[0]?.date || toISODate(new Date());
let editingStopId = null;

const elements = {
  tripName: document.querySelector("#tripName"),
  travelerName: document.querySelector("#travelerName"),
  dateStrip: document.querySelector("#dateStrip"),
  selectedDateLabel: document.querySelector("#selectedDateLabel"),
  dayTitle: document.querySelector("#dayTitle"),
  timeline: document.querySelector("#timeline"),
  reservations: document.querySelector("#reservations"),
  mapFrame: document.querySelector("#mapFrame"),
  mapTitle: document.querySelector("#mapTitle"),
  mapsLink: document.querySelector("#mapsLink"),
  addStopButton: document.querySelector("#addStopButton"),
  sampleButton: document.querySelector("#sampleButton"),
  exportButton: document.querySelector("#exportButton"),
  fileInput: document.querySelector("#fileInput"),
  aiForm: document.querySelector("#aiForm"),
  aiText: document.querySelector("#aiText"),
  themeToggle: document.querySelector("#themeToggle"),
  stopDialog: document.querySelector("#stopDialog"),
  stopForm: document.querySelector("#stopForm"),
  dialogTitle: document.querySelector("#dialogTitle"),
  stopDate: document.querySelector("#stopDate"),
  stopTime: document.querySelector("#stopTime"),
  stopTitle: document.querySelector("#stopTitle"),
  stopLocation: document.querySelector("#stopLocation"),
  stopNotes: document.querySelector("#stopNotes"),
  stopReservation: document.querySelector("#stopReservation"),
  stopConfirmation: document.querySelector("#stopConfirmation")
};

render();
bindEvents();

function bindEvents() {
  elements.tripName.addEventListener("input", () => {
    trip.name = elements.tripName.value;
    saveTrip();
  });

  elements.travelerName.addEventListener("input", () => {
    trip.traveler = elements.travelerName.value;
    saveTrip();
  });

  elements.addStopButton.addEventListener("click", () => openStopDialog());
  elements.sampleButton.addEventListener("click", () => {
    trip = structuredClone(sampleTrip);
    selectedDate = trip.days[0].date;
    saveTrip();
    render();
  });

  elements.exportButton.addEventListener("click", exportTrip);
  elements.fileInput.addEventListener("change", importJsonFile);
  elements.aiForm.addEventListener("submit", importFromNotes);
  elements.themeToggle.addEventListener("click", toggleTheme);

  elements.stopForm.addEventListener("submit", (event) => {
    if (event.submitter?.value === "cancel") return;
    event.preventDefault();
    saveStopFromDialog();
  });
}

function loadTrip() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? normalizeTrip(JSON.parse(stored)) : structuredClone(sampleTrip);
  } catch {
    return structuredClone(sampleTrip);
  }
}

function saveTrip() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trip));
}

function normalizeTrip(nextTrip) {
  return {
    name: nextTrip.name || "Untitled trip",
    traveler: nextTrip.traveler || "",
    days: (nextTrip.days || [])
      .map((day) => ({
        date: day.date,
        title: day.title || formatDate(day.date, "long"),
        stops: (day.stops || []).map((stop) => ({
          id: stop.id || crypto.randomUUID(),
          time: stop.time || "09:00",
          title: stop.title || "Untitled stop",
          location: stop.location || "Location not set",
          notes: stop.notes || "",
          reservation: stop.reservation || "",
          confirmation: stop.confirmation || ""
        }))
      }))
      .filter((day) => day.date)
      .sort((a, b) => a.date.localeCompare(b.date))
  };
}

function render() {
  if (!trip.days.length) {
    trip.days.push({ date: toISODate(new Date()), title: "New day", stops: [] });
    selectedDate = trip.days[0].date;
  }

  elements.tripName.value = trip.name;
  elements.travelerName.value = trip.traveler;
  renderDateStrip();
  renderDay();
  saveTrip();
}

function renderDateStrip() {
  elements.dateStrip.replaceChildren(
    ...trip.days.map((day) => {
      const button = document.createElement("button");
      button.className = `date-pill${day.date === selectedDate ? " active" : ""}`;
      button.type = "button";
      button.innerHTML = `<span>${formatDate(day.date, "weekday")}</span><strong>${formatDate(day.date, "short")}</strong>`;
      button.addEventListener("click", () => {
        selectedDate = day.date;
        render();
      });
      return button;
    })
  );
}

function renderDay() {
  const day = getSelectedDay();
  const stops = [...day.stops].sort((a, b) => a.time.localeCompare(b.time));

  elements.selectedDateLabel.textContent = formatDate(day.date, "full");
  elements.dayTitle.textContent = day.title || "Daily schedule";

  if (!stops.length) {
    elements.timeline.innerHTML = '<div class="empty-state">No stops yet. Add the first stop for this date.</div>';
  } else {
    elements.timeline.replaceChildren(...stops.map(renderStop));
  }

  renderMap(stops);
  renderReservations(stops);
}

function renderStop(stop) {
  const article = document.createElement("article");
  article.className = "stop-card";
  article.innerHTML = `
    <div class="stop-time">${escapeHtml(stop.time)}</div>
    <div>
      <h3>${escapeHtml(stop.title)}</h3>
      <p><strong>${escapeHtml(stop.location)}</strong></p>
      ${stop.notes ? `<p>${escapeHtml(stop.notes)}</p>` : ""}
      <div class="stop-meta">
        ${stop.reservation ? `<span class="tag">${escapeHtml(stop.reservation)}</span>` : ""}
        ${stop.confirmation ? `<span class="tag">Ref ${escapeHtml(stop.confirmation)}</span>` : ""}
      </div>
      <div class="stop-actions">
        <button type="button" data-action="edit">Edit</button>
        <button type="button" data-action="delete">Delete</button>
      </div>
    </div>
  `;
  article.querySelector('[data-action="edit"]').addEventListener("click", () => openStopDialog(stop));
  article.querySelector('[data-action="delete"]').addEventListener("click", () => deleteStop(stop.id));
  return article;
}

function renderMap(stops) {
  const query = stops[0]?.location || trip.name || "Istanbul";
  const encoded = encodeURIComponent(query);
  elements.mapTitle.textContent = stops.length ? stops[0].location : "Daily route";
  elements.mapsLink.href = `https://www.google.com/maps/search/?api=1&query=${encoded}`;
  elements.mapFrame.src = `https://www.openstreetmap.org/export/embed.html?layer=mapnik&query=${encoded}`;
}

function renderReservations(stops) {
  const reservedStops = stops.filter((stop) => stop.reservation || stop.confirmation);
  if (!reservedStops.length) {
    elements.reservations.innerHTML = '<div class="empty-state">No reservations for this day.</div>';
    return;
  }

  elements.reservations.replaceChildren(
    ...reservedStops.map((stop) => {
      const item = document.createElement("div");
      item.className = "reservation-item";
      item.innerHTML = `
        <strong>${escapeHtml(stop.time)} · ${escapeHtml(stop.title)}</strong>
        <span>${escapeHtml(stop.reservation || "Reservation")} ${stop.confirmation ? `· ${escapeHtml(stop.confirmation)}` : ""}</span>
      `;
      return item;
    })
  );
}

function openStopDialog(stop) {
  editingStopId = stop?.id || null;
  elements.dialogTitle.textContent = stop ? "Edit stop" : "Add stop";
  elements.stopDate.value = selectedDate;
  elements.stopTime.value = stop?.time || "09:00";
  elements.stopTitle.value = stop?.title || "";
  elements.stopLocation.value = stop?.location || "";
  elements.stopNotes.value = stop?.notes || "";
  elements.stopReservation.value = stop?.reservation || "";
  elements.stopConfirmation.value = stop?.confirmation || "";
  elements.stopDialog.showModal();
}

function saveStopFromDialog() {
  const stop = {
    id: editingStopId || crypto.randomUUID(),
    time: elements.stopTime.value,
    title: elements.stopTitle.value.trim(),
    location: elements.stopLocation.value.trim(),
    notes: elements.stopNotes.value.trim(),
    reservation: elements.stopReservation.value.trim(),
    confirmation: elements.stopConfirmation.value.trim()
  };

  const date = elements.stopDate.value;
  let day = trip.days.find((item) => item.date === date);
  if (!day) {
    day = { date, title: formatDate(date, "long"), stops: [] };
    trip.days.push(day);
    trip.days.sort((a, b) => a.date.localeCompare(b.date));
  }

  trip.days.forEach((item) => {
    item.stops = item.stops.filter((existingStop) => existingStop.id !== stop.id);
  });
  day.stops.push(stop);
  day.stops.sort((a, b) => a.time.localeCompare(b.time));
  selectedDate = date;
  elements.stopDialog.close();
  render();
}

function deleteStop(stopId) {
  const day = getSelectedDay();
  day.stops = day.stops.filter((stop) => stop.id !== stopId);
  render();
}

function getSelectedDay() {
  return trip.days.find((day) => day.date === selectedDate) || trip.days[0];
}

function exportTrip() {
  const blob = new Blob([JSON.stringify(trip, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${slugify(trip.name)}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
}

async function importJsonFile(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const text = await file.text();
  trip = normalizeTrip(JSON.parse(text));
  selectedDate = trip.days[0]?.date || toISODate(new Date());
  render();
  event.target.value = "";
}

function importFromNotes(event) {
  event.preventDefault();
  const text = elements.aiText.value.trim();
  if (!text) return;

  const generated = createTripFromText(text);
  if (!generated.days.length) return;

  trip = generated;
  selectedDate = trip.days[0].date;
  elements.aiText.value = "";
  render();
}

function createTripFromText(text) {
  const lines = text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  const days = new Map();
  let fallbackDate = toISODate(new Date());

  lines.forEach((line, index) => {
    const date = line.match(/\b(20\d{2}-\d{2}-\d{2})\b/)?.[1] || fallbackDate;
    fallbackDate = date;
    const time = line.match(/\b([01]\d|2[0-3]):([0-5]\d)\b/)?.[0] || `${String(9 + index).padStart(2, "0")}:00`;
    const clean = line.replace(date, "").replace(time, "").trim().replace(/^[-:,.]+/, "").trim();
    const [titlePart, ...noteParts] = clean.split(/\s+-\s+|\.\s+/);
    const locationMatch = clean.match(/\bat\s+([^,.]+)/i);
    const reservationMatch = clean.match(/reservation:\s*([^,.]+)/i);
    const confirmationMatch = clean.match(/confirmation:\s*([A-Z0-9-]+)/i);

    if (!days.has(date)) {
      days.set(date, { date, title: formatDate(date, "long"), stops: [] });
    }

    days.get(date).stops.push({
      id: crypto.randomUUID(),
      time,
      title: titlePart || "Planned stop",
      location: locationMatch?.[1]?.trim() || titlePart || "Location not set",
      notes: noteParts.join(". "),
      reservation: reservationMatch?.[1]?.trim() || "",
      confirmation: confirmationMatch?.[1]?.trim() || ""
    });
  });

  return normalizeTrip({
    name: "Imported trip",
    traveler: trip.traveler,
    days: [...days.values()]
  });
}

function toggleTheme() {
  const nextTheme = document.documentElement.dataset.theme === "dark" ? "" : "dark";
  document.documentElement.dataset.theme = nextTheme;
  localStorage.setItem("troute-theme", nextTheme);
}

function restoreTheme() {
  const theme = localStorage.getItem("troute-theme");
  if (theme) document.documentElement.dataset.theme = theme;
}

function formatDate(date, style) {
  const parsed = new Date(`${date}T12:00:00`);
  const options = {
    weekday: { weekday: "short" },
    short: { month: "short", day: "numeric" },
    long: { month: "long", day: "numeric" },
    full: { weekday: "long", month: "long", day: "numeric", year: "numeric" }
  };
  return new Intl.DateTimeFormat("en", options[style]).format(parsed);
}

function toISODate(date) {
  return date.toISOString().slice(0, 10);
}

function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "trip";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

restoreTheme();
