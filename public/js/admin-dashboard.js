// Admin Dashboard JavaScript
document.addEventListener('DOMContentLoaded', function() {
    setupNavigation();
    loadDashboard();
    setupForms();
    loadTimetables();
    loadResources();
    loadReviews();

    // Logout functionality
    document.getElementById('logout').addEventListener('click', async (e) => {
        e.preventDefault();
        try {
            await fetch('/api/admin-logout', { method: 'POST' });
            window.location.href = '/';
        } catch (error) {
            console.error('Logout error:', error);
        }
    });
});

function setupNavigation() {
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            
            menuItems.forEach(mi => mi.classList.remove('active'));
            item.classList.add('active');
            
            const sectionId = item.getAttribute('onclick').match(/'([^']+)'/)[1];
            showSection(sectionId);
        });
    });
}

function showSection(sectionId) {
    const sections = document.querySelectorAll('.admin-section');
    sections.forEach(section => section.classList.remove('active'));
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        // trigger section-specific animations
        if (sectionId === 'newsletter' && window.animateAdminNewsletterOpen) {
            window.animateAdminNewsletterOpen();
        }
    }
}

async function loadDashboard() {
    try {
        // Load enrollments
        const response = await fetch('/api/enrollments');
        const data = await response.json();
        
        if (data.success) {
            const enrollments = data.enrollments;
            const approved = enrollments.filter(e => e.status === 'approved').length;
            const rejected = enrollments.filter(e => e.status === 'rejected').length;
            const pending = enrollments.filter(e => e.status === 'pending').length;

            document.getElementById('totalEnrollments').textContent = enrollments.length;
            document.getElementById('approvedCount').textContent = approved;
            document.getElementById('rejectedCount').textContent = rejected;
            document.getElementById('pendingCount').textContent = pending;

            // Populate student select in reviews section
            populateStudentSelect(enrollments);
            // Load enrollment status
            const statusResponse = await fetch('/api/enrollment-status');
            const statusData = await statusResponse.json();
            const statusText = statusData.enrollmentClosed ? 'Enrollment CLOSED' : 'Enrollment OPEN';
            document.getElementById('enrollmentStatusText').textContent = `Current Status: ${statusText} (${statusData.enrollmentCount}/${statusData.enrollmentLimit} enrolled)`;
            // Populate enrollment limit input if present
            const enrollmentLimitInput = document.getElementById('enrollmentLimit');
            if (enrollmentLimitInput) enrollmentLimitInput.value = statusData.enrollmentLimit;

            // Load all enrollments
            loadEnrollmentsList(enrollments, 'enrollmentsList');
            loadEnrollmentsList(enrollments.filter(e => e.status === 'approved'), 'approvedList');
            loadEnrollmentsList(enrollments.filter(e => e.status === 'rejected'), 'rejectedList');
        }
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }

    // Load subjects for resource upload form
    try {
        const response = await fetch('/api/subjects');
        const data = await response.json();
        if (data.success) {
            const subjectSelect = document.getElementById('resourceSubject');
            subjectSelect.innerHTML = data.subjects.map(subject => 
                `<option value="${subject}">${subject}</option>`
            ).join('');
        }
    } catch (error) {
        console.error('Error loading subjects:', error);
    }
}

