// Main JavaScript logic for the Expense Tracker
console.log("Expense Tracker script loaded.");

// Ensure supabaseClient is available
if (typeof supabaseClient === 'undefined') {
    console.error('Supabase client is not loaded. Make sure supabaseClient.js is included before main.js');
} else {
    console.log('Supabase client found.');
}

// DOM Elements
const authContainer = document.getElementById('auth-container');
const trackerContainer = document.getElementById('tracker-container');
const signupForm = document.getElementById('signup-form');
const loginForm = document.getElementById('login-form');
const logoutButton = document.getElementById('logout-button');
const signupMessage = document.getElementById('signup-message');
const loginMessage = document.getElementById('login-message');
const addExpenseForm = document.getElementById('add-expense-form');
const expenseList = document.getElementById('expense-list');
const expenseMessage = document.getElementById('expense-message');
const expenseDateInput = document.getElementById('expense-date');

// --- Authentication Logic ---

// Sign Up Handler
signupForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    signupMessage.textContent = ''; // Clear previous messages
    const email = signupForm.email.value;
    const password = signupForm.password.value;

    try {
        const { data, error } = await supabaseClient.auth.signUp({
            email: email,
            password: password,
        });

        if (error) throw error;

        // Check if email confirmation is required (depends on Supabase settings)
        if (data.user && data.user.identities && data.user.identities.length === 0) {
             signupMessage.textContent = 'Signup successful! Please check your email to confirm your account.';
             signupForm.reset();
        } else if (data.session) {
            // If auto-confirm is on or user already confirmed
            console.log('Signup and login successful!', data);
            // The onAuthStateChange listener will handle the UI update
            signupForm.reset();
        } else {
             signupMessage.textContent = 'Signup successful! Please check your email to confirm your account.';
             signupForm.reset();
        }

    } catch (error) {
        console.error('Signup Error:', error.message);
        signupMessage.textContent = `Signup failed: ${error.message}`;
    }
});

// Login Handler
loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    loginMessage.textContent = ''; // Clear previous messages

    // Get values directly from input elements by ID
    const emailInput = document.getElementById('login-email');
    const passwordInput = document.getElementById('login-password');
    const email = emailInput.value;
    const password = passwordInput.value;

    if (!email || !password) {
        loginMessage.textContent = 'Please enter both email and password.';
        return; // Stop if fields are empty
    }

    try {
        console.log(`Attempting login for: ${email}`); // Add logging
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (error) throw error;

        console.log('Login successful!', data);
        // The onAuthStateChange listener will handle the UI update
        loginForm.reset();

    } catch (error) {
        console.error('Login Error:', error.message);
        loginMessage.textContent = `Login failed: ${error.message}`;
    }
});

// Logout Handler
logoutButton.addEventListener('click', async () => {
    try {
        const { error } = await supabaseClient.auth.signOut();
        if (error) throw error;
        console.log('Logout successful');
        // The onAuthStateChange listener will handle the UI update
    } catch (error) {
        console.error('Logout Error:', error.message);
        alert(`Logout failed: ${error.message}`); // Simple alert for logout error
    }
});

// --- UI Update Logic ---

function updateUI(user) {
    if (user) {
        // User is logged in
        authContainer.classList.add('hidden');
        trackerContainer.classList.remove('hidden');
        
        // Store authentication state
        localStorage.setItem('isAuthenticated', 'true');
        
        console.log('User logged in, showing tracker.');
        fetchExpenses(); // Fetch expenses when user logs in or session is detected
        // Set default date for expense form to today
        expenseDateInput.valueAsDate = new Date();
    } else {
        // User is logged out
        authContainer.classList.remove('hidden');
        trackerContainer.classList.add('hidden');
        
        // Clear authentication state
        localStorage.removeItem('isAuthenticated');
        
        console.log('User logged out, showing auth forms.');
        displayExpenses([]); // Clear expense list on logout
    }
     // Clear any residual messages when state changes
    signupMessage.textContent = '';
    loginMessage.textContent = '';
    expenseMessage.textContent = ''; // Clear expense message too
}

// --- Initial Load and Auth State Change Listener ---

