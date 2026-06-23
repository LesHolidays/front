import { apiUrl } from "../utils/apiUrl.js";

let userAlreadyExists = true;

const form = document.getElementById("post-form");

async function post() {
  const response = await fetch(apiUrl + "/posts", {
    method: "POST",
    body: new FormData(form),
    headers: {
      authorization: "Bearer " + localStorage.getItem("access_token"),
    },
  });
  if (response.ok) {
    window.location.href = "/feed";
  }
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  post();
});
