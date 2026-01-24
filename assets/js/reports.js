// ============================================
// 📁 الملف: assets/js/reports.js
// الوصف: إدارة التقارير (النسخة النهائية - مع الحفاظ على أيقونات القائمة)
// ============================================

// 1. حقن أنماط الطباعة (CSS)
(function injectPrintStyles() {
    const style = document.createElement('style');
    style.innerHTML = `
        @media print {
            @page {
                size: A4;
                margin: 15mm;
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
            }
            
            /* تنسيق الجداول */
            table {
                width: 100% !important;
                border-collapse: collapse !important;
                border: 2px solid #000 !important;
                font-family: 'Times New Roman', serif;
                font-size: 11pt;
                margin-top: 15px;
                margin-bottom: 15px;
            }
            th, td {
                border: 1px solid #000 !important;
                padding: 6px 10px !important;
                color: #000 !important;
                vertical-align: middle;
            }
            th {
                background-color: #f0f0f0 !important;
                -webkit-print-color-adjust: exact;
                font-weight: bold;
                text-align: center;
            }
            
            /* العناوين */
            .report-title-main {
                font-size: 22pt;
                font-weight: bold;
                text-align: center !important;
                margin-bottom: 20px;
                text-decoration: underline;
                display: block;
                width: 100%;
            }
            .section-title {
                background-color: #333 !important;
                color: #fff !important;
                -webkit-print-color-adjust: exact;
                padding: 5px;
                font-weight: bold;
                text-align: center;
                margin-top: 10px;
                border: 1px solid #000;
            }

            /* التذييل الموحد */
            .custom-footer {
                position: fixed;
                bottom: 0;
                left: 0;
                width: 100%;
                text-align: center;
                font-size: 10pt;
                color: #555;
                border-top: 1px solid #ccc;
                padding-top: 5px;
                background: white;
            }

            /* فواصل الصفحات */
            .page-break {
                page-break-after: always;
                display: block;
                height: 1px;
                margin-top: 20px;
            }

            /* تنسيق الحالات */
            .status-pending { color: red !important; font-weight: bold; }
            .status-completed { color: green !important; font-weight: bold; }
            
            /* شريط التقدم */
            .progress-container { border: 1px solid #000 !important; background: #eee !important; -webkit-print-color-adjust: exact; }
            .progress-bar-fill { background: #555 !important; -webkit-print-color-adjust: exact; }
        }
    `;
    document.head.appendChild(style);
})();

// ============================================
// 2. التعريفات الأساسية
// ============================================

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

    const previewArea = document.getElementById('reportPreviewArea');
    previewArea.innerHTML = ''; // تنظيف المنطقة

    // توجيه الطلب حسب النوع
    if (reportType === 'attendance') {
        generateAttendanceReport(selectedStudentIds, previewArea);
    } else if (reportType === 'achievement') {
        generateAchievementReport(selectedStudentIds, previewArea);
    } else if (reportType === 'assignments') {
        generateAssignmentsReport(selectedStudentIds, previewArea);
    } else if (reportType === 'iep') {
        generateIEPReport(selectedStudentIds, previewArea);
    } else {
        previewArea.innerHTML = `<div class="alert alert-warning text-center no-print">عفواً، هذا التقرير قيد التطوير.</div>`;
    }
};

document.addEventListener('DOMContentLoaded', function() {
    updateTeacherName();
    loadStudentsForSelection();

    // ✅ التعديل هنا: تحديث الاسم مع الحفاظ على الرمز (الأيقونة)
    const iepOption = document.querySelector('#reportType option[value="iep"]');
    if(iepOption) {
        const oldText = iepOption.textContent.trim();
        // نفترض أن الرمز هو الجزء الأول قبل المسافة (مثل: 📋 تقرير...)
        const icon = oldText.split(' ')[0]; 
        
        // نتأكد أن الرمز ليس كلمة "تقرير" نفسها، فإذا كان كذلك نضيف رمزاً افتراضياً
        const finalIcon = (icon === 'تقرير' || icon === 'Report') ? '📋' : icon;
        
        iepOption.textContent = `${finalIcon} تقرير الخطط التربوية الفردية`;
    }
});

