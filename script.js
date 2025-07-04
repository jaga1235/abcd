// ===== FIREBASE CONFIGURATION =====
const firebaseConfig = {
  apiKey: "AIzaSyDwSV0XUxlddgkrMp6EEQdLalwazZvz14E",
  authDomain: "jagan-8ef1b.firebaseapp.com",
  databaseURL: "https://jagan-8ef1b-default-rtdb.firebaseio.com",
  projectId: "jagan-8ef1b",
  storageBucket: "jagan-8ef1b.appspot.com",
  messagingSenderId: "630775772214",
  appId: "1:630775772214:web:1c2a6e3267209c4054d497",
  measurementId: "G-MNRX0CGBGP"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();

// ===== DOM ELEMENTS =====
const authSection = document.getElementById('authSection');
const dashboardSection = document.getElementById('dashboardSection');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const showRegister = document.getElementById('showRegister');
const showLogin = document.getElementById('showLogin');
const loginError = document.getElementById('loginError');
const registerError = document.getElementById('registerError');

// ===== GLOBAL VARIABLES =====
let currentUser = null;
let currentTab = 'home';
let previousTab = 'home';

// ===== INITIALIZE APP =====
document.addEventListener('DOMContentLoaded', function() {
  setupEventListeners();
  checkAuthState();
});

function setupEventListeners() {
  // Auth Forms
  loginForm.addEventListener('submit', handleLogin);
  registerForm.addEventListener('submit', handleRegister);
  showRegister.addEventListener('click', showRegisterForm);
  showLogin.addEventListener('click', showLoginForm);
  
  // Daily Sign-In
  document.querySelector('.option-card:nth-child(4)').addEventListener('click', handleDailySignIn);
}

function checkAuthState() {
  auth.onAuthStateChanged((user) => {
    if (user) {
      currentUser = user;
      showDashboard();
      loadUserData();
    } else {
      showAuthSection();
    }
  });
}

// ===== AUTH FUNCTIONS =====
function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;

  auth.signInWithEmailAndPassword(email, password)
    .then(() => {
      // Success handled by authStateChanged
    })
    .catch((error) => {
      loginError.textContent = error.message;
    });
}

function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById('registerName').value;
  const email = document.getElementById('registerEmail').value;
  const phone = document.getElementById('registerPhone').value;
  const password = document.getElementById('registerPassword').value;
  const confirmPassword = document.getElementById('registerConfirmPassword').value;

  if (password !== confirmPassword) {
    registerError.textContent = 'Passwords do not match';
    return;
  }

  auth.createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
      return database.ref('users/' + userCredential.user.uid).set({
        name: name,
        email: email,
        phone: phone,
        balance: 0,
        vipLevel: 0,
        referralCode: generateReferralCode(),
        bankDetails: null,
        transactions: {},
        orders: {},
        bills: {},
        createdAt: firebase.database.ServerValue.TIMESTAMP
      });
    })
    .catch((error) => {
      registerError.textContent = error.message;
    });
}

function generateReferralCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// ===== DASHBOARD FUNCTIONS =====
function showDashboard() {
  authSection.classList.add('hidden');
  dashboardSection.classList.remove('hidden');
  switchTab('home');
}

function showAuthSection() {
  authSection.classList.remove('hidden');
  dashboardSection.classList.add('hidden');
  showLoginForm();
}

function showLoginForm() {
  document.getElementById('loginContainer').classList.remove('hidden');
  document.getElementById('registerContainer').classList.add('hidden');
  loginError.textContent = '';
}

function showRegisterForm() {
  document.getElementById('loginContainer').classList.add('hidden');
  document.getElementById('registerContainer').classList.remove('hidden');
  registerError.textContent = '';
}

function loadUserData() {
  database.ref('users/' + currentUser.uid).on('value', (snapshot) => {
    const userData = snapshot.val();
    if (userData) {
      // Update Profile
      document.getElementById('userName').textContent = userData.name || 'User';
      document.getElementById('userPhone').textContent = userData.phone ? userData.phone.replace(/(\d{3})\d+(\d{3})/, '$1****$2') : '000****000';
      document.getElementById('userId').textContent = `[ID:${currentUser.uid.substring(0, 6)}]`;
      
      // Update Wallet
      document.getElementById('walletBalance').textContent = userData.balance || '0';
      
      // Update VIP Level
      updateVipLevel(userData.vipLevel || 0);
      
      // Update Referral Code
      if (userData.referralCode) {
        document.getElementById('referralCodeDisplay').textContent = userData.referralCode;
      }
      
      // Load Transactions
      loadTransactions(userData.transactions || {});
      
      // Load Orders
      loadOrders(userData.orders || {});
      
      // Load Bills
      loadBills(userData.bills || {});
    }
  });
}

