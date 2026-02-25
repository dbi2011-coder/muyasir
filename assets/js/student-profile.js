// ============================================
// 📁 المسار: assets/js/student-profile.js (نسخة Supabase النهائية)
// الوصف: إدارة الطالب، توليد الخطة التلقائية، إسناد الدروس والواجبات، وتصحيحها
// ============================================

let currentStudentId = null; 
let currentStudent = null; 

document.addEventListener('DOMContentLoaded', function() {
    const params = new URLSearchParams(window.location.search); 
    currentStudentId = parseInt(params.get('id'));
    if (!currentStudentId) { 
        alert('لم يتم تحديد طالب'); 
        setTimeout(() => { window.location.href = 'students.html'; }, 1000); 
        return; 
    }
    loadStudentData();
});

function getCurrentUser() { 
    return JSON.parse(sessionStorage.getItem('currentUser')); 
}

async function loadStudentData() {
    try {
        const { data: student, error } = await window.supabase.from('users').select('*').eq('id', currentStudentId).single();
        if (error || !student) throw new Error('الطالب غير موجود');
        
        currentStudent = student;
        if(document.getElementById('sideName')) document.getElementById('sideName').textContent = currentStudent.name;
        if(document.getElementById('headerStudentName')) document.getElementById('headerStudentName').textContent = currentStudent.name;
        if(document.getElementById('sideGrade')) document.getElementById('sideGrade').textContent = currentStudent.grade + ' - ' + (currentStudent.subject || 'عام');
        if(document.getElementById('sideAvatar')) document.getElementById('sideAvatar').textContent = currentStudent.name.charAt(0);
        document.title = `ملف الطالب: ${currentStudent.name}`;
        
        await calculateAndSetStudentProgress();
        switchSection('diagnostic');
    } catch(e) {
        console.error(e);
        alert('حدث خطأ في جلب بيانات الطالب');
        window.location.href = 'students.html';
    }
}

function switchSection(sectionId) {
    document.querySelectorAll('.sidebar-menu .nav-link').forEach(link => link.classList.remove('active'));
    document.querySelectorAll('.content-section').forEach(section => section.classList.remove('active'));
    const activeLink = document.getElementById(`link-${sectionId}`); if(activeLink) activeLink.classList.add('active');
    const activeSection = document.getElementById(`section-${sectionId}`); if(activeSection) activeSection.classList.add('active');
    
    if (sectionId === 'diagnostic') loadDiagnosticTab();
    if (sectionId === 'iep') loadIEPTab();
    if (sectionId === 'lessons') loadLessonsTab();
    if (sectionId === 'assignments') loadAssignmentsTab();
}

async function calculateAndSetStudentProgress() {
    try {
        const { data: myLessons } = await window.supabase.from('student_lessons').select('status, passedByAlternative').eq('studentId', currentStudentId);
        let progressPct = 0;

        if (myLessons && myLessons.length > 0) {
            const completed = myLessons.filter(l => l.status === 'completed' || l.status === 'accelerated' || l.passedByAlternative).length;
            progressPct = Math.round((completed / myLessons.length) * 100);
        }

        document.querySelectorAll('.progress-percentage, .progress-text, #progressPercentage, #studentProgressText, #sideProgress').forEach(el => el.innerText = progressPct + '%');
        document.querySelectorAll('.progress-bar, .progress-bar-fill, #studentProgressBar, #sideProgressBar').forEach(el => {
            el.style.width = progressPct + '%';
            if (progressPct >= 80) el.style.backgroundColor = '#28a745'; 
            else if (progressPct >= 50) el.style.backgroundColor = '#17a2b8'; 
            else el.style.backgroundColor = '#ffc107'; 
        });

        // تحديث النسبة في جدول المستخدمين
        await window.supabase.from('users').update({ progress: progressPct }).eq('id', currentStudentId);
        return progressPct;
    } catch(e) { console.error(e); return 0; }
}

// ============================================
// 1. الاختبار التشخيصي
// ============================================
async function loadDiagnosticTab() {
    try {
        const { data: studentTests, error: stError } = await window.supabase.from('student_tests').select('*').eq('studentId', currentStudentId).eq('type', 'diagnostic');
        if (studentTests && studentTests.length > 0) {
            let assignedTest = studentTests[0]; 
            document.getElementById('noDiagnosticTest').style.display = 'none'; 
            const detailsDiv = document.getElementById('diagnosticTestDetails'); 
            detailsDiv.style.display = 'block'; 

            const { data: originalTest } = await window.supabase.from('tests').select('*').eq('id', assignedTest.testId).single();
            let finalPercentage = assignedTest.score || 0;
            
            let statusBadge = '', actionContent = '';
            if(assignedTest.status === 'completed') {
                statusBadge = '<span class="badge badge-success">مكتمل</span>';
                actionContent = `<div style="margin-top:15px; padding:15px; background:#f0fff4; border:1px solid #c3e6cb; border-radius:8px;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <strong style="font-size:1.1rem;">الدرجة الحالية: <span style="font-size:1.4rem; color:#28a745; font-weight:900;">${finalPercentage}%</span></strong>
                    </div>
                    <div style="margin-top:15px; display:flex; gap:10px;">
                        <button class="btn btn-warning" onclick="openReviewModal(${assignedTest.id}, 'test')">🔍 مراجعة وتصحيح</button>
                        <button class="btn btn-primary" onclick="autoGenerateLessons()">⚡ توليد الخطة والدروس</button>
                    </div>
                </div>`;
            } else if (assignedTest.status === 'returned') { 
                statusBadge = '<span class="badge badge-warning">معاد للتعديل</span>'; 
                actionContent = `<div class="alert alert-warning mt-2">تم إعادة الاختبار للطالب ليقوم بتعديله.</div>`; 
            } else { 
                statusBadge = '<span class="badge badge-secondary">بانتظار حل الطالب</span>'; 
            }
            
            detailsDiv.innerHTML = `
                <div class="card" style="border:1px solid #eee; box-shadow:0 4px 10px rgba(0,0,0,0.05); padding:20px;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <h3>${originalTest ? originalTest.title : 'اختبار (محذوف)'}</h3>
                        <div style="display:flex; gap:5px; align-items:center;">
                            ${statusBadge}
                            <button class="btn btn-sm btn-outline-danger" onclick="deleteAssignedTest(${assignedTest.id})" title="حذف الاختبار"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                    <p class="text-muted" style="margin-top:5px;"><i class="fas fa-calendar-alt"></i> تاريخ التعيين: ${new Date(assignedTest.assignedDate).toLocaleDateString('ar-SA')}</p>
                    ${actionContent}
                </div>`;
        } else { 
            document.getElementById('noDiagnosticTest').style.display = 'block'; 
            document.getElementById('diagnosticTestDetails').style.display = 'none'; 
        }
    } catch(e) { console.error(e); }
}

