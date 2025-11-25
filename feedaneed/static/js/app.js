// app.js - Feed A Need (Django + DRF + Razorpay client adapter)
//
// Place this file at: feedaneed/static/js/app.js
// Make sure aa.html includes it via: <script src="{% static 'js/app.js' %}"></script>
// Also inject a public Razorpay key in the template (see instructions below).





const API_ROOT = '/api';
const ACCOUNTS_ROOT = '/api/accounts';
const DONATIONS_ROOT = `${API_ROOT}/donations`;
const REQUESTS_ROOT = `${API_ROOT}/requests`;
const CREATE_ORDER_URL = '/api/payments/create_order/';
const VERIFY_PAYMENT_URL = '/api/payments/verify/';

let registerRole = 'donor'; // set by showRegister(role) from page buttons

// ---------------------------
// Token helpers
// ---------------------------
function setTokens(access, refresh) {
  localStorage.setItem('accessToken', access);
  if (refresh) localStorage.setItem('refreshToken', refresh);
}

function clearTokens() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}

function getAccessToken() {
  return localStorage.getItem('accessToken');
}

async function refreshAccessToken() {
  const refresh = localStorage.getItem('refreshToken');
  if (!refresh) return null;
  try {
    const res = await fetch('/api/token/refresh/', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({refresh})
    });
    if (!res.ok) {
      clearTokens();
      return null;
    }
    const data = await res.json();
    setTokens(data.access, data.refresh || refresh);
    return data.access;
  } catch (e) {
    console.error('refreshAccessToken error', e);
    clearTokens();
    return null;
  }
}

async function getAuthHeaders() {
  let token = getAccessToken();
  if (!token) return {};
  // optimistic attempt; if 401 happens server-side we try refresh in fetch wrapper
  return {'Authorization': 'Bearer ' + token};
}

//Location of the user
function getMyLocation() {
  alert("Location feature will be added soon.");
}
window.getMyLocation = getMyLocation;


// ---------------------------
// Generic fetch wrapper (auto-refresh on 401)
// ---------------------------
async function apiFetch(url, options = {}) {
  options.headers = options.headers || {};
  // ensure JSON header if body present
  if (options.body && !options.headers['Content-Type']) {
    options.headers['Content-Type'] = 'application/json';
  }
  // attach token
  const auth = await getAuthHeaders();
  options.headers = {...options.headers, ...auth};

  let res = await fetch(url, options);
  if (res.status === 401) {
    // try refresh
    const newAccess = await refreshAccessToken();
    if (!newAccess) return res; // still 401
    options.headers['Authorization'] = 'Bearer ' + newAccess;
    res = await fetch(url, options);
  }
  return res;
}

// ---------------------------
// Authentication (used by inline form handlers in aa.html)
// ---------------------------

async function handleRegister(event) {
  if (event) event.preventDefault();
  const name = document.getElementById('regName')?.value?.trim() || '';
  const email = document.getElementById('regEmail')?.value?.trim() || '';
  const phone = document.getElementById('regPhone')?.value?.trim() || '';
  const address = document.getElementById('regAddress')?.value?.trim() || '';
  const password = document.getElementById('regPassword')?.value || '';

  const payload = {
    username: email.split('@')[0] || name.replace(/\s+/g,'') || email,
    email,
    password,
    first_name: name,
    role: registerRole === 'recipient' ? 'recipient' : 'donor',
    phone,
    address
  };

  try {
    const res = await apiFetch(`${ACCOUNTS_ROOT}/register/`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      alert('Registration successful. Please login.');
      // optional: auto-switch to login
      backToLogin();
    } else {
      const err = await res.json().catch(()=>({detail:'Unknown error'}));
      alert('Registration failed: ' + JSON.stringify(err));
    }
  } catch (e) {
    console.error(e);
    alert('Registration failed (network).');
  }
}

async function handleLogin(event) {
  if (event) event.preventDefault();

  const username = document.getElementById('username')?.value?.trim();
  const password = document.getElementById('password')?.value;

  try {
    const res = await fetch('/api/token/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (!res.ok) {
      const text = await res.text();
      console.warn('Login failed status:', res.status, 'body:', text);
      alert('Login failed: ' + text);
      return;
    }

    const data = await res.json();
    console.log('Login success, tokens:', data);
    setTokens(data.access, data.refresh || '');
    await loadProfileAndInit();
  } catch (e) {
    console.error('Login network error', e);
    alert('Login failed (network error). Check console for details.');
  }
}




