// ============================================
// 📁 الملف: assets/js/committee-reports.js
// الوصف: إدارة تقارير اللجنة (محدث لإصلاح الجدول الدراسي)
// ============================================

let selectedStudents = new Set();
let currentReportStudentIds = [];

document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('reports.html')) {
        initializeReportsPage();
        loadStudentsForReports();
        loadGeneratedReports();
    }
});

// 🔥 دالة إصلاح النصوص (الحل السحري لمشكلة الأحد/الاحد)
function normalizeText(text) {
    if (!text) return "";
    return String(text).trim()
        .replace(/[أإآ]/g, 'ا') // تحويل جميع الألفات إلى ا
        .replace(/ة/g, 'ه');    // تحويل التاء المربوطة
}

function initializeReportsPage() {
    populateTeacherFilter();
    populateGradeFilter();
}

function populateTeacherFilter() {
    const teacherFilter = document.getElementById('teacherFilter');
    if (!teacherFilter) return;

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
    if (!gradeFilter) return;

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
    if (!tableBody) return;

    const currentUser = getCurrentUser();
    // جلب المعلمين المرتبطين بهذا العضو
    const assignedTeacherIds = getAssignedTeacherIds(currentUser.id);
    
    const allStudents = JSON.parse(localStorage.getItem('students') || '[]');
    const teachers = JSON.parse(localStorage.getItem('teachers') || '[]');
    
    // فلترة الطلاب التابعين للمعلمين المخصصين للجنة
    const filteredStudents = allStudents.filter(student => 
        assignedTeacherIds.includes(String(student.teacherId))
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
        const teacher = teachers.find(t => t.id == student.teacherId);
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
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function filterStudents() {
    const teacherFilter = document.getElementById('teacherFilter').value;
    const gradeFilter = document.getElementById('gradeFilter').value;
    const subjectFilter = document.getElementById('subjectFilter') ? document.getElementById('subjectFilter').value : 'all';
    const progressFilter = document.getElementById('progressFilter') ? document.getElementById('progressFilter').value : 'all';
    
    const rows = document.querySelectorAll('#studentsTableBody tr[data-student-id]');
    
    rows.forEach(row => {
        const teacherId = row.getAttribute('data-teacher-id');
        const grade = row.getAttribute('data-grade');
        const subject = row.getAttribute('data-subject');
        const progress = parseInt(row.getAttribute('data-progress'));
        
        let showRow = true;
        
        if (teacherFilter !== 'all' && teacherFilter != teacherId) showRow = false;
        if (gradeFilter !== 'all' && gradeFilter !== grade) showRow = false;
        if (subjectFilter !== 'all' && subjectFilter !== subject) showRow = false;
        
        if (progressFilter !== 'all') {
            const [min, max] = progressFilter.split('-').map(Number);
            if (progress < min || progress > max) showRow = false;
        }
        
        row.style.display = showRow ? '' : 'none';
    });
}

function toggleSelectAll() {
    const selectAllCheckbox = document.getElementById('selectAllCheckbox');
    const checkboxes = document.querySelectorAll('.student-checkbox');
    // نختار فقط الظاهرين في حال وجود فلترة
    const visibleCheckboxes = Array.from(checkboxes).filter(cb => cb.closest('tr').style.display !== 'none');
    
    visibleCheckboxes.forEach(checkbox => {
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
    const checkboxes = document.querySelectorAll('.student-checkbox');
    const visibleCheckboxes = Array.from(checkboxes).filter(cb => cb.closest('tr').style.display !== 'none');

    visibleCheckboxes.forEach(checkbox => {
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
    const checkboxes = document.querySelectorAll('.student-checkbox');
    const visibleCheckboxes = Array.from(checkboxes).filter(cb => cb.closest('tr').style.display !== 'none');
    const checkedVisibleCheckboxes = visibleCheckboxes.filter(cb => cb.checked);
    
    if (visibleCheckboxes.length > 0) {
        selectAllCheckbox.checked = visibleCheckboxes.length === checkedVisibleCheckboxes.length;
        selectAllCheckbox.indeterminate = checkedVisibleCheckboxes.length > 0 && checkedVisibleCheckboxes.length < visibleCheckboxes.length;
    } else {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = false;
    }
}

function generateReportForSelected() {
    if (selectedStudents.size === 0) {
        alert('يرجى تحديد طلاب لإنشاء تقرير لهم');
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
        alert('لم يتم تحديد طلاب');
        return;
    }
    
    const currentUser = getCurrentUser();
    
    // حفظ التقرير في قاعدة البيانات
    const committeeReports = JSON.parse(localStorage.getItem('committeeReports') || '[]');
    const reportId = Date.now();
    
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
    
    // عرض التقرير مباشرة
    showGeneratedReport(reportId);
    
    hideReportOptions();
    selectedStudents.clear();
    resetCheckboxes();
    loadGeneratedReports();
}

function showGeneratedReport(reportId) {
    const reports = JSON.parse(localStorage.getItem('committeeReports') || '[]');
    const report = reports.find(r => r.id === reportId);
    
    if (!report) {
        alert('التقرير غير موجود');
        return;
    }
    
    document.getElementById('reportModalTitle').textContent = `تقرير ${getReportTypeName(report.reportType)}`;
    
    // جلب بيانات الطلاب المحددين في هذا التقرير
    const students = JSON.parse(localStorage.getItem('students') || '[]');
    const selectedStudents = students.filter(s => report.studentIds.includes(s.id));
    
    document.getElementById('reportPreview').innerHTML = `
        <div class="report-preview-content">
            <h4>معلومات التقرير:</h4>
            <table class="table table-bordered">
                <tr><th>نوع التقرير</th><td>${getReportTypeName(report.reportType)}</td></tr>
                <tr><th>عدد الطلاب</th><td>${selectedStudents.length} طالب</td></tr>
                <tr><th>تاريخ الإنشاء</th><td>${formatDate(report.createdAt)}</td></tr>
            </table>
            
            ${report.notes ? `<div class="alert alert-info"><strong>ملاحظات:</strong> ${report.notes}</div>` : ''}
            
            <hr>
            ${generateReportContent(report.reportType, selectedStudents)}
            
            <div class="report-footer" style="margin-top:20px; text-align:center; font-size:0.8rem; color:#777;">
                <p>تم إنشاء التقرير من موقع ميسر التعلم</p>
            </div>
        </div>
    `;
    
    document.getElementById('viewReportModal').classList.add('show');
}

// 🔥 الدالة الرئيسية لتوليد محتوى التقارير (بما فيها الجدول الدراسي)
function generateReportContent(reportType, students) {
    switch (reportType) {
        case 'studentData':
            return `
                <h4>بيانات الطلاب</h4>
                <table class="table table-bordered">
                    <thead>
                        <tr style="background:#f0f0f0;">
                            <th>اسم الطالب</th>
                            <th>الصف</th>
                            <th>المادة</th>
                            <th>نسبة التقدم</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${students.map(student => `
                            <tr>
                                <td>${student.name}</td>
                                <td>${student.grade || '-'}</td>
                                <td>${student.subject || '-'}</td>
                                <td>${student.progress || 0}%</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;

        case 'schedule':
            // 🔥 هنا يتم استدعاء دالة بناء الجدول التي أضفناها
            return generateScheduleReportHTML(students);
            
        case 'diagnosticTest':
            return `<div class="alert alert-warning">تقرير الاختبار التشخيصي: سيتم عرض نتائج الاختبارات للطلاب المحددين هنا.</div>`;
            
        case 'iep':
            return `<div class="alert alert-warning">تقرير الخطط الفردية: سيتم عرض تفاصيل الخطط للطلاب المحددين هنا.</div>`;
            
        case 'assignments':
            return `<div class="alert alert-warning">تقرير الواجبات: سيتم عرض حالة تسليم الواجبات للطلاب المحددين هنا.</div>`;
            
        default:
            return `<p>نوع التقرير غير معروف.</p>`;
    }
}

// 🔥 دالة بناء الجدول الدراسي لعضو اللجنة (الجديدة كلياً والمصلحة)
function generateScheduleReportHTML(students) {
    // 1. جلب جميع الجداول
    const allSchedules = JSON.parse(localStorage.getItem('teacherSchedule') || '[]');
    const studentIds = students.map(s => String(s.id)); // تحويل لـ String للمقارنة الآمنة

    // 2. بناء هيكل الجدول
    let html = `
        <h4 style="text-align:center; margin-bottom:15px;">الجدول الدراسي المجمع</h4>
        <div class="table-responsive">
            <table class="table table-bordered schedule-table" style="width:100%; text-align:center; border:2px solid #333;">
                <thead>
                    <tr style="background:#333; color:white;">
                        <th style="width:15%;">اليوم / الحصة</th>
                        <th>1</th><th>2</th><th>3</th><th>4</th><th>5</th><th>6</th><th>7</th>
                    </tr>
                </thead>
                <tbody>
    `;

    // 3. التكرار عبر الأيام والحصص
    const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
    
    days.forEach(day => {
        html += `<tr><td style="font-weight:bold; background:#f0f0f0; border:1px solid #999;">${day}</td>`;

        for (let period = 1; period <= 7; period++) {
            // 🔥 البحث الذكي:
            // - نستخدم normalizeText لمطابقة "الاحد" مع "الأحد"
            // - نبحث في كل الجداول (لأن اللجنة تتابع عدة معلمين)
            // - نتأكد هل الحصة تحتوي على أحد الطلاب المحددين
            const session = allSchedules.find(s =>
                normalizeText(s.day) === normalizeText(day) && 
                s.period == period && 
                s.students && 
                s.students.some(id => studentIds.includes(String(id)))
            );

            let content = '-';
            if (session) {
                // فلترة الطلاب الموجودين في هذه الحصة فقط من ضمن الطلاب المحددين للتقرير
                const studentsInSession = students.filter(s => 
                    session.students.map(String).includes(String(s.id))
                );
                
                // عرض الأسماء
                if (studentsInSession.length > 0) {
                    content = studentsInSession.map(s => `<span class="badge bg-light text-dark border">${s.name}</span>`).join('<br>');
                }
            }
            html += `<td style="border:1px solid #999; vertical-align:middle;">${content}</td>`;
        }
        html += `</tr>`;
    });

    html += `</tbody></table></div>`;
    
    // إضافة مفتاح بسيط
    html += `<p class="text-muted small mt-2">* يظهر في الجدول فقط الطلاب الذين قمت بتحديدهم في التقرير.</p>`;

    return html;
}

function closeReportModal() {
    document.getElementById('viewReportModal').classList.remove('show');
}

function printReport() {
    window.print();
}

function downloadReport() {
    alert('تم تحميل التقرير (محاكاة)');
}

function viewStudentReport(studentId) {
    // تحديد الطالب الفردي وتوليد تقرير له
    selectedStudents.clear();
    selectedStudents.add(studentId);
    currentReportStudentIds = [studentId];
    
    // اختيار "بيانات الطالب" افتراضياً
    const radio = document.querySelector('input[name="reportType"][value="studentData"]');
    if(radio) radio.checked = true;

    generateReport();
}

function loadGeneratedReports() {
    const reportsList = document.getElementById('generatedReportsList');
    if (!reportsList) return;

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
        
        return `
            <div class="report-item">
                <div class="report-info">
                    <div class="report-title">تقرير ${getReportTypeName(report.reportType)}</div>
                    <div class="report-meta">
                        <span>${reportStudents.length} طالب</span>
                        <span>${formatDate(report.createdAt)}</span>
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
    if (!confirm('هل أنت متأكد من حذف هذا التقرير؟')) return;
    
    const committeeReports = JSON.parse(localStorage.getItem('committeeReports') || '[]');
    const updatedReports = committeeReports.filter(r => r.id !== reportId);
    
    localStorage.setItem('committeeReports', JSON.stringify(updatedReports));
    loadGeneratedReports();
}

function resetCheckboxes() {
    const cbAll = document.getElementById('selectAllCheckbox');
    if(cbAll) cbAll.checked = false;
    
    const checkboxes = document.querySelectorAll('.student-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
        checkbox.closest('tr').classList.remove('selected');
    });
    updateSelectedCount();
}

// دوال مساعدة إضافية
function getAssignedTeacherIds(committeeId) {
    const committeeTeachers = JSON.parse(localStorage.getItem('committeeTeachers') || '[]');
    return committeeTeachers
        .filter(ct => ct.committeeId == committeeId) // استخدام == للمرونة
        .map(ct => String(ct.teacherId));
}

function getAssignedTeachers(committeeId) {
    const ids = getAssignedTeacherIds(committeeId);
    const teachers = JSON.parse(localStorage.getItem('teachers') || '[]');
    return teachers.filter(t => ids.includes(String(t.id)));
}

function getReportTypeName(type) {
    const map = {
        'studentData': 'بيانات الطلاب',
        'schedule': 'الجدول الدراسي',
        'diagnosticTest': 'الاختبار التشخيصي',
        'iep': 'الخطة الفردية',
        'assignments': 'الواجبات'
    };
    return map[type] || type;
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('ar-SA');
}

function formatDateShort(dateString) {
    const d = new Date(dateString);
    return `${d.getDate()}/${d.getMonth()+1}`;
}

function getCurrentUser() {
    const session = sessionStorage.getItem('currentUser');
    if (!session) return null;
    const data = JSON.parse(session);
    return data.user || data;
}

// تصدير الدوال
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
window.deleteReport = deleteReport;
window.filterStudents = filterStudents;
