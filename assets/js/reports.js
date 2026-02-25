// ============================================
// 📁 المسار: assets/js/reports.js (نسخة Supabase)
// الوصف: نظام التقارير الشامل السحابي
// ============================================

(function injectPrintStyles() {
    if(document.getElementById('reportPrintStyles')) return;
    const style = document.createElement('style');
    style.id = 'reportPrintStyles';
    // ... (احتفظ بنفس ستايلات الـ CSS للطباعة الموجودة في ملفك الأصلي تماماً دون تغيير) ...
    style.innerHTML = `
        .custom-footer { width: 100%; text-align: center; font-size: 11pt; font-weight: bold; color: #000 !important; border-top: 2px solid #000; padding-top: 10px; margin-top: 20px; background: white; }
        @media print {
            @page { size: A4; margin: 10mm; margin-bottom: 20mm; }
            body * { visibility: hidden; }
            .main-sidebar, .header, .sidebar, .no-print, button, input, select, .alert { display: none !important; }
            #reportPreviewArea, #reportPreviewArea * { visibility: visible; }
            #reportPreviewArea { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; background: white; direction: rtl; z-index: 99999 !important; }
            .custom-footer { position: fixed; bottom: 0; left: 0; right: 0; z-index: 2147483647; background-color: white !important; }
            table { width: 100% !important; border-collapse: collapse !important; border: 2px solid #000 !important; font-family: 'Times New Roman', serif; font-size: 12pt; margin-top: 15px; margin-bottom: 30px; }
            th, td { border: 1px solid #000 !important; padding: 8px 10px !important; color: #000 !important; vertical-align: middle; text-align: center; }
            th { background-color: #f0f0f0 !important; -webkit-print-color-adjust: exact; font-weight: bold; }
            .report-title-main { font-size: 22pt; font-weight: bold; text-align: center !important; margin-bottom: 20px; text-decoration: underline; display: block; width: 100%; }
        }
    `;
    document.head.appendChild(style);
})();