async function showAssignTestModal() { 
    const user = getCurrentUser();
    const { data: allTests } = await window.supabase.from('tests').select('*').eq('teacherId', user.id);
    const select = document.getElementById('testSelect'); 
    select.innerHTML = '<option value="">اختر اختباراً...</option>'; 
    (allTests || []).forEach(t => select.innerHTML += `<option value="${t.id}">${t.title}</option>`); 
    document.getElementById('assignTestModal').classList.add('show'); 
}

async function assignTest() { 
    const testId = parseInt(document.getElementById('testSelect').value); 
    if(!testId) return; 
    try {
        const { data: existing } = await window.supabase.from('student_tests').select('id').eq('studentId', currentStudentId).eq('type', 'diagnostic');
        if(existing && existing.length > 0) return alert('يوجد اختبار معين مسبقاً لهذا الطالب.'); 

        await window.supabase.from('student_tests').insert([{ id: Date.now(), studentId: currentStudentId, testId: testId, type: 'diagnostic', status: 'pending' }]);
        closeModal('assignTestModal'); 
        loadDiagnosticTab(); 
        alert('تم تعيين الاختبار بنجاح.');
    } catch(e) { console.error(e); alert('حدث خطأ'); }
}

async function deleteAssignedTest(id) { 
    if(confirm('هل أنت متأكد من حذف هذا الاختبار المعين؟')) { 
        await window.supabase.from('student_tests').delete().eq('id', id);
        loadDiagnosticTab(); 
        alert('تم الحذف بنجاح.'); 
    } 
}

