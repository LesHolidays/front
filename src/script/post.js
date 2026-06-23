import { apiUrl } from "../utils/apiUrl.js";

let userAlreadyExists = true;

const form = document.getElementById("post-form");

async function post() {
  await fetch(apiUrl + "/posts", {
    method: "POST",
    body: new FormData(form),
    headers: {
      authorization: "Bearer " + localStorage.getItem("access_token"),
    },
  });
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  post();
});
