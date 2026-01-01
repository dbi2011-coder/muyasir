// ============================================
// 📁 المسار: assets/js/student-profile.js
// الوصف: إدارة ملف الطالب (شامل: تشخيص، خطة، دروس بمساراتها الأربعة، تقدم، سجل تاريخي)
// ============================================

let currentStudentId = null;
let currentStudent = null;

document.addEventListener('DOMContentLoaded', function() {
    const params = new URLSearchParams(window.location.search);
    currentStudentId = parseInt(params.get('id'));
    
    if (!currentStudentId) {
        alert('لم يتم تحديد طالب');
        window.location.href = 'students.html';
        return;
    }
    loadStudentData();
});

function loadStudentData() {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    currentStudent = users.find(u => u.id == currentStudentId);
    
    if (!currentStudent) {
        alert('الطالب غير موجود');
        window.location.href = 'students.html';
        return;
    }
    
    // تحديث بيانات الواجهة
    if(document.getElementById('sideName')) document.getElementById('sideName').textContent = currentStudent.name;
    if(document.getElementById('headerStudentName')) document.getElementById('headerStudentName').textContent = currentStudent.name;
    if(document.getElementById('sideGrade')) document.getElementById('sideGrade').textContent = currentStudent.grade + ' - ' + (currentStudent.subject || 'عام');
    if(document.getElementById('sideAvatar')) document.getElementById('sideAvatar').textContent = currentStudent.name.charAt(0);
    document.title = `ملف الطالب: ${currentStudent.name}`;
    
    // تفعيل التبويب الافتراضي
    switchSection('diagnostic');
}

function switchSection(sectionId) {
    // إزالة التنشيط من الكل
    document.querySelectorAll('.sidebar-menu .nav-link').forEach(link => link.classList.remove('active'));
    document.querySelectorAll('.content-section').forEach(section => section.classList.remove('active'));

    // تنشيط المطلوب
    const activeLink = document.getElementById(`link-${sectionId}`);
    if(activeLink) activeLink.classList.add('active');
    
    const activeSection = document.getElementById(`section-${sectionId}`);
    if(activeSection) activeSection.classList.add('active');

    // تحميل البيانات الخاصة بالقسم
    if (sectionId === 'diagnostic') loadDiagnosticTab();
    if (sectionId === 'iep') loadIEPTab();
    if (sectionId === 'lessons') loadLessonsTab();
    if (sectionId === 'assignments') loadAssignmentsTab();
    if (sectionId === 'progress') loadProgressTab();
}

// ============================================
// 1. قسم الاختبار التشخيصي
// ============================================
function loadDiagnosticTab() {
    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const assignedTest = studentTests.find(t => t.studentId == currentStudentId && t.type === 'diagnostic');
    
    if (assignedTest) {
        document.getElementById('noDiagnosticTest').style.display = 'none';
        const detailsDiv = document.getElementById('diagnosticTestDetails');
        detailsDiv.style.display = 'block';
        
        const allTests = JSON.parse(localStorage.getItem('tests') || '[]');
        const originalTest = allTests.find(t => t.id == assignedTest.testId);
        
        let statusBadge = '';
        let actionContent = '';

        if(assignedTest.status === 'completed') {
            statusBadge = '<span class="badge badge-success">مكتمل</span>';
            actionContent = `
                <div style="margin-top:15px; padding:15px; background:#f0fff4; border:1px solid #c3e6cb; border-radius:5px;">
                    <strong>الدرجة الحالية: ${assignedTest.score || 0}%</strong>
                    <div style="margin-top:10px;">
                        <button class="btn btn-warning btn-sm" onclick="openReviewModal(${assignedTest.id})">🔍 مراجعة وتصحيح</button>
                        <button class="btn btn-primary btn-sm" onclick="autoGenerateLessons()">⚡ توليد الخطة والدروس</button>
                    </div>
                </div>`;
        } else if (assignedTest.status === 'returned') {
            statusBadge = '<span class="badge badge-warning">معاد للتعديل</span>';
            actionContent = `<div class="alert alert-warning mt-2">تم إعادة الاختبار للطالب.</div>`;
        } else {
            statusBadge = '<span class="badge badge-secondary">قيد الانتظار</span>';
        }

        const title = originalTest ? originalTest.title : 'اختبار (محذوف)';
        detailsDiv.innerHTML = `
            <div class="card">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <h3>${title}</h3>
                    <div style="display:flex; gap:5px;">${statusBadge}<button class="btn btn-sm btn-outline-danger" onclick="deleteAssignedTest(${assignedTest.id})"><i class="fas fa-trash"></i></button></div>
                </div>
                <p class="text-muted">تاريخ التعيين: ${new Date(assignedTest.assignedDate).toLocaleDateString('ar-SA')}</p>
                ${actionContent}
            </div>`;
    } else {
        document.getElementById('noDiagnosticTest').style.display = 'block';
        document.getElementById('diagnosticTestDetails').style.display = 'none';
    }
}

