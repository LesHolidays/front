import { apiUrl } from "../utils/apiUrl.js";

async function getRanking() {
  const response = await fetch(apiUrl + "/ranking", { cache: "no-store" });
  const ranking = await response.json();

  const tableElement = document.getElementById("ranking");

  for (let userIndex in ranking) {
    const rowElement = document.createElement("tr");
    const rankingElement = document.createElement("td");
    const nameElement = document.createElement("td");
    const pointsElement = document.createElement("td");
    nameElement.textContent =
      ranking[userIndex].first_name + " " + ranking[userIndex].last_name;
    rankingElement.textContent = +userIndex + 1;
    pointsElement.textContent = ranking[userIndex].points + " points";
    rowElement.append(rankingElement, nameElement, pointsElement);
    tableElement.appendChild(rowElement);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  getRanking();
});