// ============================================
// 2. الخطة التربوية (IEP)
// ============================================
async function loadIEPTab() {
    const iepContainer = document.getElementById('iepContent'); 
    const wordModel = document.querySelector('.iep-word-model'); 
    if (!iepContainer) return;

    try {
        const { data: diagTests } = await window.supabase.from('student_tests').select('*').eq('studentId', currentStudentId).eq('type', 'diagnostic').eq('status', 'completed');
        if (!diagTests || diagTests.length === 0) { 
            if(wordModel) wordModel.style.display = 'none'; 
            iepContainer.innerHTML = `<div class="empty-state"><h3>الخطة غير جاهزة</h3><p>يجب إكمال وتصحيح اختبار تشخيصي أولاً.</p></div>`; 
            return; 
        }

        const completedDiagnostic = diagTests[0];
        if(wordModel) wordModel.style.display = 'block';

        const { data: originalTest } = await window.supabase.from('tests').select('*').eq('id', completedDiagnostic.testId).single();
        const { data: allObjectives } = await window.supabase.from('objectives').select('*').eq('teacherId', getCurrentUser().id);
        const { data: studentLessons } = await window.supabase.from('student_lessons').select('*').eq('studentId', currentStudentId);

        let strengthHTML = '', needsHTML = ''; let needsObjects = [];
        if (originalTest && originalTest.questions) {
            originalTest.questions.forEach(q => {
                const ans = completedDiagnostic.answers ? completedDiagnostic.answers.find(a => a.questionId == q.id) : null;
                const score = ans ? parseFloat(ans.score || 0) : 0; 
                const maxScore = parseFloat(q.maxScore || q.passingScore || 1); 
                const criterion = parseFloat(q.passingCriterion || 80); 
                let percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;

                if (q.linkedGoalId) {
                    const obj = allObjectives.find(o => o.id == q.linkedGoalId);
                    if (obj) {
                        if (percentage >= criterion) { if (!strengthHTML.includes(obj.shortTermGoal)) strengthHTML += `<li>${obj.shortTermGoal}</li>`; } 
                        else { if (!needsObjects.find(o => o.id == obj.id)) { needsObjects.push(obj); needsHTML += `<li>${obj.shortTermGoal}</li>`; } }
                    }
                }
            });
        }
        if(!strengthHTML) strengthHTML = '<li>لا توجد نقاط مسجلة.</li>'; if(!needsHTML) needsHTML = '<li>لا توجد نقاط احتياج مسجلة.</li>';

        const completedLessonsMap = {}, acceleratedLessonsMap = {};
        (studentLessons || []).forEach(l => { 
            if (l.status === 'completed') completedLessonsMap[l.objective] = l.completedDate || 'مكتمل'; 
            if (l.status === 'accelerated') acceleratedLessonsMap[l.objective] = l.completedDate || 'مكتمل بتفوق'; 
        });

        let objectivesRows = ''; let stgCounter = 1;
        needsObjects.forEach(obj => {
            objectivesRows += `<tr style="background-color:#dbeeff !important;"><td class="text-center" style="font-weight:bold; color:#0056b3;">${stgCounter++}</td><td colspan="2" style="font-weight:bold; color:#0056b3;">الهدف: ${obj.shortTermGoal}</td></tr>`;
            if (obj.instructionalGoals) obj.instructionalGoals.forEach(iGoal => {
                const compDate = completedLessonsMap[iGoal], accelDate = acceleratedLessonsMap[iGoal]; 
                let dateDisplay = '', rowStyle = '';
                if (accelDate) { dateDisplay = `<span style="font-weight:bold; color:#856404;">⚡ ${new Date(accelDate).toLocaleDateString('ar-SA')} (تسريع)</span>`; rowStyle = 'background-color:#fff3cd !important;'; }
                else if (compDate) { dateDisplay = `<span class="text-success font-weight-bold">✔ ${new Date(compDate).toLocaleDateString('ar-SA')}</span>`; }
                else { dateDisplay = `<span style="color:#ccc;">--/--/----</span>`; }
                objectivesRows += `<tr style="${rowStyle}"><td class="text-center">-</td><td>${iGoal}</td><td>${dateDisplay}</td></tr>`;
            });
        });

        const subjectName = originalTest ? originalTest.subject : 'عام';
        iepContainer.innerHTML = `
        <div class="iep-printable" style="background:#fff; padding:20px; border:1px solid #ccc;">
            <div style="text-align:center; margin-bottom:20px; border-bottom:2px solid #333;"><h3>الخطة التربوية الفردية</h3></div>
            <table class="table table-bordered mb-4"><tr><td style="background:#f5f5f5; width:15%;">اسم الطالب:</td><td style="width:35%;">${currentStudent.name}</td><td style="background:#f5f5f5; width:15%;">الصف:</td><td>${currentStudent.grade}</td></tr><tr><td style="background:#f5f5f5;">المادة:</td><td>${subjectName}</td><td style="background:#f5f5f5;">التاريخ:</td><td>${new Date().toLocaleDateString('ar-SA')}</td></tr></table>
            <div style="display:flex; gap:20px; margin-bottom:20px;"><div style="flex:1; border:1px solid #ddd; padding:10px;"><h6 style="background:#28a745; color:white; padding:5px; text-align:center;">نقاط القوة</h6><ul>${strengthHTML}</ul></div><div style="flex:1; border:1px solid #ddd; padding:10px;"><h6 style="background:#dc3545; color:white; padding:5px; text-align:center;">نقاط الاحتياج</h6><ul>${needsHTML}</ul></div></div>
            <div class="alert alert-secondary text-center mb-4">الهدف بعيد المدى: أن يتقن التلميذ مهارات مادة <strong>${subjectName}</strong> بنسبة 80%</div>
            <h5>الأهداف التدريسية:</h5>
            <table class="table table-bordered"><thead style="background:#333; color:white;"><tr><th>#</th><th>الهدف</th><th>التحقق</th></tr></thead><tbody>${objectivesRows}</tbody></table>
        </div>`;
    } catch(e) { console.error(e); }
}

// ============================================
// 3. إدارة الدروس وتوليد الخطة التلقائي (Auto Generate)
// ============================================
async function loadLessonsTab() {
    try {
        const { data: myLessons } = await window.supabase.from('student_lessons').select('*').eq('studentId', currentStudentId).order('orderIndex', { ascending: true });
        const container = document.getElementById('studentLessonsGrid');

        if (!myLessons || myLessons.length === 0) { container.innerHTML = `<div class="empty-state"><h3>لا توجد دروس</h3><button class="btn btn-primary" onclick="autoGenerateLessons()">⚡ توليد تلقائي</button></div>`; return; }

        container.innerHTML = myLessons.map((l, index) => {
            const prevCompleted = index === 0 || ['completed', 'accelerated'].includes(myLessons[index-1].status);
            const isLockedForStudent = !prevCompleted;
            let statusBadge = '', cardStyle = '';
            
            if (l.status === 'completed') { 
                statusBadge = l.passedByAlternative ? '<span class="badge badge-info">✅ مجتاز ببديل</span>' : '<span class="badge badge-success">✅ مكتمل</span>'; 
                cardStyle = 'border-right: 5px solid #28a745;'; 
            } 
            else if (l.status === 'accelerated') { statusBadge = '<span class="badge badge-warning">⚡ مسرع</span>'; cardStyle = 'border-right: 5px solid #ffc107; background:#fffbf0;'; } 
            else if (l.status === 'pending_review') { statusBadge = '<span class="badge badge-warning">⏳ بانتظار التصحيح</span>'; cardStyle = 'border-right: 5px solid #fd7e14; background:#fffaf6;'; }
            else if (l.status === 'struggling') { statusBadge = '<span class="badge badge-danger">🙋‍♂️ يطلب المساعدة</span>'; cardStyle = 'border-right: 5px solid #dc3545; background:#fff5f5;'; }
            else if (isLockedForStudent) { statusBadge = '<span class="badge badge-secondary">🔒 مغلق</span>'; cardStyle = 'border-right: 5px solid #6c757d; opacity:0.8;'; } 
            else { statusBadge = '<span class="badge badge-primary">🔓 نشط حالياً</span>'; cardStyle = 'border-right: 5px solid #007bff;'; }

            let controls = '';
            if (l.status === 'completed' || l.status === 'accelerated') {
                controls = `<button class="btn btn-outline-success btn-sm w-100 mb-2" onclick="openReviewModal(${l.id}, 'lesson')">🔍 مراجعة الإجابات</button><button class="btn btn-warning btn-sm" onclick="resetLesson(${l.id})">🔄 إعادة فتح</button>`;
            } else if (l.status === 'pending_review') {
                controls = `<button class="btn btn-warning btn-sm w-100 mb-2" style="color:#000; font-weight:bold;" onclick="openReviewModal(${l.id}, 'lesson')">📝 تصحيح ورصد الدرجة</button><button class="btn btn-danger btn-sm" onclick="resetLesson(${l.id})">إعادة فتح</button>`;
            } else {
                controls = `<button class="btn btn-info btn-sm" style="background:#ffc107; border:none; color:#000;" onclick="accelerateLesson(${l.id})">⚡ تسريع (تفوق)</button>`;
            }

            return `<div class="content-card" style="${cardStyle}"><div style="display:flex; justify-content:space-between;"><div style="margin-right:20px;"><h4 style="margin:0;">${index+1}. ${l.title}</h4><small class="text-muted">${l.objective}</small></div><div>${statusBadge}</div></div><div style="margin-top:10px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap;"><div class="lesson-actions" style="width:100%; display:flex; gap:5px; margin-top:25px;">${controls}<button class="btn btn-danger btn-sm" onclick="deleteLesson(${l.id})">حذف</button></div></div></div>`;
        }).join('');
    } catch(e) { console.error(e); }
}