// نافذة تعيين اختبار
function showAssignTestModal() {
    const allTests = JSON.parse(localStorage.getItem('tests') || '[]');
    const select = document.getElementById('testSelect');
    select.innerHTML = '<option value="">اختر اختباراً...</option>';
    allTests.forEach(t => select.innerHTML += `<option value="${t.id}">${t.title}</option>`);
    document.getElementById('assignTestModal').classList.add('show');
}

function assignTest() {
    const testId = parseInt(document.getElementById('testSelect').value);
    if(!testId) return;
    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    
    // منع التكرار
    if(studentTests.some(t => t.studentId == currentStudentId && t.type === 'diagnostic')) {
        alert('يوجد اختبار تشخيصي معين مسبقاً لهذا الطالب.');
        return;
    }

    studentTests.push({
        id: Date.now(),
        studentId: currentStudentId,
        testId: testId,
        type: 'diagnostic',
        status: 'pending',
        assignedDate: new Date().toISOString()
    });
    localStorage.setItem('studentTests', JSON.stringify(studentTests));
    closeModal('assignTestModal');
    loadDiagnosticTab();
    alert('تم تعيين الاختبار بنجاح.');
}

function deleteAssignedTest(id) {
    if(!confirm('هل أنت متأكد من حذف هذا الاختبار؟ سيؤدي ذلك لحذف نتائج التشخيص والخطة المرتبطة.')) return;
    let st = JSON.parse(localStorage.getItem('studentTests') || '[]');
    st = st.filter(t => t.id != id);
    localStorage.setItem('studentTests', JSON.stringify(st));
    loadDiagnosticTab();
    // إعادة تحميل الخطة لإظهار أنها فارغة
    if(document.getElementById('section-iep').classList.contains('active')) loadIEPTab();
}

// ---------------------------------------------------------
// مراجعة الاختبار وتصحيحه
// ---------------------------------------------------------
function openReviewModal(assignmentId) {
    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const assignment = studentTests.find(t => t.id == assignmentId);
    if(!assignment) return;
    
    const allTests = JSON.parse(localStorage.getItem('tests') || '[]');
    const originalTest = allTests.find(t => t.id == assignment.testId);
    
    document.getElementById('reviewAssignmentId').value = assignmentId;
    const container = document.getElementById('reviewQuestionsContainer');
    container.innerHTML = '';

    if (originalTest && originalTest.questions) {
        originalTest.questions.forEach((q, index) => {
            const ansObj = assignment.answers ? assignment.answers.find(a => a.questionId == q.id) : null;
            let rawAns = ansObj ? (ansObj.answer || ansObj.value) : 'لم يجب';
            
            // تنسيق الإجابة (صورة/صوت/نص)
            let formattedAns = rawAns;
            if(rawAns.toString().startsWith('data:image')) formattedAns = `<img src="${rawAns}" style="max-width:100px;">`;
            
            const score = ansObj ? (ansObj.score || 0) : 0;
            const note = ansObj ? (ansObj.teacherNote || '') : '';

            container.innerHTML += `
                <div class="review-question-item">
                    <div class="review-q-header">
                        <strong>س${index+1}: ${q.text}</strong>
                        <div><input type="number" class="score-input" name="score_${q.id}" value="${score}" max="${q.passingScore||1}"> / ${q.passingScore||1}</div>
                    </div>
                    <div class="student-answer-box">${formattedAns}</div>
                    <div class="teacher-feedback-box"><textarea class="form-control" name="note_${q.id}" placeholder="ملاحظات المعلم...">${note}</textarea></div>
                </div>`;
        });
    }
    document.getElementById('reviewTestModal').classList.add('show');
}

