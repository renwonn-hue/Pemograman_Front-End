// ============================================================
// DATA STORE
// ============================================================
let transactions = [];

// ── Utility: Format Rupiah ──
function formatRupiah(amount) {
  return "Rp" + amount.toLocaleString("id-ID");
}

// ── Toast Notification (menggantikan alert) ──
function showToast(message, type) {
  var container = document.getElementById("toastContainer");
  var icons = { success: "✅", error: "❌", info: "ℹ️" };

  var toast = document.createElement("div");
  toast.classList.add("toast", type || "info");
  toast.textContent = (icons[type] || "ℹ️") + " " + message;

  container.appendChild(toast);

  setTimeout(function () {
    toast.classList.add("hide");
    setTimeout(function () {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  }, 3000);
}

// ── Ripple Effect pada tombol ──
function addRipple(button, event) {
  var rect = button.getBoundingClientRect();
  var size = Math.max(rect.width, rect.height);
  var x = event.clientX - rect.left - size / 2;
  var y = event.clientY - rect.top - size / 2;

  var ripple = document.createElement("span");
  ripple.classList.add("ripple");
  ripple.style.width = ripple.style.height = size + "px";
  ripple.style.left = x + "px";
  ripple.style.top = y + "px";

  button.appendChild(ripple);
  setTimeout(function () {
    if (ripple.parentNode) ripple.parentNode.removeChild(ripple);
  }, 600);
}

// ── Animasi bump pada angka summary ──
function animateSummaryValue(elementId) {
  var el = document.getElementById(elementId);
  el.classList.remove("bump");
  void el.offsetWidth; // trigger reflow
  el.classList.add("bump");
  setTimeout(function () { el.classList.remove("bump"); }, 200);
}

// ── Update Summary ──
function updateSummary() {
  var totalIncome = 0;
  var totalExpense = 0;

  transactions.forEach(function (t) {
    if (t.type === "income") totalIncome += t.amount;
    else if (t.type === "expense") totalExpense += t.amount;
  });

  var balance = totalIncome - totalExpense;

  document.getElementById("totalBalance").textContent = formatRupiah(balance);
  document.getElementById("totalIncome").textContent  = formatRupiah(totalIncome);
  document.getElementById("totalExpense").textContent = formatRupiah(totalExpense);
  document.getElementById("listCount").textContent    = transactions.length;

  animateSummaryValue("totalBalance");
  animateSummaryValue("totalIncome");
  animateSummaryValue("totalExpense");
}

// ── Buat Elemen Transaksi ──
// Struktur data transaksi: { id, title, amount (Number), date, type ('income'|'expense') }
function createTransactionElement(transaction) {
  var item = document.createElement("div");
  item.setAttribute("data-testid", "transactionItem");
  item.classList.add(transaction.type);

  var info = document.createElement("div");
  info.classList.add("transaction-info");

  var title = document.createElement("h3");
  title.setAttribute("data-testid", "transactionItemTitle");
  title.textContent = transaction.title;

  var amount = document.createElement("p");
  amount.setAttribute("data-testid", "transactionItemAmount");
  amount.textContent = "Nominal: " + formatRupiah(transaction.amount);

  var date = document.createElement("p");
  date.setAttribute("data-testid", "transactionItemDate");
  date.textContent = "Tanggal: " + transaction.date;

  var type = document.createElement("p");
  type.setAttribute("data-testid", "transactionItemType");
  type.classList.add(transaction.type);
  type.textContent = "Tipe: " + (transaction.type === "income" ? "Pemasukan" : "Pengeluaran");

  info.appendChild(title);
  info.appendChild(amount);
  info.appendChild(date);
  info.appendChild(type);

  var actions = document.createElement("div");
  actions.classList.add("transaction-actions");

  var editButton = document.createElement("button");
  editButton.setAttribute("data-testid", "transactionItemEditTypeButton");
  editButton.textContent = "Ubah Tipe";
  editButton.addEventListener("click", function (e) {
    addRipple(editButton, e);
    handleEditType(transaction.id);
  });

  var deleteButton = document.createElement("button");
  deleteButton.setAttribute("data-testid", "transactionItemDeleteButton");
  deleteButton.textContent = "Hapus";
  deleteButton.addEventListener("click", function (e) {
    addRipple(deleteButton, e);
    item.classList.add("removing");
    setTimeout(function () {
      handleDelete(transaction.id);
    }, 280);
  });

  actions.appendChild(editButton);
  actions.appendChild(deleteButton);

  item.appendChild(info);
  item.appendChild(actions);

  return item;
}

// ── Render Semua Transaksi ──
function renderTransactions() {
  var list = document.getElementById("transactionList");
  var emptyState = document.getElementById("emptyState");

  var existingItems = list.querySelectorAll("div[data-testid='transactionItem']");
  existingItems.forEach(function (el) { list.removeChild(el); });

  if (transactions.length === 0) {
    emptyState.style.display = "flex";
    return;
  }

  emptyState.style.display = "none";

  var sorted = transactions.slice().reverse();
  sorted.forEach(function (transaction, index) {
    var el = createTransactionElement(transaction);
    el.style.animationDelay = (index * 0.06) + "s";
    list.appendChild(el);
  });
}

// ── Handle Tambah Transaksi ──
function handleAddTransaction(event) {
  event.preventDefault();

  var titleInput  = document.getElementById("transactionTitle");
  var amountInput = document.getElementById("transactionAmount");
  var dateInput   = document.getElementById("transactionDate");
  var typeInput   = document.getElementById("transactionType");
  var submitBtn   = event.target.querySelector("button[type='submit']");

  var title  = titleInput.value.trim();
  var amount = Number(amountInput.value);
  var date   = dateInput.value;
  var type   = typeInput.value;

  if (!title || !amount || !date || !type) {
    showToast("Harap isi semua field dengan benar.", "error");
    return;
  }
  if (amount <= 0) {
    showToast("Nominal harus lebih dari 0.", "error");
    return;
  }

  // Loading shimmer singkat pada tombol
  submitBtn.classList.add("loading");
  submitBtn.textContent = "Menyimpan...";

  setTimeout(function () {
    // Buat objek transaksi sesuai struktur yang diwajibkan
    var newTransaction = {
      id: +new Date(),   // ID unik berdasarkan timestamp
      title: title,
      amount: amount,    // disimpan sebagai Number, bukan string
      date: date,
      type: type,        // 'income' atau 'expense'
    };

    transactions.push(newTransaction);

    titleInput.value  = "";
    amountInput.value = "";
    dateInput.value   = "";
    typeInput.value   = "income";

    submitBtn.classList.remove("loading");
    submitBtn.textContent = "Tambah Transaksi";

    renderTransactions();
    updateSummary();

    showToast("Transaksi \"" + newTransaction.title + "\" berhasil ditambahkan!", "success");
  }, 400);
}

// ── Handle Ubah Tipe ──
function handleEditType(id) {
  transactions = transactions.map(function (t) {
    if (t.id === id) {
      return Object.assign({}, t, {
        type: t.type === "income" ? "expense" : "income",
      });
    }
    return t;
  });

  renderTransactions();
  updateSummary();
  showToast("Tipe transaksi berhasil diubah.", "info");
}

// ── Handle Hapus ──
function handleDelete(id) {
  var deleted = transactions.find(function (t) { return t.id === id; });
  transactions = transactions.filter(function (t) { return t.id !== id; });

  renderTransactions();
  updateSummary();

  if (deleted) {
    showToast("\"" + deleted.title + "\" dihapus.", "error");
  }
}

// ── Ripple pada tombol Submit ──
document.querySelector("button[type='submit']").addEventListener("click", function (e) {
  addRipple(this, e);
});

// ── Inisialisasi ──
document.getElementById("transactionForm").addEventListener("submit", handleAddTransaction);

(function setDefaultDate() {
  var today = new Date();
  var yyyy = today.getFullYear();
  var mm = String(today.getMonth() + 1).padStart(2, "0");
  var dd = String(today.getDate()).padStart(2, "0");
  document.getElementById("transactionDate").value = yyyy + "-" + mm + "-" + dd;
})();

renderTransactions();
updateSummary();