async function autoGenerateLessons() {
    if(!confirm('توليد الخطة العلاجية تلقائياً؟ سيتم حذف الدروس الحالية وتوليد قائمة جديدة بناءً على التشخيص.')) return;
    try {
        const { data: diagTests } = await window.supabase.from('student_tests').select('*').eq('studentId', currentStudentId).eq('type', 'diagnostic').eq('status', 'completed');
        if (!diagTests || diagTests.length === 0) return alert('يجب إكمال وتصحيح الاختبار التشخيصي أولاً.'); 
        
        const compDiag = diagTests[0];
        const teacherId = getCurrentUser().id;

        const [testsRes, objsRes, lessRes, assignsRes] = await Promise.all([
            window.supabase.from('tests').select('*').eq('id', compDiag.testId).single(),
            window.supabase.from('objectives').select('*').eq('teacherId', teacherId),
            window.supabase.from('lessons').select('*').eq('teacherId', teacherId),
            window.supabase.from('assignments').select('*').eq('teacherId', teacherId)
        ]);

        const originalTest = testsRes.data;
        const allObjectives = objsRes.data || [];
        const allLessons = lessRes.data || [];
        const allLibraryAssignments = assignsRes.data || [];

        let newLessons = []; let newAssignments = []; 

        if(originalTest && originalTest.questions) {
            originalTest.questions.forEach(q => {
                const ans = compDiag.answers ? compDiag.answers.find(a => a.questionId == q.id) : null;
                const score = ans ? parseFloat(ans.score || 0) : 0;
                const maxScore = parseFloat(q.maxScore || q.passingScore || 1);
                const criterion = parseFloat(q.passingCriterion || 80);
                const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
                
                if(percentage < criterion && q.linkedGoalId) {
                    const obj = allObjectives.find(o => o.id == q.linkedGoalId);
                    if(obj) {
                        const targetGoals = [obj.shortTermGoal, ...(obj.instructionalGoals || [])].filter(g => g).map(g => String(g).trim());
                        const matches = allLessons.filter(l => l.linkedInstructionalGoal && targetGoals.includes(String(l.linkedInstructionalGoal).trim()));
                        
                        matches.forEach(m => {
                            if(!newLessons.find(x => x.originalLessonId == m.id)) {
                                newLessons.push({ id: Date.now() + Math.floor(Math.random()*10000), studentId: currentStudentId, title: m.title, objective: m.linkedInstructionalGoal, originalLessonId: m.id, status: 'pending', orderIndex: newLessons.length });
                                const linkedHomework = allLibraryAssignments.find(h => h.linkedInstructionalGoal && String(h.linkedInstructionalGoal).trim() === String(m.linkedInstructionalGoal).trim());
                                if (linkedHomework && !newAssignments.find(a => a.title === linkedHomework.title)) {
                                    newAssignments.push({ id: Date.now() + Math.floor(Math.random()*10000) + 1, studentId: currentStudentId, title: linkedHomework.title, status: 'pending' });
                                } 
                            }
                        });
                    }
                }
            });
        }
        
        if(newLessons.length === 0) return alert('الطالب متفوق! تجاوز محك الاجتياز في جميع المهارات، لا توجد نقاط ضعف تتطلب خطة.'); 

        // حذف القديم والإضافة من جديد
        await window.supabase.from('student_lessons').delete().eq('studentId', currentStudentId);
        await window.supabase.from('student_lessons').insert(newLessons);

        if (newAssignments.length > 0) {
            await window.supabase.from('student_assignments').delete().eq('studentId', currentStudentId);
            await window.supabase.from('student_assignments').insert(newAssignments);
        }

        alert(`تم إسناد ${newLessons.length} درس و ${newAssignments.length} واجب مرتبط للطالب.`);
        loadLessonsTab(); loadAssignmentsTab(); calculateAndSetStudentProgress();
    } catch(e) { console.error(e); alert('خطأ أثناء التوليد التلقائي'); }
}