function saveTestReview() {
    const id = parseInt(document.getElementById('reviewAssignmentId').value);
    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const idx = studentTests.findIndex(t => t.id == id);
    if(idx === -1) return;

    const container = document.getElementById('reviewQuestionsContainer');
    const allTests = JSON.parse(localStorage.getItem('tests') || '[]');
    const originalTest = allTests.find(t => t.id == studentTests[idx].testId);
    
    let totalScore = 0;
    let maxTotal = 0;

    if(originalTest) {
        if(!studentTests[idx].answers) studentTests[idx].answers = [];
        originalTest.questions.forEach(q => {
            const scoreInp = container.querySelector(`input[name="score_${q.id}"]`);
            const noteInp = container.querySelector(`textarea[name="note_${q.id}"]`);
            
            let ansIdx = studentTests[idx].answers.findIndex(a => a.questionId == q.id);
            const val = parseInt(scoreInp.value) || 0;
            
            if(ansIdx !== -1) {
                studentTests[idx].answers[ansIdx].score = val;
                studentTests[idx].answers[ansIdx].teacherNote = noteInp.value;
            } else {
                studentTests[idx].answers.push({questionId: q.id, score: val, teacherNote: noteInp.value});
            }
            totalScore += val;
            maxTotal += (q.passingScore || 1);
        });
        studentTests[idx].score = Math.round((totalScore / maxTotal) * 100);
    }
    
    localStorage.setItem('studentTests', JSON.stringify(studentTests));
    closeModal('reviewTestModal');
    loadDiagnosticTab();
    alert('تم حفظ التصحيح.');
}

function returnTestForResubmission() {
    const id = parseInt(document.getElementById('reviewAssignmentId').value);
    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const idx = studentTests.findIndex(t => t.id == id);
    if(idx !== -1) {
        studentLessons[idx].status = 'returned';
        localStorage.setItem('studentTests', JSON.stringify(studentTests));
        closeModal('reviewTestModal');
        loadDiagnosticTab();
        alert('تمت إعادة الاختبار للطالب.');
    }
}

