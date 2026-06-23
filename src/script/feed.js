import { apiUrl } from "../utils/apiUrl.js";

async function getPosts() {
  const response = await fetch(apiUrl + "/posts", {
    headers: {
      authorization: "Bearer " + localStorage.getItem("access_token"),
    },
  });
  const posts = await response.json();

  const listElement = document.getElementById("posts-list");

  for (let post of posts) {
    const postElement = document.createElement("div");
    const imageElement = document.createElement("img");
    imageElement.src = post.image;
    postElement.textContent = post.description;
    postElement.appendChild(imageElement);
    listElement.appendChild(postElement);
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
  getPosts();
});
