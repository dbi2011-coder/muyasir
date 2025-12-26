// إدارة واجبات الطالب
let currentAssignmentId = null;

document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('my-assignments.html')) {
        loadStudentAssignments();
        updateCurrentAssignmentSection();
    }
});

function loadStudentAssignments() {
    const assignmentsList = document.getElementById('assignmentsList');
    const currentStudent = getCurrentUser();
    const studentAssignments = JSON.parse(localStorage.getItem('studentAssignments') || '[]');
    
    const studentAssignmentsFiltered = studentAssignments.filter(assignment => 
        assignment.studentId === currentStudent.id
    );
    
    if (studentAssignmentsFiltered.length === 0) {
        assignmentsList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📋</div>
                <h3>لا توجد واجبات مطلوبة</h3>
                <p>سيتم إضافة الواجبات المطلوبة هنا</p>
            </div>
        `;
        return;
    }
    
    assignmentsList.innerHTML = studentAssignmentsFiltered.map(assignment => {
        const statusClass = getAssignmentStatusClass(assignment.status);
        const statusText = getAssignmentStatusText(assignment.status);
        
        return `
            <div class="assignment-card ${statusClass}">
                <div class="card-header">
                    <h3 class="card-title">${assignment.title}</h3>
                    <span class="card-status ${statusClass}">${statusText}</span>
                </div>
                <div class="card-meta">
                    <div class="meta-item">
                        <span>المادة:</span>
                        <strong>${assignment.subject}</strong>
                    </div>
                    <div class="meta-item">
                        <span>تاريخ الإضافة:</span>
                        <strong>${formatDate(assignment.assignedDate)}</strong>
                    </div>
                    ${assignment.dueDate ? `
                    <div class="meta-item">
                        <span>موعد التسليم:</span>
                        <strong>${formatDate(assignment.dueDate)}</strong>
                    </div>
                    ` : ''}
                    ${assignment.score ? `
                    <div class="meta-item">
                        <span>النتيجة:</span>
                        <strong>${assignment.score}%</strong>
                    </div>
                    ` : ''}
                </div>
                <div class="card-actions">
                    ${assignment.status === 'pending' ? `
                    <button class="btn btn-success" onclick="solveAssignment(${assignment.id})">حل الواجب</button>
                    ` : ''}
                    ${assignment.status === 'completed' ? `
                    <button class="btn btn-primary" onclick="viewAssignment(${assignment.id})">عرض الواجب</button>
                    ` : ''}
                    <button class="btn btn-outline-secondary" onclick="viewAssignmentDetails(${assignment.id})">عرض التفاصيل</button>
                </div>
            </div>
        `;
    }).join('');
}

function updateCurrentAssignmentSection() {
    const currentAssignmentSection = document.getElementById('currentAssignmentSection');
    const currentStudent = getCurrentUser();
    const studentAssignments = JSON.parse(localStorage.getItem('studentAssignments') || '[]');
    
    const currentAssignment = studentAssignments.find(assignment => 
        assignment.studentId === currentStudent.id && assignment.status === 'pending'
    );
    
    if (!currentAssignment) {
        currentAssignmentSection.innerHTML = `
            <div class="current-assignment-content">
                <h3 class="current-assignment-title">لا توجد واجبات جديدة</h3>
                <p class="current-assignment-description">جميع الواجبات المطلوبة مكتملة أو سيتم إضافتها قريباً</p>
            </div>
        `;
        return;
    }
    
    currentAssignmentSection.innerHTML = `
        <div class="current-assignment-content">
            <h3 class="current-assignment-title">واجب جديد: ${currentAssignment.title}</h3>
            <p class="current-assignment-description">يجب تسليم هذا الواجب قبل ${formatDate(currentAssignment.dueDate)}</p>
            <button class="btn btn-light btn-large" onclick="solveAssignment(${currentAssignment.id})">
                📝 حل الواجب
            </button>
        </div>
    `;
}

function filterAssignments() {
    const filter = document.getElementById('assignmentFilter').value;
    const assignmentCards = document.querySelectorAll('.assignment-card');
    
    assignmentCards.forEach(card => {
        switch (filter) {
            case 'all':
                card.style.display = 'block';
                break;
            case 'pending':
                card.style.display = card.classList.contains('pending') ? 'block' : 'none';
                break;
            case 'completed':
                card.style.display = card.classList.contains('completed') ? 'block' : 'none';
                break;
            case 'overdue':
                card.style.display = card.classList.contains('overdue') ? 'block' : 'none';
                break;
        }
    });
}

function solveAssignment(assignmentId) {
    const studentAssignments = JSON.parse(localStorage.getItem('studentAssignments') || '[]');
    const assignment = studentAssignments.find(a => a.id === assignmentId);
    
    if (!assignment) {
        showAuthNotification('الواجب غير موجود', 'error');
        return;
    }
    
    currentAssignmentId = assignmentId;
    
    document.getElementById('assignmentModalTitle').textContent = assignment.title;
    document.getElementById('assignmentContent').innerHTML = `
        <div class="assignment-info">
            <h4>تعليمات الواجب:</h4>
            <p>${assignment.instructions || 'لا توجد تعليمات خاصة.'}</p>
            
            <div class="assignment-questions">
                <h5>الأسئلة:</h5>
                <div class="question">
                    <p><strong>السؤال 1:</strong> اكتب فقرة عن أهمية التعلم.</p>
                    <textarea class="form-control" rows="4" placeholder="اكتب إجابتك هنا..."></textarea>
                </div>
                <div class="question">
                    <p><strong>السؤال 2:</strong> حل المسألة الحسابية التالية: ٤٥ + ٢٣ = ؟</p>
                    <input type="text" class="form-control" placeholder="اكتب الإجابة...">
                </div>
            </div>
            
            <div class="alert alert-info">
                <strong>ملاحظة:</strong> تأكد من مراجعة إجاباتك قبل التسليم
            </div>
        </div>
    `;
    
    document.getElementById('solveAssignmentModal').classList.add('show');
}

function closeSolveAssignmentModal() {
    document.getElementById('solveAssignmentModal').classList.remove('show');
    currentAssignmentId = null;
}

function submitAssignment() {
    if (!currentAssignmentId) {
        showAuthNotification('لم يتم تحديد واجب', 'error');
        return;
    }
    
    showAuthNotification('جاري تسليم الواجب...', 'info');
    
    setTimeout(() => {
        // تحديث حالة الواجب
        const studentAssignments = JSON.parse(localStorage.getItem('studentAssignments') || '[]');
        const assignmentIndex = studentAssignments.findIndex(a => a.id === currentAssignmentId);
        
        if (assignmentIndex !== -1) {
            studentAssignments[assignmentIndex].status = 'completed';
            studentAssignments[assignmentIndex].completedDate = new Date().toISOString();
            studentAssignments[assignmentIndex].score = Math.floor(Math.random() * 30) + 70; // نتيجة عشوائية بين 70-100
            
            localStorage.setItem('studentAssignments', JSON.stringify(studentAssignments));
            
            // إضافة نشاط
            addStudentActivity({
                type: 'assignment',
                title: 'سلمت واجباً',
                description: studentAssignments[assignmentIndex].title
            });
        }
        
        showAuthNotification('تم تسليم الواجب بنجاح', 'success');
        closeSolveAssignmentModal();
        loadStudentAssignments();
        updateCurrentAssignmentSection();
    }, 2000);
}

function viewAssignment(assignmentId) {
    const studentAssignments = JSON.parse(localStorage.getItem('studentAssignments') || '[]');
    const assignment = studentAssignments.find(a => a.id === assignmentId);
    
    if (!assignment) {
        showAuthNotification('الواجب غير موجود', 'error');
        return;
    }
    
    const detailsMessage = `
        تفاصيل الواجب:
        العنوان: ${assignment.title}
        المادة: ${assignment.subject}
        الحالة: ${getAssignmentStatusText(assignment.status)}
        ${assignment.score ? `النتيجة: ${assignment.score}%` : ''}
        ${assignment.completedDate ? `تاريخ التسليم: ${formatDate(assignment.completedDate)}` : ''}
    `;
    
    alert(detailsMessage);
}

function viewAssignmentDetails(assignmentId) {
    const studentAssignments = JSON.parse(localStorage.getItem('studentAssignments') || '[]');
    const assignment = studentAssignments.find(a => a.id === assignmentId);
    
    if (!assignment) {
        showAuthNotification('الواجب غير موجود', 'error');
        return;
    }
    
    const detailsMessage = `
        تفاصيل الواجب:
        العنوان: ${assignment.title}
        المادة: ${assignment.subject}
        الحالة: ${getAssignmentStatusText(assignment.status)}
        تاريخ الإضافة: ${formatDate(assignment.assignedDate)}
        ${assignment.dueDate ? `موعد التسليم: ${formatDate(assignment.dueDate)}` : ''}
        ${assignment.instructions ? `التعليمات: ${assignment.instructions}` : ''}
    `;
    
    alert(detailsMessage);
}

function getAssignmentStatusClass(status) {
    const statusClasses = {
        'pending': 'pending',
        'completed': 'completed',
        'overdue': 'overdue'
    };
    return statusClasses[status] || 'pending';
}

function getAssignmentStatusText(status) {
    const statusTexts = {
        'pending': 'معلقة',
        'completed': 'مكتملة',
        'overdue': 'متأخرة'
    };
    return statusTexts[status] || 'غير محدد';
}

// تصدير الدوال للاستخدام العالمي
window.filterAssignments = filterAssignments;
window.solveAssignment = solveAssignment;
window.closeSolveAssignmentModal = closeSolveAssignmentModal;
window.submitAssignment = submitAssignment;
window.viewAssignment = viewAssignment;
window.viewAssignmentDetails = viewAssignmentDetails;