// ============================================
// 2. الخطة التربوية (IEP)
// ============================================
function loadIEPTab() {
    const iepContainer = document.getElementById('iepContent');
    const wordModel = document.querySelector('.iep-word-model');
    if (!iepContainer) return;

    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const completedDiagnostic = studentTests.find(t => t.studentId == currentStudentId && t.type === 'diagnostic' && t.status === 'completed');

    if (!completedDiagnostic) {
        if(wordModel) wordModel.style.display = 'none';
        iepContainer.innerHTML = `<div class="empty-state"><h3>الخطة غير جاهزة</h3><p>يجب إكمال وتصحيح اختبار تشخيصي أولاً.</p></div>`;
        return;
    }

    if(wordModel) wordModel.style.display = 'block';
    
    const allTests = JSON.parse(localStorage.getItem('tests') || '[]');
    const originalTest = allTests.find(t => t.id == completedDiagnostic.testId);
    const allObjectives = JSON.parse(localStorage.getItem('objectives') || '[]');
    const studentLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');

    // 1. تحليل نقاط القوة والاحتياج
    let needsObjects = [];
    let strengthHTML = '';
    let needsHTML = '';

    if (originalTest && originalTest.questions) {
        originalTest.questions.forEach(q => {
            const ans = completedDiagnostic.answers ? completedDiagnostic.answers.find(a => a.questionId == q.id) : null;
            const score = ans ? (ans.score || 0) : 0;
            const pass = q.passingScore || 1;

            if (q.linkedGoalId) {
                const obj = allObjectives.find(o => o.id == q.linkedGoalId);
                if (obj) {
                    if (score >= pass) {
                        if (!strengthHTML.includes(obj.shortTermGoal)) strengthHTML += `<li>${obj.shortTermGoal}</li>`;
                    } else {
                        if (!needsObjects.find(o => o.id == obj.id)) {
                            needsObjects.push(obj);
                            needsHTML += `<li>${obj.shortTermGoal}</li>`;
                        }
                    }
                }
            }
        });
    }

    if(!strengthHTML) strengthHTML = '<li>لا توجد نقاط مسجلة.</li>';
    if(!needsHTML) needsHTML = '<li>لا توجد نقاط احتياج مسجلة.</li>';

    // 2. ربط الأهداف بالدروس (لجلب التواريخ)
    // نبحث عن الدروس التي تغطي هذه الأهداف ونرى حالتها
    const completedLessonsMap = {};
    const acceleratedLessonsMap = {};

    studentLessons.forEach(l => {
        if (l.studentId == currentStudentId) {
            if (l.status === 'completed') completedLessonsMap[l.objective] = l.completedDate;
            if (l.status === 'accelerated') acceleratedLessonsMap[l.objective] = l.completedDate;
        }
    });

    // 3. بناء جدول الأهداف
    let objectivesRows = '';
    if (needsObjects.length === 0) {
        objectivesRows = '<tr><td colspan="3" class="text-center">جميع الأهداف محققة (ما شاء الله).</td></tr>';
    } else {
        let stgCounter = 1;
        needsObjects.forEach(obj => {
            objectivesRows += `
                <tr style="background-color: #dbeeff !important; -webkit-print-color-adjust: exact;">
                    <td class="text-center" style="font-weight:bold; color:#0056b3;">${stgCounter++}</td>
                    <td colspan="2" style="font-weight:bold; color:#0056b3;">الهدف قصير المدى: ${obj.shortTermGoal}</td>
                </tr>`;
            
            if (obj.instructionalGoals && obj.instructionalGoals.length > 0) {
                obj.instructionalGoals.forEach(iGoal => {
                    const compDate = completedLessonsMap[iGoal];
                    const accelDate = acceleratedLessonsMap[iGoal];
                    let dateDisplay = '';
                    let rowStyle = '';

                    if (accelDate) {
                        // حالة التسريع (تمييز ذهبي)
                        const d = new Date(accelDate).toLocaleDateString('ar-SA');
                        dateDisplay = `<span style="font-weight:bold; color:#856404;">⚡ ${d} (تفوق)</span>`;
                        rowStyle = 'background-color: #fff3cd !important;';
                    } else if (compDate) {
                        // حالة الإكمال الطبيعي
                        const d = new Date(compDate).toLocaleDateString('ar-SA');
                        dateDisplay = `<span class="text-success font-weight-bold">✔ ${d}</span>`;
                    } else {
                        dateDisplay = `<span style="color:#ccc;">--/--/----</span>`;
                    }

                    objectivesRows += `
                        <tr style="${rowStyle}">
                            <td class="text-center">-</td>
                            <td>${iGoal}</td>
                            <td>${dateDisplay}</td>
                        </tr>`;
                });
            } else {
                objectivesRows += `<tr><td></td><td class="text-muted">لا توجد أهداف تدريسية</td><td></td></tr>`;
            }
        });
    }

    // 4. جدول الحصص (من teacherSchedule)
    const teacherSchedule = JSON.parse(localStorage.getItem('teacherSchedule') || '[]');
    const dayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'];
    let scheduleCells = '';
    dayKeys.forEach(dk => {
        const session = teacherSchedule.find(s => s.day === dk && (s.studentId == currentStudentId || (s.students && s.students.includes(currentStudentId))));
        scheduleCells += `<td style="height:50px;">${session ? 'حصة ' + (session.period||1) : ''}</td>`;
    });

    const subjectName = originalTest ? originalTest.subject : 'عام';
    
    // ستايل الطباعة والتذييل
    const iepHTML = `
    <style>
        @media print {
            body * { visibility: hidden; }
            .iep-printable, .iep-printable * { visibility: visible; }
            .iep-printable { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; border:none; }
            .no-print { display: none !important; }
            .print-footer-container { margin-top: 50px; text-align: center; border-top: 1px solid #ccc; padding-top: 10px; display: block !important; }
        }
    </style>
    <div class="iep-printable" style="background:#fff; padding:20px; border:1px solid #ccc;">
        <div style="text-align:center; margin-bottom:20px; border-bottom:2px solid #333;"><h3>الخطة التربوية الفردية</h3></div>
        
        <table class="table table-bordered mb-4">
            <tr><td style="background:#f5f5f5; width:15%;">اسم الطالب:</td><td style="width:35%;">${currentStudent.name}</td><td style="background:#f5f5f5; width:15%;">الصف:</td><td>${currentStudent.grade}</td></tr>
            <tr><td style="background:#f5f5f5;">المادة:</td><td>${subjectName}</td><td style="background:#f5f5f5;">التاريخ:</td><td>${new Date().toLocaleDateString('ar-SA')}</td></tr>
        </table>

        <h5>جدول الحصص:</h5>
        <table class="table table-bordered text-center mb-4">
            <thead><tr style="background:#f5f5f5;"><th>الأحد</th><th>الاثنين</th><th>الثلاثاء</th><th>الأربعاء</th><th>الخميس</th></tr></thead>
            <tbody><tr>${scheduleCells}</tr></tbody>
        </table>

        <div style="display:flex; gap:20px; margin-bottom:20px;">
            <div style="flex:1; border:1px solid #ddd; padding:10px;"><h6 style="background:#28a745; color:white; padding:5px; text-align:center;">نقاط القوة</h6><ul>${strengthHTML}</ul></div>
            <div style="flex:1; border:1px solid #ddd; padding:10px;"><h6 style="background:#dc3545; color:white; padding:5px; text-align:center;">نقاط الاحتياج</h6><ul>${needsHTML}</ul></div>
        </div>

        <div class="alert alert-secondary text-center mb-4">
            الهدف بعيد المدى: أن يتقن التلميذ مهارات مادة <strong>${subjectName}</strong> بنسبة 80%
        </div>

        <h5>الأهداف التدريسية:</h5>
        <table class="table table-bordered">
            <thead style="background:#333; color:white;"><tr><th>#</th><th>الهدف</th><th>التحقق</th></tr></thead>
            <tbody>${objectivesRows}</tbody>
        </table>

        <div class="print-footer-container">
            <p class="print-footer-text">تم طباعة الخطة من نظام ميسر التعلم - معلم: أ/ صالح عبد العزيز العجلان</p>
        </div>
    </div>`;

    iepContainer.innerHTML = iepHTML;
}

