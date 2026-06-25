import { apiUrl } from "../utils/apiUrl.js";
import { jwtDecode } from "https://esm.sh/jwt-decode";

const activatedUsers = [];
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
  return await response.json();
}

async function getPosts() {
  const response = await fetch(apiUrl + "/posts", {
    headers: {
      authorization: "Bearer " + localStorage.getItem("access_token"),
    },
  });
  const posts = await response.json();

  if (posts.length === 0) {
    listElement.textContent = "Aucun nouveau post à afficher.";
    return;
  }

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
    postElement.append(imageElement, selectElement, submitButton);
    listElement.appendChild(postElement);

    submitButton.addEventListener("click", async () => {
      const votedUserId = +selectElement.value;
      const answer = await submitVote(votedUserId, post.post_id);
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
        commentariesButton.textContent = "Voir les commentaires";
        postElement.appendChild(commentariesButton);

        commentaryForm.addEventListener("submit", (e) => {
          e.preventDefault();
          addCommentary(post.post_id, e.target);
          commentaryInput.value = "";
        });

        commentariesButton.addEventListener("click", () => {
          commentariesElement.showModal();
          getCommentaries(post.post_id);
        });
      }
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