function updateTeacherName() {
    try {
        const sessionData = JSON.parse(sessionStorage.getItem('currentUser'));
        if (sessionData) {
            const name = (sessionData.user && sessionData.user.name) || sessionData.name;
            if (name) document.getElementById('teacherName').textContent = name;
        }
    } catch (e) { console.error(e); }
}

function loadStudentsForSelection() {
    const container = document.getElementById('studentsListContainer');
    if (!container) return;

    const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const sessionData = JSON.parse(sessionStorage.getItem('currentUser'));
    
    let teacherId = null; 
    let isAdmin = false;

    if (sessionData) {
        if (sessionData.user) {
            teacherId = String(sessionData.user.id);
            isAdmin = sessionData.user.role === 'admin';
        } else {
            teacherId = String(sessionData.id);
            isAdmin = sessionData.role === 'admin';
        }
    }

    let students = allUsers.filter(u => {
        if (u.role !== 'student') return false;
        if (isAdmin) return true;
        return String(u.teacherId) === teacherId;
    });

    if (students.length === 0 && !isAdmin) {
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

// ============================================
// 3. تقرير متابعة الغياب
// ============================================
function generateAttendanceReport(studentIds, container) {
    const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const allEvents = JSON.parse(localStorage.getItem('studentEvents') || '[]');
    const printDate = new Date().toLocaleDateString('ar-SA');

    let tableHTML = `
        <div style="background:white; padding:20px;">
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
        const student = allUsers.find(u => u.id == studentId);
        if (!student) return;

        const studentRecords = allEvents.filter(e => e.studentId == studentId);
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

    tableHTML += `</tbody></table>
            <div class="custom-footer">
                تم طباعة التقرير من نظام ميسر التعلم للاستاذ/ صالح عبدالعزيز العجلان بتاريخ ${printDate}
            </div>
            <div class="mt-4 text-left no-print" style="text-align:left; margin-top:20px;">
                <button onclick="window.print()" class="btn btn-primary" style="padding:10px 20px; font-size:1.1em;">طباعة التقرير 🖨️</button>
            </div>
        </div>`;
    container.innerHTML = tableHTML;
}

// ============================================
// 4. تقرير نسب الإنجاز
// ============================================
function generateAchievementReport(studentIds, container) {
    const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const allLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    const printDate = new Date().toLocaleDateString('ar-SA');

    let tableHTML = `
        <div style="background:white; padding:20px;">
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
        const student = allUsers.find(u => u.id == studentId);
        if (!student) return;

        const myLessons = allLessons.filter(l => l.studentId == studentId);
        const total = myLessons.length;
        const completed = myLessons.filter(l => l.status === 'completed' || l.status === 'accelerated').length;
        
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

    tableHTML += `</tbody></table>
            <div class="custom-footer">
                تم طباعة التقرير من نظام ميسر التعلم للاستاذ/ صالح عبدالعزيز العجلان بتاريخ ${printDate}
            </div>
            <div class="mt-4 text-left no-print" style="text-align:left; margin-top:20px;">
                <button onclick="window.print()" class="btn btn-primary" style="padding:10px 20px; font-size:1.1em;">طباعة التقرير 🖨️</button>
            </div>
        </div>`;
    container.innerHTML = tableHTML;
}

// ============================================
// 5. تقرير الواجبات
// ============================================
function generateAssignmentsReport(studentIds, container) {
    const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const allAssignments = JSON.parse(localStorage.getItem('studentAssignments') || '[]');
    const printDate = new Date().toLocaleDateString('ar-SA');

    let tableHTML = `
        <div style="background:white; padding:20px;">
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
        const student = allUsers.find(u => u.id == studentId);
        if (!student) return;

        const myAssignments = allAssignments.filter(a => a.studentId == studentId);

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
                    statusContent = `<span class="status-completed">${completedDate}</span>`;
                } else {
                    statusContent = `<span class="status-pending">لم يتم تسليم الواجب</span>`;
                }

                tableHTML += `
                    <tr>
                        <td style="font-weight:bold;">${student.name}</td>
                        <td>${assign.title}</td>
                        <td>${assignedDate}</td>
                        <td>${statusContent}</td>
                    </tr>
                `;
            });
        }
    });

    tableHTML += `</tbody></table>
            <div class="custom-footer">
                تم طباعة التقرير من نظام ميسر التعلم للاستاذ/ صالح عبدالعزيز العجلان بتاريخ ${printDate}
            </div>
            <div class="mt-4 text-left no-print" style="text-align:left; margin-top:20px;">
                <button onclick="window.print()" class="btn btn-primary" style="padding:10px 20px; font-size:1.1em;">طباعة التقرير 🖨️</button>
            </div>
        </div>`;
    container.innerHTML = tableHTML;
}

// ============================================
// 6. تقرير الخطط التربوية الفردية (IEP) - النهائي
// ============================================
function generateIEPReport(studentIds, container) {
    const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const allTests = JSON.parse(localStorage.getItem('tests') || '[]');
    const allObjectives = JSON.parse(localStorage.getItem('objectives') || '[]');
    const studentLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    const teacherSchedule = JSON.parse(localStorage.getItem('teacherSchedule') || '[]');
    const printDate = new Date().toLocaleDateString('ar-SA');

    let fullReportHTML = `<div style="background:white; padding:0;">`;

    studentIds.forEach((studentId, index) => {
        const student = allUsers.find(u => u.id == studentId);
        if (!student) return;

        const completedDiagnostic = studentTests.find(t => t.studentId == studentId && t.type === 'diagnostic' && t.status === 'completed');
        const originalTest = completedDiagnostic ? allTests.find(t => t.id == completedDiagnostic.testId) : null;

        let strengthHTML = '';
        let needsObjects = [];

        if (completedDiagnostic && originalTest && originalTest.questions) {
            originalTest.questions.forEach(q => {
                const ans = completedDiagnostic.answers ? completedDiagnostic.answers.find(a => a.questionId == q.id) : null;
                const score = ans ? (ans.score || 0) : 0;
                if (q.linkedGoalId) {
                    const obj = allObjectives.find(o => o.id == q.linkedGoalId);
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

        // جدول الحصص الشريطي (المطابق لملف الطالب)
        const dayKeys = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
        let scheduleCells = dayKeys.map(dk => {
            const session = teacherSchedule.find(s => 
                s.day === dk && 
                s.students && 
                s.students.some(id => id == studentId)
            );
            
            let content = session ? `حصة ${session.period}` : '-';
            return `<td style="height:40px; text-align:center;">${content}</td>`;
        }).join('');

        fullReportHTML += `
        <div class="student-iep-page">
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
                    <td>${originalTest ? originalTest.subject : 'عام'}</td>
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
                        const lesson = studentLessons.find(l => l.studentId == studentId && l.objective === iGoal);
                        let statusText = '-';
                        if (lesson) {
                            if (lesson.status === 'completed') statusText = `<span class="status-completed">${new Date(lesson.completedDate).toLocaleDateString('ar-SA')}</span>`;
                            else if (lesson.status === 'accelerated') statusText = `<span class="status-completed">تجاوز (تفوق)</span>`;
                            else statusText = '<span class="status-pending">جاري العمل</span>';
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

            <div class="custom-footer">
                تم طباعة التقرير من نظام ميسر التعلم للاستاذ/ صالح عبدالعزيز العجلان بتاريخ ${printDate}
            </div>
        </div>
        `;

        if (index < studentIds.length - 1) {
            fullReportHTML += `<div class="page-break"></div>`;
        }
    });

    fullReportHTML += `
        <div class="mt-4 text-left no-print" style="text-align:left; margin-top:20px; padding:20px;">
            <button onclick="window.print()" class="btn btn-primary" style="padding:10px 20px; font-size:1.1em;">طباعة التقارير 🖨️</button>
        </div>
    </div>`;

    container.innerHTML = fullReportHTML;
}
