import { apiUrl } from "../utils/apiUrl.js";

const activatedUsers = [];

async function submitVote(votedUserId, postId) {
  const formData = new FormData();
  formData.append("votedUserId", votedUserId);
  formData.append("postId", postId);

  const response = await fetch(apiUrl + "/vote", {
    method: "POST",
    headers: {
      authorization: "Bearer " + localStorage.getItem("access_token"),
    },
    body: formData,
  });
  return await response.json();
}

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
    const selectElement = document.createElement("select");
    for (let user of activatedUsers) {
      const optionElement = document.createElement("option");
      optionElement.value = user.userId;
      optionElement.textContent = user.firstName + " " + user.lastName;
      selectElement.appendChild(optionElement);
    }
    const submitButton = document.createElement("button");
    submitButton.textContent = "Voter";
    postElement.appendChild(imageElement);
    postElement.appendChild(selectElement);
    postElement.appendChild(submitButton);
    listElement.appendChild(postElement);

    submitButton.addEventListener("click", () => {
      const votedUserId = +selectElement.value;
      const answer = submitVote(votedUserId, post.post_id);
    });
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

async function getActivatedUsers() {
  const response = await fetch(apiUrl + "/users?activated=1");
  const users = await response.json();

  for (let user of users) {
    activatedUsers.push({
      userId: user.user_id,
      firstName: user.first_name,
      lastName: user.last_name,
    });
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  await getActivatedUsers();
  getPosts();
});