function loadEnrollmentsList(enrollments, containerId) {
    const container = document.getElementById(containerId);
    if (enrollments.length === 0) {
        container.innerHTML = '<p>No enrollments to display.</p>';
        return;
    }

    container.innerHTML = enrollments.map(enrollment => `
        <div class="enrollment-item ${enrollment.status}">
            <div class="enrollment-header">
                <h3>${enrollment.childName}</h3>
                <span class="enrollment-status ${enrollment.status}">${enrollment.status.toUpperCase()}</span>
            </div>
            <div class="enrollment-details">
                <div class="enrollment-detail">
                    <strong>Parent ID:</strong>
                    ${enrollment.parentId}
                </div>
                <div class="enrollment-detail">
                    <strong>Student ID:</strong>
                    ${enrollment.studentId}
                </div>
                <div class="enrollment-detail">
                    <strong>Guardian Email:</strong>
                    ${enrollment.guardianEmail}
                </div>
                <div class="enrollment-detail">
                    <strong>Service Type:</strong>
                    ${enrollment.serviceType}
                </div>
                <div class="enrollment-detail">
                    <strong>Subjects:</strong>
                    ${enrollment.subjects.join(', ')}
                </div>
            </div>
            ${enrollment.status === 'pending' ? `
                <div class="enrollment-actions">
                    <button class="btn btn-primary" onclick="approveEnrollment('${enrollment.id}')">Approve</button>
                    <button class="btn btn-outline" onclick="rejectEnrollment('${enrollment.id}')">Reject</button>
                    <button class="btn btn-danger" onclick="deleteEnrollment('${enrollment.id}')">Delete</button>
                </div>
            ` : ''}
            ${enrollment.status !== 'pending' ? `
                <div class="enrollment-actions">
                    <button class="btn btn-danger" onclick="deleteEnrollment('${enrollment.id}')">Delete</button>
                </div>
            ` : ''}
        </div>
    `).join('');
}

async function approveEnrollment(enrollmentId) {
    try {
        const response = await fetch('/api/approve-enrollment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ enrollmentId })
        });

        const result = await response.json();
        if (result.success) {
            if (window.showAlert) window.showAlert('success', 'Enrollment approved successfully!');
            loadDashboard();
        }
    } catch (error) {
        console.error('Error:', error);
        if (window.showAlert) window.showAlert('error', 'Failed to approve enrollment');
    }
}

async function rejectEnrollment(enrollmentId) {
    try {
        const response = await fetch('/api/reject-enrollment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ enrollmentId })
        });

        const result = await response.json();
        if (result.success) {
            if (window.showAlert) window.showAlert('success', 'Enrollment rejected successfully!');
            loadDashboard();
        }
    } catch (error) {
        console.error('Error:', error);
        if (window.showAlert) window.showAlert('error', 'Failed to reject enrollment');
    }
}