async function accelerateLesson(id) {
    if(!confirm('تسريع هذا الدرس؟ سيتم اعتباره منجزاً للتميز.')) return;
    try {
        await window.supabase.from('student_lessons').update({ status: 'accelerated', completedDate: new Date().toISOString() }).eq('id', id);
        loadLessonsTab(); calculateAndSetStudentProgress();
    } catch(e) { console.error(e); }
}

async function resetLesson(id) {
    if(!confirm('إعادة فتح الدرس؟ سيتم مسح السجل التاريخي وإعادته للحالة المعلقة.')) return;
    try {
        await window.supabase.from('student_lessons').update({ status: 'pending', completedDate: null, answers: null, passedByAlternative: false }).eq('id', id);
        loadLessonsTab(); calculateAndSetStudentProgress();
    } catch(e) { console.error(e); }
}

async function deleteLesson(id) {
    if(!confirm('هل أنت متأكد من حذف هذا الدرس؟')) return;
    try {
        await window.supabase.from('student_lessons').delete().eq('id', id);
        loadLessonsTab(); calculateAndSetStudentProgress();
    } catch(e) { console.error(e); }
}

// ============================================
// 4. الواجبات
// ============================================
async function loadAssignmentsTab() {
    try {
        const { data: list } = await window.supabase.from('student_assignments').select('*').eq('studentId', currentStudentId).order('id', { ascending: false });
        const container = document.getElementById('studentAssignmentsGrid');

        if (!list || list.length === 0) { container.innerHTML = `<div class="empty-state"><h3>لا توجد واجبات حالياً</h3><button class="btn btn-primary" onclick="showAssignHomeworkModal()"><i class="fas fa-plus-circle"></i> إسناد واجب</button></div>`; return; }
        
        container.innerHTML = list.map(a => `<div class="content-card"><div style="display:flex; justify-content:space-between;"><h4 style="margin:0;">${a.title}</h4><span class="badge ${a.status === 'completed' ? 'badge-success' : 'badge-primary'}">${a.status === 'completed' ? 'مكتمل' : 'جديد'}</span></div><div class="content-meta" style="margin-top:10px;"><span>📅 التسليم: ${a.dueDate || 'مفتوح'}</span><span>تاريخ الإسناد: ${new Date(a.assignedDate).toLocaleDateString('ar-SA')}</span></div><div style="margin-top:15px; border-top:1px solid #eee; padding-top:10px;">${a.status === 'completed' ? `<button class="btn btn-sm btn-outline-success" onclick="openReviewModal(${a.id}, 'assignment')">🔍 مراجعة الحل</button>` : '<span class="text-muted text-sm">بانتظار الحل...</span>'}<button class="btn btn-sm btn-outline-danger" style="float:left;" onclick="deleteAssignment(${a.id})">حذف</button></div></div>`).join('');
    } catch(e) { console.error(e); }
}

async function showAssignHomeworkModal() { 
    const select = document.getElementById('homeworkSelect');
    const { data: allAssignments } = await window.supabase.from('assignments').select('*').eq('teacherId', getCurrentUser().id);
    select.innerHTML = '<option value="">اختر من قائمة الواجبات...</option>';
    if (allAssignments && allAssignments.length > 0) { allAssignments.forEach(a => select.innerHTML += `<option value="${a.title}">${a.title}</option>`); } 
    document.getElementById('homeworkDueDate').valueAsDate = new Date();
    document.getElementById('assignHomeworkModal').classList.add('show'); 
}

async function assignHomework() { 
    const select = document.getElementById('homeworkSelect'); 
    if(!select || !select.value) return alert('الرجاء اختيار واجب'); 
    try {
        await window.supabase.from('student_assignments').insert([{ id: Date.now(), studentId: currentStudentId, title: select.value, status: 'pending', dueDate: document.getElementById('homeworkDueDate').value }]);
        closeModal('assignHomeworkModal'); 
        loadAssignmentsTab(); 
        alert('تم إسناد الواجب بنجاح'); 
    } catch(e) { console.error(e); }
}

async function deleteAssignment(id) { 
    if(confirm('هل أنت متأكد من حذف هذا الواجب؟')) {
        await window.supabase.from('student_assignments').delete().eq('id', id);
        loadAssignmentsTab(); 
        alert('تم الحذف بنجاح');
    }
}