function showRegister(role) {
  // called by existing page buttons
  registerRole = role;
  const subtitle = document.getElementById('registerSubtitle');
  if (subtitle) {
    subtitle.textContent = role === 'donor' ? 'Register as a Donor' : 'Register as a Recipient';
  }
  // show register page - the HTML already toggles visibility; keep original behavior
  document.getElementById('loginPage')?.classList.add('hidden');
  document.getElementById('registerPage')?.classList.remove('hidden');
  // show/hide recipient-only field if present
  const rgroup = document.getElementById('recipientTypeGroup');
  if (rgroup) rgroup.style.display = role === 'recipient' ? 'block' : 'none';
}

function backToLogin() {
  document.getElementById('registerPage')?.classList.add('hidden');
  document.getElementById('loginPage')?.classList.remove('hidden');
}

// ---------------------------
// Profile + Dashboard init
// ---------------------------
// ---------------------------
// Profile + Dashboard init
// ---------------------------
async function loadProfileAndInit() {
  try {
    const res = await apiFetch(`${ACCOUNTS_ROOT}/me/`, { method: 'GET' });
    if (!res.ok) {
      console.warn('loadProfileAndInit: Failed to fetch profile, status =', res.status);
      // If unauthorized, clear tokens and show login
      if (res.status === 401) {
        console.warn('Token invalid or expired. Clearing tokens.');
        clearTokens();
      }
      // Ensure login UI is visible
      document.getElementById('loginPage')?.classList.remove('hidden');
      document.getElementById('registerPage')?.classList.add('hidden');
      return null;
    }
    const me = await res.json();
    window.currentUser = me;
    console.log('Loaded profile:', me);

    // hide auth pages
    document.getElementById('loginPage')?.classList.add('hidden');
    document.getElementById('registerPage')?.classList.add('hidden');

    // show role specific UI
    if (me.role === 'donor') {
      document.getElementById('donorDashboard')?.classList.add('active');
      document.getElementById('donorNameDisplay') && (document.getElementById('donorNameDisplay').textContent = me.first_name || me.username);
      loadDonorDonations();
      updateDonorStats();
    } else if (me.role === 'recipient') {
      document.getElementById('recipientDashboard')?.classList.add('active');
      document.getElementById('recipientNameDisplay') && (document.getElementById('recipientNameDisplay').textContent = me.first_name || me.username);
      loadAvailableDonations();
      loadMyRequests();
    } else {
      // admin
      document.getElementById('adminDashboard')?.classList.add('active');
      loadAdminDonations();
    }
    return me;
  } catch (e) {
    console.error('loadProfileAndInit error', e);
    // If unexpected error, clear tokens and show login so user won't see blank page
    clearTokens();
    document.getElementById('loginPage')?.classList.remove('hidden');
    document.getElementById('registerPage')?.classList.add('hidden');
    return null;
  }
}

// call on page load if access token exists
document.addEventListener('DOMContentLoaded', async () => {
  console.log('DOMContentLoaded: checking tokens...');
  const token = getAccessToken();
  if (!token) {
    console.log('No access token found — showing login.');
    // make sure login is visible
    document.getElementById('loginPage')?.classList.remove('hidden');
    document.getElementById('registerPage')?.classList.add('hidden');
    return;
  }

  console.log('Access token found — attempting to load profile');
  // attempt load; if it fails it will show login UI (handled inside loadProfileAndInit)
  await loadProfileAndInit();
});




// ---------------------------
// Donations (create, list, approve)
// ---------------------------
function handleDonationTypeChange() {
  const type = document.getElementById('donationType')?.value;
  const qtyInput = document.getElementById('donationQty');
  if (type === 'fund') {
    if (qtyInput) qtyInput.placeholder = 'Enter amount in INR (e.g. 500)';
  } else {
    if (qtyInput) qtyInput.placeholder = 'e.g. 50 meals';
  }
}

async function postDonation(event) {
  if (event) event.preventDefault();
  if (!getAccessToken()) { alert('Please login to post donation'); return; }

  const type = document.getElementById('donationType')?.value || 'food';
  const quantity = document.getElementById('donationQty')?.value.trim() || null;
  const description = document.getElementById('donationDesc')?.value.trim() || '';
  const location = document.getElementById('donorLocation')?.value?.trim() || '';
  // if fund, parse amount as number
  let amount = null;
  if (type === 'fund') {
    const v = parseFloat(quantity.replace(/[^\d.]/g,'')); // allow user typed "₹500"
    amount = isNaN(v) ? null : v;
  }

  const payload = {
    type,
    description,
    quantity: type === 'fund' ? null : quantity,
    amount: type === 'fund' ? amount : null,
    location
  };

  try {
    const res = await apiFetch(`${DONATIONS_ROOT}/`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const j = await res.json().catch(()=>({detail:'error'}));
      alert('Failed to post donation: ' + JSON.stringify(j));
      return;
    }
    const donation = await res.json();
    alert('Donation created (pending approval).');

    // If fund donation and amount present, start payment flow
    if (type === 'fund' && amount && donation.id) {
      await startFundPayment(amount, donation.id);
    } else {
      // refresh lists
      loadDonorDonations();
    }
  } catch (e) {
    console.error(e);
    alert('Failed to post donation (network).');
  }
}