function setupForms() {
    // Toggle enrollment
    const toggleBtn = document.getElementById('toggleEnrollment');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', async () => {
            try {
                const response = await fetch('/api/toggle-enrollment', { method: 'POST' });
                const result = await response.json();
                if (window.showAlert) window.showAlert('info', result.message);
                loadDashboard();
            } catch (error) {
                console.error('Error:', error);
            }
        });
    }

    // Resource upload
    const resourceForm = document.getElementById('resourceForm');
    if (resourceForm) {
        const resourceFile = document.getElementById('resourceFile');
        
        // Add preview handler
        if (resourceFile) {
            resourceFile.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        const preview = document.getElementById('filePreview');
                        if (preview) {
                            preview.src = event.target.result;
                            preview.style.display = 'block';
                        } else {
                            const img = document.createElement('img');
                            img.id = 'filePreview';
                            img.src = event.target.result;
                            img.style.maxWidth = '200px';
                            img.style.marginTop = '1rem';
                            img.style.borderRadius = '8px';
                            resourceFile.parentElement.appendChild(img);
                        }
                    };
                    reader.readAsDataURL(file);
                }
            });
        }

        resourceForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData();
            formData.append('title', document.getElementById('resourceTitle').value);
            formData.append('subject', document.getElementById('resourceSubject').value);
            formData.append('description', document.getElementById('resourceDescription').value);
            formData.append('file', document.getElementById('resourceFile').files[0]);

            try {
                const response = await fetch('/api/upload-resource', {
                    method: 'POST',
                    body: formData
                });

                const result = await response.json();
                if (result.success) {
                    showMessage('Resource uploaded successfully!', 'success', 'resourceMessage');
                    resourceForm.reset();
                    const preview = document.getElementById('filePreview');
                    if (preview) preview.style.display = 'none';
                    // reload resources grid
                    loadResources();
                } else {
                    showMessage('Upload failed', 'error', 'resourceMessage');
                }
            } catch (error) {
                console.error('Error:', error);
                showMessage('An error occurred', 'error', 'resourceMessage');
            }
        });
    }

    // Welcome motion upload
    const welcomeMotionForm = document.getElementById('welcomeMotionForm');
    const welcomeMotionFile = document.getElementById('welcomeMotionFile');
    const welcomeMotionPreview = document.getElementById('welcomeMotionPreview');
    if (welcomeMotionFile) {
        welcomeMotionFile.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const url = URL.createObjectURL(file);
            if (welcomeMotionPreview) {
                welcomeMotionPreview.src = url;
                welcomeMotionPreview.style.display = 'block';
            }
        });
    }

    if (welcomeMotionForm) {
        welcomeMotionForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const file = welcomeMotionFile.files[0];
            if (!file) {
                showMessage('Please choose a file', 'error', 'welcomeMotionMessage');
                return;
            }

            const formData = new FormData();
            formData.append('file', file);

            try {
                const res = await fetch('/api/upload-welcome-motion', { method: 'POST', body: formData });
                const result = await res.json();
                if (result.success) {
                    showMessage('Welcome motion uploaded', 'success', 'welcomeMotionMessage');
                    // keep preview
                } else {
                    showMessage(result.message || 'Upload failed', 'error', 'welcomeMotionMessage');
                }
            } catch (err) {
                console.error('Error uploading motion:', err);
                showMessage('An error occurred', 'error', 'welcomeMotionMessage');
            }
        });
    }

    // Load current welcome motion preview if set
    async function loadWelcomeMotionAdmin() {
        try {
            const r = await fetch('/api/welcome-motion');
            const j = await r.json();
            if (j.success && j.url && welcomeMotionPreview) {
                welcomeMotionPreview.src = j.url;
                welcomeMotionPreview.style.display = 'block';
            }
        } catch (err) {
            console.warn('Error loading welcome motion:', err);
        }
    }

    // Call it now to show existing motion
    loadWelcomeMotionAdmin();

    // Timetable creation
    const timetableForm = document.getElementById('timetableForm');
    if (timetableForm) {
        timetableForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            try {
                const classesJSON = document.getElementById('timetableClasses').value;
                const classes = JSON.parse(classesJSON);

                const data = {
                    title: document.getElementById('timetableTitle').value,
                    startDate: document.getElementById('startDate').value,
                    endDate: document.getElementById('endDate').value,
                    repeatWeeks: parseInt(document.getElementById('repeatWeeks').value),
                    classes
                };

                const response = await fetch('/api/create-timetable', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });

                const result = await response.json();
                if (result.success) {
                    showMessage('Timetable created successfully!', 'success', 'timetableMessage');
                    timetableForm.reset();
                    loadTimetables();  // Reload the timetable list
                } else {
                    showMessage('Creation failed', 'error', 'timetableMessage');
                }
            } catch (error) {
                console.error('Error:', error);
                showMessage('An error occurred', 'error', 'timetableMessage');
            }
        });
    }

    // Admin Newsletter (styled, animated)
    const adminNewsletterForm = document.getElementById('adminNewsletterForm');
    if (adminNewsletterForm) {
        adminNewsletterForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const subj = document.getElementById('newsletterSubject').value;
            const msg = document.getElementById('newsletterMessage').value;
            const sendBtn = adminNewsletterForm.querySelector('.send-newsletter');
            const plane = sendBtn ? sendBtn.querySelector('.send-plane') : null;

            // Animate send icon (GSAP preferred)
            if (typeof gsap !== 'undefined' && plane) {
                // create a flight animation
                gsap.to(plane, { x: 220, y: -18, rotation: 15, opacity: 0, duration: 0.85, ease: 'power2.in', onComplete: () => {
                    showMessage('Newsletter will be sent to all subscribers!', 'success', 'newsletterStatus');
                    adminNewsletterForm.reset();
                    // reset plane
                    gsap.set(plane, { clearProps: 'all' });
                }});
            } else if (plane) {
                // fallback CSS class
                plane.classList.add('sending');
                setTimeout(() => {
                    plane.classList.remove('sending');
                    showMessage('Newsletter will be sent to all subscribers!', 'success', 'newsletterStatus');
                    adminNewsletterForm.reset();
                }, 900);
            } else {
                    showMessage('Newsletter will be sent to all subscribers!', 'success', 'newsletterStatus');
                adminNewsletterForm.reset();
            }
        });
    }

    // Animate admin newsletter when section opens
    window.animateAdminNewsletterOpen = function() {
        const card = document.querySelector('.newsletter-form-card');
        if (!card) return;
        const inputs = card.querySelectorAll('.form-group');
        const btn = card.querySelector('.send-newsletter');
        if (typeof gsap !== 'undefined') {
            const tl = gsap.timeline();
            gsap.set(card.querySelectorAll('.decor-circle'), { opacity: 0, y: -8 });
            tl.to(card.querySelectorAll('.decor-circle'), { opacity: 1, y: 0, stagger: 0.08, duration: 0.6, ease: 'power2.out' })
              .from(inputs, { y: 8, opacity: 0, stagger: 0.1, duration: 0.45, ease: 'power2.out' }, '-=0.25')
              .from(btn, { scale: 0.95, opacity: 0, duration: 0.4, ease: 'back.out(1.2)' }, '-=0.2');
        } else {
            // CSS fallback: quick class toggle
            card.classList.add('animated');
            setTimeout(() => card.classList.remove('animated'), 800);
        }
    };

    // Student Review Form
    const studentReviewForm = document.getElementById('studentReviewForm');
    if (studentReviewForm) {
        studentReviewForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const data = {
                studentId: document.getElementById('studentSelect').value,
                academicPerformance: document.getElementById('academicPerformance').value,
                behavior: document.getElementById('behavior').value,
                attendance: parseInt(document.getElementById('attendance').value),
                teacherRemarks: document.getElementById('teacherRemarks').value,
                parentalAdvice: document.getElementById('parentalAdvice').value
            };

            if (!data.studentId) {
                showMessage('Please select a student', 'error', 'reviewMessage');
                return;
            }

            try {
                const response = await fetch('/api/save-review', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });

                const result = await response.json();
                if (result.success) {
                    showMessage('Review saved successfully!', 'success', 'reviewMessage');
                    studentReviewForm.reset();
                    loadReviews();
                } else {
                    showMessage('Failed to save review', 'error', 'reviewMessage');
                }
            } catch (error) {
                console.error('Error:', error);
                showMessage('An error occurred', 'error', 'reviewMessage');
            }
        });
    }
}

    // Change Password
    const changePasswordForm = document.getElementById('changePasswordForm');
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const currentPassword = document.getElementById('currentPassword').value;
            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            if (newPassword !== confirmPassword) {
                showMessage('Passwords do not match', 'error', 'passwordMessage');
                return;
            }
            try {
                const response = await fetch('/api/change-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ currentPassword, newPassword })
                });
                const result = await response.json();
                if (result.success) {
                    showMessage('Password updated successfully', 'success', 'passwordMessage');
                    changePasswordForm.reset();
                } else {
                    showMessage(result.message || 'Failed to update password', 'error', 'passwordMessage');
                }
            } catch (error) {
                console.error('Error changing password:', error);
                showMessage('An error occurred', 'error', 'passwordMessage');
            }
        });
    }

    // Enrollment Settings
    const enrollmentSettingsForm = document.getElementById('enrollmentSettingsForm');
    if (enrollmentSettingsForm) {
        enrollmentSettingsForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const limit = parseInt(document.getElementById('enrollmentLimit').value, 10);
            if (!limit || limit < 1) {
                showMessage('Please enter a valid limit', 'error', 'settingsMessage');
                return;
            }
            try {
                const response = await fetch('/api/update-enrollment-limit', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ enrollmentLimit: limit })
                });
                const result = await response.json();
                if (result.success) {
                    showMessage('Enrollment limit updated', 'success', 'settingsMessage');
                    loadDashboard();
                } else {
                    showMessage(result.message || 'Update failed', 'error', 'settingsMessage');
                }
            } catch (error) {
                console.error('Error updating enrollment limit:', error);
                showMessage('An error occurred', 'error', 'settingsMessage');
            }
        });
    }

