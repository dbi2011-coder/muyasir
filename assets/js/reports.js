// ============================================
// 📁 الملف: assets/js/reports.js
// الوصف: نظام التقارير الشامل (نسخة المطابقة التامة - Teacher & Committee)
// ============================================

// 1. حقن أنماط الطباعة (CSS)
(function injectPrintStyles() {
    const style = document.createElement('style');
    style.innerHTML = `
        /* تنسيق التذييل الأساسي */
        .custom-footer {
            display: block;
            width: 100%;
            text-align: center;
            font-size: 12pt;
            font-weight: bold;
            color: #000 !important;
            border-top: 2px solid #000;
            padding-top: 10px;
            padding-bottom: 10px;
            background: #fff;
            margin-top: 30px;
        }

        @media print {
            @page {
                size: A4;
                margin: 10mm;
                margin-bottom: 25mm; /* مساحة للتذييل */
            }

            /* إخفاء الصفحة بالكامل مبدئياً */
            body {
                visibility: hidden !important;
                margin: 0 !important;
                padding: 0 !important;
                background: #fff !important;
            }

            /* إخفاء جميع العناصر المباشرة للـ body ما عدا التقرير */
            body > *:not(#reportPreviewArea) {
                display: none !important;
            }

            /* إظهار وتنسيق منطقة التقرير */
            #reportPreviewArea {
                visibility: visible !important;
                display: block !important;
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
                background: white !important;
                z-index: 9999999 !important; /* أعلى طبقة على الإطلاق */
            }

            #reportPreviewArea * {
                visibility: visible !important;
            }

            /* تنسيق التذييل الثابت */
            .custom-footer {
                position: fixed !important;
                bottom: 0 !important;
                left: 0 !important;
                right: 0 !important;
                background-color: white !important;
                z-index: 2147483647 !important;
                border-top: 2px solid #000;
                padding-bottom: 10px;
            }

            /* تحسين الجداول للطباعة */
            table {
                width: 100% !important;
                border-collapse: collapse !important;
                border: 2px solid #000 !important;
                font-family: 'Times New Roman', serif;
                font-size: 12pt;
                margin-bottom: 20px;
            }
            
            th, td {
                border: 1px solid #000 !important;
                padding: 8px !important;
                color: #000 !important;
                text-align: center;
                vertical-align: middle;
            }

            th {
                background-color: #f0f0f0 !important;
                -webkit-print-color-adjust: exact;
                font-weight: bold;
            }
            
            .report-title-main {
                text-align: center !important;
                font-size: 24pt;
                font-weight: bold;
                margin-bottom: 30px;
                text-decoration: underline;
            }

            /* إخفاء الأزرار */
            .no-print, button {
                display: none !important;
            }

            .page-break {
                page-break-after: always;
                display: block;
                height: 1px;
            }
            
            .balance-positive { color: green !important; -webkit-print-color-adjust: exact; }
            .balance-negative { color: red !important; -webkit-print-color-adjust: exact; }
            .progress-bar-fill { background-color: #555 !important; -webkit-print-color-adjust: exact; }
        }
    `;
    document.head.appendChild(style);
})();

// ============================================
// 2. دوال المساعدة والتهيئة
// ============================================

function normalizeText(text) {
    if (!text) return "";
    return String(text).trim().replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه');
}

function getReportUser() {
    try {
        const sessionData = JSON.parse(sessionStorage.getItem('currentUser'));
        return sessionData.user || sessionData;
    } catch (e) {
        return null;
    }
}

window.toggleSelectAll = function() {
    const checkboxes = document.querySelectorAll('input[name="selectedStudents"]');
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
    checkboxes.forEach(cb => cb.checked = !allChecked);
};

