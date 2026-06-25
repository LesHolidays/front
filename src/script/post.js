import { apiUrl } from "../utils/apiUrl.js";
import Compressor from "https://cdn.jsdelivr.net/npm/compressorjs@1.2.1/+esm";

let userAlreadyExists = true;

const form = document.getElementById("post-form");

function post() {
  const formData = new FormData(form);
  const image = formData.get("image");

  if (!image || image.size === 0) {
    console.error("Aucun fichier");
    return;
  }

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
        if (response.ok) {
          window.location.href = "/feed";
        }
      } catch (fetchError) {
        console.error("Erreur :", fetchError);
      }
    },
    error(err) {
      console.error("Erreur :", err.message);
    },
  });
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  post();
});
