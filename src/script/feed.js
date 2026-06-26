import { apiUrl } from "../utils/apiUrl.js";
import { jwtDecode } from "https://esm.sh/jwt-decode";
import { showToast } from "../utils/toast.js";

const activatedUsers = [];
const dialogElement = document.getElementById("dialog");

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
  dialogElement.innerHTML = "";
  dialogElement.appendChild(closeDialogButton);

  closeDialogButton.addEventListener("click", () => dialogElement.close());

  if (!commentaries || commentaries.length === 0) {
    const emptyMsg = document.createElement("p");
    emptyMsg.textContent = "Aucun commentaire pour le moment";
    dialogElement.appendChild(emptyMsg);
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
      dialogElement.appendChild(commentaryElement);
    }
  }
}

async function addCommentary(postId, form) {
  const formData = new FormData(form);
  formData.append("postId", postId);

  const response = await fetch(apiUrl + "/commentaries", {
    method: "POST",
    headers: {
      authorization: "Bearer " + localStorage.getItem("access_token"),
    },
    body: formData,
  });
  if (redirectIfUnauthorized(response)) return false;
  if (!response.ok) {
    const data = await response.json();
    showToast(data.error || "Erreur lors de l'ajout du commentaire", "error");
    return false;
  }
  return true;
}

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
  if (redirectIfUnauthorized(response)) return { error: true };
  const data = await response.json();
  if (!response.ok) {
    showToast(data.error || "Erreur lors du vote", "error");
    return { error: true };
  }
  return data;
}

function renderPost(post, listElement) {
  const postElement = document.createElement("div");
  postElement.classList.add("post-card");

  const imageElement = document.createElement("img");
  imageElement.src = post.image;

  const descriptionElement = document.createElement("p");
  descriptionElement.classList.add("post-description");
  descriptionElement.textContent = post.description;

  const selectElement = document.createElement("select");
  for (let user of activatedUsers) {
    const optionElement = document.createElement("option");
    optionElement.value = user.userId;
    optionElement.textContent = user.firstName + " " + user.lastName;
    selectElement.appendChild(optionElement);
  }

  const submitButton = document.createElement("button");
  submitButton.textContent = "Voter";

  postElement.append(
    imageElement,
    descriptionElement,
    selectElement,
    submitButton,
  );
  listElement.appendChild(postElement);

  submitButton.addEventListener("click", async () => {
    const votedUserId = +selectElement.value;
    const answer = await submitVote(votedUserId, post.post_id);
    if (answer.error) return;

    if (answer.points_added > 0) {
      showToast(
        "Bonne réponse ! +" + answer.points_added + " points",
        "success",
      );
    } else if (answer.guessed === false) {
      showToast(
        "Mauvaise réponse. Essais restants : " + answer.remaining,
        "error",
      );
    }

    if (
      (answer.guessed == false && answer.remaining == 0) ||
      answer.guessed == true
    ) {
      const answerElement = document.createElement("div");
      answerElement.textContent = answer.creator;
      selectElement.replaceWith(answerElement);

      const commentaryForm = document.createElement("form");

      const commentaryInput = document.createElement("input");
      commentaryInput.type = "text";
      commentaryInput.name = "message";
      commentaryInput.placeholder = "Ajouter un commentaire";

      const addCommentaryButton = document.createElement("input");
      addCommentaryButton.value = "Envoyer";
      addCommentaryButton.type = "submit";

      commentaryForm.append(commentaryInput, addCommentaryButton);

      submitButton.replaceWith(commentaryForm);

      const commentariesButton = document.createElement("button");
      commentariesButton.textContent = `Voir les commentaires (${post.commentary_count ?? 0})`;
      postElement.appendChild(commentariesButton);

      commentaryForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const success = await addCommentary(post.post_id, e.target);
        if (success) {
          commentaryInput.value = "";
          getCommentaries(post.post_id, commentariesButton);
        }
      });

      commentariesButton.addEventListener("click", () => {
        dialogElement.showModal();
        getCommentaries(post.post_id, commentariesButton);
      });
    }
  });
}

async function loadPosts(page) {
  if (isLoading) return;
  isLoading = true;

  const listElement = document.getElementById("posts-list");
  const loadMoreBtn = document.getElementById("load-more-btn");
  if (loadMoreBtn) loadMoreBtn.disabled = true;

  const response = await fetch(apiUrl + "/posts?page=" + page, {
    headers: {
      authorization: "Bearer " + localStorage.getItem("access_token"),
    },
  });
  if (redirectIfUnauthorized(response)) return;

  const data = await response.json();

  if (!response.ok) {
    if (page === 1)
      listElement.textContent =
        data.error || "Erreur lors du chargement des posts.";
    isLoading = false;
    return;
  }

  const { posts, has_more } = data;

  if (page === 1 && posts.length === 0) {
    listElement.textContent = "Aucun nouveau post à afficher.";
    updateLoadMoreButton(false);
    isLoading = false;
    return;
  }

  for (let post of posts) {
    renderPost(post, listElement);
  }

  updateLoadMoreButton(has_more);
  isLoading = false;
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

async function getActivatedUsers() {
  const response = await fetch(apiUrl + "/users?activated=1", {
    cache: "no-store",
    headers: {
      authorization: "Bearer " + localStorage.getItem("access_token"),
    },
  });
  const users = await response.json();

  activatedUsers.length = 0;

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
  loadPosts(currentPage);
});
