document.addEventListener('DOMContentLoaded', function() {
    const enrollmentForm = document.getElementById('enrollmentForm');
    const enrollmentMessage = document.getElementById('enrollmentMessage');
    
    loadSavedEnrollmentData();
    
    checkEnrollmentStatus();
    
    enrollmentForm.addEventListener('input', () => {
        saveEnrollmentDataToLocalStorage();
    });

        enrollmentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const subjectCheckboxes = document.querySelectorAll('input[name="subjects"]:checked');
        const subjects = Array.from(subjectCheckboxes).map(cb => cb.value);

        if (subjects.length === 0) {
            showMessage('Please Select At Least One or Two ', 'error');
            return;
        }

        const data = {
            childName: document.getElementById('childName').value,
            childClass: document.getElementById('childClass').value,
            childGender: document.getElementById('childGender').value,
            guardianName: document.getElementById('guardianName').value,
            guardianEmail: document.getElementById('guardianEmail').value,
            guardianPhone: document.getElementById('guardianPhone').value,
            guardianGender: document.getElementById('guardianGender').value,
            serviceType: document.getElementById('serviceType').value,
            subjects,
            concerns: document.getElementById('concerns').value
        };

        try {
            const response = await fetch('/api/enroll', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();
            if (result.success) {
                // Save enrollment status to localStorage
                localStorage.setItem('enrollmentData', JSON.stringify({
                    ...data,
                    enrollmentDate: new Date().toISOString(),
                    parentId: result.parentId,
                    studentId: result.studentId,
                    status: 'pending'
                }));
                
                sessionStorage.setItem('lastEnrollment', JSON.stringify({
                    parentId: result.parentId,
                    studentId: result.studentId,
                    email: data.guardianEmail
                }));

                showMessage(
                    `Enrollment successful! Your Parent ID: ${result.parentId} | Student ID: ${result.studentId}. Check your email for details.`,
                    'success'
                );
                enrollmentForm.reset();
                // Clear form cache after successful submission
                localStorage.removeItem('enrollmentFormData');
                
                setTimeout(() => {
                    window.location.href = '/';
                }, 3000);
            } else {
                showMessage(result.message || 'Enrollment failed', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showMessage('An error occurred during enrollment', 'error');
        }
    });

    function saveEnrollmentDataToLocalStorage() {
        const formData = {
            childName: document.getElementById('childName').value,
            childClass: document.getElementById('childClass').value,
            childGender: document.getElementById('childGender').value,
            guardianName: document.getElementById('guardianName').value,
            guardianEmail: document.getElementById('guardianEmail').value,
            guardianPhone: document.getElementById('guardianPhone').value,
            guardianGender: document.getElementById('guardianGender').value,
            serviceType: document.getElementById('serviceType').value,
            subjects: Array.from(document.querySelectorAll('input[name="subjects"]:checked'))
                .map(cb => cb.value),
            concerns: document.getElementById('concerns').value
        };
        localStorage.setItem('enrollmentFormData', JSON.stringify(formData));
    }

    function loadSavedEnrollmentData() {
        const saved = localStorage.getItem('enrollmentFormData');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                if (data.childName) document.getElementById('childName').value = data.childName;
                if (data.childClass) document.getElementById('childClass').value = data.childClass;
                if (data.childGender) document.getElementById('childGender').value = data.childGender;
                if (data.guardianName) document.getElementById('guardianName').value = data.guardianName;
                if (data.guardianEmail) document.getElementById('guardianEmail').value = data.guardianEmail;
                if (data.guardianPhone) document.getElementById('guardianPhone').value = data.guardianPhone;
                if (data.guardianGender) document.getElementById('guardianGender').value = data.guardianGender;
                if (data.serviceType) document.getElementById('serviceType').value = data.serviceType;
                if (data.concerns) document.getElementById('concerns').value = data.concerns;
                
                // Restore selected subjects
                if (data.subjects && data.subjects.length > 0) {
                    data.subjects.forEach(subject => {
                        const checkbox = document.querySelector(`input[name="subjects"][value="${subject}"]`);
                        if (checkbox) checkbox.checked = true;
                    });
                }
            } catch (error) {
                console.error('Error loading saved enrollment data:', error);
            }
        }
    }

    function showMessage(msg, type) {
        if (window.showAlert) {
            window.showAlert(type === 'error' ? 'error' : (type === 'success' ? 'success' : 'info'), msg);
        }
        if (enrollmentMessage) {
            enrollmentMessage.textContent = msg;
            enrollmentMessage.className = `message ${type}`;
            enrollmentMessage.style.display = 'block';
        }
    }

    async function checkEnrollmentStatus() {
        try {
            const response = await fetch('/api/enrollment-status');
            const data = await response.json();
            if (data.enrollmentClosed) {
                showMessage('Enrollment is currently closed. Please try again later.', 'error');
                enrollmentForm.disabled = true;
            }
        } catch (error) {
            console.error('Error checking enrollment status:', error);
        }
    }
})
