import { apiUrl } from "../utils/apiUrl.js";
import { showToast } from "../utils/toast.js";
import Compressor from "https://cdn.jsdelivr.net/npm/compressorjs@1.2.1/+esm";

const form = document.getElementById("post-form");
const submitButton = form.querySelector("input[type=submit]");

function redirectIfUnauthorized(response) {
  if (response.status === 401) {
    localStorage.removeItem("access_token");
    window.location.href = "/login";
    return true;
  }
  return false;
}

function post() {
  const formData = new FormData(form);
  const image = formData.get("image");

  if (!image || image.size === 0) {
    showToast("Veuillez sélectionner une photo", "error");
    return;
  }

  submitButton.value = "Envoi en cours...";
  submitButton.disabled = true;

  new Compressor(image, {
    quality: 0.6,
    async success(result) {
      formData.set("image", result, image.name);

      try {
        const response = await fetch(apiUrl + "/posts", {
          method: "POST",
          body: formData,
          headers: {
            authorization: "Bearer " + localStorage.getItem("access_token"),
          },
        });

        if (redirectIfUnauthorized(response)) return;

        const data = await response.json();
        if (response.ok) {
          if (data.points_added) {
            showToast("Post publié ! +" + data.points_added + " points", "success");
          }
          setTimeout(() => { window.location.href = "/feed"; }, 1200);
        } else {
          showToast(data.error || "Une erreur est survenue", "error");
          submitButton.value = "Envoyer";
          submitButton.disabled = false;
        }
      } catch (fetchError) {
        console.error("Erreur :", fetchError);
        showToast("Impossible de contacter le serveur", "error");
        submitButton.value = "Envoyer";
        submitButton.disabled = false;
      }
    },
    error(err) {
      console.error("Erreur :", err.message);
      showToast("Erreur lors de la compression de l'image", "error");
      submitButton.value = "Envoyer";
      submitButton.disabled = false;
    },
  });
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  post();
});
