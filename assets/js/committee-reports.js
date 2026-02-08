// إدارة التقارير والإحصائيات للجنة
let selectedStudents = new Set();
let currentReportStudentIds = [];

document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('reports.html')) {
        initializeReportsPage();
        loadStudentsForReports();
        loadGeneratedReports();
    }
});

function initializeReportsPage() {
    populateTeacherFilter();
    populateGradeFilter();
}

function populateTeacherFilter() {
    const teacherFilter = document.getElementById('teacherFilter');
    const currentUser = getCurrentUser();
    const assignedTeachers = getAssignedTeachers(currentUser.id);
    
    teacherFilter.innerHTML = '<option value="all">جميع المعلمين</option>';
    
    assignedTeachers.forEach(teacher => {
        const option = document.createElement('option');
        option.value = teacher.id;
        option.textContent = teacher.name;
        teacherFilter.appendChild(option);
    });
}

function populateGradeFilter() {
    const gradeFilter = document.getElementById('gradeFilter');
    const grades = ['الصف الأول', 'الصف الثاني', 'الصف الثالث', 'الصف الرابع', 'الصف الخامس', 'الصف السادس'];
    
    gradeFilter.innerHTML = '<option value="all">جميع الصفوف</option>';
    
    grades.forEach(grade => {
        const option = document.createElement('option');
        option.value = grade;
        option.textContent = grade;
        gradeFilter.appendChild(option);
    });
}

