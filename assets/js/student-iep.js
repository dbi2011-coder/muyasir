// ============================================
// 📁 المسار: assets/js/student-iep.js
// الوصف: عرض الخطة للطالب (تذييل يظهر في الصفحة الأخيرة فقط + إزالة الأزرار الزائدة)
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('my-iep.html')) {
        loadStudentIEP();
    }
});

function loadStudentIEP() {
    const iepContainer = document.getElementById('iepContainer');
    
    // التحقق من المستخدم
    let currentStudent = null;
    try {
        if (typeof getCurrentUser === 'function') currentStudent = getCurrentUser();
        if (!currentStudent && sessionStorage.getItem('currentUser')) {
            currentStudent = JSON.parse(sessionStorage.getItem('currentUser')).user;
        }
    } catch (e) {}

    if (!currentStudent) return;
    
    const currentStudentId = currentStudent.id;

    // جلب البيانات
    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const allTests = JSON.parse(localStorage.getItem('tests') || '[]');
    const allObjectives = JSON.parse(localStorage.getItem('objectives') || '[]');
    const teacherSchedule = JSON.parse(localStorage.getItem('teacherSchedule') || '[]');
    const studentLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');

    // البحث عن أحدث اختبار تشخيصي مكتمل
    const completedDiagnostic = studentTests
        .filter(t => t.studentId == currentStudentId && t.type === 'diagnostic' && t.status === 'completed')
        .sort((a, b) => new Date(b.assignedDate) - new Date(a.assignedDate))[0];

    // إذا لم تكن الخطة جاهزة
    if (!completedDiagnostic) {
        iepContainer.innerHTML = `
            <div class="empty-state" style="text-align:center; padding:40px; background:white; border-radius:8px;">
                <div style="font-size:3rem;">⏳</div>
                <h3>الخطة غير جاهزة بعد</h3>
                <p>يجب إكمال الاختبار التشخيصي وتصحيحه من قبل المعلم لتظهر خطتك هنا.</p>
                <a href="my-tests.html" class="btn btn-primary" style="margin-top:15px;">الذهاب للاختبارات</a>
            </div>
        `;
        return;
    }

    const originalTest = allTests.find(t => t.id == completedDiagnostic.testId);
    if (!originalTest) return; // حماية

    // تحليل الأهداف (قوة واحتياج)
    let needsObjects = [];
    let strengthHTML = '';
    let needsHTML = '';

    if (originalTest.questions) {
        originalTest.questions.forEach(question => {
            let studentScore = 0;
            if (completedDiagnostic.answers) {
                const ans = completedDiagnostic.answers.find(a => a.questionId == question.id);
                if (ans) studentScore = Number(ans.score) || 0;
            }

            if (question.linkedGoalId) {
                const objective = allObjectives.find(o => o.id == question.linkedGoalId);
                if (objective) {
                    const passingScore = Number(question.passingScore) || 1;
                    if (studentScore >= passingScore) {
                        if (!strengthHTML.includes(objective.shortTermGoal)) {
                            strengthHTML += `<li>${objective.shortTermGoal}</li>`;
                        }
                    } else {
                        if (!needsObjects.find(o => o.id == objective.id)) {
                            needsObjects.push(objective);
                            needsHTML += `<li>${objective.shortTermGoal}</li>`;
                        }
                    }
                }
            }
        });
    }

    if(!strengthHTML) strengthHTML = '<li>لا توجد نقاط مسجلة.</li>';
    if(!needsHTML) needsHTML = '<li>لا توجد نقاط احتياج مسجلة.</li>';

    // تواريخ الدروس
    const completedLessonsMap = {};
    studentLessons.forEach(l => {
        if (l.studentId == currentStudentId && l.status === 'completed') {
            completedLessonsMap[l.objective] = l.completedDate;
        }
    });

    // جدول الأهداف
    let objectivesRows = '';
    if (needsObjects.length === 0) {
        objectivesRows = '<tr><td colspan="3" class="text-center">جميع الأهداف محققة.</td></tr>';
    } else {
        let stgCounter = 1;
        needsObjects.forEach(obj => {
            // صف الهدف القصير
            objectivesRows += `
                <tr style="background-color: #dbeeff !important; -webkit-print-color-adjust: exact;">
                    <td class="text-center" style="font-weight:bold; font-size:1.1rem; color:#0056b3;">${stgCounter++}</td>
                    <td colspan="2" style="font-weight:bold; color:#0056b3; font-size:1.05rem;">الهدف قصير المدى: ${obj.shortTermGoal}</td>
                </tr>
            `;
            
            if (obj.instructionalGoals && obj.instructionalGoals.length > 0) {
                obj.instructionalGoals.forEach(iGoal => {
                    const achievementDate = completedLessonsMap[iGoal];
                    let dateDisplay = '';
                    if (achievementDate) {
                        try {
                            const d = new Date(achievementDate);
                            dateDisplay = `<span class="text-success font-weight-bold">✔ ${d.toLocaleDateString('ar-SA')}</span>`;
                        } catch(e) {}
                    } else {
                        dateDisplay = `<span style="color:#999;">⏳ قيد العمل</span>`;
                    }
                    objectivesRows += `
                        <tr>
                            <td class="text-center" style="color:#666;">-</td>
                            <td>${iGoal}</td>
                            <td>${dateDisplay}</td>
                        </tr>
                    `;
                });
            } else {
                objectivesRows += `<tr><td></td><td class="text-muted">لا توجد أهداف تدريسية</td><td></td></tr>`;
            }
        });
    }

    const subjectName = originalTest.subject || 'المادة';

    // بناء جدول الحصص
    const daysMap = { 'sunday': 'الأحد', 'monday': 'الاثنين', 'tuesday': 'الثلاثاء', 'wednesday': 'الأربعاء', 'thursday': 'الخميس' };
    const dayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'];
    let scheduleCells = '';

    dayKeys.forEach(dayKey => {
        let content = '';
        const session = teacherSchedule.find(s => s.day === dayKey && (
            (s.students && s.students.includes(currentStudentId)) || s.studentId == currentStudentId
        ));
        
        if (session) {
            content = `<div style="background:#e2e6ea !important; padding:4px; margin-bottom:2px; border-radius:3px; font-size:0.9rem;">حصة ${session.period || 1}</div>`;
        }
        
        scheduleCells += `<td style="height:50px; vertical-align:middle;">${content}</td>`;
    });

    // ✅ ستايل الطباعة المعدل (لإظهار التذييل في النهاية فقط)
    const printStyles = `
        <style>
            @media print {
                body * { visibility: hidden; }
                .iep-word-model-content, .iep-word-model-content * { visibility: visible; }
                .iep-word-model-content { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; border: none !important; }
                * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                .no-print { display: none !important; }
                
                /* تنسيق التذييل ليكون في نهاية المحتوى فقط وليس ثابتاً في كل صفحة */
                .print-footer-container {
                    margin-top: 50px;
                    width: 100%;
                    text-align: center;
                    border-top: 1px solid #ccc;
                    padding-top: 10px;
                    display: block !important;
                }
                .print-footer-text {
                    font-size: 11px;
                    color: #555;
                    font-weight: bold;
                    font-family: 'Tajawal', sans-serif;
                }
            }
        </style>
    `;

    // الهيكل النهائي
    const iepHTML = `
    ${printStyles}
    <div class="iep-word-model-content" style="background:#fff; padding:20px; border:1px solid #ccc; font-family:'Tajawal', sans-serif;">
        
        <div style="text-align:center; margin-bottom:20px; border-bottom:2px solid #333; padding-bottom:10px;">
            <h3>الخطة التربوية الفردية</h3>
        </div>

        <table class="table table-bordered mb-4" style="width:100%;">
            <tr>
                <td style="background:#f5f5f5 !important; width:15%; font-weight:bold;">اسم الطالب:</td>
                <td style="width:35%;">${currentStudent.name}</td>
                <td style="background:#f5f5f5 !important; width:15%; font-weight:bold;">الصف:</td>
                <td style="width:35%;">${currentStudent.grade}</td>
            </tr>
            <tr>
                <td style="background:#f5f5f5 !important; font-weight:bold;">المادة:</td>
                <td>${subjectName}</td>
                <td style="background:#f5f5f5 !important; font-weight:bold;">تاريخ الخطة:</td>
                <td>${new Date().toLocaleDateString('ar-SA')}</td>
            </tr>
        </table>

        <h5 style="margin-bottom:10px; font-weight:bold;">جدول الحصص:</h5>
        <div class="table-responsive mb-4">
            <table class="table table-bordered text-center" style="width:100%;">
                <thead>
                    <tr style="background:#f5f5f5 !important;">
                        <th>الأحد</th><th>الاثنين</th><th>الثلاثاء</th><th>الأربعاء</th><th>الخميس</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>${scheduleCells}</tr>
                </tbody>
            </table>
        </div>

        <div style="display: flex; gap: 20px; margin-bottom: 20px;">
            <div style="flex: 1;">
                <div class="card h-100" style="border:1px solid #ddd;">
                    <div class="card-header" style="background:#28a745 !important; color:#fff; text-align:center; padding: 10px; font-weight: bold;">نقاط القوة</div>
                    <div class="card-body" style="padding: 15px;">
                        <ul style="padding-right:20px; margin:0;">${strengthHTML}</ul>
                    </div>
                </div>
            </div>
            <div style="flex: 1;">
                <div class="card h-100" style="border:1px solid #ddd;">
                    <div class="card-header" style="background:#dc3545 !important; color:#fff; text-align:center; padding: 10px; font-weight: bold;">نقاط الاحتياج</div>
                    <div class="card-body" style="padding: 15px;">
                        <ul style="padding-right:20px; margin:0;">${needsHTML}</ul>
                    </div>
                </div>
            </div>
        </div>

        <table class="table table-bordered mb-4" style="width:100%; border-color:#999;">
            <tr>
                <td style="background:#f0f0f0 !important; font-weight:bold; text-align:center; padding:10px;">الهدف بعيد المدى</td>
            </tr>
            <tr>
                <td style="text-align:center; padding:15px; font-size:1.1rem;">
                    أن يتقن التلميذ مهارات مادة <strong>${subjectName}</strong> لذوي صعوبات التعلم حتى صفه الحالي وبنسبة لا تقل عن 80%
                </td>
            </tr>
        </table>

        <h5 style="margin-bottom:10px; font-weight:bold;">الأهداف:</h5>
        <div class="table-responsive">
            <table class="table table-bordered" style="width:100%;">
                <thead style="background:#333 !important; color:#fff;">
                    <tr>
                        <th style="width:50px;">#</th>
                        <th>الهدف</th>
                        <th style="width:150px;">تاريخ التحقق</th>
                    </tr>
                </thead>
                <tbody>
                    ${objectivesRows}
                </tbody>
            </table>
        </div>

        <div class="print-footer-container">
            <p class="print-footer-text">
                تم طباعة الخطة التربوية الفردية من نظام ميسر التعلم لمعلم صعوبات التعلم أ/ صالح عبد العزيز العجلان
            </p>
        </div>
    </div>
    `;

    iepContainer.innerHTML = iepHTML;
}