// Load resources for admin panel
async function loadResources() {
    try {
        const response = await fetch('/api/resources');
        const data = await response.json();
        const container = document.getElementById('resourcesGrid');
        if (!container) return;
        if (!data.success || data.resources.length === 0) {
            container.innerHTML = '<p>No resources uploaded yet.</p>';
            return;
        }

        container.innerHTML = data.resources.map(r => {
            const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(r.filename);
            return `
            <div class="resource-card">
                ${isImage ? `<div class="resource-preview"><img src="/uploads/${r.filename}" alt="${r.title}" style="width:100%; height:150px; object-fit:cover; border-radius:8px 8px 0 0;"></div>` : `<div class="resource-icon"><i class="fas fa-file"></i></div>`}
                <h3>${r.title}</h3>
                <p>${r.description || ''}</p>
                <div class="resource-subject">${r.subject}</div>
                <div class="resource-actions">
                    <a class="btn-view" href="/uploads/${r.filename}" download="${r.originalName || r.filename}">${r.originalName || 'Download'}</a>
                    <button class="btn-delete" onclick="deleteResource('${r.id}')">Delete</button>
                </div>
            </div>
        `}).join('');
    } catch (error) {
        console.error('Error loading resources:', error);
    }
}

async function deleteResource(id) {
    if (!confirm('Delete resource?')) return;
    try {
        const response = await fetch(`/api/resources/${id}`, { method: 'DELETE' });
        const result = await response.json();
        if (result.success) {
            showMessage('Resource deleted', 'success', 'resourceMessage');
            loadResources();
        } else {
            showMessage(result.message || 'Delete failed', 'error', 'resourceMessage');
        }
    } catch (error) {
        console.error('Error deleting resource:', error);
        showMessage('An error occurred while deleting', 'error', 'resourceMessage');
    }
}