window.initiateReport = function() {
    const reportType = document.getElementById('reportType').value;
    const selectedCheckboxes = document.querySelectorAll('input[name="selectedStudents"]:checked');
    const selectedStudentIds = Array.from(selectedCheckboxes).map(cb => cb.value);

    if (!reportType) return alert("الرجاء اختيار نوع التقرير.");
    if (selectedStudentIds.length === 0) return alert("الرجاء اختيار طالب واحد على الأقل.");

    // 🔥 الخطوة الحاسمة: التأكد من وجود منطقة التقرير ونقلها لتكون ابناً مباشراً للـ body
    // هذا يحل مشكلة اختلاف التصميم بين المعلم واللجنة
    let previewArea = document.getElementById('reportPreviewArea');
    if (!previewArea) {
        previewArea = document.createElement('div');
        previewArea.id = 'reportPreviewArea';
        document.body.appendChild(previewArea);
    } else {
        // إذا كان موجوداً، انقله ليكون في آخر الـ body (للتخلص من أي قيود للحاويات الأب)
        if (previewArea.parentNode !== document.body) {
            document.body.appendChild(previewArea);
        }
    }
    
    // إعداد منطقة المعاينة
    previewArea.style.display = "block";
    previewArea.style.visibility = "visible";
    previewArea.style.background = "white";
    previewArea.style.position = "fixed"; // تغطية كاملة للمعاينة
    previewArea.style.top = "0";
    previewArea.style.left = "0";
    previewArea.style.width = "100%";
    previewArea.style.height = "100%";
    previewArea.style.zIndex = "100000";
    previewArea.style.overflowY = "auto";
    previewArea.innerHTML = ''; 

    // زر إغلاق للمعاينة (مهم لأننا غطينا الشاشة)
    const closeBtnHTML = `
        <div class="no-print" style="position:fixed; top:20px; left:20px; z-index:100001;">
            <button onclick="document.getElementById('reportPreviewArea').style.display='none'" class="btn btn-danger" style="padding:10px 20px; box-shadow:0 2px 5px rgba(0,0,0,0.2);">❌ إغلاق المعاينة</button>
        </div>
    `;

    try {
        let reportContent = '';
        if (reportType === 'attendance') generateAttendanceReport(selectedStudentIds, previewArea);
        else if (reportType === 'achievement') generateAchievementReport(selectedStudentIds, previewArea);
        else if (reportType === 'assignments') generateAssignmentsReport(selectedStudentIds, previewArea);
        else if (reportType === 'iep') generateIEPReport(selectedStudentIds, previewArea);
        else if (reportType === 'diagnostic') generateDiagnosticReport(selectedStudentIds, previewArea);
        else if (reportType === 'schedule') generateScheduleReport(selectedStudentIds, previewArea);
        else if (reportType === 'credit') generateCreditReport(selectedStudentIds, previewArea);
        else previewArea.innerHTML = `<div class="alert alert-warning text-center no-print">عفواً، هذا التقرير قيد التطوير.</div>` + closeBtnHTML;

        // إضافة زر الإغلاق في الأعلى دائماً
        if (previewArea.innerHTML) {
            previewArea.insertAdjacentHTML('afterbegin', closeBtnHTML);
        }

    } catch (error) {
        console.error("Report Error:", error);
        previewArea.innerHTML = closeBtnHTML + `<div class="alert alert-danger text-center" style="margin-top:50px;">خطأ: ${error.message}</div>`;
    }
};

document.addEventListener('DOMContentLoaded', function() {
    updateTeacherName();
    if (typeof loadStudentsForSelection === 'function') loadStudentsForSelection();
    
    const select = document.getElementById('reportType');
    if (select) {
        Array.from(select.options).forEach(opt => {
            if (opt.textContent.includes('⚖️') || opt.textContent.includes('رصيد الحصص')) opt.remove();
        });
    }

    ensureOptionExists('iep', 'تقرير الخطط التربوية الفردية', '📄');
    ensureOptionExists('diagnostic', 'تقرير الاختبار التشخيصي', '📝');
    ensureOptionExists('schedule', 'تقرير الجدول الدراسي', '📅');
    ensureOptionExists('credit', 'تقرير رصيد الحصص', '📊');
});

function ensureOptionExists(value, text, icon) {
    const select = document.getElementById('reportType');
    if (!select) return;
    if (!select.querySelector(`option[value="${value}"]`)) {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = `${icon} ${text}`;
        select.appendChild(option);
    }
}

function updateTeacherName() {
    try {
        const user = getReportUser();
        const el = document.getElementById('teacherName');
        if (el && user) el.textContent = user.name;
    } catch (e) { }
}