// ============================================
// 5. المراجعة والتصحيح (Review Modal)
// ============================================
async function openReviewModal(targetId, type = 'assignment') {
    document.getElementById('reviewAssignmentId').value = targetId;
    document.getElementById('reviewAssignmentId').setAttribute('data-type', type);
    const container = document.getElementById('reviewQuestionsContainer'); container.innerHTML = 'جاري التحميل...';
    
    let questions = [], studentAnswers = [], attachedSolution = null;

    try {
        if (type === 'lesson') {
            const { data: targetLesson } = await window.supabase.from('student_lessons').select('*').eq('id', targetId).single();
            const { data: originalLesson } = await window.supabase.from('lessons').select('*').eq('id', targetLesson.originalLessonId).single();
            if (originalLesson) questions = [...(originalLesson.exercises?.questions || []), ...(originalLesson.assessment?.questions || [])];
            studentAnswers = targetLesson.answers || [];
            document.querySelector('#reviewTestModal h3').innerHTML = '🔍 مراجعة الدرس: ' + targetLesson.title;
        } else if (type === 'assignment') {
            const { data: assignment } = await window.supabase.from('student_assignments').select('*').eq('id', targetId).single();
            const { data: originalAssignment } = await window.supabase.from('assignments').select('*').eq('title', assignment.title).single();
            questions = assignment.questions || (originalAssignment ? originalAssignment.questions : []);
            studentAnswers = assignment.answers || []; attachedSolution = assignment.attachedSolution;
            document.querySelector('#reviewTestModal h3').innerHTML = '🔍 مراجعة الواجب: ' + assignment.title;
        } else if (type === 'test') {
            const { data: test } = await window.supabase.from('student_tests').select('*').eq('id', targetId).single();
            const { data: originalTest } = await window.supabase.from('tests').select('*').eq('id', test.testId).single();
            questions = originalTest ? originalTest.questions : [];
            studentAnswers = test.answers || [];
            document.querySelector('#reviewTestModal h3').innerHTML = '🔍 مراجعة الاختبار: ' + (originalTest ? originalTest.title : '');
        }

        container.innerHTML = '';
        if (attachedSolution) container.innerHTML += `<div class="alert alert-info"><strong>📎 حل ورقي مرفق:</strong><br><a href="${attachedSolution}" download="solution" class="btn btn-primary btn-sm mt-2">تحميل ملف الحل</a></div>`;

        if (questions && questions.length > 0) {
            questions.forEach((q, index) => {
                const studentAnsObj = studentAnswers.find(a => a.questionId == q.id);
                container.innerHTML += buildTeacherReviewItem(q, index, studentAnsObj); // دالة بناء الـ HTML القديمة
            });
        } else { container.innerHTML += '<div class="text-center p-3 text-muted">لا توجد أسئلة مسجلة لعرضها.</div>'; }
        
        document.getElementById('reviewTestModal').classList.add('show');
    } catch(e) { console.error(e); alert('خطأ في جلب بيانات المراجعة'); }
}

async function saveTestReview() {
    const id = parseInt(document.getElementById('reviewAssignmentId').value);
    const type = document.getElementById('reviewAssignmentId').getAttribute('data-type');
    let tableName = type === 'test' ? 'student_tests' : (type === 'lesson' ? 'student_lessons' : 'student_assignments');

    try {
        const { data: record } = await window.supabase.from(tableName).select('*').eq('id', id).single();
        if (!record) return alert('السجل غير موجود');

        const container = document.getElementById('reviewQuestionsContainer');
        let totalScore = 0, maxTotalScore = 0, questions = [];
        
        if (type === 'assignment') {
            const { data: orig } = await window.supabase.from('assignments').select('*').eq('title', record.title).single();
            questions = record.questions || (orig ? orig.questions : []);
        } else if (type === 'test') {
            const { data: orig } = await window.supabase.from('tests').select('*').eq('id', record.testId).single();
            if(orig) questions = orig.questions;
        } else if (type === 'lesson') {
            const { data: orig } = await window.supabase.from('lessons').select('*').eq('id', record.originalLessonId).single();
            if(orig) questions = [...(orig.exercises?.questions || []), ...(orig.assessment?.questions || [])];
        }

        let updatedAnswers = record.answers || [];

        if(questions && questions.length > 0) {
            questions.forEach(q => {
                const scoreInp = container.querySelector(`input[name="score_${q.id}"]`);
                const noteInp = container.querySelector(`textarea[name="note_${q.id}"]`);
                let ansIdx = updatedAnswers.findIndex(a => a.questionId == q.id);
                let newScore = scoreInp && scoreInp.value !== '' ? parseFloat(scoreInp.value) : 0;
                
                if(ansIdx === -1) { updatedAnswers.push({ questionId: q.id, answer: null }); ansIdx = updatedAnswers.length - 1; }
                
                updatedAnswers[ansIdx].score = newScore;
                updatedAnswers[ansIdx].teacherNote = noteInp ? noteInp.value : '';
                
                if (!updatedAnswers[ansIdx].evaluations) updatedAnswers[ansIdx].evaluations = {};
                const evalInputs = container.querySelectorAll(`input[type="hidden"][name^="eval_${q.id}_"]`);
                evalInputs.forEach(inp => { let pKey = inp.name.replace(`eval_${q.id}_`, ''); updatedAnswers[ansIdx].evaluations[pKey] = inp.value; });

                totalScore += newScore; 
                let maxQScore = parseFloat(q.maxScore || q.passingScore || 1);
                maxTotalScore += maxQScore;
            });
            record.score = maxTotalScore > 0 ? Math.round((totalScore / maxTotalScore) * 100) : 0;
        }
        
        let updateData = { answers: updatedAnswers, score: record.score };

        if (type === 'lesson') {
            const { data: orig } = await window.supabase.from('lessons').select('exercises').eq('id', record.originalLessonId).single();
            const passScore = orig?.exercises?.passScore ? parseFloat(orig.exercises.passScore) : 80;
            
            if (record.score >= passScore) {
                updateData.status = 'completed';
                updateData.completedDate = new Date().toISOString();
                alert('تم حفظ التصحيح. الطالب اجتاز المحك واكتمل الدرس بنجاح!');
            } else {
                updateData.status = 'returned'; 
                alert(`تم حفظ التقييم. نتيجة الطالب (${record.score}%) لم تحقق المحك (${passScore}%). أُعيد الدرس للطالب.`);
            }
        } else {
            updateData.status = 'completed';
            alert('تم حفظ التصحيح واعتماد الدرجة بنجاح.');
        }

        await window.supabase.from(tableName).update(updateData).eq('id', id);
        closeModal('reviewTestModal');
        
        if (type === 'assignment') loadAssignmentsTab(); 
        else if (type === 'test') loadDiagnosticTab(); 
        else if (type === 'lesson') { loadLessonsTab(); calculateAndSetStudentProgress(); }
    } catch(e) { console.error(e); alert('حدث خطأ أثناء الحفظ'); }
}

