// Parent Login JavaScript
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('parentLoginForm');
    const loginMessage = document.getElementById('loginMessage');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const parentId = document.getElementById('parentId').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('/api/parent-login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ parentId, password })
            });

            const result = await response.json();
            if (result.success) {
                if (window.showAlert) window.showAlert('success', 'Login successful! Redirecting...');
                loginMessage.textContent = 'Login successful! Redirecting...';
                loginMessage.className = 'message success';
                loginMessage.style.display = 'block';
                setTimeout(() => { window.location.href = '/parent-dashboard'; }, 1500);
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
