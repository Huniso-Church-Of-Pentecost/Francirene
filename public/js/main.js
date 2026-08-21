document.addEventListener('DOMContentLoaded', function() {
    if (!document.querySelector('.toast-container')) {
        const tc = document.createElement('div');
        tc.className = 'toast-container';
        document.body.appendChild(tc);
    }

    window.showAlert = function(type, message, timeout = 4500) {
        const container = document.querySelector('.toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        const icon = document.createElement('i');
        icon.className = type === 'success' ? 'fas fa-check-circle' : (type === 'error' ? 'fas fa-exclamation-circle' : 'fas fa-info-circle');
        const msg = document.createElement('div');
        msg.textContent = message;
        toast.appendChild(icon);
        toast.appendChild(msg);
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => container.removeChild(toast), 300);
        }, timeout);
    };
        const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(contactForm);
            const data = {
                name: formData.get('name') || contactForm.querySelector('input[placeholder="Your Name"]').value,
                email: formData.get('email') || contactForm.querySelector('input[placeholder="Your Email"]').value,
                subject: formData.get('subject') || contactForm.querySelector('input[placeholder="Subject"]').value,
                message: formData.get('message') || contactForm.querySelector('textarea[placeholder="Your Message"]').value
            };

            try {
                const response = await fetch('/api/contact', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });

                const result = await response.json();
                if (result.success) {
                    window.showAlert('success', 'Message sent successfully!');
                    contactForm.reset();
                } else {
                    window.showAlert('error', result.message || 'Failed to send message');
                }
            } catch (error) {
                console.error('Error:', error);
                window.showAlert('error', 'An error occurred while sending message');
            }
        });
    }

    const newsletterForm = document.getElementById('newsletterForm');
    if (newsletterForm) {
        const savedEmail = localStorage.getItem('subscribedEmail');
        if (savedEmail) {
            const emailInput = newsletterForm.querySelector('input[type="email"]') || 
                              newsletterForm.querySelector('input[placeholder="Your Email"]');
            if (emailInput) emailInput.value = savedEmail;
        }

        newsletterForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const emailInput = newsletterForm.querySelector('input[type="email"]') || 
                              newsletterForm.querySelector('input[placeholder="Your Email"]');
            const email = emailInput.value;
            const name = 'Newsletter Subscriber';

            try {
                const response = await fetch('/api/newsletter-signup', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, name })
                });

                const result = await response.json();
                if (result.success) {
                    localStorage.setItem('subscribedEmail', email);
                    sessionStorage.setItem('lastSubscribedEmail', email);
                    
                    window.showAlert('success', 'Successfully subscribed to newsletter!');
                    emailInput.disabled = true;
                    setTimeout(() => {
                        emailInput.disabled = false;
                    }, 2000);
                } else {
                    window.showAlert('error', result.message || 'Subscription failed');
                }
            } catch (error) {
                console.error('Error:', error);
                window.showAlert('error', 'An error occurred while subscribing');
            }
        });
    }

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href !== '#') {
                e.preventDefault();
                const element = document.querySelector(href);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    });

    const gpsLocation = document.getElementById('gpsLocation');
    if (gpsLocation && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
            gpsLocation.textContent = `Lat: ${position.coords.latitude.toFixed(2)}, Lon: ${position.coords.longitude.toFixed(2)}`;
        }, (error) => {
            console.log('Geolocation error:', error);
        });
    }

    const hamburger = document.querySelector('.hamburger');
    if (hamburger) {
        hamburger.addEventListener('click', () => {
            document.body.classList.toggle('nav-open');
        });
    }

    document.addEventListener('click', (e) => {
        if (!document.body.classList.contains('nav-open')) return;
        const target = e.target;
        if (target.closest('.mobile-nav') && target.tagName.toLowerCase() === 'a') {
            document.body.classList.remove('nav-open');
        }
    });
});

(function() {
    const MOBILE_BREAK = 900;
    let mobileCreated = false;
    let mobileNode = null;

    function createMobileNav() {
        if (mobileCreated) return;
        const nav = document.querySelector('.navbar');
        if (!nav) return;

        const mobile = document.createElement('div');
        mobile.className = 'mobile-nav';

        const links = nav.querySelector('.nav-links');
        const buttons = nav.querySelector('.nav-buttons');
        const mobileLinksWrap = document.createElement('div');
        mobileLinksWrap.className = 'mobile-links';

        if (links) {
            links.querySelectorAll('a').forEach(a => {
                const copy = a.cloneNode(true);
                copy.removeAttribute('id');
                mobileLinksWrap.appendChild(copy);
            });
        }

        mobile.appendChild(mobileLinksWrap);

        if (buttons) {
            const actions = document.createElement('div');
            actions.className = 'mobile-actions';
            buttons.querySelectorAll('a, button').forEach(el => {
                    const copy = el.cloneNode(true);
                    if (copy.hasAttribute && copy.hasAttribute('id')) copy.removeAttribute('id');
                    if (copy.hasAttribute && copy.hasAttribute('aria-expanded')) copy.removeAttribute('aria-expanded');
                actions.appendChild(copy);
            });
            mobile.appendChild(actions);
        }

        nav.parentNode.insertBefore(mobile, nav.nextSibling);
        mobileCreated = true;
        mobileNode = mobile;
    }

    function removeMobileNav() {
        if (!mobileCreated) return;
        if (mobileNode && mobileNode.parentNode) mobileNode.parentNode.removeChild(mobileNode);
        mobileCreated = false;
        mobileNode = null;
        document.body.classList.remove('nav-open');
    }

    function evaluate() {
        if (window.innerWidth <= MOBILE_BREAK) {
            createMobileNav();
        } else {
            removeMobileNav();
        }
    }

    let resizeTimer = null;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(evaluate, 150);
    });

    document.addEventListener('DOMContentLoaded', evaluate);
})();