// Check initial session state
async function checkSession() {
     console.log('Checking initial session...');
    const { data: { session }, error } = await supabaseClient.auth.getSession();
     if (error) {
        console.error("Error getting session:", error);
        updateUI(null);
        return;
     }
     console.log('Initial session:', session);
    updateUI(session ? session.user : null);
    // Note: fetchExpenses is called inside updateUI if session exists
}

// Listen for authentication state changes (login, logout, token refresh)
supabaseClient.auth.onAuthStateChange((event, session) => {
    console.log('Auth state changed:', event, session);
    updateUI(session ? session.user : null);
});

// Initial check when the script loads
checkSession();


// --- Expense Tracking Logic ---

// Fetch expenses for the current user
async function fetchExpenses() {
    console.log('Fetching expenses...');
    expenseList.innerHTML = '<p class="text-gray-500">Loading expenses...</p>'; // Show loading state

    try {
        // Get current user
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) {
            console.log('No user logged in, cannot fetch expenses.');
            displayExpenses([]); // Ensure list is cleared
            return;
        }

        // Fetch expenses from Supabase, ordered by date descending
        const { data: expenses, error } = await supabaseClient
            .from('expenses')
            .select('*')
            .eq('user_id', user.id)
            .order('expense_date', { ascending: false })
            .order('created_at', { ascending: false }); // Secondary sort by creation time

        if (error) throw error;

        console.log('Expenses fetched:', expenses);
        displayExpenses(expenses);

    } catch (error) {
        console.error('Error fetching expenses:', error.message);
        expenseList.innerHTML = '<p class="text-red-500">Error loading expenses.</p>';
    }
}

// Display expenses in the list
function displayExpenses(expenses) {
    expenseList.innerHTML = ''; // Clear previous list or loading message

    if (!expenses || expenses.length === 0) {
        expenseList.innerHTML = '<p class="text-gray-500">No expenses recorded yet.</p>';
        return;
    }

    expenses.forEach(expense => {
        const expenseElement = document.createElement('div');
        // Added more padding, slightly darker border, increased rounding
        expenseElement.classList.add('p-4', 'bg-white', 'rounded-md', 'shadow', 'border', 'border-gray-300', 'mb-3');
        expenseElement.innerHTML = `
            <div class="flex justify-between items-start">
                <div>
                    <span class="font-semibold text-lg text-gray-700">${expense.category}</span>
                    ${expense.description ? `<p class="text-sm text-gray-500 mt-1">${expense.description}</p>` : ''}
                    <p class="text-xs text-gray-400 mt-1">Date: ${new Date(expense.expense_date).toLocaleDateString()}</p>
                </div>
                <span class="font-bold text-xl text-red-500 whitespace-nowrap ml-4">₹${parseFloat(expense.amount).toFixed(2)}</span>
            </div>
            <!-- Add Edit/Delete buttons later if needed -->
            <!-- Example: <button class="text-xs text-blue-500 hover:underline mt-1">Edit</button> -->
        `;
        expenseList.appendChild(expenseElement);
    });
}

// Add Expense Handler
addExpenseForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    expenseMessage.textContent = ''; // Clear previous messages

    const amount = addExpenseForm.amount.value;
    const category = addExpenseForm.category.value;
    const description = addExpenseForm.description.value;
    const date = addExpenseForm.date.value;

    try {
        // Get current user
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
        if (userError || !user) throw userError || new Error('User not logged in.');

        // Insert expense into Supabase
        const { data, error } = await supabaseClient
            .from('expenses')
            .insert([
                {
                    user_id: user.id,
                    amount: amount,
                    category: category,
                    description: description,
                    expense_date: date
                }
            ])
            .select(); // Return the inserted data

        if (error) throw error;

        console.log('Expense added:', data);
        expenseMessage.textContent = 'Expense added successfully!';
        expenseMessage.classList.remove('text-red-600');
        expenseMessage.classList.add('text-green-600');
        addExpenseForm.reset(); // Clear the form
        expenseDateInput.valueAsDate = new Date(); // Reset date to today
        fetchExpenses(); // Refresh the expense list

        // Clear success message after a few seconds
        setTimeout(() => { expenseMessage.textContent = ''; }, 3000);

    } catch (error) {
        console.error('Error adding expense:', error.message);
        expenseMessage.textContent = `Error: ${error.message}`;
        expenseMessage.classList.remove('text-green-600');
        expenseMessage.classList.add('text-red-600');
    }
});
