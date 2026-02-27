// ============================================
// 📁 الملف: assets/js/reports.js
// الوصف: نظام التقارير الشامل (نسخة احترافية مع تثبيت التذييل أسفل الصفحة لجميع التقارير)
// ============================================

// 1. حقن أنماط الطباعة (CSS)
(function injectPrintStyles() {
    const style = document.createElement('style');
    style.innerHTML = `
        /* --- تقنية Flexbox لجعل التذييل في أسفل الصفحة دائماً --- */
        .report-wrapper {
            display: flex;
            flex-direction: column;
            min-height: 95vh; /* يأخذ 95% من طول الشاشة/الورقة */
            background: white;
            padding: 20px;
        }
        .report-content {
            flex: 1 0 auto; /* يتمدد لدفع التذييل للأسفل */
        }
        .custom-footer {
            margin-top: auto; /* يلتصق بالأسفل تلقائياً */
            width: 100%;
            text-align: center;
            font-size: 11pt;
            font-weight: bold;
            color: #000 !important;
            border-top: 2px solid #000;
            padding-top: 10px;
            background: white;
            page-break-inside: avoid; /* يمنع انقسام التذييل بين صفحتين */
        }

        @media print {
            @page {
                size: A4;
                margin: 10mm;
            }
            body * {
                visibility: hidden;
            }
            .main-sidebar, .header, .sidebar, .no-print, button, input, select, .alert {
                display: none !important;
            }
            #reportPreviewArea, #reportPreviewArea * {
                visibility: visible;
            }
            #reportPreviewArea {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                margin: 0;
                padding: 0;
                background: white;
                direction: rtl;
                z-index: 99999 !important;
            }
            .report-wrapper {
                padding: 0 !important;
                min-height: 95vh;
            }
            table {
                width: 100% !important;
                border-collapse: collapse !important;
                border: 2px solid #000 !important;
                font-family: 'Times New Roman', serif;
                font-size: 12pt;
                margin-top: 15px;
                margin-bottom: 20px;
            }
            th, td {
                border: 1px solid #000 !important;
                padding: 8px 10px !important;
                color: #000 !important;
                vertical-align: middle;
                text-align: center;
            }
            th {
                background-color: #f0f0f0 !important;
                -webkit-print-color-adjust: exact;
                font-weight: bold;
            }
            
            .schedule-table { table-layout: fixed; }
            .schedule-table td { height: 40px; font-size: 14pt; font-weight: bold; }
            .student-code-badge { display: inline-block; border: 1px solid #000; border-radius: 50%; width: 25px; height: 25px; line-height: 23px; text-align: center; margin: 2px; background-color: #fff; }
            .balance-positive { color: green !important; font-weight: bold; direction: ltr; unicode-bidi: embed; }
            .balance-negative { color: red !important; font-weight: bold; direction: ltr; unicode-bidi: embed; }
            .balance-neutral { color: black !important; font-weight: bold; direction: ltr; unicode-bidi: embed; }
            .report-title-main { font-size: 22pt; font-weight: bold; text-align: center !important; margin-bottom: 20px; text-decoration: underline; display: block; width: 100%; }
            .section-title { background-color: #333 !important; color: #fff !important; -webkit-print-color-adjust: exact; padding: 5px; font-weight: bold; text-align: center; margin-top: 10px; border: 1px solid #000; }
            .page-break { page-break-after: always; display: block; height: 1px; margin-top: 20px; }
            .answer-img { max-width: 150px; max-height: 80px; border: 1px solid #ccc; }
            .progress-container { border: 1px solid #000 !important; background: #eee !important; -webkit-print-color-adjust: exact; }
            .progress-bar-fill { background: #555 !important; -webkit-print-color-adjust: exact; }
        }
    `;
    document.head.appendChild(style);
})();

// ============================================
// 2. التعريفات الأساسية ودوال المساعدة
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

function getTargetTeacherId() {
    const user = getReportUser();
    if (!user) return null;
    if (user.ownerId) return user.ownerId; 
    return user.id; 
}

window.toggleSelectAll = function(forceState = null) {
    const checkboxes = document.querySelectorAll('input[name="selectedStudents"]');
    let isChecked = forceState !== null ? forceState : true;
    
    if (forceState === null) {
        const allChecked = Array.from(checkboxes).every(cb => cb.checked);
        isChecked = !allChecked;
    }
    
    checkboxes.forEach(cb => cb.checked = isChecked);
};

