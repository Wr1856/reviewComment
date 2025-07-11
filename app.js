/* ------------------- UTILIDADES ------------------- */
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);
const LS_KEY = "productReviews";
const VOTE_LIMIT = 3;

function throttle(func, limit) {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Throttle aplicado; verificar frequência correta para UX
const saveToLocalStorage = throttle(() => {
  localStorage.setItem(LS_KEY, JSON.stringify(reviews));
}, 500);

const starIcons = (n) => {
  let stars = "";
  for (let i = 1; i <= 5; i++) {
    if (n >= i) {
      stars += '<i class="fa-solid fa-star"></i>';
    } else if (n >= i - 0.5) {
      stars += '<i class="fa-solid fa-star-half-stroke"></i>';
    } else {
      stars += '<i class="fa-regular fa-star"></i>';
    }
  }
  return stars;
};

/* ------------------- DADOS ------------------- */
let reviews = JSON.parse(localStorage.getItem(LS_KEY) || "[]").map(r => ({ votes: typeof r.votes === "number" ? r.votes : 0, ...r }));
if (!reviews.length) {
  reviews = [{
    id: Date.now() - 1000,
    name: "Exemplo",
    email: "exemplo@email.com",
    age: 20,
    rating: 5,
    comment: "Um exemplo de parâmetros.",
    votes: 0,
    date: Date.now() - 1728e5,
  }];
  saveToLocalStorage();
}
const userVotes = {};

/* ------------------- RENDERIZAÇÃO ------------------- */
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
    if (sortFilter === "recent") return b.date - a.date;
    if (sortFilter === "old") return a.date - b.date;
    if (sortFilter === "best") return b.rating - a.rating;
    if (sortFilter === "most-voted") return b.votes - a.votes;
    if (sortFilter === "least-voted") return a.votes - b.votes;
    return 0;
  });

  const listEl = $("#reviews-list");
  listEl.innerHTML = "";

  filtered.forEach(r => {
    const itemEl = document.createElement("li");
    itemEl.className = "review-item";
    itemEl.setAttribute("data-id", r.id);
    itemEl.setAttribute("tabindex", "0");
    itemEl.innerHTML = `
      <div class="review-top">
        <span class="review-name">${r.name} (${r.age})</span>
        <span class="stars">${starIcons(r.rating)}</span>
      </div>
      <p>${r.comment}</p>
      <span class="review-date">${new Date(r.date).toLocaleDateString()}</span>
    `;
    listEl.appendChild(itemEl);
  });
}

/* ------------------- MODAIS ------------------- */
function openModal(id) {
  const modal = $("#modal-" + id);
  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("lock");
  const firstInput = modal.querySelector("input, textarea, select, button");
  if (firstInput) firstInput.focus();
}

function closeModal(id) {
  const modal = $("#modal-" + id);
  modal.classList.add("hidden");
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("lock");
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    const openModal = document.querySelector(".modal-backdrop:not(.hidden)");
    if (openModal) closeModal(openModal.id.replace("modal-", ""));
  }
});

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
  $("#detail-votes").innerHTML = `
    <button class="vote-btn" data-id="${r.id}" data-vote="up">👍</button>
    <button class="vote-btn" data-id="${r.id}" data-vote="down">👎</button>
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
  if (userVotes[id] >= VOTE_LIMIT) {
    showToast("Limite de votos atingido para esta avaliação.", "error");
    return;
  }
  const review = reviews.find(r => r.id === id);
  if (voteType === "up") review.votes++;
  if (voteType === "down") review.votes--;
  userVotes[id]++;
  saveToLocalStorage();
  $("#detail-votes .votes-count").textContent = `${review.votes} votos`;
});

$("#btn-open-add").addEventListener("click", () => openModal("add"));
$("#modal-add").addEventListener("click", (e) => {
  if (e.target === $("#modal-add")) closeModal("add");
});

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
    votes: 0
  };
  const duplicate = reviews.some(r => r.name === newReview.name && r.comment === newReview.comment);
  if (duplicate) {
    showToast("Essa avaliação já existe.", "error");
    return;
  }
  if (!newReview.name || !newReview.email || !newReview.comment || !newReview.rating) {
    showToast("Preencha todos os campos!", "error");
    return;
  }
  reviews.push(newReview);
  saveToLocalStorage();
  renderAvg();
  renderList();
  closeModal("add");
  e.target.reset();
  showToast("Avaliação enviada com sucesso!", "success");
});

$("#star-rating").addEventListener("mouseover", (e) => {
  if (e.target.tagName === "I") highlightStars(e.target.parentNode.children, e.target.dataset.value);
});

$("#star-rating").addEventListener("click", (e) => {
  if (e.target.tagName === "I") {
    $("#add-rating").value = e.target.dataset.value;
    highlightStars(e.target.parentNode.children, e.target.dataset.value);
  }
});

$("#star-rating").addEventListener("mouseout", (e) => {
  const hiddenRating = $("#add-rating").value;
  highlightStars(e.target.parentNode.children, hiddenRating || 0);
});

function highlightStars(stars, value) {
  [...stars].forEach(star => {
    if (star.dataset.value <= value) {
      star.classList.add("fa-solid");
      star.classList.remove("fa-regular");
    } else {
      star.classList.add("fa-regular");
      star.classList.remove("fa-solid");
    }
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

renderAvg();
renderList();
$("#star-filter").addEventListener("change", renderList);
$("#sort-filter").addEventListener("change", renderList);

const toastStyle = document.createElement("style");
toastStyle.innerHTML = `
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
`;
document.head.appendChild(toastStyle);
