document.addEventListener('DOMContentLoaded', function () {
    // Login Form Submission
    const loginButton = document.getElementById('loginButton');
    if (loginButton) {
        loginButton.addEventListener('click', async function (e) {
            e.preventDefault();
            const email = document.getElementById('email')?.value;
            const password = document.getElementById('password')?.value;

            if (!email || !password) {
                alert("Email and password are required.");
                return;
            }

            try {
                const response = await fetch('http://localhost:8003/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password }),
                });

                const result = await response.json();
                if (!response.ok) {
                    alert(`Login failed: ${result.error || 'Unknown error'}`);
                    return;
                }

                // Store token and handle redirection
                localStorage.setItem('token', result.token);
                switch (result.role) {
                    case 'donor':
                        window.location.href = '/UserManagementDashboard.html';
                        break;
                    case 'receiver':
                        window.location.href = '/ReceiverDashboard.html';
                        break;
                    case 'admin':
                        window.location.href = '/AdminDashboard.html';
                        break;
                    case 'company':
                        window.location.href = '/CompanyManagementDashboard.html';
                        break;
                    default:
                        alert('Invalid role or unsupported login type.');
                }
            } catch (error) {
                console.error("Error in login request:", error);
                alert('An error occurred while trying to log in. Please try again.');
            }
        });
    }

    // Proceed to Payment
    const proceedButton = document.getElementById('proceed-to-payment');
    if (proceedButton) {
        proceedButton.addEventListener('click', function () {
            window.location.href = 'Payment.html';
        });
    }

    // Payment Form Submission
    const paymentForm = document.getElementById('payment-form');
    if (paymentForm) {
        paymentForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const cardNumber = document.getElementById('card-number')?.value;
            const expiryDate = document.getElementById('expiry-date')?.value;
            const cvc = document.getElementById('cvc')?.value;

            setTimeout(() => {
                const isValid = simulatePayment(cardNumber, expiryDate, cvc);
                displayResult(isValid);
            }, 1000);
        });
    }

    // Payment Report Section
    const showReportButton = document.getElementById('showReportButton');
    const reportTableContainer = document.getElementById('reportTableContainer');
    const selectedDateInput = document.getElementById('selectedDate');
    const errorDiv = document.getElementById('error-message');

    if (showReportButton && reportTableContainer && selectedDateInput) {
        showReportButton.addEventListener('click', async () => {
            reportTableContainer.innerHTML = '';
            const selectedDate = selectedDateInput.value;

            const dateObj = new Date(selectedDate);
            if (!selectedDate || isNaN(dateObj)) {
                if (errorDiv) {
                    errorDiv.textContent = 'Please select a valid date';
                    errorDiv.style.color = 'red';
                }
                return;
            }

            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    alert('Please log in to view payments.');
                    window.location.href = '/login.html';
                    return;
                }

                const allPayments = await fetchPayments(selectedDate);
                const filteredPayments = filterPaymentsByDate(allPayments, selectedDate);
                const table = createReportTable(filteredPayments);
                reportTableContainer.appendChild(table);
            } catch (error) {
                console.error("Error fetching payments:", error);
            }
        });
    }
});

// Supporting Functions

async function fetchPayments(selectedDate) {
    const token = localStorage.getItem('token');
    const response = await fetch(`http://localhost:8003/auth/payments/by-date/${selectedDate}`, {
        headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Failed to fetch payments');
    return await response.json();
}

function filterPaymentsByDate(payments, selectedDate) {
    const date = new Date(selectedDate);
    return payments.filter(payment => new Date(payment.date).toDateString() === date.toDateString());
}

function createReportTable(payments) {
    const table = document.createElement('table');
    table.border = "1";
    const headerRow = `<tr><th>Reference</th><th>Date</th><th>Amount</th><th>Status</th></tr>`;
    const rows = payments.map(payment => `
        <tr>
            <td>${payment.reference}</td>
            <td>${new Date(payment.date).toLocaleDateString()}</td>
            <td>R ${payment.amount.toFixed(2)}</td>
            <td>${payment.status ? 'Paid' : 'Unpaid'}</td>
        </tr>
    `);
    table.innerHTML = headerRow + rows.join('');
    return table;
}

function simulatePayment(cardNumber, expiryDate, cvc) {
    return cardNumber.length === 16 && /^\d{16}$/.test(cardNumber) &&
           expiryDate.match(/^\d{2}\/\d{2}$/) && cvc.length === 3;
}

function displayResult(isValid) {
    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = isValid ? '<p>Payment successful! Thank you for your donation.</p>' : '<p>Payment failed. Please check your details.</p>';
    resultDiv.style.color = isValid ? 'green' : 'red';
}