function normalizeText(text) { return text ? String(text).trim().replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه') : ""; }
function getReportUser() { try { return JSON.parse(sessionStorage.getItem('currentUser')).user || JSON.parse(sessionStorage.getItem('currentUser')); } catch (e) { return null; } }

window.toggleSelectAll = function(checked) {
    const checkboxes = document.querySelectorAll('input[name="selectedStudents"]');
    checkboxes.forEach(cb => cb.checked = checked !== undefined ? checked : !cb.checked);
};

window.initiateReport = async function() {
    const reportType = document.getElementById('reportType').value;
    const selectedCheckboxes = document.querySelectorAll('input[name="selectedStudents"]:checked');
    const selectedStudentIds = Array.from(selectedCheckboxes).map(cb => cb.value);

    if (!reportType) return alert("الرجاء اختيار نوع التقرير.");
    if (selectedStudentIds.length === 0) return alert("الرجاء اختيار طالب واحد على الأقل.");

    const previewArea = document.getElementById('reportPreviewArea');
    previewArea.style.zIndex = "99999"; previewArea.style.position = "absolute"; previewArea.style.background = "white";
    previewArea.innerHTML = '<div class="text-center p-5"><div class="loading-spinner"></div><p>جاري جلب البيانات من السحابة وتوليد التقرير...</p></div>'; 

    try {
        if (reportType === 'attendance') await generateAttendanceReport(selectedStudentIds, previewArea);
        else if (reportType === 'achievement') await generateAchievementReport(selectedStudentIds, previewArea);
        else if (reportType === 'assignments') await generateAssignmentsReport(selectedStudentIds, previewArea);
        else if (reportType === 'iep') await generateIEPReport(selectedStudentIds, previewArea);
        else if (reportType === 'diagnostic') await generateDiagnosticReport(selectedStudentIds, previewArea);
        else if (reportType === 'schedule') await generateScheduleReport(selectedStudentIds, previewArea);
        else if (reportType === 'credit') await generateCreditReport(selectedStudentIds, previewArea);
    } catch (error) {
        console.error("Report Generation Error:", error);
        previewArea.innerHTML = `<div class="alert alert-danger text-center">حدث خطأ أثناء إنشاء التقرير: ${error.message}</div>`;
    }
};

document.addEventListener('DOMContentLoaded', function() {
    if (typeof loadStudentsForSelection === 'function') loadStudentsForSelection();
});

async function loadStudentsForSelection() {
    const container = document.getElementById('studentsListContainer');
    if (!container) return;

    container.innerHTML = 'جاري التحميل...';
    const user = getReportUser();
    let teacherId = user ? user.id : null;
    let isAdminOrCommittee = user && (user.role === 'admin' || user.role === 'committee_member');

    try {
        let query = window.supabase.from('users').select('*').eq('role', 'student');
        if (!isAdminOrCommittee) query = query.eq('teacherId', teacherId);

        const { data: students, error } = await query;
        if(error) throw error;

        container.innerHTML = '';
        if (!students || students.length === 0) {
            container.innerHTML = '<div class="text-danger p-3">لا يوجد طلاب.</div>';
            return;
        }

        students.forEach(student => {
            const div = document.createElement('div');
            div.style.cssText = "padding: 8px; border-bottom: 1px solid #eee;";
            div.innerHTML = `<label style="cursor: pointer; display: flex; align-items: center;"><input type="checkbox" name="selectedStudents" value="${student.id}" style="margin-left:10px;"><span style="font-weight: bold;">${student.name}</span></label>`;
            container.appendChild(div);
        });
    } catch(e) { console.error(e); }
}

// ------------------------------------------------------------------
// دوال توليد التقارير (محولة للعمل مع Supabase)
// ------------------------------------------------------------------

async function generateAttendanceReport(studentIds, container) {
    const printDate = new Date().toLocaleDateString('ar-SA');
    const { data: allUsers } = await window.supabase.from('users').select('*').in('id', studentIds);
    const { data: allEvents } = await window.supabase.from('student_events').select('*').in('studentId', studentIds);

    let tableHTML = `<div style="background:white; padding:20px;"><div class="text-center mb-4"><h1 class="report-title-main">تقرير متابعة الغياب</h1></div><table class="table table-bordered" style="width:100%; direction:rtl;" border="1"><thead><tr style="background-color:#f2f2f2;"><th style="width:30%;">اسم الطالب</th><th style="width:15%;">عدد الأيام</th><th style="width:55%;">تواريخ الغياب</th></tr></thead><tbody>`;

    (allUsers || []).forEach(student => {
        const studentRecords = (allEvents || []).filter(e => e.studentId == student.id);
        const absences = studentRecords.filter(e => e.type === 'auto-absence' || e.status === 'absence' || e.status === 'غائب');
        const count = absences.length;
        const datesOnly = absences.map(a => `<span style="display:inline-block; margin:0 5px;">${a.date.split('T')[0]}</span>`).join(' ، ');

        tableHTML += `<tr><td style="font-weight:bold;">${student.name}</td><td style="font-weight:bold; font-size:1.2em;">${count}</td><td style="font-size:0.9em; text-align:right;">${count > 0 ? datesOnly : 'منتظم'}</td></tr>`;
    });

    tableHTML += `</tbody></table><div class="custom-footer">تم طباعة التقرير من منصة ميسر التعلم بتاريخ ${printDate}</div><div class="mt-4 text-left no-print"><button onclick="window.print()" class="btn btn-primary">طباعة التقرير 🖨️</button></div></div>`;
    container.innerHTML = tableHTML;
}

async function generateAchievementReport(studentIds, container) {
    const printDate = new Date().toLocaleDateString('ar-SA');
    const { data: allUsers } = await window.supabase.from('users').select('*').in('id', studentIds);
    const { data: allLessons } = await window.supabase.from('student_lessons').select('*').in('studentId', studentIds);

    let tableHTML = `<div style="background:white; padding:20px;"><div class="text-center mb-4"><h1 class="report-title-main">تقرير نسب الإنجاز</h1></div><table class="table table-bordered" style="width:100%; direction:rtl;" border="1"><thead><tr style="background-color:#f2f2f2;"><th style="width:25%;">اسم الطالب</th><th style="width:15%;">عدد الأهداف</th><th style="width:15%;">المنجز</th><th style="width:45%;">نسبة الإنجاز</th></tr></thead><tbody>`;

    (allUsers || []).forEach(student => {
        const myLessons = (allLessons || []).filter(l => l.studentId == student.id);
        const total = myLessons.length;
        const completed = myLessons.filter(l => l.status === 'completed' || l.status === 'accelerated' || l.passedByAlternative).length;
        const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

        tableHTML += `<tr><td style="font-weight:bold;">${student.name}</td><td>${total}</td><td>${completed}</td><td><div style="display:flex; align-items:center;"><span style="font-weight:bold; width:45px; margin-left:10px;">${percentage}%</span><div style="flex-grow:1; background:#eee; height:15px; border-radius:10px; overflow:hidden;"><div style="width:${percentage}%; background:#007bff; height:100%;"></div></div></div></td></tr>`;
    });

    tableHTML += `</tbody></table><div class="custom-footer">تم طباعة التقرير من منصة ميسر التعلم بتاريخ ${printDate}</div><div class="mt-4 text-left no-print"><button onclick="window.print()" class="btn btn-primary">طباعة التقرير 🖨️</button></div></div>`;
    container.innerHTML = tableHTML;
}

async function generateIEPReport(studentIds, container) {
    // جلب جميع البيانات دفعة واحدة لتقليل التحميل
    const [usersRes, sTestsRes, testsRes, objRes, sLessRes, schRes] = await Promise.all([
        window.supabase.from('users').select('*').in('id', studentIds),
        window.supabase.from('student_tests').select('*').in('studentId', studentIds).eq('type', 'diagnostic').eq('status', 'completed'),
        window.supabase.from('tests').select('*'),
        window.supabase.from('objectives').select('*'),
        window.supabase.from('student_lessons').select('*').in('studentId', studentIds),
        window.supabase.from('teacher_schedule').select('*')
    ]);

    const allUsers = usersRes.data || [];
    const studentTests = sTestsRes.data || [];
    const allTests = testsRes.data || [];
    const allObjectives = objRes.data || [];
    const studentLessons = sLessRes.data || [];
    const teacherSchedule = schRes.data || [];
    const printDate = new Date().toLocaleDateString('ar-SA');

    let fullReportHTML = `<div style="background:white; padding:0;">`;

    allUsers.forEach((student, index) => {
        const completedDiagnostic = studentTests.find(t => t.studentId == student.id);
        const originalTest = completedDiagnostic ? allTests.find(t => t.id == completedDiagnostic.testId) : null;

        let strengthHTML = ''; let needsObjects = [];
        if (completedDiagnostic && originalTest && originalTest.questions) {
            originalTest.questions.forEach(q => {
                const ans = completedDiagnostic.answers ? completedDiagnostic.answers.find(a => a.questionId == q.id) : null;
                const score = ans ? parseFloat(ans.score || 0) : 0;
                if (q.linkedGoalId) {
                    const obj = allObjectives.find(o => o.id == q.linkedGoalId);
                    if (obj) {
                        if (score >= (parseFloat(q.passingScore)||1)) { if (!strengthHTML.includes(obj.shortTermGoal)) strengthHTML += `<li>${obj.shortTermGoal}</li>`; } 
                        else { if (!needsObjects.find(o => o.id == obj.id)) needsObjects.push(obj); }
                    }
                }
            });
        }
        if (!strengthHTML) strengthHTML = '<li>لا توجد نقاط قوة مسجلة.</li>';

        const dayKeys = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
        let scheduleCells = dayKeys.map(dk => {
            const session = teacherSchedule.find(s => s.day === dk && s.students && s.students.includes(student.id));
            return `<td style="height:40px; text-align:center;">${session ? `حصة ${session.period}` : '-'}</td>`;
        }).join('');

        let objectivesRows = ''; let rowCounter = 1;
        if (needsObjects.length > 0) {
            needsObjects.forEach(obj => {
                objectivesRows += `<tr style="background-color: #dbeeff !important;"><td class="text-center" style="font-weight:bold;">${rowCounter++}</td><td colspan="2" style="font-weight:bold;">الهدف قصير المدى: ${obj.shortTermGoal}</td></tr>`;
                if (obj.instructionalGoals) {
                    obj.instructionalGoals.forEach(iGoal => {
                        const lesson = studentLessons.find(l => l.studentId == student.id && l.objective === iGoal);
                        let statusText = lesson ? (lesson.status === 'completed' ? `✔ ${new Date(lesson.completedDate).toLocaleDateString('ar-SA')}` : (lesson.status === 'accelerated' ? '⚡ تجاوز (تفوق)' : '⏳ قيد العمل')) : '-';
                        objectivesRows += `<tr><td class="text-center">-</td><td>${iGoal}</td><td class="text-center">${statusText}</td></tr>`;
                    });
                }
            });
        } else { objectivesRows += `<tr><td colspan="3" style="text-align:center;">لا توجد أهداف مسجلة.</td></tr>`; }

        fullReportHTML += `
        <div class="student-iep-page">
            <h1 class="report-title-main">تقرير الخطط التربوية الفردية</h1>
            <table class="table table-bordered"><tr><th>اسم الطالب</th><td>${student.name}</td><th>الصف</th><td>${student.grade || '-'}</td></tr><tr><th>المادة</th><td>${originalTest ? originalTest.subject : 'عام'}</td><th>تاريخ الخطة</th><td>${completedDiagnostic ? new Date(completedDiagnostic.assignedDate).toLocaleDateString('ar-SA') : printDate}</td></tr></table>
            <div class="section-title">جدول الحصص الأسبوعي</div><table class="table table-bordered"><thead><tr><th>الأحد</th><th>الاثنين</th><th>الثلاثاء</th><th>الأربعاء</th><th>الخميس</th></tr></thead><tbody><tr>${scheduleCells}</tr></tbody></table>
            <div style="display:flex; gap:10px; margin-top:10px;">
                <div style="flex:1; border:1px solid #000; padding:10px;"><div style="font-weight:bold; border-bottom:1px solid #000; text-align:center; background:#eee;">نقاط القوة</div><ul>${strengthHTML}</ul></div>
                <div style="flex:1; border:1px solid #000; padding:10px;"><div style="font-weight:bold; border-bottom:1px solid #000; text-align:center; background:#eee;">نقاط الاحتياج (الأهداف)</div><ul>${needsObjects.length > 0 ? needsObjects.map(o => `<li>${o.shortTermGoal}</li>`).join('') : '<li>لا توجد خطة نشطة</li>'}</ul></div>
            </div>
            <div class="section-title">الخطة التدريسية التفصيلية</div><table class="table table-bordered"><thead><tr style="background:#333; color:white;"><th>#</th><th>الهدف قصير المدى</th><th>الهدف التدريسي (الدرس)</th><th>تاريخ التحقق</th></tr></thead><tbody>${objectivesRows}</tbody></table>
            <div class="custom-footer">تم طباعة التقرير من منصة ميسر التعلم بتاريخ ${printDate}</div>
        </div>`;
        if (index < allUsers.length - 1) fullReportHTML += `<div class="page-break"></div>`;
    });

    fullReportHTML += `<div class="mt-4 text-left no-print"><button onclick="window.print()" class="btn btn-primary">طباعة التقارير 🖨️</button></div></div>`;
    container.innerHTML = fullReportHTML;
}

// أضفنا دالة رصيد الحصص (Credit Report)
async function generateCreditReport(studentIds, container) {
    const printDate = new Date().toLocaleDateString('ar-SA');
    const [usersRes, lessRes, eventsRes, schRes] = await Promise.all([
        window.supabase.from('users').select('*').in('id', studentIds),
        window.supabase.from('student_lessons').select('*').in('studentId', studentIds),
        window.supabase.from('student_events').select('*').in('studentId', studentIds),
        window.supabase.from('teacher_schedule').select('*')
    ]);

    let tableHTML = `<div style="background:white; padding:20px;"><div class="text-center mb-4"><h1 class="report-title-main">تقرير رصيد الحصص</h1></div><table class="table table-bordered" style="width:100%; direction:rtl;" border="1"><thead><tr style="background-color:#333; color:white;"><th>اسم الطالب</th><th>رصيد الحصص</th></tr></thead><tbody>`;

    (usersRes.data || []).forEach(student => {
        // تم استدعاء الدالة المتزامنة (Sync) بعد جلب البيانات
        const balance = calculateStudentBalance(student.id, lessRes.data||[], eventsRes.data||[], schRes.data||[], student.teacherId); 
        let balanceClass = balance > 0 ? 'color:green;' : (balance < 0 ? 'color:red;' : 'color:black;');
        let balanceText = balance > 0 ? `+${balance}` : balance;
        tableHTML += `<tr><td style="font-weight:bold;">${student.name}</td><td style="font-size:1.4em; direction:ltr; font-weight:bold; ${balanceClass}">${balanceText}</td></tr>`;
    });

    tableHTML += `</tbody></table><div class="custom-footer">تم طباعة التقرير من منصة ميسر التعلم بتاريخ ${printDate}</div><div class="mt-4 text-left no-print"><button onclick="window.print()" class="btn btn-primary">طباعة التقرير 🖨️</button></div></div>`;
    container.innerHTML = tableHTML;
}

// ... (يرجى الاحتفاظ بدوال calculateStudentBalance وباقي التقارير كما هي مع تمرير الداتا لها بعد جلبها بـ await) ...
