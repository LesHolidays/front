import { apiUrl } from "../utils/apiUrl.js";

async function getMyPosts() {
  const listElement = document.getElementById("posts-list");
  listElement.innerHTML = "";

  try {
    const response = await fetch(apiUrl + "/user_feed", {
      headers: {
        authorization: "Bearer " + localStorage.getItem("access_token"),
      },
    });

    if (!response.ok) {
      listElement.textContent = "Impossible de charger votre feed.";
      return;
    }

    const posts = await response.json();

    if (!Array.isArray(posts) || posts.length === 0) {
      listElement.textContent = "Aucun post à afficher.";
      return;
    }

    for (let post of posts) {
      const postElement = document.createElement("div");
      const imageElement = document.createElement("img");
      imageElement.src = post.image;
      postElement.textContent = post.description;
      postElement.appendChild(imageElement);
      listElement.appendChild(postElement);
    }
  } catch (error) {
    listElement.textContent = "Erreur lors du chargement du feed.";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  getMyPosts();
});