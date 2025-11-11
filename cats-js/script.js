const STORAGE_KEY = "fieldguide-simple-leads";
const FOLLOWUP_DEFAULT_DAYS = 3;

const leadForm = document.getElementById("lead-form");
const nameInput = document.getElementById("lead-name");
const emailInput = document.getElementById("lead-email");
const phoneInput = document.getElementById("lead-phone");
const sourceInput = document.getElementById("lead-source");
const valueInput = document.getElementById("lead-value");
const notesInput = document.getElementById("lead-notes");
const followupInput = document.getElementById("lead-followup");
const leadFeedback = document.getElementById("lead-feedback");
const statusFilter = document.getElementById("status-filter");
const searchInput = document.getElementById("search");
const pipelineBody = document.getElementById("pipeline-body");
const todaySummary = document.getElementById("today-summary");
const todayList = document.getElementById("today-list");

const leadRowTemplate = document.getElementById("lead-row-template");
const followupTemplate = document.getElementById("followup-item-template");

let leads = loadLeads();

leadForm.addEventListener("submit", handleLeadSubmit);
statusFilter.addEventListener("change", render);
searchInput.addEventListener("input", render);

document.addEventListener("click", (event) => {
  const action = event.target.closest("[data-action]");
  if (!action) return;

  const { action: actionType, id } = action.dataset;
  const lead = leads.find((item) => item.id === id);
  if (!lead) return;

  switch (actionType) {
    case "mark-done":
      handleFollowupDone(lead);
      break;
    case "schedule":
      handleSchedule(lead);
      break;
    case "status-open":
      updateLead(lead.id, { status: "open" });
      break;
    case "status-won":
      updateLead(lead.id, { status: "won", nextFollowUp: null });
      break;
    case "status-lost":
      updateLead(lead.id, { status: "lost", nextFollowUp: null });
      break;
    case "status-hold":
      updateLead(lead.id, { status: "hold" });
      break;
    default:
      break;
  }
});

render();

function handleLeadSubmit(event) {
  event.preventDefault();

  const lead = {
    id: crypto.randomUUID(),
    name: nameInput.value.trim(),
    email: emailInput.value.trim() || null,
    phone: phoneInput.value.trim() || null,
    source: sourceInput.value.trim() || "—",
    value: valueInput.value ? Number(valueInput.value) : null,
    notes: notesInput.value.trim(),
    status: "open",
    nextFollowUp: followupInput.value ? new Date(followupInput.value) : suggestNextFollowup(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  leads = [lead, ...leads];
  saveLeads();
  render();
  leadForm.reset();
  nameInput.focus();
  setFeedback("Lead saved. We will remind you when it is time to follow up.");
}

function handleFollowupDone(lead) {
  const next = suggestNextFollowup();
  updateLead(lead.id, {
    nextFollowUp: next,
    notes: lead.notes,
  });
  setFeedback(`Great work! We scheduled the next touch for ${formatDate(next)}.`);
}

function handleSchedule(lead) {
  const proposed = prompt(
    "When should we check back? Enter a date (YYYY-MM-DD).",
    lead.nextFollowUp ? formatInputDate(lead.nextFollowUp) : ""
  );
  if (!proposed) return;

  const parsed = new Date(proposed);
  if (Number.isNaN(parsed.valueOf())) {
    alert("That date did not register. Please use YYYY-MM-DD.");
    return;
  }

  updateLead(lead.id, { nextFollowUp: parsed });
  setFeedback(`Follow-up set for ${formatDate(parsed)}.`);
}

function updateLead(id, fields) {
  leads = leads.map((lead) =>
    lead.id === id
      ? {
          ...lead,
          ...fields,
          updatedAt: new Date(),
        }
      : lead
  );
  saveLeads();
  render();
}

function render() {
  renderPipeline();
  renderToday();
}

function renderPipeline() {
  const filter = statusFilter.value;
  const query = searchInput.value.trim().toLowerCase();

  pipelineBody.textContent = "";

  leads
    .filter((lead) => (filter === "all" ? true : lead.status === filter))
    .filter((lead) =>
      !query
        ? true
        : [lead.name, lead.source, lead.notes || ""]
            .join(" ")
            .toLowerCase()
            .includes(query)
    )
    .forEach((lead) => {
      const row = leadRowTemplate.content.firstElementChild.cloneNode(true);
      row.querySelector(".lead-name").textContent = lead.name;
      row.querySelector(".lead-status").appendChild(createStatusBadge(lead.status));
      row.querySelector(".lead-source").textContent = lead.source || "—";
      row.querySelector(".lead-next").textContent = lead.nextFollowUp
        ? formatDate(lead.nextFollowUp)
        : "Not scheduled";
      row.querySelector(".lead-value").textContent = lead.value
        ? new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: 0,
          }).format(lead.value)
        : "—";

      const actions = row.querySelector(".lead-actions");
      actions.classList.add("action-group");
      if (lead.nextFollowUp) {
        actions.appendChild(createActionButton("Done", "mark-done", lead.id));
      }
      actions.appendChild(createActionButton("Schedule", "schedule", lead.id));

      if (lead.status !== "won") {
        actions.appendChild(createActionButton("Mark won", "status-won", lead.id));
      }
      if (lead.status !== "lost") {
        actions.appendChild(createActionButton("Mark lost", "status-lost", lead.id));
      }
      if (lead.status !== "hold") {
        actions.appendChild(createActionButton("Hold", "status-hold", lead.id));
      }
      if (lead.status !== "open") {
        actions.appendChild(createActionButton("Reopen", "status-open", lead.id));
      }

      pipelineBody.appendChild(row);
    });
}