// ============================================
// 3. قسم الدروس (المسارات الأربعة + التسريع + السجل)
// ============================================
function loadLessonsTab() {
    const studentLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    let myList = studentLessons.filter(l => l.studentId == currentStudentId);
    const container = document.getElementById('studentLessonsGrid');

    if (myList.length === 0) {
        container.innerHTML = `<div class="empty-state"><h3>لا توجد دروس</h3><button class="btn btn-primary" onclick="autoGenerateLessons()">⚡ توليد تلقائي من الخطة</button></div>`;
        return;
    }

    // ترتيب حسب orderIndex
    myList.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));

    container.innerHTML = myList.map((l, index) => {
        // حساب حالة القفل للعرض فقط (المعلم يرى كل شيء)
        const prevCompleted = index === 0 || ['completed', 'accelerated'].includes(myList[index-1].status);
        const isLockedForStudent = !prevCompleted;

        let statusBadge = '';
        let cardStyle = '';
        
        if (l.status === 'completed') {
            statusBadge = '<span class="badge badge-success">✅ مكتمل</span>';
            cardStyle = 'border-right: 5px solid #28a745;';
        } else if (l.status === 'accelerated') {
            statusBadge = '<span class="badge badge-warning" style="background:#ffc107; color:#000;">⚡ مسرع (تفوق)</span>';
            cardStyle = 'border-right: 5px solid #ffc107; background:#fffbf0;';
        } else if (isLockedForStudent) {
            statusBadge = '<span class="badge badge-secondary">🔒 مغلق (ينتظر السابق)</span>';
            cardStyle = 'border-right: 5px solid #6c757d; opacity:0.8;';
        } else {
            statusBadge = '<span class="badge badge-primary">🔓 نشط حالياً</span>';
            cardStyle = 'border-right: 5px solid #007bff;';
        }

        // أزرار التحكم
        let controls = '';
        // 1. إعادة الفتح (المسار الذكي)
        if (['completed', 'accelerated'].includes(l.status)) {
            controls += `<button class="btn btn-warning btn-sm" onclick="resetLesson(${l.id})">🔄 إعادة فتح (إلغاء)</button>`;
        } 
        // 2. التسريع (مسار التفوق)
        else {
            controls += `<button class="btn btn-info btn-sm" style="background:#ffc107; border:none; color:#000;" onclick="accelerateLesson(${l.id})">⚡ تسريع (تفوق)</button>`;
        }

        // أزرار الترتيب (المسار المرن)
        const isFirst = index === 0;
        const isLast = index === myList.length - 1;
        let orderBtns = '';
        if (!isFirst) orderBtns += `<button class="btn-order" onclick="moveLesson(${l.id}, 'up')">⬆</button>`;
        if (!isLast) orderBtns += `<button class="btn-order" onclick="moveLesson(${l.id}, 'down')">⬇</button>`;

        return `
        <div class="content-card" style="${cardStyle} position:relative;">
            <div style="position:absolute; top:10px; left:10px; display:flex; gap:3px; z-index:5;">${orderBtns}</div>
            <div style="display:flex; justify-content:space-between;">
                <div style="margin-right:30px;">
                    <h4 style="margin:0;">${index+1}. ${l.title}</h4>
                    <small class="text-muted">${l.objective}</small>
                </div>
                <div>${statusBadge}</div>
            </div>
            <div class="lesson-actions" style="margin-top:10px; width:100%; display:flex; gap:5px;">
                ${controls}
                <button class="btn btn-danger btn-sm" onclick="deleteLesson(${l.id})">حذف</button>
            </div>
        </div>`;
    }).join('');
}

