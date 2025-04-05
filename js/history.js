// Initialize variables
let allExpenses = [];
let filteredExpenses = [];

// DOM Elements
const dateFilter = document.getElementById('date-filter');
const categoryFilter = document.getElementById('category-filter');
const sortFilter = document.getElementById('sort-filter');
const historyList = document.getElementById('expense-history-list');
const totalAmount = document.getElementById('total-amount');

// Event Listeners
dateFilter.addEventListener('change', applyFilters);
categoryFilter.addEventListener('change', applyFilters);
sortFilter.addEventListener('change', applyFilters);

// Check authentication and fetch expenses
async function initialize() {
    const { data: { session }, error } = await supabaseClient.auth.getSession();
    if (!session) {
        window.location.href = 'index.html';
        return;
    }
    
    // Add auth state change listener
    supabaseClient.auth.onAuthStateChange((event, session) => {
        if (!session) {
            window.location.href = 'index.html';
        }
    });

    await fetchExpenses();
    updateCategoryFilter();
}

// Fetch all expenses for the current user
async function fetchExpenses() {
    try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) throw new Error('No user found');

        const { data, error } = await supabaseClient
            .from('expenses')
            .select('*')
            .eq('user_id', user.id)
            .order('expense_date', { ascending: false });

        if (error) throw error;

        allExpenses = data;
        applyFilters();

    } catch (error) {
        console.error('Error fetching expenses:', error);
        historyList.innerHTML = '<p class="text-red-500 text-center">Error loading expenses</p>';
    }
}

// Update category filter options based on unique categories
function updateCategoryFilter() {
    const categories = [...new Set(allExpenses.map(expense => expense.category))];
    categoryFilter.innerHTML = '<option value="all">All Categories</option>' +
        categories.map(category => `<option value="${category}">${category}</option>`).join('');
}

// Apply filters and sort
function applyFilters() {
    let filtered = [...allExpenses];

    // Date filter
    const now = new Date();
    switch (dateFilter.value) {
        case 'week':
            filtered = filtered.filter(exp => new Date(exp.expense_date) >= new Date(now - 7 * 24 * 60 * 60 * 1000));
            break;
        case 'month':
            filtered = filtered.filter(exp => new Date(exp.expense_date) >= new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()));
            break;
        case 'year':
            filtered = filtered.filter(exp => new Date(exp.expense_date) >= new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()));
            break;
    }

    // Category filter
    if (categoryFilter.value !== 'all') {
        filtered = filtered.filter(exp => exp.category === categoryFilter.value);
    }

    // Sort
    switch (sortFilter.value) {
        case 'date-asc':
            filtered.sort((a, b) => new Date(a.expense_date) - new Date(b.expense_date));
            break;
        case 'date-desc':
            filtered.sort((a, b) => new Date(b.expense_date) - new Date(a.expense_date));
            break;
        case 'amount-asc':
            filtered.sort((a, b) => parseFloat(a.amount) - parseFloat(b.amount));
            break;
        case 'amount-desc':
            filtered.sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount));
            break;
    }

    filteredExpenses = filtered;
    displayExpenses();
}

// Display filtered expenses
function displayExpenses() {
    if (filteredExpenses.length === 0) {
        historyList.innerHTML = '<p class="text-gray-500 text-center py-4">No expenses found</p>';
        totalAmount.textContent = 'Total: ₹0.00';
        return;
    }

    const total = filteredExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
    totalAmount.textContent = `Total: ₹${total.toFixed(2)}`;

    historyList.innerHTML = filteredExpenses.map(expense => `
        <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div class="flex-1">
                <div class="flex justify-between items-start mb-2">
                    <h3 class="font-semibold text-gray-800">${expense.category}</h3>
                    <span class="font-bold text-lg ${parseFloat(expense.amount) >= 0 ? 'text-green-600' : 'text-red-600'}">
                        ₹${parseFloat(expense.amount).toFixed(2)}
                    </span>
                </div>
                <div class="flex justify-between items-center text-sm text-gray-600">
                    <span>${expense.description || 'No description'}</span>
                    <span>${new Date(expense.expense_date).toLocaleDateString()}</span>
                </div>
            </div>
        </div>
    `).join('');
}

// Initialize the page
initialize();
