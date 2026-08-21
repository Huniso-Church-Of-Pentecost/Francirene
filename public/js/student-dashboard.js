// Student Dashboard JavaScript
document.addEventListener('DOMContentLoaded', function() {
    setupNavigation();
    loadStudentInfo();
    loadSubjectsAndResources();
    loadTimetable();
    loadStudentReviews();

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
    const navItems = document.querySelectorAll('.student-menu-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            if (item.id === 'logout') return;
            e.preventDefault();

            navItems.forEach(ni => ni.classList.remove('student-active'));
            item.classList.add('student-active');

            const href = item.getAttribute('href') || '#dashboard';
            const targetId = href.startsWith('#') ? href.substring(1) : href;
            showContentView(targetId);
        });
    });
}

function showContentView(viewId) {
    const views = document.querySelectorAll('.student-section');
    views.forEach(view => view.classList.remove('active'));
    const targetView = document.getElementById(viewId);
    if (targetView) {
        targetView.classList.add('active');
    }
}

function loadStudentInfo() {
    const welcomeText = document.getElementById('welcomeText');
    const studentInfo = document.getElementById('studentInfo');
    // Fetch session info to display student-specific details
    fetch('/api/session').then(r => r.json()).then(data => {
        if (data.success && data.role === 'student' && data.student) {
            welcomeText.textContent = `Welcome, ${data.student.childName || 'Student'}`;
            studentInfo.textContent = 'Access your learning resources and track your progress';
        } else {
            welcomeText.textContent = 'Welcome, Student!';
            studentInfo.textContent = 'Access your learning resources and track your progress';
        }
    }).catch(err => {
        console.error('Error fetching session info:', err);
    });
}

async function loadSubjectsAndResources() {
    try {
        const response = await fetch('/api/resources');
        const data = await response.json();

        if (data.success) {
            const subjectsList = document.getElementById('subjectsList');
            if (!subjectsList) return;

            if (data.resources.length === 0) {
                subjectsList.innerHTML = '<p>No resources available yet.</p>';
                return;
            }

            subjectsList.innerHTML = data.resources.map(resource => `
                <div class="resource-item">
                    <h3>${resource.title}</h3>
                    <p class="small muted">Subject: ${resource.subject} — ${new Date(resource.uploadDate).toLocaleDateString()}</p>
                    <p>${resource.description || ''}</p>
                            <a href="/uploads/${resource.filename}" class="resource-download btn btn-primary" download="${resource.originalName || resource.filename}">${resource.originalName || 'Download File'}</a>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading subjects:', error);
    }
}

async function loadTimetable() {
    try {
        const response = await fetch('/api/timetables');
        const data = await response.json();

        if (data.success && data.timetables.length > 0) {
            const timetableContent = document.getElementById('timetableContent');
            if (!timetableContent) return;

            let html = '';
            data.timetables.forEach(timetable => {
                html += `<div style="margin-bottom:2rem;"><h3>${timetable.title}</h3>`;
                html += `<p style="color:#6b7280; font-size:0.9rem;"><strong>Period:</strong> ${new Date(timetable.startDate).toLocaleDateString()} to ${new Date(timetable.endDate).toLocaleDateString()}</p>`;
                html += renderTimetableGrid(timetable);
                html += '</div>';
            });
            
            timetableContent.innerHTML = html;
        } else {
            document.getElementById('timetableContent').innerHTML = '<p>No timetable available yet.</p>';
        }
    } catch (error) {
        console.error('Error loading timetable:', error);
    }
}

function renderTimetableGrid(timetable) {
    if (!timetable.classes || timetable.classes.length === 0) {
        return '<p>No classes in this timetable.</p>';
    }

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

    days.forEach(day => {
        dayMap[day].sort((a, b) => a.time.localeCompare(b.time));
    });

    const times = new Set();
    timetable.classes.forEach(cls => times.add(cls.time));
    const sortedTimes = Array.from(times).sort();

    let html = '<table class="timetable-grid" style="width:100%; border-collapse:collapse; background:white; margin:1rem 0; border:1px solid #e5e7eb;"><thead style="background:linear-gradient(135deg, #0b3b66 0%, #0b76ff 100%); color:white;"><tr><th style="padding:0.75rem; text-align:left; font-weight:600; border-right:1px solid rgba(255,255,255,0.2);">Time</th>';
    
    days.forEach(day => {
        html += `<th style="padding:0.75rem; text-align:left; font-weight:600; border-right:1px solid rgba(255,255,255,0.2);">${day}</th>`;
    });
    
    html += '</tr></thead><tbody>';

    sortedTimes.forEach(time => {
        html += `<tr><td style="padding:0.75rem; border-right:1px solid #e5e7eb; border-bottom:1px solid #e5e7eb; font-weight:600; color:#0b76ff; font-size:0.85rem;">${time}</td>`;
        days.forEach(day => {
            const classForSlot = dayMap[day].find(c => c.time === time);
            html += '<td style="padding:0.75rem; border-right:1px solid #e5e7eb; border-bottom:1px solid #e5e7eb; font-size:0.9rem; vertical-align:top;">';
            if (classForSlot) {
                html += `<div style="font-weight:600; color:#1f2937;">${classForSlot.subject}</div><div style="color:#6b7280; font-size:0.85rem;">${classForSlot.class}</div>`;
            }
            html += '</td>';
        });
        html += '</tr>';
    });

    html += '</tbody></table>';
    return html;
}

// Load reviews for student
async function loadStudentReviews() {
    try {
        const response = await fetch('/api/reviews');
        const data = await response.json();
        
        if (data.success && data.reviews && data.reviews.length > 0) {
            const progressList = document.getElementById('progressList');
            if (progressList) {
                progressList.innerHTML = data.reviews.map(review => `
                    <div class="progress-item">
                        <h3>Teacher Review</h3>
                        <p><strong>Academic Performance:</strong> ${review.academicPerformance}</p>
                        <p><strong>Behavior & Conduct:</strong> ${review.behavior}</p>
                        <p><strong>Attendance:</strong> ${review.attendance}%</p>
                        <p><strong>Teacher Remarks:</strong> ${review.teacherRemarks}</p>
                        <p class="small muted">${new Date(review.createdAt).toLocaleString()}</p>
                    </div>
                `).join('');
            }
        }
    } catch (error) {
        console.error('Error loading reviews:', error);
    }
}