async function returnTestForResubmission() {
    const id = parseInt(document.getElementById('reviewAssignmentId').value);
    const type = document.getElementById('reviewAssignmentId').getAttribute('data-type');
    
    if(confirm('إعادة الاختبار/الدرس للطالب لتعديل الإجابات؟')) {
        let tableName = type === 'test' ? 'student_tests' : (type === 'lesson' ? 'student_lessons' : 'student_assignments');
        await window.supabase.from(tableName).update({ status: 'returned' }).eq('id', id);
        
        closeModal('reviewTestModal');
        if (type === 'assignment') loadAssignmentsTab();
        else if (type === 'test') loadDiagnosticTab();
        else if (type === 'lesson') loadLessonsTab();
        alert('تمت الإعادة للطالب بنجاح');
    }
}

function closeModal(id) { document.getElementById(id).classList.remove('show'); }
function regenerateLessons() { autoGenerateLessons(); }

// ----------------------------------------------------------------------------------
// دوال رسم واجهة المراجعة (DOM Builders) - محتفظ بها كما هي لجماليات التصميم الخاصة بك
// ----------------------------------------------------------------------------------
function buildTeacherReviewItem(q, index, studentAnsObj) {
    let rawAnswer = studentAnsObj ? (studentAnsObj.answer || studentAnsObj.value) : null;
    let evaluations = (studentAnsObj && studentAnsObj.evaluations) ? studentAnsObj.evaluations : {};
    let maxScore = parseFloat(q.maxScore || q.passingScore || 1);
    let currentScore = studentAnsObj ? studentAnsObj.score : 0;
    let teacherNote = studentAnsObj ? (studentAnsObj.teacherNote || '') : '';
    let html = '';

    if (q.type.includes('mcq')) {
        let sAns = (rawAnswer !== null && rawAnswer !== undefined && rawAnswer !== '') ? parseInt(rawAnswer) : -1;
        let cAns = (q.correctAnswer !== undefined && q.correctAnswer !== null && q.correctAnswer !== '') ? parseInt(q.correctAnswer) : -1;
        html += `<div style="display:flex; flex-direction:column; gap:8px;">`;
        (q.choices || []).forEach((choice, i) => {
            let isStudent = (sAns === i); let isCorrect = (cAns === i);
            let bg = isCorrect ? '#d4edda' : (isStudent ? '#f8d7da' : '#f8f9fa'); let border = isCorrect ? '#c3e6cb' : (isStudent ? '#f5c6cb' : '#eee'); let icon = isCorrect ? '✅' : (isStudent ? '❌' : '');
            html += `<div style="padding:10px; border:2px solid ${border}; border-radius:8px; background:${bg}; display:flex; justify-content:space-between; align-items:center; font-weight:bold;"><span>${icon} ${choice}</span>${isStudent && !isCorrect ? '<span class="badge badge-danger">إجابة الطالب</span>' : ''}${isStudent && isCorrect ? '<span class="badge badge-success">إجابة الطالب</span>' : ''}</div>`;
        });
        html += `</div>`;
    } else if (q.type === 'drag-drop') {
        html += renderDragDropReview(q, rawAnswer);
    } else if (q.paragraphs && q.paragraphs.length > 0) {
        if (q.type === 'manual-reading') {
            html += `<div style="display:flex; flex-direction:column; gap:15px;">`;
            q.paragraphs.forEach((p, pIdx) => {
                let pKey = `p_${pIdx}`; let words = (p.text || '').trim().split(/\s+/);
                let wordsHtml = words.map((w, wIdx) => {
                    let wKey = `${pKey}_w_${wIdx}`; let wEval = evaluations[wKey] || '';
                    let wClass = wEval === 'correct' ? 'word-correct' : (wEval === 'wrong' ? 'word-wrong' : 'word-neutral'); let icon = wEval === 'correct' ? ' ✔️' : (wEval === 'wrong' ? ' ❌' : '');
                    return `<span class="reading-word-eval ${wClass}" onclick="toggleReadingWord(this, '${q.id}', '${wKey}')" data-state="${wEval}">${w}${icon}<input type="hidden" name="eval_${q.id}_${wKey}" value="${wEval}"></span>`;
                }).join(' ');
                html += `<div style="border:1px solid #e2e8f0; padding:15px; border-radius:8px; background:#fff;"><div style="font-weight:bold; margin-bottom:10px; color:#007bff;"><i class="fas fa-hand-pointer"></i> اضغط على الكلمة لتصحيحها:</div><div style="background:#f8f9fa; padding:15px; border-radius:5px; line-height:2.8; text-align:justify;">${wordsHtml}</div></div>`;
            });
            html += `</div>`;
        } else {
            html += `<div style="display:flex; flex-direction:column; gap:15px;">`;
            q.paragraphs.forEach((p, pIdx) => {
                let pKey = `p_${pIdx}`; let pAns = (rawAnswer && typeof rawAnswer === 'object') ? rawAnswer[pKey] : null; let evalState = evaluations[pKey] || ''; 
                let displayAns = pAns ? (pAns.startsWith('data:image') ? `<img src="${pAns}" style="max-height:100px;">` : pAns) : '<span class="text-muted">لم يُجب</span>';
                let btnCorrect = `<button type="button" class="btn btn-sm ${evalState === 'correct' ? 'btn-success' : 'btn-outline-success'}" onclick="setEvalState(this, '${q.id}', '${pKey}', 'correct')">✔️ صحيح</button>`;
                let btnWrong = `<button type="button" class="btn btn-sm ${evalState === 'wrong' ? 'btn-danger' : 'btn-outline-danger'}" onclick="setEvalState(this, '${q.id}', '${pKey}', 'wrong')">❌ خاطئ</button>`;
                html += `<div style="border:1px solid #e2e8f0; padding:15px; border-radius:8px; background:#fff; text-align:center;">${displayAns}<br><div class="mt-2">${btnCorrect} ${btnWrong}</div><input type="hidden" name="eval_${q.id}_${pKey}" value="${evalState}"></div>`;
            });
            html += `</div>`;
        }
    } else {
        html += `<div style="background:#f8f9fa; padding:15px; border-radius:8px; border:1px solid #eee;">${rawAnswer || 'لم يُجب'}</div>`;
    }
    
    return `<div class="review-question-item" id="q-review-item-${q.id}"><div class="review-q-header" style="background:#e3f2fd; border-bottom:2px solid #90caf9;"><div style="flex:1; font-size:1.1rem; color:#1565c0;"><strong>س${index+1}: ${q.text}</strong></div><div class="score-input-container"><input type="number" step="0.5" class="score-input" name="score_${q.id}" value="${currentScore}" max="${maxScore}" min="0"><span class="text-muted"> / ${maxScore} درجة</span></div></div><div class="student-answer-box">${html}</div><div class="teacher-feedback-box mt-3"><label>ملاحظات المعلم (تظهر للطالب):</label><textarea class="form-control" name="note_${q.id}">${teacherNote}</textarea></div></div>`;
}

