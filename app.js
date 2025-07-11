// Utility functions
const $cache = {};
const $ = (selector) => $cache[selector] || ($cache[selector] = document.querySelector(selector));
const $$ = (selector) => document.querySelectorAll(selector);
const LS_KEY = "productReviews";
const VOTE_LIMIT = 3;

function throttle(func, limit) {
  let inThrottle;
  return (...args) => {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

function saveToLocalStorage() {
  localStorage.setItem(LS_KEY, JSON.stringify(reviews));
}

const starIcons = (n) => Array.from({ length: 5 }, (_, i) => {
  const starValue = i + 1;
  return n >= starValue ? `<i class="fa-solid fa-star" data-value="${starValue}"></i>` :
         n >= starValue - 0.5 ? `<i class="fa-solid fa-star-half-stroke" data-value="${starValue}"></i>` :
         `<i class="fa-regular fa-star" data-value="${starValue}"></i>`;
}).join("");

// Load or initialize reviews
let reviews = JSON.parse(localStorage.getItem(LS_KEY)) || [];
const userVotes = {};

function addReview(review) {
  reviews.push(review);
  saveToLocalStorage();
  renderAvg();
  renderList();
}

function renderAvg() {
  const total = reviews.length;
  const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / (total || 1);
  $("#avg-rating").textContent = avg.toFixed(1);
  $("#avg-stars").innerHTML = starIcons(avg);
  $("#total-reviews").textContent = `${total} avaliação${total !== 1 ? "s" : ""}`;
}

function renderList() {
  const starFilter = $("#star-filter").value;
  const sortFilter = $("#sort-filter").value;
  let filtered = [...reviews];
  if (starFilter !== "all") filtered = filtered.filter(r => r.rating == starFilter);
  filtered.sort((a, b) => {
    switch (sortFilter) {
      case "recent": return b.date - a.date;
      case "old": return a.date - b.date;
      case "best": return b.rating - a.rating;
      case "most-voted": return b.votes - a.votes;
      case "least-voted": return a.votes - b.votes;
      default: return 0;
    }
  });
  const listEl = $("#reviews-list");
  listEl.innerHTML = filtered.map(r => `
    <li class="review-item" data-id="${r.id}" tabindex="0">
      <div class="review-top">
        <span class="review-name">${r.name} (${r.age})</span>
        <span class="stars">${starIcons(r.rating)}</span>
      </div>
      <p>${r.comment}</p>
      <span class="review-date">${new Date(r.date).toLocaleDateString()}</span>
      <div class="responses" data-id="${r.id}"></div>
    </li>
  `).join("");
}

function openModal(id) {
  const modal = $("#modal-" + id);
  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("lock");
  modal.querySelector("input, textarea, select, button")?.focus();

  // Garante as estrelas sempre que o modal de avaliação abrir
  if (id === 'add' && $("#star-rating")) {
    $("#star-rating").innerHTML = starIcons(0);
  }

  if (!modal.listenerAttached) {
    modal.escHandler = (e) => e.key === "Escape" && closeModal(id);
    modal.addEventListener("keydown", modal.escHandler);
    modal.listenerAttached = true;
  }
}

function closeModal(id) {
  const modal = $("#modal-" + id);
  document.activeElement.blur();
  modal.classList.add("hidden");
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("lock");
  if (modal.escHandler) {
    modal.removeEventListener("keydown", modal.escHandler);
    delete modal.listenerAttached;
    delete modal.escHandler;
  }
}

$$(".modal-close").forEach(btn =>
  btn.addEventListener("click", () => closeModal(btn.dataset.close))
);

$("#reviews-list").addEventListener("click", (e) => {
  const li = e.target.closest(".review-item");
  if (!li) return;
  const r = reviews.find(rev => rev.id == li.dataset.id);
  $("#detail-name").textContent = r.name;
  $("#detail-stars").innerHTML = starIcons(r.rating);
  $("#detail-comment").textContent = r.comment;
  $("#detail-date").textContent = new Date(r.date).toLocaleString();
  $("#detail-responses").innerHTML = renderResponses(r.id);
  $("#detail-votes").innerHTML = `
    <button class="vote-btn" data-id="${r.id}" data-vote="up">👍</button>
    <button class="vote-btn" data-id="${r.id}" data-vote="down">👎</button>
    <button class="share-twitter" data-id="${r.id}">🐦</button>
    <button class="share-facebook" data-id="${r.id}">📘</button>
    <span class="votes-count">${r.votes} votos</span>
  `;
  openModal("detail");
});

$("#detail-votes").addEventListener("click", (e) => {
  const btn = e.target.closest(".vote-btn");
  if (!btn) return;
  const id = +btn.dataset.id;
  const voteType = btn.dataset.vote;
  userVotes[id] = userVotes[id] || 0;
  if (userVotes[id] >= VOTE_LIMIT) return showToast("Limite de votos atingido para esta avaliação.", "error");
  const review = reviews.find(r => r.id === id);
  voteType === "up" ? review.votes++ : review.votes--;
  userVotes[id]++;
  saveToLocalStorage();
  $("#detail-votes .votes-count").textContent = `${review.votes} votos`;
});

$("#detail-votes").addEventListener("click", (e) => {
  const btnTwitter = e.target.closest(".share-twitter");
  const btnFacebook = e.target.closest(".share-facebook");
  if (btnTwitter) shareOnTwitter(+btnTwitter.dataset.id);
  if (btnFacebook) shareOnFacebook(+btnFacebook.dataset.id);
});

$("#btn-open-add").addEventListener("click", () => openModal("add"));
$("#modal-add").addEventListener("click", (e) => e.target === $("#modal-add") && closeModal("add"));

$("#form-add").addEventListener("submit", (e) => {
  e.preventDefault();
  const newReview = {
    id: Date.now(),
    name: $("#add-name").value.trim(),
    email: $("#add-email").value.trim(),
    age: +$("#add-age").value,
    rating: +$("#add-rating").value,
    comment: $("#add-comment").value.trim(),
    date: Date.now(),
    votes: 0,
    responses: []
  };
  if (!newReview.name || !newReview.email || !newReview.comment || !newReview.rating)
    return showToast("Preencha todos os campos!", "error");
  addReview(newReview);
  closeModal("add");
  e.target.reset();
  showToast("Avaliação enviada com sucesso!", "success");
});

// Estrelas (mouseover, click, mouseout)
$("#modal-add").addEventListener("mouseover", (e) => {
  if (e.target.closest('#star-rating') && e.target.tagName === "I") {
    highlightStars(e.target.parentNode.children, e.target.dataset.value);
  }
});
$("#modal-add").addEventListener("click", (e) => {
  if (e.target.closest('#star-rating') && e.target.tagName === "I") {
    $("#add-rating").value = e.target.dataset.value;
    highlightStars(e.target.parentNode.children, e.target.dataset.value);
  }
});
$("#modal-add").addEventListener("mouseout", (e) => {
  if (e.target.closest('#star-rating')) {
    highlightStars($("#star-rating").children, $("#add-rating").value || 0);
  }
});

function highlightStars(stars, value) {
  const numericValue = Number(value);
  [...stars].forEach(star => {
    const starVal = Number(star.dataset.value);
    star.classList.toggle("fa-solid", starVal <= numericValue);
    star.classList.toggle("fa-regular", starVal > numericValue);
  });
}

function showToast(msg, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = msg;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("show"));
  toast.addEventListener("animationend", () => toast.remove());
}

function formatDate(timestamp) {
  return new Date(timestamp).toLocaleString();
}

function renderResponses(reviewId) {
  const review = reviews.find(r => r.id === reviewId);
  return review.responses?.map(resp => `
    <div class="response-item">
      <p>${resp.text}</p>
      <span class="response-date">${formatDate(resp.date)}</span>
    </div>
  `).join('') || "";
}

function shareOnTwitter(id) {
  const review = reviews.find(r => r.id === id);
  const text = encodeURIComponent(`"${review.comment}" — ${review.name}`);
  window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
}

function shareOnFacebook(id) {
  const url = encodeURIComponent(window.location.href + `#review-${id}`);
  window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
}

renderAvg();
renderList();
$("#star-filter").addEventListener("change", renderList);
$("#sort-filter").addEventListener("change", renderList);

document.head.insertAdjacentHTML("beforeend", `
<style>
.toast {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  background: #0d6efd;
  color: white;
  padding: .75rem 1.25rem;
  border-radius: .5rem;
  box-shadow: 0 5px 15px rgba(0,0,0,0.2);
  opacity: 0;
  transform: translateY(20px);
  transition: opacity .4s ease, transform .4s ease;
  z-index: 9999;
}
.toast.show {
  opacity: 1;
  transform: translateY(0);
}
.toast.error { background: #f43f5e; }
</style>
`);