function updateVipLevel(level) {
  const vipLevelElement = document.getElementById('vipLevel');
  vipLevelElement.textContent = `VIP ${level}`;
  
  // Update progress based on VIP level
  const progress = [0, 25, 50, 75, 100][level] || 0;
  document.getElementById('vipProgress').style.width = `${progress}%`;
  document.getElementById('vipProgressText').textContent = 
    `Current progress ${progress} / 100`;
}

// ===== TAB NAVIGATION =====
function switchTab(tabId, element) {
  // Hide all tabs
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.remove('active');
  });
  
  // Show selected tab
  document.getElementById(tabId).classList.add('active');
  
  // Update nav tab active state
  if (element) {
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.classList.remove('active');
    });
    element.classList.add('active');
  }
  
  // Update tab history
  previousTab = currentTab;
  currentTab = tabId;
}

function goBack() {
  switchTab(previousTab);
}

// ===== TRANSACTION FUNCTIONS =====
function loadTransactions(transactions) {
  const productHistory = document.getElementById('productIncomeHistory');
  const extraHistory = document.getElementById('extraIncomeHistory');
  const teamHistory = document.getElementById('teamIncomeHistory');
  
  productHistory.innerHTML = '';
  extraHistory.innerHTML = '';
  teamHistory.innerHTML = '';
  
  Object.entries(transactions).forEach(([id, transaction]) => {
    const item = document.createElement('div');
    item.className = 'history-item';
    item.innerHTML = `💸 ${transaction.amount} ${transaction.type} - ${transaction.status}`;
    
    if (transaction.type === 'Product Income') {
      productHistory.appendChild(item);
    } else if (transaction.type === 'Team Income') {
      teamHistory.appendChild(item);
    } else {
      extraHistory.appendChild(item);
    }
  });
}

function addTransaction(type, amount, status = 'Success') {
  const transactionId = `TXN${Date.now()}`;
  const transaction = {
    type: type,
    amount: amount,
    status: status,
    timestamp: firebase.database.ServerValue.TIMESTAMP
  };
  
  return database.ref(`users/${currentUser.uid}/transactions/${transactionId}`).set(transaction);
}

// ===== RECHARGE & WITHDRAWAL =====
function showRechargePopup() {
  document.getElementById('rechargePopup').classList.remove('hidden');
}

function showWithdrawalPopup() {
  // Check if bank details exist
  database.ref(`users/${currentUser.uid}/bankDetails`).once('value').then((snapshot) => {
    if (snapshot.exists()) {
      document.getElementById('withdrawalPopup').classList.remove('hidden');
    } else {
      alert('Please add bank details first!');
      switchTab('bankCard');
    }
  });
}

function submitRecharge() {
  const mobile = document.getElementById('rechargeMobile').value;
  const amount = parseFloat(document.getElementById('rechargeAmount').value);
  
  if (!mobile || !amount) {
    alert('Please fill all fields');
    return;
  }
  
  // Add to transactions
  addTransaction('Recharge', amount, 'Pending')
    .then(() => {
      // Update wallet balance in Firebase
      return database.ref(`users/${currentUser.uid}/balance`).transaction((currentBalance) => {
        return (currentBalance || 0) + amount;
      });
    })
    .then(() => {
      alert('Recharge request submitted!');
      closePopup('rechargePopup');
    });
}

function submitWithdrawal() {
  const amount = parseFloat(document.getElementById('withdrawalAmount').value);
  const password = document.getElementById('withdrawalPassword').value;
  
  if (!amount || !password) {
    alert('Please fill all fields');
    return;
  }
  
  // Verify password (in real app, use re-authentication)
  auth.signInWithEmailAndPassword(currentUser.email, password)
    .then(() => {
      // Check balance
      return database.ref(`users/${currentUser.uid}/balance`).once('value');
    })
    .then((snapshot) => {
      const currentBalance = snapshot.val() || 0;
      if (currentBalance < amount) {
        throw new Error('Insufficient balance');
      }
      
      // Deduct from balance
      return database.ref(`users/${currentUser.uid}/balance`).set(currentBalance - amount);
    })
    .then(() => {
      // Add withdrawal transaction
      return addTransaction('Withdrawal', amount, 'Pending');
    })
    .then(() => {
      alert('Withdrawal request submitted!');
      closePopup('withdrawalPopup');
    })
    .catch((error) => {
      alert(error.message);
    });
}