async function loadDonorDonations() {
  try {
    const res = await apiFetch(`${DONATIONS_ROOT}/`, { method: 'GET' });
    if (!res.ok) return;
    const list = await res.json();
    const container = document.getElementById('myDonations') || document.getElementById('donor-donations') || document.getElementById('donorDonations') || document.getElementById('myDonationsContainer');
    if (!container) return;
    container.innerHTML = '';
    list.forEach(d => {
      const el = document.createElement('div');
      el.className = 'donation-card';
      el.innerHTML = `
  <div><strong>${d.type.toUpperCase()}</strong> — ${d.description || ''}</div>
  <div>Qty/Amount: ${d.quantity || (d.amount ? d.amount : '—')}</div>
  <div>Status: <span class="badge-${d.status}">${d.status}</span></div>

  ${d.invoice_number ? `<div>Invoice: ${d.invoice_number}</div>` : ''}

  ${d.invoice_pdf_url ? `
      <div style="margin-top:6px;">
          <a href="${d.invoice_pdf_url}" target="_blank">
              <button class="download-btn">Download Invoice</button>
          </a>
      </div>
  `: ''}

  <div style="margin-top:8px;">
    ${d.status === 'approved' && d.type === 'fund' && !d.payment_id ? `<button data-id="${d.id}" class="pay-btn">Pay</button>` : ''}
  </div>
`;

      container.appendChild(el);
    });
    // attach pay buttons if present
    document.querySelectorAll('.pay-btn').forEach(btn => {
      btn.addEventListener('click', ev => {
        const id = ev.target.dataset.id;
        // find donation amount by refetching donation or reading from UI; easiest to refetch
        fetch(`${DONATIONS_ROOT}/${id}/`, { headers: {'Content-Type':'application/json', ...{'Authorization':'Bearer ' + getAccessToken()}}})
          .then(r => r.json()).then(d => startFundPayment(d.amount, id)).catch(()=>alert('Unable to fetch donation'));
      });
    });
  } catch (e) {
    console.error(e);
  }
}

async function loadAvailableDonations() {
  try {
    const res = await apiFetch(`${DONATIONS_ROOT}/`, { method: 'GET' });
    if (!res.ok) return;
    const list = await res.json();
    const container = document.getElementById('availableDonations');
    if (!container) return;
    container.innerHTML = '';
    list.forEach(d => {
      if (d.status !== 'approved') return; // recipients see only approved donations
      const el = document.createElement('div');
      el.className = 'donation-card';
      el.innerHTML = `
        <div><strong>${d.type}</strong> — ${d.description || ''}</div>
        <div>Qty/Amount: ${d.quantity || (d.amount ? d.amount : '—')}</div>
        <div>Location: ${d.location || '—'}</div>
        <div style="margin-top:8px;"><button data-id="${d.id}" class="request-btn">Request</button></div>
      `;
      container.appendChild(el);
    });
    document.querySelectorAll('.request-btn').forEach(btn => {
      btn.addEventListener('click', ev => {
        const id = ev.target.dataset.id;
        createDonationRequest(id);
      });
    });
  } catch (e) {
    console.error(e);
  }
}

async function loadAdminDonations() {
  try {
    const res = await apiFetch(`${DONATIONS_ROOT}/`, { method: 'GET' });
    if (!res.ok) return;
    const list = await res.json();
    const container = document.getElementById('adminDonations') || document.getElementById('admin-donations') || document.getElementById('admin-donations-container');
    if (!container) return;
    container.innerHTML = '';
    list.forEach(d => {
      const el = document.createElement('div');
      el.className = 'donation-card';
      el.innerHTML = `
        <div><strong>${d.type}</strong> — ${d.description || ''}</div>
        <div>Donor: ${d.donor}</div>
        <div>Status: ${d.status}</div>
        <div style="margin-top:8px;">
          ${d.status === 'pending' ? `<button data-id="${d.id}" class="admin-approve">Approve</button>` : ''}
        </div>
      `;
      container.appendChild(el);
    });
    document.querySelectorAll('.admin-approve').forEach(btn => {
      btn.addEventListener('click', ev => adminApproveDonation(ev.target.dataset.id));
    });
  } catch (e) {
    console.error(e);
  }
}

async function adminApproveDonation(id) {
  try {
    const res = await apiFetch(`${DONATIONS_ROOT}/${id}/approve/`, { method: 'POST' });
    if (!res.ok) {
      const j = await res.json().catch(()=>({detail:'error'}));
      alert('Approve failed: ' + JSON.stringify(j));
      return;
    }
    alert('Donation approved.');
    loadAdminDonations();
  } catch (e) {
    console.error(e);
    alert('Approve failed (network).');
  }
}