// دالة التوليد الآلي
function autoGenerateLessons() {
    if(!confirm('سيتم حذف الدروس الحالية وتوليد قائمة جديدة بناءً على التشخيص. متابعة؟')) return;
    
    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const compDiag = studentTests.find(t => t.studentId == currentStudentId && t.type === 'diagnostic' && t.status === 'completed');
    if (!compDiag) { alert('يجب إكمال التشخيص أولاً'); return; }

    const allObjectives = JSON.parse(localStorage.getItem('objectives') || '[]');
    const allLessons = JSON.parse(localStorage.getItem('lessons') || '[]');
    const originalTest = JSON.parse(localStorage.getItem('tests') || '[]').find(t => t.id == compDiag.testId);

    let newLessons = [];
    if(originalTest && originalTest.questions) {
        originalTest.questions.forEach(q => {
            const ans = compDiag.answers ? compDiag.answers.find(a => a.questionId == q.id) : null;
            if((ans?.score || 0) < (q.passingScore || 1) && q.linkedGoalId) {
                const obj = allObjectives.find(o => o.id == q.linkedGoalId);
                if(obj) {
                    // البحث عن دروس لهذا الهدف
                    const matches = allLessons.filter(l => l.linkedInstructionalGoal === obj.shortTermGoal || (obj.instructionalGoals||[]).includes(l.linkedInstructionalGoal));
                    matches.forEach(m => {
                        if(!newLessons.find(x => x.originalLessonId == m.id)) {
                            newLessons.push({
                                id: Date.now() + Math.floor(Math.random()*10000),
                                studentId: currentStudentId, title: m.title, objective: m.linkedInstructionalGoal,
                                originalLessonId: m.id, status: 'pending', assignedDate: new Date().toISOString()
                            });
                        }
                    });
                }
            }
        });
    }

    if(newLessons.length === 0) { alert('لا توجد دروس مقترحة.'); return; }
    saveAndReindexLessons(newLessons, true);
    alert('تم توليد الدروس.');
}