function loadStudentsForSelection() {
    const container = document.getElementById('studentsListContainer');
    if (!container) return;

    const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const user = getReportUser();
    
    let teacherId = null, isAdmin = false, isCommittee = false;

    if (user) {
        teacherId = String(user.id);
        isAdmin = user.role === 'admin';
        isCommittee = user.role === 'committee';
    }

    let students = allUsers.filter(u => {
        if (u.role !== 'student') return false;
        if (isAdmin || isCommittee) return true;
        return String(u.teacherId) === teacherId;
    });

    if (students.length === 0 && !isAdmin && !isCommittee) {
        students = allUsers.filter(u => u.role === 'student');
    }

    container.innerHTML = '';
    if (students.length === 0) {
        container.innerHTML = '<div class="text-danger p-3">لا يوجد طلاب.</div>';
        return;
    }

    students.forEach(student => {
        const div = document.createElement('div');
        div.style.cssText = "padding: 8px; border-bottom: 1px solid #eee;";
        div.innerHTML = `
            <label style="cursor: pointer; display: flex; align-items: center;">
                <input type="checkbox" name="selectedStudents" value="${student.id}" style="margin-left:10px;">
                <span style="font-weight: bold;">${student.name}</span>
            </label>
        `;
        container.appendChild(div);
    });
}