function renderDragDropReview(q, rawAnswer) {
    if (!q.paragraphs || q.paragraphs.length === 0) return '<span class="text-muted">لا توجد جمل لعرضها</span>';
    let sentencesHtml = '<div style="display:flex; flex-direction:column; gap:15px; margin-top:10px;">';
    q.paragraphs.forEach((p, pIdx) => {
        let processedText = p.text;
        if (p.gaps) {
            p.gaps.forEach((g, gIdx) => {
                let studentWord = (rawAnswer && typeof rawAnswer === 'object' && rawAnswer[`p_${pIdx}_g_${gIdx}`]) ? rawAnswer[`p_${pIdx}_g_${gIdx}`] : '';
                let isCorrect = studentWord.trim() === g.dragItem.trim();
                let color = isCorrect ? '#155724' : '#721c24'; let bg = isCorrect ? '#d4edda' : '#f8d7da'; let border = isCorrect ? '#c3e6cb' : '#f5c6cb';
                let displayWord = studentWord ? studentWord : '<span style="color:#999; font-size:0.95rem;">(لم يُجب)</span>';
                let wordBadge = `<span style="background:${bg}; color:${color}; padding:2px 15px; border-radius:8px; border-bottom:3px solid ${border}; font-weight:bold; margin:0 5px;">${displayWord}</span>`;
                processedText = processedText.replace(g.dragItem, wordBadge);
            });
        }
        sentencesHtml += `<div style="background:#fff; padding:15px; border:1px solid #e2e8f0; border-radius:10px; font-size:1.2rem; line-height:2.6;">${processedText}</div>`;
    });
    return sentencesHtml + '</div>';
}

window.toggleReadingWord = function(span, qId, wKey) {
    let currentState = span.getAttribute('data-state');
    let hiddenInput = span.querySelector('input');
    let newState = currentState === '' ? 'correct' : (currentState === 'correct' ? 'wrong' : ''); 
    let newClass = newState === 'correct' ? 'word-correct' : (newState === 'wrong' ? 'word-wrong' : 'word-neutral');
    let textOnly = span.innerText.replace(/✔️|❌/g, '').trim();
    span.setAttribute('data-state', newState); hiddenInput.value = newState;
    span.className = `reading-word-eval ${newClass}`;
    span.innerHTML = `${textOnly}${newState === 'correct' ? ' ✔️' : (newState === 'wrong' ? ' ❌' : '')}<input type="hidden" name="eval_${qId}_${wKey}" value="${newState}">`;
}

window.setEvalState = function(btn, qId, pKey, state) {
    const container = btn.closest('.mt-2');
    const hiddenInput = container.parentElement.querySelector(`input[name="eval_${qId}_${pKey}"]`);
    const btns = container.querySelectorAll('button');
    btns[0].className = 'btn btn-sm btn-outline-success'; btns[1].className = 'btn btn-sm btn-outline-danger';
    if (hiddenInput.value === state) { hiddenInput.value = ''; } 
    else { hiddenInput.value = state; if (state === 'correct') btns[0].className = 'btn btn-sm btn-success'; else btns[1].className = 'btn btn-sm btn-danger'; }
}

// Global scope
window.showAssignTestModal = showAssignTestModal; window.assignTest = assignTest; window.deleteAssignedTest = deleteAssignedTest;
window.autoGenerateLessons = autoGenerateLessons; window.accelerateLesson = accelerateLesson; window.resetLesson = resetLesson; window.deleteLesson = deleteLesson; window.regenerateLessons = regenerateLessons;
window.showAssignHomeworkModal = showAssignHomeworkModal; window.assignHomework = assignHomework; window.deleteAssignment = deleteAssignment;
window.openReviewModal = openReviewModal; window.saveTestReview = saveTestReview; window.returnTestForResubmission = returnTestForResubmission;