// Reviews: populate student select and load reviews list
function populateStudentSelect(enrollments) {
    const select = document.getElementById('studentSelect');
    if (!select) return;
    select.innerHTML = '<option value="">-- Choose a Student --</option>' + enrollments.map(e => `<option value="${e.studentId}">${e.childName} (${e.studentId})</option>`).join('');
}

async function loadReviews() {
    try {
        const response = await fetch('/api/reviews');
        const data = await response.json();
        const container = document.getElementById('reviewsList');
        if (!container) return;
        if (!data.success || data.reviews.length === 0) {
            container.innerHTML = '<p>No reviews yet.</p>';
            return;
        }

        container.innerHTML = data.reviews.map(r => `
            <div class="review-item">
                <h4>Review for ${r.studentId}</h4>
                <p><strong>Academic:</strong> ${r.academicPerformance}</p>
                <p><strong>Behavior:</strong> ${r.behavior}</p>
                <p><strong>Attendance:</strong> ${r.attendance}%</p>
                <p>${r.teacherRemarks || ''}</p>
                <p class="small muted">${new Date(r.createdAt).toLocaleString()}</p>
                <div style="margin-top:0.5rem"><button class="btn-outline" onclick="deleteReview('${r.id}')">Delete</button></div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading reviews:', error);
    }
}

function showMessage(msg, type, elementId) {
    if (window.showAlert) window.showAlert(type === 'error' ? 'error' : (type === 'success' ? 'success' : 'info'), msg);
    const messageEl = document.getElementById(elementId);
    if (!messageEl) return;
    messageEl.textContent = msg;
    messageEl.className = `message ${type}`;
    messageEl.style.display = 'block';
    setTimeout(() => {
        messageEl.style.display = 'none';
    }, 3000);
}

// Timetable viewer and management
async function loadTimetables() {
    try {
        const response = await fetch('/api/timetables');
        const data = await response.json();

        if (!data.success || !data.timetables || data.timetables.length === 0) {
            document.getElementById('timetableListContainer').innerHTML = '<p>No timetables created yet.</p>';
            return;
        }

        const container = document.getElementById('timetableListContainer');
        container.innerHTML = data.timetables.map(timetable => `
            <div class="timetable-item">
                <h3>${timetable.title}</h3>
                <div class="timetable-item-meta">
                    <span><strong>Start:</strong> ${new Date(timetable.startDate).toLocaleDateString()}</span>
                    <span><strong>End:</strong> ${new Date(timetable.endDate).toLocaleDateString()}</span>
                    <span><strong>Repeats:</strong> ${timetable.repeatWeeks} week(s)</span>
                </div>
                ${renderTimetableGrid(timetable)}
                <div class="timetable-item-actions">
                    <button class="btn btn-outline btn-sm" onclick="deleteTimetable('${timetable.id}')">Delete</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading timetables:', error);
    }
}

function renderTimetableGrid(timetable) {
    if (!timetable.classes || timetable.classes.length === 0) {
        return '<p>No classes in this timetable.</p>';
    }

    // Group classes by day
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const dayMap = {};
    
    days.forEach(day => {
        dayMap[day] = [];
    });

    timetable.classes.forEach(cls => {
        if (dayMap[cls.day]) {
            dayMap[cls.day].push(cls);
        }
    });

    // Sort classes by time within each day
    days.forEach(day => {
        dayMap[day].sort((a, b) => a.time.localeCompare(b.time));
    });

    // Build table
    let html = '<table class="timetable-grid"><thead><tr><th>Time</th>';
    days.forEach(day => {
        html += `<th>${day}</th>`;
    });
    html += '</tr></thead><tbody>';

    // Get all unique times
    const times = new Set();
    timetable.classes.forEach(cls => times.add(cls.time));
    const sortedTimes = Array.from(times).sort();

    // Build rows for each time slot
    sortedTimes.forEach(time => {
        html += `<tr><td class="time-slot">${time}</td>`;
        days.forEach(day => {
            const classForSlot = dayMap[day].find(c => c.time === time);
            html += '<td>';
            if (classForSlot) {
                html += `
                    <div class="subject-name">${classForSlot.subject}</div>
                    <div class="class-name">${classForSlot.class}</div>
                `;
            }
            html += '</td>';
        });
        html += '</tr>';
    });

    html += '</tbody></table>';
    return html;
}

async function deleteTimetable(timetableId) {
    if (!confirm('Are you sure you want to delete this timetable?')) return;
    try {
        const response = await fetch(`/api/timetables/${timetableId}`, { method: 'DELETE' });
        const result = await response.json();
        if (result.success) {
            showMessage('Timetable deleted', 'success', 'timetableMessage');
            loadTimetables();
        } else {
            showMessage(result.message || 'Delete failed', 'error', 'timetableMessage');
        }
    } catch (error) {
        console.error('Error deleting timetable:', error);
        showMessage('An error occurred while deleting', 'error', 'timetableMessage');
    }
}

// Delete Review
async function deleteReview(id) {
    if (!confirm('Delete review?')) return;
    try {
        const response = await fetch(`/api/reviews/${id}`, { method: 'DELETE' });
        const result = await response.json();
        if (result.success) {
            showMessage('Review deleted', 'success', 'reviewMessage');
            loadReviews();
        } else {
            showMessage(result.message || 'Delete failed', 'error', 'reviewMessage');
        }
    } catch (error) {
        console.error('Error deleting review:', error);
        showMessage('An error occurred while deleting', 'error', 'reviewMessage');
    }
}

// Delete Enrollment
async function deleteEnrollment(id) {
    if (!confirm('Delete enrollment? This will remove student data and related reviews.')) return;
    try {
        const response = await fetch(`/api/enrollments/${id}`, { method: 'DELETE' });
        const result = await response.json();
        if (result.success) {
            showMessage('Enrollment deleted', 'success', 'enrollmentMessage');
            loadDashboard();
        } else {
            showMessage(result.message || 'Delete failed', 'error', 'enrollmentMessage');
        }
    } catch (error) {
        console.error('Error deleting enrollment:', error);
        showMessage('An error occurred while deleting enrollment', 'error', 'enrollmentMessage');
    }
}