// دالة التحريك (Re-indexing)
function moveLesson(lessonId, direction) {
    const studentLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    let myLessons = studentLessons.filter(l => l.studentId == currentStudentId);
    let otherLessons = studentLessons.filter(l => l.studentId != currentStudentId);

    myLessons.sort((a, b) => (a.orderIndex||0) - (b.orderIndex||0));
    const idx = myLessons.findIndex(l => l.id == lessonId);
    if (idx === -1) return;

    if (direction === 'up' && idx > 0) [myLessons[idx], myLessons[idx-1]] = [myLessons[idx-1], myLessons[idx]];
    else if (direction === 'down' && idx < myLessons.length - 1) [myLessons[idx], myLessons[idx+1]] = [myLessons[idx+1], myLessons[idx]];

    saveAndReindexLessons(myLessons, false, otherLessons);
}

// دالة التسريع (مسار التفوق)
function accelerateLesson(id) {
    if(!confirm('تسريع هذا الدرس؟ سيتم اعتباره منجزاً وسيفتح الدرس التالي.')) return;
    const studentLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    const target = studentLessons.find(l => l.id == id);
    if(target) {
        target.status = 'accelerated';
        target.completedDate = new Date().toISOString();
        if(!target.historyLog) target.historyLog = [];
        target.historyLog.push({ date: new Date().toISOString(), status: 'accelerated' });
        localStorage.setItem('studentLessons', JSON.stringify(studentLessons));
        loadLessonsTab();
        // تحديث الخطة إذا كانت مفتوحة
        if(document.getElementById('section-iep').classList.contains('active')) loadIEPTab();
    }
}

// دالة إعادة الفتح (المسار الذكي - مسح التاريخ)
function resetLesson(id) {
    if(!confirm('تنبيه: سيتم مسح السجل التاريخي لهذا الدرس بالكامل، وسيتم قفل الدروس اللاحقة.')) return;
    const studentLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    const target = studentLessons.find(l => l.id == id);
    if(target) {
        target.status = 'pending';
        delete target.completedDate;
        delete target.answers;
        target.historyLog = []; // مسح السجل
        localStorage.setItem('studentLessons', JSON.stringify(studentLessons));
        loadLessonsTab();
        if(document.getElementById('section-iep').classList.contains('active')) loadIEPTab();
    }
}

// إضافة درس يدوي (المسار المرن)
function assignLibraryLesson() {
    const lessonId = parseInt(document.getElementById('libraryLessonSelect').value);
    if(!lessonId) return;
    const allLessons = JSON.parse(localStorage.getItem('lessons') || '[]');
    const lesson = allLessons.find(l => l.id == lessonId);
    const studentLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    let myLessons = studentLessons.filter(l => l.studentId == currentStudentId);
    let otherLessons = studentLessons.filter(l => l.studentId != currentStudentId);

    myLessons.push({
        id: Date.now(), studentId: currentStudentId, title: lesson.title,
        objective: lesson.linkedInstructionalGoal || 'إضافي', originalLessonId: lessonId,
        status: 'pending', assignedDate: new Date().toISOString(), isIntervention: true
    });

    saveAndReindexLessons(myLessons, false, otherLessons);
    closeModal('assignLibraryLessonModal');
    loadLessonsTab();
}

