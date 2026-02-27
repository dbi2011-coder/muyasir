// ============================================
// 📁 الملف: assets/js/committee-reports.js
// الوصف: إدارة تقارير اللجنة مع العزل التام للبيانات (Supabase)
// ============================================

let selectedStudents = new Set();
let currentReportStudentIds = [];
let allFetchedStudents = []; // للاحتفاظ بالطلاب محلياً من أجل الفلترة

document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('reports.html')) {
        loadStudentsForReports();
        loadGeneratedReports();
    }
});

function getCurrentUser() {
    try {
        const session = sessionStorage.getItem('currentUser');
        return session ? JSON.parse(session) : null;
    } catch (e) {
        return null;
    }
}

// ========================================================
// 🛡️ 1. جلب الطلاب مع تطبيق العزل التام للبيانات
// ========================================================
async function loadStudentsForReports() {
    const tableBody = document.getElementById('studentsTableBody');
    const currentUser = getCurrentUser();
    
    if (!tableBody || !currentUser) return;

    tableBody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 20px;">جاري جلب بيانات الطلاب من السحابة...</td></tr>';

    try {
        // 🔥 العزل: المعلم المالك لهذا العضو
        const targetTeacherId = currentUser.ownerId;

        if (!targetTeacherId) {
            tableBody.innerHTML = '<tr><td colspan="8" class="text-danger text-center">عذراً، لا يوجد معلم مرتبط بحسابك.</td></tr>';
            return;
        }

        // جلب اسم المعلم
        const { data: teacherData } = await window.supabase
            .from('users')
            .select('name')
            .eq('id', targetTeacherId)
            .single();
            
        const teacherName = teacherData ? teacherData.name : 'المعلم';

        // جلب طلاب هذا المعلم فقط
        const { data: students, error } = await window.supabase
            .from('users')
            .select('*')
            .eq('role', 'student')
            .eq('teacherId', targetTeacherId)
            .order('id', { ascending: false });

        if (error) throw error;

        allFetchedStudents = students || [];

        if (allFetchedStudents.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 40px;">
                        <div class="empty-state">
                            <div class="empty-icon">👨‍🎓</div>
                            <h3>لا يوجد طلاب</h3>
                            <p>لم يقم المعلم (${teacherName}) بإضافة أي طلاب حتى الآن.</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        renderStudentsTable(allFetchedStudents, teacherName);
        
        // إخفاء فلتر المعلم لأنه لا داعي له (العضو يرى معلم واحد فقط)
        const teacherFilterGroup = document.getElementById('teacherFilter');
        if(teacherFilterGroup) {
            teacherFilterGroup.innerHTML = `<option value="all">أ. ${teacherName}</option>`;
            teacherFilterGroup.disabled = true;
        }

    } catch (e) {
        console.error("Error loading isolated students:", e);
        tableBody.innerHTML = '<tr><td colspan="8" class="text-danger text-center">حدث خطأ أثناء جلب الطلاب</td></tr>';
    }
}

// رسم الجدول
function renderStudentsTable(studentsArray, teacherName = 'المعلم') {
    const tableBody = document.getElementById('studentsTableBody');
    if (!tableBody) return;

    if(studentsArray.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="8" class="text-center p-3 text-muted">لا يوجد طلاب يطابقون الفلتر الحالي</td></tr>';
        return;
    }

    tableBody.innerHTML = studentsArray.map(student => {
        const progress = student.progress || 0;
        const progressClass = progress < 30 ? 'danger' : progress < 60 ? 'warning' : 'success';
        
        return `
            <tr data-student-id="${student.id}">
                <td>
                    <input type="checkbox" class="student-checkbox" 
                           value="${student.id}" 
                           onchange="toggleStudentSelection(${student.id})">
                </td>
                <td style="font-weight:bold;">${student.name}</td>
                <td>${student.grade || 'غير محدد'}</td>
                <td>${student.subject || 'غير محدد'}</td>
                <td>${teacherName}</td>
                <td>
                    <div style="display:flex; align-items:center; gap:10px;">
                        <span style="font-weight:bold; min-width:35px;">${progress}%</span>
                        <div style="flex-grow:1; background:#eee; height:10px; border-radius:5px; overflow:hidden;">
                            <div style="height:100%; width:${progress}%; background-color:var(--${progressClass}-color);"></div>
                        </div>
                    </div>
                </td>
                <td>${student.createdAt ? new Date(student.createdAt).toLocaleDateString('ar-SA') : '-'}</td>
                <td>
                    <button class="btn btn-sm btn-success" onclick="generateStudentReport(${student.id})">
                        <i class="fas fa-file-alt"></i> تقرير
                    </button>
                </td>
            </tr>
        `;
    }).join('');
    
    // تصفير التحديد
    selectedStudents.clear();
    updateSelectedCount();
    const selectAllCb = document.getElementById('selectAllCheckbox');
    if(selectAllCb) selectAllCb.checked = false;
}

// الفلترة المحلية
function filterStudents() {
    const gradeFilter = document.getElementById('gradeFilter').value;
    const subjectFilter = document.getElementById('subjectFilter').value;
    const progressFilter = document.getElementById('progressFilter').value;
    
    const filtered = allFetchedStudents.filter(student => {
        let match = true;
        
        if (gradeFilter !== 'all' && student.grade !== gradeFilter) match = false;
        if (subjectFilter !== 'all' && student.subject !== subjectFilter) match = false;
        
        if (progressFilter !== 'all') {
            const progress = student.progress || 0;
            const [min, max] = progressFilter.split('-').map(Number);
            if (progress < min || progress > max) match = false;
        }
        
        return match;
    });

    renderStudentsTable(filtered, document.getElementById('teacherFilter').options[0].text.replace('أ. ', ''));
}

// ========================================================
// 🔄 2. دوال التحديد
// ========================================================

function toggleSelectAll(forceState = null) {
    const selectAllCheckbox = document.getElementById('selectAllCheckbox');
    let isChecked = forceState !== null ? forceState : (selectAllCheckbox ? selectAllCheckbox.checked : true);
    
    if(selectAllCheckbox && forceState !== null) selectAllCheckbox.checked = forceState;

    const checkboxes = document.querySelectorAll('.student-checkbox');
    
    checkboxes.forEach(checkbox => {
        checkbox.checked = isChecked;
        const studentId = parseInt(checkbox.value);
        const row = checkbox.closest('tr');
        
        if (isChecked) {
            selectedStudents.add(studentId);
            if(row) row.classList.add('selected');
        } else {
            selectedStudents.delete(studentId);
            if(row) row.classList.remove('selected');
        }
    });
    
    updateSelectedCount();
}

function toggleStudentSelection(studentId) {
    const checkbox = document.querySelector(`.student-checkbox[value="${studentId}"]`);
    const row = checkbox ? checkbox.closest('tr') : null;
    
    if (checkbox && checkbox.checked) {
        selectedStudents.add(studentId);
        if(row) row.classList.add('selected');
    } else {
        selectedStudents.delete(studentId);
        if(row) row.classList.remove('selected');
    }
    
    updateSelectedCount();
    
    const selectAllCheckbox = document.getElementById('selectAllCheckbox');
    const allVisible = document.querySelectorAll('.student-checkbox').length;
    const allChecked = document.querySelectorAll('.student-checkbox:checked').length;
    
    if(selectAllCheckbox) {
        selectAllCheckbox.checked = (allVisible > 0 && allVisible === allChecked);
    }
}

function selectAllStudents() {
    toggleSelectAll(true);
}

function updateSelectedCount() {
    const count = selectedStudents.size;
    const generateBtn = document.querySelector('.btn-generate') || document.querySelector('.btn-success[onclick*="generateReportForSelected"]');
    
    if (generateBtn) {
        generateBtn.innerHTML = count > 0 ? 
            `<i class="fas fa-print"></i> توليد تقرير (${count} طالب)` : 
            `<i class="fas fa-print"></i> توليد تقرير للمحددين`;
    }
}

// ========================================================
// 📊 3. توليد التقارير
// ========================================================

function generateReportForSelected() {
    if (selectedStudents.size === 0) {
        return window.showAuthNotification ? showAuthNotification('يرجى تحديد طالب واحد على الأقل', 'error') : alert('يرجى تحديد طلاب');
    }
    currentReportStudentIds = Array.from(selectedStudents);
    showReportOptions();
}

function generateStudentReport(studentId) {
    selectedStudents.clear();
    selectedStudents.add(studentId);
    currentReportStudentIds = [studentId];
    
    const checkboxes = document.querySelectorAll('.student-checkbox');
    checkboxes.forEach(cb => {
        cb.checked = parseInt(cb.value) === studentId;
        const row = cb.closest('tr');
        if(cb.checked) row.classList.add('selected'); else row.classList.remove('selected');
    });
    
    updateSelectedCount();
    showReportOptions();
}

function showReportOptions() {
    const optionsSection = document.getElementById('reportOptionsSection');
    if(optionsSection) {
        optionsSection.style.display = 'block';
        optionsSection.scrollIntoView({ behavior: 'smooth' });
    }
}

function hideReportOptions() {
    const optionsSection = document.getElementById('reportOptionsSection');
    if(optionsSection) optionsSection.style.display = 'none';
}

// 🌟 الدالة التي تستدعي محرك التقارير الرئيسي من (reports.js)
window.initiateReport = window.memberGenerateReport = async function() {
    const reportType = document.querySelector('input[name="reportType"]:checked')?.value || document.getElementById('reportType')?.value || document.getElementById('memberReportType')?.value;
    
    let studentIdsToProcess = currentReportStudentIds;
    if(studentIdsToProcess.length === 0) {
        const checkboxes = document.querySelectorAll('.student-checkbox:checked');
        studentIdsToProcess = Array.from(checkboxes).map(cb => cb.value);
    }

    if (!reportType) return alert("الرجاء اختيار نوع التقرير.");
    if (studentIdsToProcess.length === 0) return alert("الرجاء اختيار طالب واحد على الأقل.");

    const previewArea = document.getElementById('reportPreviewArea');
    if(!previewArea) return;
    
    previewArea.innerHTML = '<div class="text-center p-5"><h3><i class="fas fa-spinner fa-spin"></i> جاري استخراج البيانات من السحابة...</h3></div>'; 
    
    try {
        // يتم استدعاء دوال التوليد من ملف reports.js المحمل في نفس الصفحة
        if (reportType === 'attendance' && typeof generateAttendanceReport === 'function') await generateAttendanceReport(studentIdsToProcess, previewArea);
        else if (reportType === 'achievement' && typeof generateAchievementReport === 'function') await generateAchievementReport(studentIdsToProcess, previewArea);
        else if (reportType === 'assignments' && typeof generateAssignmentsReport === 'function') await generateAssignmentsReport(studentIdsToProcess, previewArea);
        else if (reportType === 'iep' && typeof generateIEPReport === 'function') await generateIEPReport(studentIdsToProcess, previewArea);
        else if (reportType === 'diagnostic' && typeof generateDiagnosticReport === 'function') await generateDiagnosticReport(studentIdsToProcess, previewArea);
        else if (reportType === 'schedule' && typeof generateScheduleReport === 'function') await generateScheduleReport(studentIdsToProcess, previewArea);
        else if (reportType === 'balance' && typeof generateCreditReport === 'function') await generateCreditReport(studentIdsToProcess, previewArea);
        else previewArea.innerHTML = `<div class="alert alert-warning">نظام التقارير غير متصل بشكل صحيح. يرجى التأكد من توفر ملف reports.js</div>`;
        
        // حفظ سجل التقرير
        saveReportLog(reportType, studentIdsToProcess.length);
        loadGeneratedReports();
        
    } catch (e) {
        console.error(e);
        previewArea.innerHTML = `<div class="alert alert-danger">حدث خطأ أثناء بناء التقرير.</div>`;
    }
};

function saveReportLog(type, count) {
    const currentUser = getCurrentUser();
    const committeeReports = JSON.parse(localStorage.getItem('committeeReports') || '[]');
    committeeReports.push({
        id: Date.now(),
        committeeId: currentUser.id,
        reportType: type,
        studentCount: count,
        createdAt: new Date().toISOString()
    });
    localStorage.setItem('committeeReports', JSON.stringify(committeeReports));
}

function loadGeneratedReports() {
    const reportsList = document.getElementById('generatedReportsList');
    if(!reportsList) return;
    
    const currentUser = getCurrentUser();
    const committeeReports = JSON.parse(localStorage.getItem('committeeReports') || '[]');
    
    const userReports = committeeReports
        .filter(cr => cr.committeeId === currentUser.id)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 10);
    
    if (userReports.length === 0) {
        reportsList.innerHTML = `
            <div class="empty-state" style="text-align:center; padding:20px; color:#777;">
                <div style="font-size:2rem; margin-bottom:10px;">📋</div>
                <p>لا توجد تقارير منشأة مسبقاً</p>
            </div>
        `;
        return;
    }
    
    const typeNames = { 'attendance':'الغياب', 'achievement':'الإنجاز', 'assignments':'الواجبات', 'iep':'الخطط الفردية', 'diagnostic':'الاختبار التشخيصي', 'schedule':'الجدول الدراسي', 'balance': 'رصيد الحصص' };

    reportsList.innerHTML = userReports.map(report => {
        return `
            <div style="background: #f8f9fa; border: 1px solid #eee; border-radius: 8px; padding: 15px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <div style="font-weight: bold; color: #2c3e50; margin-bottom: 5px;">تقرير ${typeNames[report.reportType] || 'عام'}</div>
                    <div style="font-size: 0.85rem; color: #666;">
                        <span style="margin-left: 15px;"><i class="fas fa-users"></i> ${report.studentCount} طلاب</span>
                        <span><i class="far fa-clock"></i> ${new Date(report.createdAt).toLocaleDateString('ar-SA')} - ${new Date(report.createdAt).toLocaleTimeString('ar-SA')}</span>
                    </div>
                </div>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteReportLog(${report.id})"><i class="fas fa-trash"></i></button>
            </div>
        `;
    }).join('');
}

window.deleteReportLog = function(id) {
    let committeeReports = JSON.parse(localStorage.getItem('committeeReports') || '[]');
    committeeReports = committeeReports.filter(cr => cr.id !== id);
    localStorage.setItem('committeeReports', JSON.stringify(committeeReports));
    loadGeneratedReports();
};
