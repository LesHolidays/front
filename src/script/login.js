import { apiUrl } from "../utils/apiUrl.js";

let userAlreadyExists = true;

const form = document.getElementById("connexion-form");

async function login() {
  const response = await fetch(
    apiUrl + (userAlreadyExists ? "/login" : "/register"),
    {
      method: "POST",
      body: new FormData(form),
    },
  );
  if (response.ok) {
    const data = await response.json();
    localStorage.setItem("access_token", data.access_token);
    window.location.href = "/feed";
  } else {
    const data = await response.json();
    alert(data.error || "Une erreur est survenue");
  }
}

async function getAllNames() {
  const response = await fetch(apiUrl + "/users");
  const users = await response.json();

  const selectElement = document.getElementById("select-name");

  for (let user of users) {
    const option = document.createElement("option");
    option.value = user.user_id;
    option.innerText = user.first_name + " " + user.last_name;
    selectElement.appendChild(option);
  }

  selectElement.addEventListener("change", (e) => {
    const isSelectedUserActivated = users.find(
      (user) => user.user_id === +e.target.value,
    ).activated;
    if (isSelectedUserActivated == 1) {
      userAlreadyExists = true;
    } else {
      userAlreadyExists = false;
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  getAllNames();
});

form.addEventListener("submit", (e) => {
  e.preventDefault();
  login();
});