function renderToday() {
  const today = startOfDay(new Date());
  const dueLeads = leads.filter((lead) => {
    if (!lead.nextFollowUp) return false;
    if (["won", "lost"].includes(lead.status)) return false;
    return startOfDay(lead.nextFollowUp) <= today;
  });

  todayList.textContent = "";

  if (dueLeads.length === 0) {
    todaySummary.textContent = "No follow-ups due. Use the time to prospect or tidy your notes.";
    return;
  }

  todaySummary.textContent = `You have ${dueLeads.length} follow-up${dueLeads.length > 1 ? "s" : ""} today.`;

  dueLeads.forEach((lead) => {
    const item = followupTemplate.content.firstElementChild.cloneNode(true);
    item.querySelector(".followup-name").textContent = lead.name;
    const note = lead.notes ? lead.notes : "No notes yet. Add a detail next time.";
    item.querySelector(".followup-note").textContent = note;

    const actions = item.querySelector(".followup-actions");
    actions.classList.add("action-group");
    actions.appendChild(createActionButton("Done", "mark-done", lead.id));
    actions.appendChild(createActionButton("Reschedule", "schedule", lead.id));
    actions.appendChild(createActionButton("Mark won", "status-won", lead.id));

    todayList.appendChild(item);
  });
}

function createActionButton(label, action, id) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.dataset.action = action;
  button.dataset.id = id;
  return button;
}

function createStatusBadge(status) {
  const badge = document.createElement("span");
  badge.classList.add("badge");

  switch (status) {
    case "won":
      badge.classList.add("status-won");
      badge.textContent = "Won";
      break;
    case "lost":
      badge.classList.add("status-lost");
      badge.textContent = "Lost";
      break;
    case "hold":
      badge.classList.add("status-hold");
      badge.textContent = "On hold";
      break;
    default:
      badge.textContent = "Open";
  }

  return badge;
}

function suggestNextFollowup() {
  const date = new Date();
  date.setDate(date.getDate() + FOLLOWUP_DEFAULT_DAYS);
  return date;
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatDate(date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatInputDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

function setFeedback(message) {
  leadFeedback.textContent = message;
  leadFeedback.classList.remove("muted");
  leadFeedback.style.color = "var(--brand)";
  clearTimeout(setFeedback.timeout);
  setFeedback.timeout = setTimeout(() => {
    leadFeedback.textContent = "";
    leadFeedback.style.color = "";
    leadFeedback.classList.add("muted");
  }, 4000);
}

function loadLeads() {
  try {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      return JSON.parse(cached).map((lead) => ({
        ...lead,
        nextFollowUp: lead.nextFollowUp ? new Date(lead.nextFollowUp) : null,
        createdAt: new Date(lead.createdAt),
        updatedAt: new Date(lead.updatedAt),
      }));
    }
  } catch (error) {
    console.warn("Could not load saved leads", error);
  }

  const today = new Date();
  const twoDaysOut = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2);
  const fiveDaysOut = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 5);

  return [
    {
      id: crypto.randomUUID(),
      name: "Dorothy Harris",
      email: "dorothy.harris@example.com",
      phone: "(555) 019-3344",
      source: "Country Club Mixer",
      value: 850000,
      notes: "Met at the Chamber lunch. Wants discreet marketing for two retail suites.",
      status: "open",
      nextFollowUp: twoDaysOut,
      createdAt: today,
      updatedAt: today,
    },
    {
      id: crypto.randomUUID(),
      name: "Martin & Elaine Properties",
      email: "partners@me-properties.com",
      phone: "(555) 010-8822",
      source: "Referral — Coach Thompson",
      value: 1200000,
      notes: "Exploring 1031 exchange options for aging office park.",
      status: "open",
      nextFollowUp: fiveDaysOut,
      createdAt: today,
      updatedAt: today,
    },
    {
      id: crypto.randomUUID(),
      name: "Red Oak Builders",
      email: "sales@redoakbuilders.com",
      phone: "(555) 016-2219",
      source: "Past client",
      value: 460000,
      notes: "Considering refresh of marketing materials before spring tour.",
      status: "hold",
      nextFollowUp: null,
      createdAt: today,
      updatedAt: today,
    },
  ];
}

function saveLeads() {
  const serialised = leads.map((lead) => ({
    ...lead,
    nextFollowUp: lead.nextFollowUp ? lead.nextFollowUp.toISOString() : null,
  }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(serialised));
}