// ---------------------------
// Donation requests (recipient flow)
// ---------------------------
async function createDonationRequest(donationId) {
  try {
    const res = await apiFetch(`${REQUESTS_ROOT}/`, {
      method: 'POST',
      body: JSON.stringify({ donation: donationId })
    });
    if (!res.ok) {
      const j = await res.json().catch(()=>({detail:'error'}));
      alert('Request failed: ' + JSON.stringify(j));
      return;
    }
    alert('Request submitted.');
    loadMyRequests();
  } catch (e) {
    console.error(e);
    alert('Request failed (network).');
  }
}

async function loadMyRequests() {
  try {
    const res = await apiFetch(`${REQUESTS_ROOT}/`, { method: 'GET' });
    if (!res.ok) return;
    const list = await res.json();
    const container = document.getElementById('myRequests');
    if (!container) return;
    container.innerHTML = '';
    list.forEach(r => {
      const el = document.createElement('div');
      el.className = 'request-card';
      el.innerHTML = `
        <div>Donation: ${r.donation}</div>
        <div>Status: ${r.status}</div>
      `;
      container.appendChild(el);
    });
  } catch (e) {
    console.error(e);
  }
}

// ---------------------------
// Payments (Razorpay): create order -> open checkout -> verify
// ---------------------------
// 

async function startFundPayment(amount, donationId = null) {
    // 1. Show demo popup
    alert(`Demo Payment Successful!\nAmount: ₹${amount}`);

    // 2. Create fake verification on backend
    try {
        const res = await apiFetch('/api/payments/verify/', {
            method: 'POST',
            body: JSON.stringify({
                razorpay_order_id: "demo_order",
                razorpay_payment_id: "demo_payment",
                razorpay_signature: "demo_signature",
                amount: amount,
                donation_id: donationId
            })
        });

        if (!res.ok) {
            const msg = await res.json();
            alert("Demo Payment Verification Failed");
            return;
        }

        alert("Donation marked as PAID successfully!");
        loadDonorDonations();

    } catch (e) {
        console.error(e);
        alert("Error simulating payment.");
    }
}


// ---------------------------
// Invoice modal helpers (aa.html uses invoiceModal & invoiceContent)
// ---------------------------
function openInvoiceModal(html) {
  const modal = document.getElementById('invoiceModal');
  const content = document.getElementById('invoiceContent');
  if (content) content.innerHTML = html;
  if (modal) modal.style.display = 'block';
}
function closeInvoiceModal(){
  const modal = document.getElementById('invoiceModal');
  if (modal) modal.style.display = 'none';
}
function downloadInvoice(){
  const content = document.getElementById('invoiceContent');
  if (!content) return alert('No invoice content');
  const blob = new Blob([content.innerHTML], {type: 'text/html'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `invoice.html`;
  a.click();
  URL.revokeObjectURL(url);
}

// ---------------------------
// Utility: update donor stats if present
// ---------------------------
async function updateDonorStats() {
  // simple counts based on donor donations
  try {
    const res = await apiFetch(`${DONATIONS_ROOT}/`, { method: 'GET' });
    if (!res.ok) return;
    const list = await res.json();
    const peopleHelped = list.reduce((acc, d) => {
      if (d.status === 'completed') return acc + (parseInt(d.quantity) || 0);
      return acc;
    }, 0);
    const active = list.filter(d => d.status !== 'completed').length;
    const phElem = document.getElementById('myPeopleHelped');
    const activeElem = document.getElementById('myActiveDonations');
    if (phElem) phElem.textContent = peopleHelped;
    if (activeElem) activeElem.textContent = active;
  } catch (e) {
    console.error(e);
  }
}

// ---------------------------
// Logout (exposed)
function logout() {
  clearTokens();
  window.currentUser = null;
  // show login page
  document.getElementById('loginPage')?.classList.remove('hidden');
  document.getElementById('registerPage')?.classList.add('hidden');
  // optionally reload to clear UI
  location.reload();
}
// expose logout globally if HTML calls it
window.logout = logout;

// expose functions expected by aa.html inline handlers
window.handleLogin = handleLogin;
window.showRegister = showRegister;
window.handleRegister = handleRegister;
window.backToLogin = backToLogin;
window.handleDonationTypeChange = handleDonationTypeChange;
window.postDonation = postDonation;
window.createDonationRequest = createDonationRequest;
window.adminApproveDonation = adminApproveDonation;
window.openInvoiceModal = openInvoiceModal;
window.closeInvoiceModal = closeInvoiceModal;
window.downloadInvoice = downloadInvoice;
window.startFundPayment = startFundPayment;