function calculateStudentBalance(studentId, allLessons, allEvents, teacherSchedule, studentTeacherId) {
    let balance = 0;
    const myList = allLessons.filter(l => l.studentId == studentId);
    let myEvents = allEvents.filter(e => e.studentId == studentId);
    
    if (myList.length === 0) return 0;

    const sortedByDate = [...myList].sort((a, b) => new Date(a.assignedDate) - new Date(b.assignedDate));
    const planStartDate = new Date(sortedByDate[0].assignedDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const dayMap = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const relevantSchedule = teacherSchedule.filter(s => s.teacherId == studentTeacherId);

    for (let d = new Date(planStartDate); d < today; d.setDate(d.getDate() + 1)) {
        if (d.toDateString() === new Date().toDateString()) continue;
        const dateStr = d.toDateString();
        const hasLesson = myList.some(l => l.historyLog && l.historyLog.some(log => new Date(log.date).toDateString() === dateStr));
        const hasEvent = myEvents.some(e => new Date(e.date).toDateString() === dateStr);
        if (hasLesson || hasEvent) continue;
        const dayKey = dayMap[d.getDay()];
        const isScheduledDay = relevantSchedule.some(s => normalizeText(s.day) === normalizeText(dayKey) && (s.students && s.students.map(String).includes(String(studentId))));
        if (isScheduledDay) balance--;
    }

    myEvents.forEach(e => {
        if (e.status === 'excused' || e.type === 'auto-absence' || e.status === 'absence') balance--;
    });

    myList.forEach(l => {
        if (l.historyLog) l.historyLog.forEach(log => {
            if (log.cachedSessionType === 'compensation' || log.cachedSessionType === 'additional') balance++;
        });
    });

    return balance;
}

// ============================================
// 3. دوال توليد التقارير (مع التذييل الثابت)
// ============================================

function generateAttendanceReport(studentIds, container) {
    const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const allEvents = JSON.parse(localStorage.getItem('studentEvents') || '[]');
    const printDate = new Date().toLocaleDateString('ar-SA');

    let html = `
        <div style="background:white; padding:20px; margin-top:40px;">
            <h1 class="report-title-main">تقرير متابعة الغياب</h1>
            <table class="table">
                <thead><tr style="background:#f2f2f2;"><th>اسم الطالب</th><th>عدد الأيام</th><th>تواريخ الغياب</th></tr></thead>
                <tbody>
    `;

    studentIds.forEach(id => {
        const student = allUsers.find(u => u.id == id);
        if (!student) return;
        const absences = allEvents.filter(e => e.studentId == id && (e.type === 'auto-absence' || e.status === 'absence' || (e.title + ' ' + e.note).toLowerCase().includes('غائب')));
        const dates = absences.map(a => (a.date || '').split('T')[0]).join(' ، ');
        html += `<tr><td>${student.name}</td><td>${absences.length}</td><td>${absences.length > 0 ? dates : 'منتظم'}</td></tr>`;
    });

    html += `</tbody></table>
            <div class="custom-footer">تم طباعة التقرير من نظام ميسر التعلم للاستاذ/ صالح عبدالعزيز العجلان بتاريخ ${printDate}</div>
            <div class="mt-4 text-left no-print" style="padding-bottom:50px;"><button onclick="window.print()" class="btn btn-primary">طباعة التقرير 🖨️</button></div>
        </div>`;
    container.innerHTML += html;
}

function generateAchievementReport(studentIds, container) {
    const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const allLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    const printDate = new Date().toLocaleDateString('ar-SA');

    let html = `
        <div style="background:white; padding:20px; margin-top:40px;">
            <h1 class="report-title-main">تقرير نسب الإنجاز</h1>
            <table class="table">
                <thead><tr style="background:#f2f2f2;"><th>اسم الطالب</th><th>عدد الأهداف</th><th>المنجز</th><th>نسبة الإنجاز</th></tr></thead>
                <tbody>
    `;

    studentIds.forEach(id => {
        const student = allUsers.find(u => u.id == id);
        if (!student) return;
        const myLessons = allLessons.filter(l => l.studentId == id);
        const completed = myLessons.filter(l => l.status === 'completed' || l.status === 'accelerated').length;
        const percent = myLessons.length === 0 ? 0 : Math.round((completed / myLessons.length) * 100);
        let color = percent >= 80 ? '#28a745' : percent >= 50 ? '#17a2b8' : '#ffc107';

        html += `<tr>
            <td>${student.name}</td><td>${myLessons.length}</td><td>${completed}</td>
            <td>
                <div style="display:flex;align-items:center;">
                    <span style="width:45px;font-weight:bold;">${percent}%</span>
                    <div class="progress-container" style="flex:1;height:15px;background:#eee;border-radius:10px;overflow:hidden;">
                        <div class="progress-bar-fill" style="width:${percent}%;background:${color};height:100%;"></div>
                    </div>
                </div>
            </td>
        </tr>`;
    });

    html += `</tbody></table>
            <div class="custom-footer">تم طباعة التقرير من نظام ميسر التعلم للاستاذ/ صالح عبدالعزيز العجلان بتاريخ ${printDate}</div>
            <div class="mt-4 text-left no-print" style="padding-bottom:50px;"><button onclick="window.print()" class="btn btn-primary">طباعة التقرير 🖨️</button></div>
        </div>`;
    container.innerHTML += html;
}

function generateAssignmentsReport(studentIds, container) {
    const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const allAssignments = JSON.parse(localStorage.getItem('studentAssignments') || '[]');
    const printDate = new Date().toLocaleDateString('ar-SA');

    let html = `
        <div style="background:white; padding:20px; margin-top:40px;">
            <h1 class="report-title-main">تقرير متابعة الواجبات</h1>
            <table class="table">
                <thead><tr style="background:#f2f2f2;"><th>اسم الطالب</th><th>اسم الواجب</th><th>تاريخ الإسناد</th><th>الحالة</th></tr></thead>
                <tbody>
    `;

    studentIds.forEach(id => {
        const student = allUsers.find(u => u.id == id);
        if (!student) return;
        const myAss = allAssignments.filter(a => a.studentId == id);
        if (myAss.length === 0) {
            html += `<tr><td>${student.name}</td><td colspan="3">لا توجد واجبات</td></tr>`;
        } else {
            myAss.forEach(a => {
                const date = a.assignedDate ? new Date(a.assignedDate).toLocaleDateString('ar-SA') : '-';
                const status = a.status === 'completed' ? (a.completedDate ? new Date(a.completedDate).toLocaleDateString('ar-SA') : 'مكتمل') : 'لم يسلم';
                html += `<tr><td>${student.name}</td><td>${a.title}</td><td>${date}</td><td>${status}</td></tr>`;
            });
        }
    });

    html += `</tbody></table>
            <div class="custom-footer">تم طباعة التقرير من نظام ميسر التعلم للاستاذ/ صالح عبدالعزيز العجلان بتاريخ ${printDate}</div>
            <div class="mt-4 text-left no-print" style="padding-bottom:50px;"><button onclick="window.print()" class="btn btn-primary">طباعة التقرير 🖨️</button></div>
        </div>`;
    container.innerHTML += html;
}

function generateIEPReport(studentIds, container) {
    const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const allTests = JSON.parse(localStorage.getItem('tests') || '[]');
    const allObjectives = JSON.parse(localStorage.getItem('objectives') || '[]');
    const studentLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    const teacherSchedule = JSON.parse(localStorage.getItem('teacherSchedule') || '[]');
    const printDate = new Date().toLocaleDateString('ar-SA');

    let html = `<div style="background:white; margin-top:40px;">`;

    studentIds.forEach((id, idx) => {
        const student = allUsers.find(u => u.id == id);
        if (!student) return;
        
        const diag = studentTests.find(t => t.studentId == id && t.type === 'diagnostic' && t.status === 'completed');
        const test = diag ? allTests.find(t => t.id == diag.testId) : null;
        let strengths = '', needs = [];

        if (diag && test) {
            test.questions.forEach(q => {
                const ans = diag.answers?.find(a => a.questionId == q.id);
                const score = ans?.score || 0;
                if (q.linkedGoalId) {
                    const obj = allObjectives.find(o => o.id == q.linkedGoalId);
                    if (obj) {
                        if (score >= (q.passingScore || 1)) {
                            if (!strengths.includes(obj.shortTermGoal)) strengths += `<li>${obj.shortTermGoal}</li>`;
                        } else {
                            if (!needs.find(o => o.id == obj.id)) needs.push(obj);
                        }
                    }
                }
            });
        }
        if (!strengths) strengths = '<li>لا توجد نقاط قوة مسجلة.</li>';

        const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
        const schedule = days.map(d => {
            const s = teacherSchedule.find(x => normalizeText(x.day) === normalizeText(d) && x.students?.map(String).includes(String(id)));
            return `<td>${s ? 'حصة ' + s.period : '-'}</td>`;
        }).join('');

        html += `
        <div class="student-iep-page" style="page-break-after:always; position:relative; min-height:90vh;">
            <h1 class="report-title-main">تقرير الخطط التربوية الفردية</h1>
            <table class="table">
                <tr><th>اسم الطالب</th><td>${student.name}</td><th>الصف</th><td>${student.grade || '-'}</td></tr>
                <tr><th>المادة</th><td>${test ? test.subject : 'عام'}</td><th>تاريخ الخطة</th><td>${diag ? new Date(diag.assignedDate).toLocaleDateString('ar-SA') : printDate}</td></tr>
            </table>
            
            <div class="section-title">جدول الحصص</div>
            <table class="table"><thead><tr><th>الأحد</th><th>الاثنين</th><th>الثلاثاء</th><th>الأربعاء</th><th>الخميس</th></tr></thead><tbody><tr>${schedule}</tr></tbody></table>
            
            <div style="display:flex;gap:10px;margin-top:10px;">
                <div style="flex:1;border:1px solid #000;padding:10px;">
                    <div style="font-weight:bold;text-align:center;border-bottom:1px solid #000;margin-bottom:5px;background:#eee;">نقاط القوة</div><ul>${strengths}</ul>
                </div>
                <div style="flex:1;border:1px solid #000;padding:10px;">
                    <div style="font-weight:bold;text-align:center;border-bottom:1px solid #000;margin-bottom:5px;background:#eee;">نقاط الاحتياج</div>
                    <ul>${needs.length > 0 ? needs.map(o => `<li>${o.shortTermGoal}</li>`).join('') : '<li>لا توجد خطة</li>'}</ul>
                </div>
            </div>

            <div class="section-title">الخطة التفصيلية</div>
            <table class="table">
                <thead><tr style="background:#333;color:white;"><th>#</th><th>الهدف قصير المدى</th><th>الهدف التدريسي</th><th>تاريخ التحقق</th></tr></thead>
                <tbody>
        `;

        let count = 1;
        if (needs.length > 0) {
            needs.forEach(obj => {
                if (obj.instructionalGoals) {
                    obj.instructionalGoals.forEach((goal, gIdx) => {
                        const lesson = studentLessons.find(l => l.studentId == id && l.objective === goal);
                        let status = lesson ? (lesson.status === 'completed' ? new Date(lesson.completedDate).toLocaleDateString('ar-SA') : 'جاري العمل') : '-';
                        html += `<tr><td>${count++}</td>${gIdx === 0 ? `<td rowspan="${obj.instructionalGoals.length}">${obj.shortTermGoal}</td>` : ''}<td>${goal}</td><td>${status}</td></tr>`;
                    });
                }
            });
        } else {
            html += `<tr><td colspan="4">لا توجد أهداف</td></tr>`;
        }

        html += `</tbody></table>
            <div class="custom-footer">تم طباعة التقرير من نظام ميسر التعلم للاستاذ/ صالح عبدالعزيز العجلان بتاريخ ${printDate}</div>
        </div>`;
    });

    html += `<div class="mt-4 text-left no-print" style="padding:20px; padding-bottom:50px;"><button onclick="window.print()" class="btn btn-primary">طباعة التقارير 🖨️</button></div></div>`;
    container.innerHTML += html;
}

function generateDiagnosticReport(studentIds, container) {
    const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const allTests = JSON.parse(localStorage.getItem('tests') || '[]');
    const allObjectives = JSON.parse(localStorage.getItem('objectives') || '[]');
    const printDate = new Date().toLocaleDateString('ar-SA');

    let html = `<div style="background:white; margin-top:40px;">`;

    studentIds.forEach((id, idx) => {
        const student = allUsers.find(u => u.id == id);
        if (!student) return;
        const diag = studentTests.filter(t => t.studentId == id && t.type === 'diagnostic' && t.status === 'completed').sort((a,b) => new Date(b.completedDate) - new Date(a.completedDate))[0];
        const test = diag ? allTests.find(t => t.id == diag.testId) : null;

        html += `
        <div class="student-diagnostic-page" style="page-break-after:always; position:relative; min-height:90vh;">
            <h1 class="report-title-main">تقرير الاختبار التشخيصي</h1>
            <table class="table"><tr><th>اسم الطالب</th><td>${student.name}</td><th>الصف</th><td>${student.grade || '-'}</td></tr></table>
        `;

        if (!diag || !test) {
            html += `<div style="text-align:center;padding:50px;">لا يوجد اختبار مكتمل</div>`;
        } else {
            const percent = Math.round((diag.score / (diag.totalScore || test.questions.length || 1)) * 100);
            html += `
                <div style="border:2px solid #333;padding:15px;margin:20px 0;text-align:center;background:#f0f0f0;">
                    <div>${test.title}</div>
                    <div>الدرجة: ${diag.score} (${percent}%)</div>
                    <div>التاريخ: ${new Date(diag.completedDate).toLocaleDateString('ar-SA')}</div>
                </div>
                <table class="table">
                    <thead><tr style="background:#333;color:white;"><th>#</th><th>السؤال</th><th>الإجابة</th><th>التقييم</th><th>المهارة</th></tr></thead>
                    <tbody>
            `;
            test.questions.forEach((q, i) => {
                const ans = diag.answers?.find(a => a.questionId == q.id);
                const val = ans?.answer || 'لم يجب';
                const disp = String(val).startsWith('data:image') ? `<img src="${val}" class="answer-img">` : val;
                const icon = ans?.score > 0 ? '✔️' : '❌';
                const skill = q.linkedGoalId ? allObjectives.find(o => o.id == q.linkedGoalId)?.shortTermGoal || '-' : '-';
                html += `<tr><td>${i+1}</td><td>${q.text}</td><td>${disp}</td><td>${icon}</td><td>${skill}</td></tr>`;
            });
            html += `</tbody></table>`;
        }
        html += `<div class="custom-footer">تم طباعة التقرير من نظام ميسر التعلم للاستاذ/ صالح عبدالعزيز العجلان بتاريخ ${printDate}</div></div>`;
    });

    html += `<div class="mt-4 text-left no-print" style="padding:20px; padding-bottom:50px;"><button onclick="window.print()" class="btn btn-primary">طباعة التقارير 🖨️</button></div></div>`;
    container.innerHTML += html;
}

function generateScheduleReport(studentIds, container) {
    const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const scheduleData = JSON.parse(localStorage.getItem('teacherSchedule') || '[]');
    const printDate = new Date().toLocaleDateString('ar-SA');
    const selectedStudents = allUsers.filter(u => studentIds.includes(String(u.id)));

    let html = `
        <div style="background:white; padding:20px; margin-top:40px;">
            <h1 class="report-title-main">تقرير الجدول الدراسي</h1>
            <div class="section-title">رموز الطلاب</div>
            <table class="table">
                <thead><tr style="background:#f0f0f0;"><th>م</th><th>اسم الطالب</th><th>الصف</th></tr></thead>
                <tbody>
    `;
    const codes = {};
    selectedStudents.forEach((s, i) => {
        codes[s.id] = i + 1;
        html += `<tr><td>${i+1}</td><td>${s.name}</td><td>${s.grade || '-'}</td></tr>`;
    });
    html += `</tbody></table><h2 style="text-align:center;margin-top:20px;">الجدول</h2>
    <table class="table schedule-table"><thead><tr style="background:#333;color:white;"><th>اليوم</th><th>1</th><th>2</th><th>3</th><th>4</th><th>5</th><th>6</th><th>7</th></tr></thead><tbody>`;

    ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'].forEach(day => {
        html += `<tr><td style="font-weight:bold;background:#f0f0f0;">${day}</td>`;
        for (let p = 1; p <= 7; p++) {
            const s = scheduleData.find(x => normalizeText(x.day) === normalizeText(day) && x.period == p && x.students?.some(id => studentIds.includes(String(id))));
            let content = '';
            if (s && s.students) {
                const visibleCodes = s.students.filter(id => codes[id]).map(id => codes[id]);
                if (visibleCodes.length) content = visibleCodes.join(' ، ');
            }
            html += `<td>${content}</td>`;
        }
        html += `</tr>`;
    });

    html += `</tbody></table>
            <div class="custom-footer">تم طباعة التقرير من نظام ميسر التعلم للاستاذ/ صالح عبدالعزيز العجلان بتاريخ ${printDate}</div>
            <div class="mt-4 text-left no-print" style="padding-bottom:50px;"><button onclick="window.print()" class="btn btn-primary">طباعة التقرير 🖨️</button></div>
        </div>`;
    container.innerHTML += html;
}