function loadStudentsForReports() {
    const tableBody = document.getElementById('studentsTableBody');
    const currentUser = getCurrentUser();
    const assignedTeacherIds = getAssignedTeacherIds(currentUser.id);
    
    // جلب جميع طلاب المعلمين المتابعين
    const allStudents = JSON.parse(localStorage.getItem('students') || '[]');
    const teachers = JSON.parse(localStorage.getItem('teachers') || '[]');
    
    const filteredStudents = allStudents.filter(student => 
        assignedTeacherIds.includes(student.teacherId)
    );
    
    if (filteredStudents.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 40px;">
                    <div class="empty-state">
                        <div class="empty-icon">👨‍🎓</div>
                        <h3>لا توجد طلاب</h3>
                        <p>لا توجد طلاب مسجلين للمعلمين المتابعين</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    tableBody.innerHTML = filteredStudents.map(student => {
        const teacher = teachers.find(t => t.id === student.teacherId);
        const progress = student.progress || 0;
        const progressClass = progress < 30 ? 'danger' : progress < 60 ? 'warning' : 'success';
        
        return `
            <tr data-student-id="${student.id}" 
                data-teacher-id="${student.teacherId}"
                data-grade="${student.grade || ''}"
                data-subject="${student.subject || ''}"
                data-progress="${progress}">
                <td>
                    <input type="checkbox" class="student-checkbox" 
                           value="${student.id}" 
                           onchange="toggleStudentSelection(${student.id})">
                </td>
                <td>${student.name}</td>
                <td>${student.grade || 'غير محدد'}</td>
                <td>${student.subject || 'غير محدد'}</td>
                <td>${teacher ? teacher.name : 'غير محدد'}</td>
                <td>
                    <div class="progress-container">
                        <div class="progress-bar" style="width: ${progress}%; background-color: var(--${progressClass}-color);"></div>
                        <span class="progress-text">${progress}%</span>
                    </div>
                </td>
                <td>${student.lastTestDate ? formatDateShort(student.lastTestDate) : 'لا يوجد'}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-primary" onclick="viewStudentReport(${student.id})">
                            <span class="btn-icon">👁️</span>
                        </button>
                        <button class="btn btn-sm btn-success" onclick="generateStudentReport(${student.id})">
                            <span class="btn-icon">📄</span>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function filterStudents() {
    const teacherFilter = document.getElementById('teacherFilter').value;
    const gradeFilter = document.getElementById('gradeFilter').value;
    const subjectFilter = document.getElementById('subjectFilter').value;
    const progressFilter = document.getElementById('progressFilter').value;
    
    const rows = document.querySelectorAll('#studentsTableBody tr[data-student-id]');
    
    rows.forEach(row => {
        const teacherId = row.getAttribute('data-teacher-id');
        const grade = row.getAttribute('data-grade');
        const subject = row.getAttribute('data-subject');
        const progress = parseInt(row.getAttribute('data-progress'));
        
        let showRow = true;
        
        // فلترة حسب المعلم
        if (teacherFilter !== 'all' && teacherFilter !== teacherId) {
            showRow = false;
        }
        
        // فلترة حسب الصف
        if (gradeFilter !== 'all' && gradeFilter !== grade) {
            showRow = false;
        }
        
        // فلترة حسب المادة
        if (subjectFilter !== 'all' && subjectFilter !== subject) {
            showRow = false;
        }
        
        // فلترة حسب نسبة التقدم
        if (progressFilter !== 'all') {
            const [min, max] = progressFilter.split('-').map(Number);
            if (progress < min || progress > max) {
                showRow = false;
            }
        }
        
        row.style.display = showRow ? '' : 'none';
    });
}

function toggleSelectAll() {
    const selectAllCheckbox = document.getElementById('selectAllCheckbox');
    const checkboxes = document.querySelectorAll('.student-checkbox:visible');
    
    checkboxes.forEach(checkbox => {
        checkbox.checked = selectAllCheckbox.checked;
        const studentId = parseInt(checkbox.value);
        
        if (checkbox.checked) {
            selectedStudents.add(studentId);
            checkbox.closest('tr').classList.add('selected');
        } else {
            selectedStudents.delete(studentId);
            checkbox.closest('tr').classList.remove('selected');
        }
    });
    
    updateSelectedCount();
}

function toggleStudentSelection(studentId) {
    const checkbox = document.querySelector(`.student-checkbox[value="${studentId}"]`);
    const row = checkbox.closest('tr');
    
    if (checkbox.checked) {
        selectedStudents.add(studentId);
        row.classList.add('selected');
    } else {
        selectedStudents.delete(studentId);
        row.classList.remove('selected');
    }
    
    updateSelectedCount();
    updateSelectAllCheckbox();
}

function selectAllStudents() {
    const checkboxes = document.querySelectorAll('.student-checkbox:visible');
    checkboxes.forEach(checkbox => {
        checkbox.checked = true;
        const studentId = parseInt(checkbox.value);
        selectedStudents.add(studentId);
        checkbox.closest('tr').classList.add('selected');
    });
    
    updateSelectedCount();
    updateSelectAllCheckbox();
}

function updateSelectedCount() {
    const count = selectedStudents.size;
    const generateBtn = document.querySelector('.btn-success');
    
    if (generateBtn) {
        generateBtn.textContent = count > 0 ? 
            `توليد تقرير (${count} طالب)` : 
            'توليد تقرير للمحددين';
    }
}

function updateSelectAllCheckbox() {
    const selectAllCheckbox = document.getElementById('selectAllCheckbox');
    const visibleCheckboxes = document.querySelectorAll('.student-checkbox:visible');
    const checkedVisibleCheckboxes = document.querySelectorAll('.student-checkbox:visible:checked');
    
    selectAllCheckbox.checked = visibleCheckboxes.length > 0 && 
                               visibleCheckboxes.length === checkedVisibleCheckboxes.length;
    selectAllCheckbox.indeterminate = checkedVisibleCheckboxes.length > 0 && 
                                     checkedVisibleCheckboxes.length < visibleCheckboxes.length;
}

function generateReportForSelected() {
    if (selectedStudents.size === 0) {
        showAuthNotification('يرجى تحديد طلاب لإنشاء تقرير لهم', 'warning');
        return;
    }
    
    currentReportStudentIds = Array.from(selectedStudents);
    showReportOptions();
}

function showReportOptions() {
    document.getElementById('reportOptionsSection').style.display = 'block';
    document.getElementById('reportOptionsSection').scrollIntoView({ behavior: 'smooth' });
}

function hideReportOptions() {
    document.getElementById('reportOptionsSection').style.display = 'none';
    currentReportStudentIds = [];
}

function generateReport() {
    const reportType = document.querySelector('input[name="reportType"]:checked').value;
    const reportFormat = document.querySelector('input[name="reportFormat"]:checked').value;
    const reportNotes = document.getElementById('reportNotes').value;
    
    if (currentReportStudentIds.length === 0) {
        showAuthNotification('لم يتم تحديد طلاب', 'error');
        return;
    }
    
    showAuthNotification('جاري إنشاء التقرير...', 'info');
    
    setTimeout(() => {
        const currentUser = getCurrentUser();
        
        // حفظ التقرير في قاعدة البيانات
        const committeeReports = JSON.parse(localStorage.getItem('committeeReports') || '[]');
        const reportId = generateId();
        
        const newReport = {
            id: reportId,
            committeeId: currentUser.id,
            studentIds: currentReportStudentIds,
            reportType: reportType,
            format: reportFormat,
            notes: reportNotes,
            createdAt: new Date().toISOString(),
            status: 'generated'
        };
        
        committeeReports.push(newReport);
        localStorage.setItem('committeeReports', JSON.stringify(committeeReports));
        
        // إضافة نشاط
        addCommitteeActivity({
            type: 'report',
            title: 'أنشأت تقريراً',
            description: `تقرير ${getReportTypeName(reportType)} لـ ${currentReportStudentIds.length} طالب`
        });
        
        // عرض التقرير
        showGeneratedReport(reportId);
        
        showAuthNotification('تم إنشاء التقرير بنجاح', 'success');
        hideReportOptions();
        selectedStudents.clear();
        resetCheckboxes();
        loadGeneratedReports();
        updateCommitteeStats();
    }, 2000);
}

function showGeneratedReport(reportId) {
    const reports = JSON.parse(localStorage.getItem('committeeReports') || '[]');
    const report = reports.find(r => r.id === reportId);
    
    if (!report) {
        showAuthNotification('التقرير غير موجود', 'error');
        return;
    }
    
    document.getElementById('reportModalTitle').textContent = `تقرير ${getReportTypeName(report.reportType)}`;
    
    // بناء معاينة التقرير
    const students = JSON.parse(localStorage.getItem('students') || '[]');
    const selectedStudents = students.filter(s => report.studentIds.includes(s.id));
    
    document.getElementById('reportPreview').innerHTML = `
        <div class="report-preview-content">
            <h4>معلومات التقرير:</h4>
            <p><strong>نوع التقرير:</strong> ${getReportTypeName(report.reportType)}</p>
            <p><strong>عدد الطلاب:</strong> ${selectedStudents.length} طالب</p>
            <p><strong>تاريخ الإنشاء:</strong> ${formatDate(report.createdAt)}</p>
            <p><strong>التنسيق:</strong> ${report.format.toUpperCase()}</p>
            ${report.notes ? `<p><strong>ملاحظات:</strong> ${report.notes}</p>` : ''}
            
            <h4>الطلاب المشمولين:</h4>
            <ul>
                ${selectedStudents.map(student => `
                    <li>${student.name} - ${student.grade || 'غير محدد'} - ${student.subject || 'غير محدد'}</li>
                `).join('')}
            </ul>
            
            <h4>محتوى التقرير:</h4>
            ${generateReportContent(report.reportType, selectedStudents)}
            
            <div class="report-footer">
                <p>تم إنشاء التقرير من موقع ميسر التعلم للأستاذ / صالح عبد العزيز عبدالله العجلان</p>
            </div>
        </div>
    `;
    
    document.getElementById('viewReportModal').classList.add('show');
}

function closeReportModal() {
    document.getElementById('viewReportModal').classList.remove('show');
}

function printReport() {
    window.print();
}

function downloadReport() {
    showAuthNotification('جاري تحميل التقرير...', 'info');
    
    setTimeout(() => {
        showAuthNotification('تم تحميل التقرير بنجاح', 'success');
        // في تطبيق حقيقي، سيتم تنزيل ملف PDF أو Excel
    }, 1500);
}

function viewStudentReport(studentId) {
    const student = getStudentById(studentId);
    
    if (!student) {
        showAuthNotification('الطالب غير موجود', 'error');
        return;
    }
    
    // توجيه إلى نموذج عرض تقرير الطالب المفرد
    showGeneratedReportForSingleStudent(student);
}

function generateStudentReport(studentId) {
    selectedStudents.clear();
    selectedStudents.add(studentId);
    currentReportStudentIds = [studentId];
    showReportOptions();
}

function loadGeneratedReports() {
    const reportsList = document.getElementById('generatedReportsList');
    const currentUser = getCurrentUser();
    const committeeReports = JSON.parse(localStorage.getItem('committeeReports') || '[]');
    
    const userReports = committeeReports
        .filter(cr => cr.committeeId === currentUser.id)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 10);
    
    if (userReports.length === 0) {
        reportsList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📋</div>
                <h3>لا توجد تقارير منشأة</h3>
                <p>سيظهر هنا تاريخ تقاريرك بعد إنشائها</p>
            </div>
        `;
        return;
    }
    
    reportsList.innerHTML = userReports.map(report => {
        const students = JSON.parse(localStorage.getItem('students') || '[]');
        const reportStudents = students.filter(s => report.studentIds.includes(s.id));
        const isUrgent = report.notes && report.notes.toLowerCase().includes('عاجل');
        
        return `
            <div class="report-item ${isUrgent ? 'urgent' : ''}">
                <div class="report-info">
                    <div class="report-title">تقرير ${getReportTypeName(report.reportType)}</div>
                    <div class="report-meta">
                        <span>${reportStudents.length} طالب</span>
                        <span>${formatDate(report.createdAt)}</span>
                        <span>${report.format.toUpperCase()}</span>
                        ${isUrgent ? '<span class="status-badge status-urgent">عاجل</span>' : ''}
                    </div>
                </div>
                <div class="report-actions">
                    <button class="btn btn-sm btn-primary" onclick="showGeneratedReport(${report.id})">
                        عرض
                    </button>
                    <button class="btn btn-sm btn-secondary" onclick="deleteReport(${report.id})">
                        حذف
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function deleteReport(reportId) {
    if (!confirm('هل أنت متأكد من حذف هذا التقرير؟')) {
        return;
    }
    
    const committeeReports = JSON.parse(localStorage.getItem('committeeReports') || '[]');
    const updatedReports = committeeReports.filter(r => r.id !== reportId);
    
    localStorage.setItem('committeeReports', JSON.stringify(updatedReports));
    
    showAuthNotification('تم حذف التقرير بنجاح', 'success');
    loadGeneratedReports();
    updateCommitteeStats();
}

function resetCheckboxes() {
    document.getElementById('selectAllCheckbox').checked = false;
    const checkboxes = document.querySelectorAll('.student-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
        checkbox.closest('tr').classList.remove('selected');
    });
    updateSelectedCount();
}

// دوال مساعدة
function getAssignedTeacherIds(committeeId) {
    const committeeTeachers = JSON.parse(localStorage.getItem('committeeTeachers') || '[]');
    return committeeTeachers
        .filter(ct => ct.committeeId === committeeId)
        .map(ct => ct.teacherId);
}

function getStudentById(studentId) {
    const students = JSON.parse(localStorage.getItem('students') || '[]');
    return students.find(s => s.id === studentId);
}

function getReportTypeName(reportType) {
    const types = {
        'studentData': 'بيانات الطالب',
        'diagnosticTest': 'الاختبار التشخيصي',
        'iep': 'الخطة التربوية الفردية',
        'assignments': 'الواجبات'
    };
    return types[reportType] || 'غير محدد';
}

function generateReportContent(reportType, students) {
    switch (reportType) {
        case 'studentData':
            return `
                <table class="preview-table">
                    <thead>
                        <tr>
                            <th>اسم الطالب</th>
                            <th>الصف</th>
                            <th>المادة</th>
                            <th>نسبة التقدم</th>
                            <th>آخر دخول</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${students.map(student => `
                            <tr>
                                <td>${student.name}</td>
                                <td>${student.grade || 'غير محدد'}</td>
                                <td>${student.subject || 'غير محدد'}</td>
                                <td>${student.progress || 0}%</td>
                                <td>${student.lastLogin ? formatDateShort(student.lastLogin) : 'لا يوجد'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
            
        case 'diagnosticTest':
            return `<p>تقرير يحتوي على نتائج الاختبارات التشخيصية للطلاب المحددين.</p>`;
            
        case 'iep':
            return `<p>تقرير يحتوي على الخطط التربوية الفردية للطلاب المحددين.</p>`;
            
        case 'assignments':
            return `<p>تقرير يحتوي على أداء الطلاب في الواجبات المطلوبة.</p>`;
            
        default:
            return `<p>تقرير عام عن أداء الطلاب.</p>`;
    }
}

function showGeneratedReportForSingleStudent(student) {
    document.getElementById('reportModalTitle').textContent = `تقرير ${student.name}`;
    
    document.getElementById('reportPreview').innerHTML = `
        <div class="report-preview-content">
            <h4>بيانات الطالب:</h4>
            <table class="preview-table">
                <tr><td>الاسم</td><td>${student.name}</td></tr>
                <tr><td>الصف</td><td>${student.grade || 'غير محدد'}</td></tr>
                <tr><td>المادة</td><td>${student.subject || 'غير محدد'}</td></tr>
                <tr><td>نسبة التقدم</td><td>${student.progress || 0}%</td></tr>
                <tr><td>تاريخ التسجيل</td><td>${student.createdAt ? formatDate(student.createdAt) : 'غير محدد'}</td></tr>
            </table>
            
            <h4>الأداء الدراسي:</h4>
            <p>محتوى تفصيلي عن أداء الطالب...</p>
            
            <div class="report-footer">
                <p>تم إنشاء التقرير من موقع ميسر التعلم للأستاذ / صالح عبد العزيز عبدالله العجلان</p>
            </div>
        </div>
    `;
    
    document.getElementById('viewReportModal').classList.add('show');
}

// تصدير الدوال للاستخدام العالمي
window.toggleSelectAll = toggleSelectAll;
window.toggleStudentSelection = toggleStudentSelection;
window.selectAllStudents = selectAllStudents;
window.generateReportForSelected = generateReportForSelected;
window.hideReportOptions = hideReportOptions;
window.generateReport = generateReport;
window.closeReportModal = closeReportModal;
window.printReport = printReport;
window.downloadReport = downloadReport;
window.viewStudentReport = viewStudentReport;
window.generateStudentReport = generateStudentReport;
window.deleteReport = deleteReport;
window.filterStudents = filterStudents;