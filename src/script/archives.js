import { apiUrl } from "../utils/apiUrl.js";
import { jwtDecode } from "https://esm.sh/jwt-decode";
import { showToast } from "../utils/toast.js";

const commentariesElement = document.getElementById("commentaries");

let currentPage = 1;
let isLoading = false;

function redirectIfUnauthorized(response) {
  if (response.status === 401) {
    localStorage.removeItem("access_token");
    window.location.href = "/login";
    return true;
  }
  return false;
}

async function deleteCommentary(commentaryId) {
  await fetch(apiUrl + "/commentaries?commentaryId=" + commentaryId, {
    method: "DELETE",
    headers: {
      authorization: "Bearer " + localStorage.getItem("access_token"),
    },
  });
  if (redirectIfUnauthorized(response)) return;
  if (!response.ok) {
    const data = await response.json();
    showToast(
      data.error || "Erreur lors de la suppression du commentaire",
      "error",
    );
  }
}

async function getCommentaries(postId, commentariesButton) {
  const response = await fetch(apiUrl + "/commentaries?postId=" + postId, {
    method: "GET",
    headers: {
      authorization: "Bearer " + localStorage.getItem("access_token"),
    },
  });
  if (redirectIfUnauthorized(response)) return;
  const commentaries = await response.json();

  if (commentariesButton) {
    commentariesButton.textContent = `Voir les commentaires (${commentaries.length})`;
  }

  const closeDialogButton = document.createElement("button");
  closeDialogButton.textContent = "X";
  closeDialogButton.classList.add("btn-close-dialog");
  commentariesElement.innerHTML = "";
  commentariesElement.appendChild(closeDialogButton);

  closeDialogButton.addEventListener("click", () =>
    commentariesElement.close(),
  );

  if (!commentaries || commentaries.length === 0) {
    const emptyMsg = document.createElement("p");
    emptyMsg.textContent = "Aucun commentaire pour le moment";
    commentariesElement.appendChild(emptyMsg);
  } else {
    for (let commentary of commentaries) {
      const commentaryElement = document.createElement("div");
      const nameElement = document.createElement("p");
      const messageElement = document.createElement("p");
      nameElement.textContent =
        commentary.first_name + " " + commentary.last_name[0] + ".";
      messageElement.textContent = commentary.commentary;

      commentaryElement.append(nameElement, messageElement);

      if (
        commentary.user_id ==
        jwtDecode(localStorage.getItem("access_token")).sub
      ) {
        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Supprimer";
        commentaryElement.appendChild(deleteButton);
        deleteButton.addEventListener("click", async () => {
          await deleteCommentary(commentary.commentary_id);
          getCommentaries(postId, commentariesButton);
        });
      }
      commentariesElement.appendChild(commentaryElement);
    }
  }
}

function renderPost(post, listElement) {
  const postElement = document.createElement("div");
  postElement.classList.add("post-card");

  const creatorElement = document.createElement("p");
  creatorElement.classList.add("post-creator");
  creatorElement.textContent = post.first_name + " " + post.last_name;

  const imageElement = document.createElement("img");
  imageElement.src = post.image;

  const descriptionElement = document.createElement("p");
  descriptionElement.classList.add("post-description");
  descriptionElement.textContent = post.description;

  postElement.append(creatorElement, imageElement, descriptionElement);

  const creationDate = new Date(post.creation_date.replace(" ", "T"));
  const now = new Date();
  const diffInMs = Math.abs(now - creationDate);
  const twentyFourHoursInMs = 24 * 60 * 60 * 1000;

  const commentariesButton = document.createElement("button");
  commentariesButton.textContent = `Voir les commentaires (${post.commentary_count ?? 0})`;

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

    commentaryForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      formData.append("postId", post.post_id);
      const res = await fetch(apiUrl + "/commentaries", {
        method: "POST",
        headers: {
          authorization: "Bearer " + localStorage.getItem("access_token"),
        },
        body: formData,
      });
      if (redirectIfUnauthorized(res)) return;
      if (!res.ok) {
        const errData = await res.json();
        showToast(
          errData.error || "Erreur lors de l'ajout du commentaire",
          "error",
        );
      } else {
        commentaryInput.value = "";
        getCommentaries(post.post_id, commentariesButton);
      }
    });

    postElement.appendChild(commentaryForm);
  }

  postElement.appendChild(commentariesButton);
  listElement.appendChild(postElement);

  commentariesButton.addEventListener("click", () => {
    commentariesElement.showModal();
    getCommentaries(post.post_id, commentariesButton);
  });
}

function updateLoadMoreButton(hasMore) {
  let btn = document.getElementById("load-more-btn");
  const listElement = document.getElementById("posts-list");

  if (hasMore) {
    if (!btn) {
      btn = document.createElement("button");
      btn.id = "load-more-btn";
      btn.textContent = "Voir plus";
      btn.classList.add("btn-load-more");
      btn.addEventListener("click", async () => {
        currentPage++;
        await loadPosts(currentPage);
      });
      listElement.parentNode.insertBefore(btn, listElement.nextSibling);
    }
    btn.disabled = false;
    btn.style.display = "";
  } else {
    if (btn) btn.style.display = "none";
  }
}

async function loadPosts(page) {
  if (isLoading) return;
  isLoading = true;

  const listElement = document.getElementById("posts-list");
  const loadMoreBtn = document.getElementById("load-more-btn");
  if (loadMoreBtn) loadMoreBtn.disabled = true;

  try {
    const response = await fetch(apiUrl + "/archives?page=" + page, {
      headers: {
        authorization: "Bearer " + localStorage.getItem("access_token"),
      },
    });
    if (redirectIfUnauthorized(response)) return;

    const data = await response.json();

    if (!response.ok) {
      if (page === 1)
        listElement.textContent =
          data.error || "Impossible de charger les archives.";
      isLoading = false;
      return;
    }

    const { posts, has_more } = data;

    if (page === 1 && posts.length === 0) {
      listElement.textContent = "Aucune archive à afficher.";
      updateLoadMoreButton(false);
      isLoading = false;
      return;
    }

    for (let post of posts) {
      renderPost(post, listElement);
    }

    updateLoadMoreButton(has_more);
  } catch (error) {
    console.log(error);
    if (page === 1)
      listElement.textContent = "Erreur lors du chargement des archives.";
  }

  isLoading = false;
}

document.addEventListener("DOMContentLoaded", () => {
  loadPosts(currentPage);
});