function deleteLesson(id) {
    if(!confirm('حذف الدرس؟')) return;
    const studentLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    let myLessons = studentLessons.filter(l => l.studentId == currentStudentId && l.id != id);
    let otherLessons = studentLessons.filter(l => l.studentId != currentStudentId);
    saveAndReindexLessons(myLessons, false, otherLessons);
}

// ---------------------------------------------------------
// 4. جدول التقدم (السجل التاريخي)
// ---------------------------------------------------------
function loadProgressTab() {
    const lessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    let myList = lessons.filter(l => l.studentId == currentStudentId);
    myList.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));

    const tbody = document.getElementById('progressTableBody');
    if(myList.length === 0) { tbody.innerHTML = '<tr><td colspan="4" class="text-center">لا توجد بيانات</td></tr>'; return; }

    tbody.innerHTML = myList.map(l => {
        let statusText = '';
        let rowClass = '';
        if (l.status === 'completed') { statusText = 'مكتمل'; rowClass = 'table-success'; }
        else if (l.status === 'accelerated') { statusText = 'مسرع'; rowClass = 'table-warning'; }
        else { statusText = 'انتظار'; }

        // بناء السجل
        let historyHTML = '';
        if (l.historyLog && l.historyLog.length > 0) {
            historyHTML = l.historyLog.map(h => {
                const d = new Date(h.date).toLocaleDateString('ar-SA');
                let type = h.status;
                if(type === 'started') type = 'بدأ';
                if(type === 'extension') type = 'تمديد';
                if(type === 'absence') type = '<span class="text-danger">غياب</span>';
                if(type === 'accelerated') type = 'تسريع';
                if(type === 'completed') type = 'إنجاز';
                return `<div><small>${d}: ${type}</small></div>`;
            }).join('');
        } else { historyHTML = '<small class="text-muted">-</small>'; }

        const dateStr = l.completedDate ? new Date(l.completedDate).toLocaleDateString('ar-SA') : '-';
        return `
            <tr class="${rowClass}">
                <td>${l.title}<br><small>${l.objective}</small></td>
                <td>${statusText}</td>
                <td>${dateStr}</td>
                <td>${historyHTML}</td>
            </tr>`;
    }).join('');
}

// Helper: حفظ وإعادة الفهرسة
function saveAndReindexLessons(myList, replaceAll, others) {
    myList.forEach((l, i) => l.orderIndex = i);
    let final;
    if(replaceAll) {
        const store = JSON.parse(localStorage.getItem('studentLessons') || '[]');
        final = [...store.filter(l => l.studentId != currentStudentId), ...myList];
    } else {
        final = [...others, ...myList];
    }
    localStorage.setItem('studentLessons', JSON.stringify(final));
    loadLessonsTab();
}

// نوافذ مساعدة
function closeModal(id) { document.getElementById(id).classList.remove('show'); }
function showAssignHomeworkModal() { /* كود الواجبات السابق */ document.getElementById('assignHomeworkModal').classList.add('show'); }
function assignHomework() { /* كود الواجبات السابق */ }
function showAssignLibraryLessonModal() {
    const all = JSON.parse(localStorage.getItem('lessons') || '[]');
    const s = document.getElementById('libraryLessonSelect');
    s.innerHTML = '<option value="">اختر...</option>';
    all.forEach(l => s.innerHTML += `<option value="${l.id}">${l.title}</option>`);
    document.getElementById('assignLibraryLessonModal').classList.add('show');
}