function generateCreditReport(studentIds, container) {
    const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const allLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    const allEvents = JSON.parse(localStorage.getItem('studentEvents') || '[]');
    const teacherSchedule = JSON.parse(localStorage.getItem('teacherSchedule') || '[]');
    const printDate = new Date().toLocaleDateString('ar-SA');

    let html = `
        <div style="background:white; padding:20px; margin-top:40px;">
            <h1 class="report-title-main">تقرير رصيد الحصص</h1>
            <table class="table">
                <thead><tr style="background:#333;color:white;"><th>اسم الطالب</th><th>الرصيد</th></tr></thead>
                <tbody>
    `;

    studentIds.forEach(id => {
        const student = allUsers.find(u => u.id == id);
        if (!student) return;
        const bal = calculateStudentBalance(id, allLessons, allEvents, teacherSchedule, student.teacherId);
        let color = bal > 0 ? 'green' : bal < 0 ? 'red' : 'black';
        let sign = bal > 0 ? '+' : '';
        html += `<tr><td>${student.name}</td><td style="color:${color};font-weight:bold;font-size:1.4em;direction:ltr;">${sign}${bal}</td></tr>`;
    });

    html += `</tbody></table>
            <div style="margin-top:20px;border:1px solid #ccc;padding:10px;">
                <strong>دليل:</strong> <span style="color:red">(-) تعويض</span> ، <span style="color:green">(+) متقدم</span> ، <span>(0) منتظم</span>
            </div>
            <div class="custom-footer">تم طباعة التقرير من نظام ميسر التعلم للاستاذ/ صالح عبدالعزيز العجلان بتاريخ ${printDate}</div>
            <div class="mt-4 text-left no-print" style="padding-bottom:50px;"><button onclick="window.print()" class="btn btn-primary">طباعة التقرير 🖨️</button></div>
        </div>`;
    container.innerHTML += html;
}