document.addEventListener('DOMContentLoaded', function() {
    updateTeacherName();
    if (typeof loadStudentsForSelection === 'function') {
        loadStudentsForSelection();
    }
    
    const select = document.getElementById('reportType');
    if (select) {
        Array.from(select.options).forEach(opt => {
            if (opt.textContent.includes('⚖️') || opt.textContent.includes('رصيد الحصص')) { opt.remove(); }
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
    const existingOption = select.querySelector(`option[value="${value}"]`);
    if (!existingOption) {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = `${icon} ${text}`;
        select.appendChild(option);
    } else {
        existingOption.textContent = `${icon} ${text}`;
    }
}

function updateTeacherName() {
    try {
        const user = getReportUser();
        const el = document.getElementById('teacherName');
        if (el && user) { el.textContent = user.name; }
    } catch (e) { }
}

async function loadStudentsForSelection() {
    const container = document.getElementById('studentsListContainer');
    if (!container) return;

    const targetTeacherId = getTargetTeacherId();
    if (!targetTeacherId) return;

    container.innerHTML = '<div class="text-center p-3">جاري جلب الطلاب من السحابة...</div>';

    try {
        const { data: students, error } = await window.supabase
            .from('users')
            .select('*')
            .eq('role', 'student')
            .eq('teacherId', targetTeacherId);

        if (error) throw error;

        container.innerHTML = '';
        if (!students || students.length === 0) {
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
    } catch (error) {
        console.error("Error loading students:", error);
        container.innerHTML = '<div class="text-danger p-3">حدث خطأ أثناء جلب الطلاب.</div>';
    }
}

window.initiateReport = async function() {
    const reportType = document.getElementById('reportType').value;
    const selectedCheckboxes = document.querySelectorAll('input[name="selectedStudents"]:checked');
    const selectedStudentIds = Array.from(selectedCheckboxes).map(cb => cb.value);

    if (!reportType) return alert("الرجاء اختيار نوع التقرير.");
    if (selectedStudentIds.length === 0) return alert("الرجاء اختيار طالب واحد على الأقل.");

    const previewArea = document.getElementById('reportPreviewArea');
    previewArea.style.zIndex = "99999";
    previewArea.style.position = "absolute";
    previewArea.style.background = "white";
    previewArea.innerHTML = '<div class="text-center p-5"><h3><i class="fas fa-spinner fa-spin"></i> جاري استخراج البيانات من السحابة...</h3></div>'; 

    try {
        if (reportType === 'attendance') {
            await generateAttendanceReport(selectedStudentIds, previewArea);
        } else if (reportType === 'achievement') {
            await generateAchievementReport(selectedStudentIds, previewArea);
        } else if (reportType === 'assignments') {
            await generateAssignmentsReport(selectedStudentIds, previewArea);
        } else if (reportType === 'iep') {
            await generateIEPReport(selectedStudentIds, previewArea);
        } else if (reportType === 'diagnostic') {
            await generateDiagnosticReport(selectedStudentIds, previewArea);
        } else if (reportType === 'schedule') {
            await generateScheduleReport(selectedStudentIds, previewArea);
        } else if (reportType === 'credit') {
            await generateCreditReport(selectedStudentIds, previewArea);
        } else {
            previewArea.innerHTML = `<div class="alert alert-warning text-center no-print">عفواً، هذا التقرير قيد التطوير.</div>`;
        }
    } catch (error) {
        console.error("Report Generation Error:", error);
        previewArea.innerHTML = `<div class="alert alert-danger text-center">حدث خطأ أثناء إنشاء التقرير: ${error.message}</div>`;
    }
};

// ============================================
// 📊 معادلة حساب الرصيد
// ============================================
function calculateStudentBalance(studentId, allLessons, allEvents, teacherSchedule, studentTeacherId) {
    let balance = 0;
    const myList = allLessons.filter(l => l.studentId == studentId);
    let myEvents = allEvents.filter(e => e.studentId == studentId);
    if (myList.length === 0) return 0;

    const sortedByDate = [...myList].sort((a, b) => new Date(a.assignedDate) - new Date(b.assignedDate));
    const planStartDate = new Date(sortedByDate[0].assignedDate);
    const today = new Date(); today.setHours(23, 59, 59, 999);
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
        if (e.status === 'excused') balance--; 
        else if (e.type === 'auto-absence' || e.status === 'absence') balance--;
    });

    myList.forEach(l => {
        if (l.historyLog) {
            l.historyLog.forEach(log => {
                if (log.cachedSessionType === 'compensation') balance++; 
                else if (log.cachedSessionType === 'additional') balance++; 
            });
        }
    });

    return balance;
}

// ============================================
// 3. التقارير المستخرجة من السحابة
// ============================================

async function generateAttendanceReport(studentIds, container) {
    const { data: allUsers } = await window.supabase.from('users').select('*').in('id', studentIds);
    const { data: allEvents } = await window.supabase.from('student_events').select('*').in('studentId', studentIds);
    
    const printDate = new Date().toLocaleDateString('ar-SA');

    let tableHTML = `
        <div class="report-wrapper">
            <div class="report-content">
                <div class="text-center mb-4">
                    <h1 class="report-title-main" style="text-align:center; color:#000;">تقرير متابعة الغياب</h1>
                </div>
                <table class="table table-bordered" style="width:100%; direction:rtl;" border="1">
                    <thead>
                        <tr style="background-color:#f2f2f2;">
                            <th style="width:30%;">اسم الطالب</th>
                            <th style="width:15%;">عدد الأيام</th>
                            <th style="width:55%;">تواريخ الغياب</th>
                        </tr>
                    </thead>
                    <tbody>
    `;

    studentIds.forEach(studentId => {
        const student = (allUsers || []).find(u => u.id == studentId);
        if (!student) return;

        const studentRecords = (allEvents || []).filter(e => e.studentId == studentId);
        const absences = studentRecords.filter(e => {
            if (e.type === 'auto-absence') return true;
            if (e.status === 'absence' || e.status === 'غائب') return true;
            const str = (e.title + ' ' + e.note).toLowerCase();
            return str.includes('غائب') || str.includes('absence');
        });

        const count = absences.length;
        const datesOnly = absences.map(a => {
            let d = a.date || '';
            if(d.includes('T')) d = d.split('T')[0]; 
            return `<span style="display:inline-block; margin:0 5px;">${d}</span>`;
        }).join(' ، ');

        tableHTML += `
            <tr>
                <td style="font-weight:bold;">${student.name}</td>
                <td style="font-weight:bold; font-size:1.2em;">${count}</td>
                <td style="font-size:0.9em; text-align:right; padding-right:15px !important;">
                    ${count > 0 ? datesOnly : 'منتظم'}
                </td>
            </tr>
        `;
    });

    tableHTML += `
                </tbody>
            </table>
        </div> <div class="custom-footer">
            تم طباعة التقرير من منصة ميسر التعلم للاستاذ/صالح عبد العزيز عبدالله العجلان بتاريخ ${printDate}
        </div>
        
        <div class="mt-4 text-left no-print" style="text-align:left; margin-top:20px;">
            <button onclick="window.print()" class="btn btn-primary" style="padding:10px 20px; font-size:1.1em;"><i class="fas fa-print"></i> طباعة التقرير</button>
        </div>
    </div>`;

    container.innerHTML = tableHTML;
}

async function generateAchievementReport(studentIds, container) {
    const { data: allUsers } = await window.supabase.from('users').select('*').in('id', studentIds);
    const { data: allLessons } = await window.supabase.from('student_lessons').select('*').in('studentId', studentIds);
    
    const printDate = new Date().toLocaleDateString('ar-SA');

    let tableHTML = `
        <div class="report-wrapper">
            <div class="report-content">
                <div class="text-center mb-4">
                    <h1 class="report-title-main" style="text-align:center; color:#000;">تقرير نسب الإنجاز</h1>
                </div>
                <table class="table table-bordered" style="width:100%; direction:rtl;" border="1">
                    <thead>
                        <tr style="background-color:#f2f2f2;">
                            <th style="width:25%;">اسم الطالب</th>
                            <th style="width:15%;">عدد الأهداف</th>
                            <th style="width:15%;">المنجز</th>
                            <th style="width:45%;">نسبة الإنجاز</th>
                        </tr>
                    </thead>
                    <tbody>
    `;

    studentIds.forEach(studentId => {
        const student = (allUsers || []).find(u => u.id == studentId);
        if (!student) return;

        const myLessons = (allLessons || []).filter(l => l.studentId == studentId);
        const total = myLessons.length;
        const completed = myLessons.filter(l => l.status === 'completed' || l.status === 'accelerated' || l.passedByAlternative).length;
        
        const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

        let barColor = '#ffc107'; 
        if (percentage >= 50) barColor = '#17a2b8'; 
        if (percentage >= 80) barColor = '#28a745'; 

        tableHTML += `
            <tr>
                <td style="font-weight:bold;">${student.name}</td>
                <td style="text-align:center;">${total}</td>
                <td style="text-align:center;">${completed}</td>
                <td style="padding:5px 15px;">
                    <div style="display:flex; align-items:center;">
                        <span style="font-weight:bold; width:45px; margin-left:10px;">${percentage}%</span>
                        <div class="progress-container" style="flex-grow:1; background:#eee; height:15px; border-radius:10px; border:1px solid #ccc; overflow:hidden;">
                            <div class="progress-bar-fill" style="width:${percentage}%; background:${barColor}; height:100%;"></div>
                        </div>
                    </div>
                </td>
            </tr>
        `;
    });

    tableHTML += `
                </tbody>
            </table>
        </div> <div class="custom-footer">
            تم طباعة التقرير من منصة ميسر التعلم للاستاذ/صالح عبد العزيز عبدالله العجلان بتاريخ ${printDate}
        </div>
        
        <div class="mt-4 text-left no-print" style="text-align:left; margin-top:20px;">
            <button onclick="window.print()" class="btn btn-primary" style="padding:10px 20px; font-size:1.1em;"><i class="fas fa-print"></i> طباعة التقرير</button>
        </div>
    </div>`;

    container.innerHTML = tableHTML;
}

async function generateAssignmentsReport(studentIds, container) {
    const { data: allUsers } = await window.supabase.from('users').select('*').in('id', studentIds);
    const { data: allAssignments } = await window.supabase.from('student_assignments').select('*').in('studentId', studentIds);
    
    const printDate = new Date().toLocaleDateString('ar-SA');

    let tableHTML = `
        <div class="report-wrapper">
            <div class="report-content">
                <div class="text-center mb-4">
                    <h1 class="report-title-main" style="text-align:center; color:#000;">تقرير متابعة الواجبات</h1>
                </div>
                <table class="table table-bordered" style="width:100%; direction:rtl;" border="1">
                    <thead>
                        <tr style="background-color:#f2f2f2;">
                            <th style="width:25%;">اسم الطالب</th>
                            <th style="width:30%;">اسم الواجب</th>
                            <th style="width:20%;">تاريخ الإسناد</th>
                            <th style="width:25%;">حالة التسليم / تاريخ الحل</th>
                        </tr>
                    </thead>
                    <tbody>
    `;

    studentIds.forEach(studentId => {
        const student = (allUsers || []).find(u => u.id == studentId);
        if (!student) return;

        const myAssignments = (allAssignments || []).filter(a => a.studentId == studentId);

        if (myAssignments.length === 0) {
            tableHTML += `
                <tr>
                    <td style="font-weight:bold;">${student.name}</td>
                    <td colspan="3" style="text-align:center; color:#777;">لا توجد واجبات مسندة لهذا الطالب</td>
                </tr>
            `;
        } else {
            myAssignments.forEach(assign => {
                const assignedDate = assign.assignedDate ? new Date(assign.assignedDate).toLocaleDateString('ar-SA') : '-';
                let statusContent = '';
                
                if (assign.status === 'completed') {
                    let completedDate = assign.completedDate 
                        ? new Date(assign.completedDate).toLocaleDateString('ar-SA') 
                        : 'تم الحل (مكتمل)';
                    statusContent = `<span style="color:green; font-weight:bold;">${completedDate}</span>`;
                } else {
                    statusContent = `<span style="color:red; font-weight:bold;">لم يتم تسليم الواجب</span>`;
                }

                tableHTML += `
                    <tr>
                        <td style="font-weight:bold;">${student.name}</td>
                        <td style="text-align:center;">${assign.title}</td>
                        <td style="text-align:center;">${assignedDate}</td>
                        <td style="text-align:center;">${statusContent}</td>
                    </tr>
                `;
            });
        }
    });

    tableHTML += `
                </tbody>
            </table>
        </div> <div class="custom-footer">
            تم طباعة التقرير من منصة ميسر التعلم للاستاذ/صالح عبد العزيز عبدالله العجلان بتاريخ ${printDate}
        </div>
        
        <div class="mt-4 text-left no-print" style="text-align:left; margin-top:20px;">
            <button onclick="window.print()" class="btn btn-primary" style="padding:10px 20px; font-size:1.1em;"><i class="fas fa-print"></i> طباعة التقرير</button>
        </div>
    </div>`;

    container.innerHTML = tableHTML;
}

// 🌟 تقرير الخطة التربوية الفردية 🌟
async function generateIEPReport(studentIds, container) {
    const teacherId = getTargetTeacherId(); 
    
    const [
        {data: allUsers},
        {data: studentTests},
        {data: allTests},
        {data: allObjectives},
        {data: studentLessons},
        {data: teacherSchedule}
    ] = await Promise.all([
        window.supabase.from('users').select('*').in('id', studentIds),
        window.supabase.from('student_tests').select('*').in('studentId', studentIds).eq('type', 'diagnostic'),
        window.supabase.from('tests').select('*').eq('teacherId', teacherId),
        window.supabase.from('objectives').select('*').eq('teacherId', teacherId),
        window.supabase.from('student_lessons').select('*').in('studentId', studentIds),
        window.supabase.from('teacher_schedule').select('*').eq('teacherId', teacherId)
    ]);

    const printDate = new Date().toLocaleDateString('ar-SA');
    let fullReportHTML = `<div>`; // Container

    studentIds.forEach((studentId, index) => {
        const student = (allUsers || []).find(u => u.id == studentId);
        if (!student) return;

        const completedDiagnostic = (studentTests || [])
            .filter(t => t.studentId == studentId && t.status === 'completed')
            .sort((a, b) => new Date(b.completedDate || b.assignedDate) - new Date(a.completedDate || a.assignedDate))[0];

        const originalTest = completedDiagnostic ? (allTests || []).find(t => t.id == completedDiagnostic.testId) : null;

        let strengthHTML = '';
        let needsObjects = [];

        if (completedDiagnostic && originalTest && originalTest.questions) {
            originalTest.questions.forEach(q => {
                const ans = completedDiagnostic.answers ? completedDiagnostic.answers.find(a => a.questionId == q.id) : null;
                const score = ans ? (ans.score || 0) : 0;
                if (q.linkedGoalId) {
                    const obj = (allObjectives || []).find(o => o.id == q.linkedGoalId);
                    if (obj) {
                        if (score >= (q.passingScore || 1)) {
                            if (!strengthHTML.includes(obj.shortTermGoal)) strengthHTML += `<li>${obj.shortTermGoal}</li>`;
                        } else {
                            if (!needsObjects.find(o => o.id == obj.id)) needsObjects.push(obj);
                        }
                    }
                }
            });
        }
        
        if (!strengthHTML) strengthHTML = '<li>لا توجد نقاط قوة مسجلة.</li>';
        if (needsObjects.length === 0 && !completedDiagnostic) needsObjects = [];

        const dayKeys = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
        let scheduleCells = dayKeys.map(dk => {
            const session = (teacherSchedule || []).find(s => 
                normalizeText(s.day) === normalizeText(dk) && 
                s.students && 
                s.students.map(String).includes(String(studentId))
            );
            let content = session ? `حصة ${session.period}` : '-';
            return `<td style="height:40px; text-align:center;">${content}</td>`;
        }).join('');

        fullReportHTML += `
        <div class="report-wrapper">
            <div class="report-content">
                <h1 class="report-title-main">تقرير الخطط التربوية الفردية</h1>
                
                <table class="table table-bordered">
                    <tr>
                        <th style="width:15%;">اسم الطالب</th>
                        <td style="width:35%;">${student.name}</td>
                        <th style="width:15%;">الصف</th>
                        <td>${student.grade || 'غير محدد'}</td>
                    </tr>
                    <tr>
                        <th>المادة</th>
                        <td>${originalTest ? originalTest.subject : (student.subject || 'عام')}</td>
                        <th>تاريخ الخطة</th>
                        <td>${completedDiagnostic ? new Date(completedDiagnostic.assignedDate).toLocaleDateString('ar-SA') : printDate}</td>
                    </tr>
                </table>

                <div class="section-title">جدول الحصص الأسبوعي</div>
                <table class="table table-bordered">
                    <thead>
                        <tr><th>الأحد</th><th>الاثنين</th><th>الثلاثاء</th><th>الأربعاء</th><th>الخميس</th></tr>
                    </thead>
                    <tbody><tr>${scheduleCells}</tr></tbody>
                </table>

                <div style="display:flex; gap:10px; margin-top:10px;">
                    <div style="flex:1; border:1px solid #000; padding:10px;">
                        <div style="font-weight:bold; border-bottom:1px solid #000; margin-bottom:5px; text-align:center; background:#eee;">نقاط القوة</div>
                        <ul style="margin:0; padding-right:20px; font-size:0.9em;">${strengthHTML}</ul>
                    </div>
                    <div style="flex:1; border:1px solid #000; padding:10px;">
                        <div style="font-weight:bold; border-bottom:1px solid #000; margin-bottom:5px; text-align:center; background:#eee;">نقاط الاحتياج (الأهداف)</div>
                        <ul style="margin:0; padding-right:20px; font-size:0.9em;">
                            ${needsObjects.length > 0 ? needsObjects.map(o => `<li>${o.shortTermGoal}</li>`).join('') : '<li>لا توجد خطة نشطة</li>'}
                        </ul>
                    </div>
                </div>

                <div class="section-title">الخطة التدريسية التفصيلية</div>
                <table class="table table-bordered" style="font-size:10pt;">
                    <thead>
                        <tr style="background:#333; color:white;">
                            <th style="width:5%;">#</th>
                            <th style="width:35%;">الهدف قصير المدى</th>
                            <th style="width:40%;">الهدف التدريسي (الدرس)</th>
                            <th style="width:20%;">تاريخ التحقق</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        let rowCounter = 1;
        if (needsObjects.length > 0) {
            needsObjects.forEach(obj => {
                if (obj.instructionalGoals) {
                    obj.instructionalGoals.forEach((iGoal, idx) => {
                        const lesson = (studentLessons || []).find(l => 
                            l.studentId == studentId && 
                            l.objective && 
                            l.objective.trim() === iGoal.trim()
                        );
                        
                        let statusText = '-';
                        if (lesson) {
                            let dStr = 'مكتمل';
                            if (lesson.completedDate) {
                                const d = new Date(lesson.completedDate);
                                if (!isNaN(d)) dStr = d.toLocaleDateString('ar-SA');
                            }

                            if (lesson.status === 'completed' || lesson.passedByAlternative) {
                                statusText = `<span style="color:green; font-weight:bold;">${dStr}</span>`;
                            }
                            else if (lesson.status === 'accelerated') {
                                statusText = `<span style="color:#856404; font-weight:bold;">${dStr} (تسريع)</span>`;
                            }
                            else {
                                statusText = '<span style="color:#475569;">جاري العمل</span>';
                            }
                        }
                        
                        fullReportHTML += `
                            <tr>
                                <td style="text-align:center;">${rowCounter++}</td>
                                ${idx === 0 ? `<td rowspan="${obj.instructionalGoals.length}" style="vertical-align:top; background:#fafafa;">${obj.shortTermGoal}</td>` : ''}
                                <td>${iGoal}</td>
                                <td style="text-align:center;">${statusText}</td>
                            </tr>
                        `;
                    });
                }
            });
        } else {
            fullReportHTML += `<tr><td colspan="4" style="text-align:center; padding:20px;">لا توجد أهداف مسجلة.</td></tr>`;
        }

        fullReportHTML += `
                    </tbody>
                </table>

                <div style="border:1px solid #000; padding:10px; margin-top:10px; background:#f9f9f9; text-align:center;">
                    <strong>الهدف بعيد المدى:</strong> أن يتقن التلميذ مهارات المادة بنسبة إتقان 80%
                </div>

            </div> <div class="custom-footer">
                تم طباعة التقرير من منصة ميسر التعلم للاستاذ/صالح عبد العزيز عبدالله العجلان بتاريخ ${printDate}
            </div>
        </div> `;

        if (index < studentIds.length - 1) {
            fullReportHTML += `<div class="page-break"></div>`;
        }
    });

    fullReportHTML += `
        <div class="mt-4 text-left no-print" style="text-align:left; margin-top:20px; padding:20px;">
            <button onclick="window.print()" class="btn btn-primary" style="padding:10px 20px; font-size:1.1em;"><i class="fas fa-print"></i> طباعة التقارير</button>
        </div>
    </div>`;

    container.innerHTML = fullReportHTML;
}

// 🌟 تقرير الاختبار التشخيصي 🌟
async function generateDiagnosticReport(studentIds, container) {
    const teacherId = getTargetTeacherId(); 
    
    const [
        {data: allUsers},
        {data: studentTests},
        {data: allTests},
        {data: allObjectives}
    ] = await Promise.all([
        window.supabase.from('users').select('*').in('id', studentIds),
        window.supabase.from('student_tests').select('*').in('studentId', studentIds).eq('type', 'diagnostic'),
        window.supabase.from('tests').select('*').eq('teacherId', teacherId),
        window.supabase.from('objectives').select('*').eq('teacherId', teacherId)
    ]);

    const printDate = new Date().toLocaleDateString('ar-SA');
    let fullReportHTML = `<div>`;

    studentIds.forEach((studentId, index) => {
        const student = (allUsers || []).find(u => u.id == studentId);
        if (!student) return;

        const completedDiagnostic = (studentTests || [])
            .filter(t => t.studentId == studentId && t.status === 'completed')
            .sort((a, b) => new Date(b.completedDate || b.assignedDate) - new Date(a.completedDate || a.assignedDate))[0];
        
        const originalTest = completedDiagnostic ? (allTests || []).find(t => t.id == completedDiagnostic.testId) : null;

        fullReportHTML += `
        <div class="report-wrapper">
            <div class="report-content">
                <h1 class="report-title-main">تقرير الاختبار التشخيصي</h1>
                
                <table class="table table-bordered">
                    <tr>
                        <th style="width:15%;">اسم الطالب</th>
                        <td style="width:35%; font-weight:bold;">${student.name}</td>
                        <th style="width:15%;">الصف</th>
                        <td>${student.grade || 'غير محدد'}</td>
                    </tr>
                </table>
        `;

        if (!completedDiagnostic || !originalTest) {
            fullReportHTML += `
                <div style="text-align:center; padding:50px; border:1px solid #ccc; background:#fafafa; margin-top:20px;">
                    <h3>لم يتم إجراء اختبار تشخيصي لهذا الطالب حتى الآن</h3>
                    <p style="color:#777;">أو لم يتم اعتماد النتيجة كـ "مكتمل"</p>
                </div>
            `;
        } else {
            const score = completedDiagnostic.score || 0;
            let totalMax = 0;
            originalTest.questions.forEach(q => totalMax += parseFloat(q.maxScore || q.passingScore || 1));
            const total = totalMax || originalTest.questions.length || 1;
            const percent = Math.round((score / total) * 100) || score; 

            fullReportHTML += `
                <div style="border:2px solid #333; padding:15px; margin:20px 0; text-align:center; background:#f0f0f0;">
                    <div style="font-size:1.2em; font-weight:bold;">${originalTest.title}</div>
                    <div style="margin-top:10px; font-size:1.1em;">
                        الدرجة الموزونة: <span style="color:${percent >= 50 ? 'green' : 'red'}; font-weight:bold;">${percent}%</span>
                    </div>
                    <div style="font-size:0.9em; color:#555; margin-top:5px;">
                        تاريخ الاختبار: ${new Date(completedDiagnostic.completedDate || completedDiagnostic.assignedDate).toLocaleDateString('ar-SA')}
                    </div>
                </div>

                <div class="section-title">تفاصيل الإجابات</div>
                <table class="table table-bordered">
                    <thead>
                        <tr style="background:#333; color:white;">
                            <th style="width:5%;">#</th>
                            <th style="width:40%;">السؤال</th>
                            <th style="width:30%;">إجابة الطالب</th>
                            <th style="width:10%;">التقييم</th>
                            <th style="width:15%;">المهارة / الهدف</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            originalTest.questions.forEach((q, qIndex) => {
                const answerObj = completedDiagnostic.answers ? completedDiagnostic.answers.find(a => a.questionId == q.id) : null;
                
                let studentAnswerContent = '<span style="color:#999;">لم يجب</span>';
                if (answerObj && answerObj.answer !== undefined && answerObj.answer !== null) {
                    const answerStr = String(answerObj.answer); 
                    if (answerStr.startsWith('data:image') || answerStr.match(/\.(jpeg|jpg|gif|png)$/i)) {
                        studentAnswerContent = `<img src="${answerStr}" class="answer-img" alt="إجابة الطالب">`;
                    } else {
                        studentAnswerContent = answerStr;
                    }
                }

                const isCorrect = answerObj && answerObj.score > 0;
                const statusIcon = isCorrect ? '<span style="color:green; font-size:1.2em;">✔️</span>' : '<span style="color:red; font-size:1.2em;">❌</span>';
                
                let skillName = '-';
                if (q.linkedGoalId) {
                    const obj = (allObjectives || []).find(o => o.id == q.linkedGoalId);
                    if (obj) skillName = obj.shortTermGoal;
                }

                fullReportHTML += `
                    <tr>
                        <td style="text-align:center;">${qIndex + 1}</td>
                        <td>${q.text}</td>
                        <td style="text-align:center;">${studentAnswerContent}</td>
                        <td style="text-align:center;">${statusIcon}</td>
                        <td style="font-size:0.9em;">${skillName}</td>
                    </tr>
                `;
            });

            fullReportHTML += `</tbody></table>`;
        }

        fullReportHTML += `
            </div> <div class="custom-footer">
                تم طباعة التقرير من منصة ميسر التعلم للاستاذ/صالح عبد العزيز عبدالله العجلان بتاريخ ${printDate}
            </div>
        </div> `;

        if (index < studentIds.length - 1) {
            fullReportHTML += `<div class="page-break"></div>`;
        }
    });

    fullReportHTML += `
        <div class="mt-4 text-left no-print" style="text-align:left; margin-top:20px; padding:20px;">
            <button onclick="window.print()" class="btn btn-primary" style="padding:10px 20px; font-size:1.1em;"><i class="fas fa-print"></i> طباعة التقارير</button>
        </div>
    </div>`;

    container.innerHTML = fullReportHTML;
}

// 🌟 تقرير الجدول الدراسي 🌟
async function generateScheduleReport(studentIds, container) {
    const teacherId = getTargetTeacherId(); 
    
    const { data: allUsers } = await window.supabase.from('users').select('*').in('id', studentIds);
    const { data: scheduleData } = await window.supabase.from('teacher_schedule').select('*').eq('teacherId', teacherId);
    
    const printDate = new Date().toLocaleDateString('ar-SA');
    const selectedStudents = allUsers || [];

    let keyTableHTML = `
        <div class="section-title" style="background:#444 !important; color:white; margin-bottom:0;">دليل رموز الطلاب</div>
        <table class="table table-bordered key-table" style="margin-top:0;">
            <thead>
                <tr style="background:#f0f0f0;">
                    <th style="width:10%;">م (الرمز)</th>
                    <th style="width:50%;">اسم الطالب</th>
                    <th style="width:40%;">الصف</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    const studentCodes = {};

    selectedStudents.forEach((student, index) => {
        const code = index + 1;
        studentCodes[student.id] = code;
        keyTableHTML += `
            <tr>
                <td style="font-weight:bold; font-size:1.2em;">${code}</td>
                <td style="text-align:right; padding-right:15px !important;">${student.name}</td>
                <td>${student.grade || '-'}</td>
            </tr>
        `;
    });
    keyTableHTML += `</tbody></table>`;

    let scheduleHTML = `
        <h2 style="text-align:center; margin-top:20px;">الجدول الدراسي</h2>
        <table class="table table-bordered schedule-table" border="1" style="border: 2px solid black;">
            <thead>
                <tr style="background:#333; color:white;">
                    <th style="width:12%;">اليوم / الحصة</th>
                    <th style="width:12.5%;">1</th>
                    <th style="width:12.5%;">2</th>
                    <th style="width:12.5%;">3</th>
                    <th style="width:12.5%;">4</th>
                    <th style="width:12.5%;">5</th>
                    <th style="width:12.5%;">6</th>
                    <th style="width:12.5%;">7</th>
                </tr>
            </thead>
            <tbody>
    `;

    const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
    
    days.forEach(day => {
        scheduleHTML += `<tr><td style="font-weight:bold; background:#f0f0f0; border:1px solid #000;">${day}</td>`;
        
        for (let period = 1; period <= 7; period++) {
            const session = (scheduleData || []).find(s => 
                normalizeText(s.day) === normalizeText(day) && 
                s.period == period &&
                s.students && 
                s.students.some(id => studentIds.includes(String(id)))
            );

            let cellContent = '';

            if (session && session.students && session.students.length > 0) {
                const studentsInSession = session.students.map(String);
                const codesToShow = [];
                selectedStudents.forEach(s => {
                    if (studentsInSession.includes(String(s.id))) {
                        codesToShow.push(studentCodes[s.id]);
                    }
                });

                if (codesToShow.length > 0) {
                    cellContent = codesToShow.join(' ، ');
                }
            }
            
            scheduleHTML += `<td style="border:1px solid #000;">${cellContent}</td>`;
        }
        scheduleHTML += `</tr>`;
    });

    scheduleHTML += `</tbody></table>`;

    let finalHTML = `
        <div class="report-wrapper">
            <div class="report-content">
                <h1 class="report-title-main">تقرير الجدول الدراسي</h1>
                
                ${keyTableHTML}
                ${scheduleHTML}
            </div> <div class="custom-footer">
                تم طباعة التقرير من منصة ميسر التعلم للاستاذ/صالح عبد العزيز عبدالله العجلان بتاريخ ${printDate}
            </div>

            <div class="mt-4 text-left no-print" style="text-align:left; margin-top:20px;">
                <button onclick="window.print()" class="btn btn-primary" style="padding:10px 20px; font-size:1.1em;"><i class="fas fa-print"></i> طباعة التقرير</button>
            </div>
        </div>
    `;

    container.innerHTML = finalHTML;
}

async function generateCreditReport(studentIds, container) {
    const teacherId = getTargetTeacherId(); 

    const [
        {data: allUsers},
        {data: allLessons},
        {data: allEvents},
        {data: teacherSchedule}
    ] = await Promise.all([
        window.supabase.from('users').select('*').in('id', studentIds),
        window.supabase.from('student_lessons').select('*').in('studentId', studentIds),
        window.supabase.from('student_events').select('*').in('studentId', studentIds),
        window.supabase.from('teacher_schedule').select('*').eq('teacherId', teacherId)
    ]);

    const printDate = new Date().toLocaleDateString('ar-SA');

    let tableHTML = `
        <div class="report-wrapper">
            <div class="report-content">
                <div class="text-center mb-4">
                    <h1 class="report-title-main" style="text-align:center; color:#000;">تقرير رصيد الحصص</h1>
                </div>
                
                <table class="table table-bordered" style="width:100%; direction:rtl;" border="1">
                    <thead>
                        <tr style="background-color:#333; color:white;">
                            <th style="width:60%;">اسم الطالب</th>
                            <th style="width:40%;">رصيد الحصص</th>
                        </tr>
                    </thead>
                    <tbody>
    `;

    studentIds.forEach(studentId => {
        const student = (allUsers || []).find(u => u.id == studentId);
        if (!student) return;

        const balance = calculateStudentBalance(studentId, allLessons || [], allEvents || [], teacherSchedule || [], student.teacherId); 

        let balanceClass = 'balance-neutral';
        let balanceText = balance;

        if (balance > 0) {
            balanceClass = 'balance-positive';
            balanceText = `+${balance}`;
        } else if (balance < 0) {
            balanceClass = 'balance-negative';
            balanceText = `${balance}`;
        }

        tableHTML += `
            <tr>
                <td style="font-weight:bold; font-size:1.1em; text-align:right; padding-right:20px;">${student.name}</td>
                <td class="${balanceClass}" style="font-size:1.4em; direction:ltr;">${balanceText}</td>
            </tr>
        `;
    });

    tableHTML += `
                    </tbody>
                </table>
                
                <div style="margin-top:20px; font-size:0.9em; color:#555; border:1px solid #ccc; padding:10px; border-radius:5px;">
                    <strong>دليل التقرير:</strong>
                    <ul style="margin-top:5px; margin-bottom:0;">
                        <li><span style="color:red; font-weight:bold;">الرقم السالب (-):</span> يعني أن الطالب يحتاج لتعويض حصص.</li>
                        <li><span style="color:green; font-weight:bold;">الرقم الموجب (+):</span> يعني أن الطالب متقدم في الخطة.</li>
                        <li><span style="color:black; font-weight:bold;">الصفر (0):</span> يعني أن الطالب يسير وفق الخطة تماماً.</li>
                    </ul>
                </div>
            </div> <div class="custom-footer">
                تم طباعة التقرير من منصة ميسر التعلم للاستاذ/صالح عبد العزيز عبدالله العجلان بتاريخ ${printDate}
            </div>

            <div class="mt-4 text-left no-print" style="text-align:left; margin-top:20px;">
                <button onclick="window.print()" class="btn btn-primary" style="padding:10px 20px; font-size:1.1em;"><i class="fas fa-print"></i> طباعة التقرير</button>
            </div>
        </div>`;
    
    container.innerHTML = tableHTML;
}

// ----------------------------------------------------
// تعريف الدوال عالمياً
// ----------------------------------------------------
window.generateAttendanceReport = generateAttendanceReport;
window.generateAchievementReport = generateAchievementReport;
window.generateAssignmentsReport = generateAssignmentsReport;
window.generateIEPReport = generateIEPReport;
window.generateDiagnosticReport = generateDiagnosticReport;
window.generateScheduleReport = generateScheduleReport;
window.generateCreditReport = generateCreditReport;
