import { apiUrl } from "../utils/apiUrl.js";
import { jwtDecode } from "https://esm.sh/jwt-decode";

const commentariesElement = document.getElementById("commentaries");

async function deleteCommentary(commentaryId) {
  const response = await fetch(
    apiUrl + "/commentaries?commentaryId=" + commentaryId,
    {
      method: "DELETE",
      headers: {
        authorization: "Bearer " + localStorage.getItem("access_token"),
      },
    },
  );
}

async function getCommentaries(postId) {
  const response = await fetch(apiUrl + "/commentaries?postId=" + postId, {
    method: "GET",
    headers: {
      authorization: "Bearer " + localStorage.getItem("access_token"),
    },
  });
  const commentaries = await response.json();

  if (!commentaries || commentaries.length === 0) {
    commentariesElement.textContent = "Aucun commentaire pour le moment";
  } else {
    commentariesElement.textContent = "";
  }
  for (let commentary of commentaries) {
    const commentaryElement = document.createElement("div");
    const nameElement = document.createElement("p");
    const messageElement = document.createElement("p");
    nameElement.textContent =
      commentary.first_name + " " + commentary.last_name[0] + ".";
    messageElement.textContent = commentary.commentary;

    commentaryElement.append(nameElement, messageElement);

    if (
      commentary.user_id == jwtDecode(localStorage.getItem("access_token")).sub
    ) {
      const deleteButton = document.createElement("button");
      deleteButton.textContent = "Supprimer";

      commentaryElement.appendChild(deleteButton);

      deleteButton.addEventListener("click", async () => {
        await deleteCommentary(commentary.commentary_id);
        getCommentaries(postId);
      });
    }
    commentariesElement.appendChild(commentaryElement);
  }
  const closeDialogButton = document.createElement("button");
  closeDialogButton.textContent = "X";
  commentariesElement.prepend(closeDialogButton);

  closeDialogButton.addEventListener("click", () =>
    commentariesElement.close(),
  );
}

async function getArchivesPosts() {
  const listElement = document.getElementById("posts-list");
  listElement.innerHTML = "";

  try {
    const response = await fetch(apiUrl + "/user_feed", {
      headers: {
        authorization: "Bearer " + localStorage.getItem("access_token"),
      },
    });

    if (!response.ok) {
      listElement.textContent = "Impossible de charger les archives.";
      return;
    }

    const posts = await response.json();

    if (!Array.isArray(posts) || posts.length === 0) {
      listElement.textContent = "Aucune archive à afficher.";
      return;
    }

    for (let post of posts) {
      const postElement = document.createElement("div");
      const imageElement = document.createElement("img");
      imageElement.src = post.image;
      postElement.textContent = post.description;

      const creatorElement = document.createElement("p");
      creatorElement.textContent = post.first_name + " " + post.last_name;

      const commentariesButton = document.createElement("button");
      commentariesButton.textContent = "Voir les commentaires";

      postElement.append(imageElement, creatorElement, commentariesButton);
      listElement.appendChild(postElement);

      commentariesButton.addEventListener("click", () => {
        commentariesElement.showModal();
        getCommentaries(post.post_id);
      });
    }
  } catch (error) {
    console.log(error);
    listElement.textContent = "Erreur lors du chargement des archives.";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  getArchivesPosts();
});