// ===== INVESTMENT PLANS =====
function showPlanDetails(amount, dailyIncome, recyclePeriod, recycleTime, vipLevel) {
  document.getElementById('planAmount').textContent = amount;
  document.getElementById('dailyIncome').textContent = dailyIncome;
  document.getElementById('recyclePeriod').textContent = recyclePeriod;
  document.getElementById('recycleTime').textContent = recycleTime;
  document.getElementById('vipLevelPlan').textContent = vipLevel;
  document.getElementById('planAmountDisplay').textContent = amount;
  switchTab('planDetails');
}

function submitInvestment() {
  const utr = document.getElementById('upiCode').value;
  const planAmount = document.getElementById('planAmount').textContent;
  const vipLevel = document.getElementById('vipLevelPlan').textContent;
  
  if (!utr || utr.length !== 12) {
    alert('Please enter a valid 12-digit UTR');
    return;
  }
  
  const orderId = `ORD${Date.now()}`;
  const order = {
    amount: planAmount,
    utr: utr,
    vipLevel: vipLevel,
    status: 'Pending',
    timestamp: firebase.database.ServerValue.TIMESTAMP
  };
  
  // Save order
  database.ref(`users/${currentUser.uid}/orders/${orderId}`).set(order)
    .then(() => {
      // Update VIP level
      const level = parseInt(vipLevel.split(' ')[1]);
      return database.ref(`users/${currentUser.uid}/vipLevel`).set(level);
    })
    .then(() => {
      alert('Investment submitted!');
      document.getElementById('upiCode').value = '';
      document.getElementById('upiSection').style.display = 'none';
      document.getElementById('paymentOptions').style.display = 'none';
      switchTab('home');
    });
}

// ===== DAILY SIGN-IN =====
function handleDailySignIn() {
  document.getElementById('dailySignInPopup').classList.remove('hidden');
  
  // Add bonus to wallet
  database.ref(`users/${currentUser.uid}/balance`).transaction((currentBalance) => {
    return (currentBalance || 0) + 5;
  });
  
  // Add transaction
  addTransaction('Daily Bonus', 5);
}

// ===== LOAD ORDERS & BILLS =====
function loadOrders(orders) {
  const ordersList = document.getElementById('ordersList');
  ordersList.innerHTML = '';
  
  Object.entries(orders).forEach(([id, order]) => {
    const item = document.createElement('div');
    item.className = 'history-item';
    item.innerHTML = `
      <strong>${order.amount}</strong><br>
      UTR: ${order.utr}<br>
      VIP: ${order.vipLevel}<br>
      Status: ${order.status}
    `;
    ordersList.appendChild(item);
  });
}

function loadBills(bills) {
  const billsList = document.getElementById('billsList');
  billsList.innerHTML = '';
  
  Object.entries(bills).forEach(([id, bill]) => {
    const item = document.createElement('div');
    item.className = 'history-item';
    item.innerHTML = `
      <strong>${bill.type}</strong><br>
      Amount: ₹${bill.amount}<br>
      Status: ${bill.status}
    `;
    billsList.appendChild(item);
  });
}

// ===== BANK DETAILS =====
function saveBankDetails() {
  const bankName = document.getElementById('bankName').value;
  const accountNumber = document.getElementById('accountNumber').value;
  const ifscCode = document.getElementById('ifscCode').value;
  const holderName = document.getElementById('holderName').value;
  
  if (!bankName || !accountNumber || !ifscCode || !holderName) {
    alert('Please fill all fields');
    return;
  }
  
  const bankDetails = {
    bankName: bankName,
    accountNumber: accountNumber,
    ifscCode: ifscCode,
    holderName: holderName
  };
  
  database.ref(`users/${currentUser.uid}/bankDetails`).set(bankDetails)
    .then(() => {
      alert('Bank details saved successfully!');
    });
}

// ===== UTILITY FUNCTIONS =====
function closePopup(id) {
  document.getElementById(id).classList.add('hidden');
}

function logout() {
  auth.signOut().then(() => {
    showAuthSection();
  });
}

// ===== TAB SPECIFIC FUNCTIONS =====
function showProductIncome() {
  switchTab('productIncome');
}

function showExtraIncome() {
  switchTab('extraIncome');
}

function goToTeam() {
  switchTab('team');
}

function showStableSeries() {
  switchTab('stableSeries');
}

function showMyOrders() {
  switchTab('myOrders');
}

function showMyBill() {
  switchTab('myBill');
}

function togglePaymentOptions() {
  const options = document.getElementById('paymentOptions');
  options.style.display = options.style.display === 'none' ? 'block' : 'none';
}

function selectSuperior() {
  document.getElementById('superiorPayment').style.display = 'block';
  document.getElementById('binancePayment').style.display = 'none';
}

function selectBinance() {
  document.getElementById('superiorPayment').style.display = 'none';
  document.getElementById('binancePayment').style.display = 'block';
}

function selectUPI() {
  document.getElementById('upiSection').style.display = 'block';
}
