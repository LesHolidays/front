import { apiUrl } from "../utils/apiUrl.js";
import { jwtDecode } from "https://esm.sh/jwt-decode";

const commentariesElement = document.getElementById("commentaries");

async function deletePost(post_id) {
  await fetch(apiUrl + "/posts?postId=" + post_id, {
    method: "DELETE",
    headers: {
      authorization: "Bearer " + localStorage.getItem("access_token"),
    },
  });
}

async function deleteCommentary(commentaryId) {
  await fetch(
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
  closeDialogButton.classList.add("btn-close-dialog");
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
      listElement.textContent = "Impossible de charger les posts.";
      return;
    }

    const posts = await response.json();

    if (!posts || posts.length === 0) {
      listElement.textContent = "Vous n'avez pas encore posté.";
      return;
    }

    for (let post of posts) {
      const postElement = document.createElement("div");
      postElement.classList.add("post-card");

      const imageElement = document.createElement("img");
      imageElement.src = post.image;
      
      const descriptionElement = document.createElement("p");
      descriptionElement.classList.add("post-description");
      descriptionElement.textContent = post.description;

      const deleteButton = document.createElement("button");
      deleteButton.textContent = "Supprimer le post";
      deleteButton.classList.add("btn-delete");

      deleteButton.addEventListener("click", async () => {
        if (confirm("Voulez-vous vraiment supprimer ce post ?")) {
          await deletePost(post.post_id);
          getArchivesPosts();
        }
      });

      postElement.append(imageElement, descriptionElement);

      const creationDate = new Date(post.creation_date.replace(" ", "T"));
      const now = new Date();
      const diffInMs = Math.abs(now - creationDate);
      const twentyFourHoursInMs = 24 * 60 * 60 * 1000;

      if (diffInMs <= twentyFourHoursInMs) {
        const commentaryForm = document.createElement("form");

        const commentaryInput = document.createElement("input");
        commentaryInput.type = "text";
        commentaryInput.name = "message";
        commentaryInput.placeholder = "Ajouter un commentaire";

        const addCommentaryButton = document.createElement("input");
        addCommentaryButton.value = "Envoyer";
        addCommentaryButton.type = "submit";

        commentaryForm.append(commentaryInput, addCommentaryButton);
        postElement.appendChild(commentaryForm);
      }

      const commentariesButton = document.createElement("button");
      commentariesButton.textContent = "Voir les commentaires";
      postElement.appendChild(commentariesButton);

      postElement.appendChild(deleteButton);

      listElement.appendChild(postElement);

      commentariesButton.addEventListener("click", () => {
        commentariesElement.showModal();
        getCommentaries(post.post_id);
      });
    }
  } catch (error) {
    console.log(error);
    listElement.textContent = "Erreur lors du chargement des posts.";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  getArchivesPosts();
});