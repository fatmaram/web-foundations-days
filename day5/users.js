const loadBtn = document.querySelector("#load-users");
const filterInput = document.querySelector("#filter-input");
const statusEl = document.querySelector("#status");
const usersList = document.querySelector("#users-list");

const API_URL = "https://jsonplaceholder.typicode.com/users";

// Every loaded user lives here so the filter never needs a new request
let allUsers = [];

function setStatus(message, type) {
  statusEl.textContent = message;
  statusEl.className = type;
}

function renderUsers(list) {
  usersList.textContent = "";

  if (list.length === 0) {
    const empty = document.createElement("li");
    empty.className = "empty-message";
    empty.textContent = "No users match your filter.";
    usersList.append(empty);
    return;
  }

  list.forEach(function (user) {
    const item = document.createElement("li");
    item.className = "user-card";

    const name = document.createElement("h2");
    name.textContent = user.name;

    const email = document.createElement("p");
    email.textContent = `Email: ${user.email}`;

    const city = document.createElement("p");
    city.textContent = `City: ${user.address.city}`;

    const company = document.createElement("p");
    company.textContent = `Company: ${user.company.name}`;

    item.append(name, email, city, company);
    usersList.append(item);
  });
}

function getFilteredUsers() {
  const term = filterInput.value.trim().toLowerCase();
  return allUsers.filter(function (user) {
    return user.name.toLowerCase().includes(term);
  });
}

async function loadUsers() {
  loadBtn.disabled = true;
  setStatus("Loading users...", "loading");

  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    allUsers = await response.json();
    renderUsers(getFilteredUsers());
    setStatus(`Loaded ${allUsers.length} users.`, "success");
  } catch (error) {
    setStatus(`Could not load users. ${error.message}`, "error");
  } finally {
    loadBtn.disabled = false;
  }
}

loadBtn.addEventListener("click", loadUsers);

filterInput.addEventListener("input", function () {
  if (allUsers.length === 0) {
    return;
  }
  renderUsers(getFilteredUsers());
});