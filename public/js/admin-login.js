// Admin Login JavaScript
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('adminLoginForm');
    const loginMessage = document.getElementById('loginMessage');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('/api/admin-login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const result = await response.json();
            if (result.success) {
                if (window.showAlert) window.showAlert('success', 'Admin login successful! Redirecting...');
                loginMessage.textContent = 'Admin login successful! Redirecting...';
                loginMessage.className = 'message success';
                loginMessage.style.display = 'block';
                setTimeout(() => { window.location.href = '/admin-dashboard'; }, 1500);
            } else {
                if (window.showAlert) window.showAlert('error', result.message || 'Login failed');
                loginMessage.textContent = result.message || 'Login failed';
                loginMessage.className = 'message error';
                loginMessage.style.display = 'block';
            }
        } catch (error) {
            console.error('Error:', error);
            if (window.showAlert) window.showAlert('error', 'An error occurred');
            loginMessage.textContent = 'An error occurred';
            loginMessage.className = 'message error';
            loginMessage.style.display = 'block';
        }
    });
});
