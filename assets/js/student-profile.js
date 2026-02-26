// ============================================
// 📁 المسار: assets/js/student-profile.js (نسخة Supabase النهائية مع التصميم المرفق)
// ============================================

let currentStudentId = null; 
let currentStudent = null; 
let editingEventId = null;

// =========================================================
// 🔥 دوال النوافذ المنبثقة والإشعارات 🔥
// =========================================================
if (!window.showConfirmModal) { window.showConfirmModal = function(message, onConfirm) { let modal = document.getElementById('globalConfirmModal'); if (!modal) { const modalHtml = `<div id="globalConfirmModal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); z-index:999999; justify-content:center; align-items:center; backdrop-filter:blur(4px);"><div style="background:white; padding:25px; border-radius:15px; width:90%; max-width:350px; text-align:center; box-shadow:0 10px 30px rgba(0,0,0,0.2); animation:popIn 0.3s ease;"><div style="font-size:3.5rem; color:#dc3545; margin-bottom:15px;"><i class="fas fa-exclamation-circle"></i></div><div style="font-size:1.3rem; font-weight:bold; margin-bottom:10px; color:#333;">تأكيد الإجراء</div><div id="globalConfirmMessage" style="color:#666; margin-bottom:25px; font-size:0.95rem; line-height:1.6;"></div><div style="display:flex; gap:15px; justify-content:center;"><button id="globalConfirmCancel" style="background:#e2e8f0; color:#333; border:none; padding:12px 20px; border-radius:8px; cursor:pointer; font-weight:bold; flex:1; transition:0.2s; font-family:'Tajawal';">إلغاء</button><button id="globalConfirmOk" style="background:#dc3545; color:white; border:none; padding:12px 20px; border-radius:8px; cursor:pointer; font-weight:bold; flex:1; transition:0.2s; font-family:'Tajawal';">نعم، متأكد</button></div></div></div>`; document.body.insertAdjacentHTML('beforeend', modalHtml); modal = document.getElementById('globalConfirmModal'); } document.getElementById('globalConfirmMessage').innerHTML = message; modal.style.display = 'flex'; document.getElementById('globalConfirmOk').onclick = function() { modal.style.display = 'none'; if (typeof onConfirm === 'function') onConfirm(); }; document.getElementById('globalConfirmCancel').onclick = function() { modal.style.display = 'none'; }; }; }
if (!window.showSuccess) { window.showSuccess = function(message) { let toast = document.getElementById('globalSuccessToast'); if (!toast) { const toastHtml = `<div id="globalSuccessToast" style="display:none; position:fixed; bottom:30px; left:50%; transform:translateX(-50%); background:#10b981; color:white; padding:12px 25px; border-radius:8px; box-shadow:0 5px 15px rgba(0,0,0,0.2); z-index:999999; font-weight:bold; font-family:'Tajawal'; align-items:center; gap:10px;"><i class="fas fa-check-circle"></i> <span id="globalSuccessMessage"></span></div>`; document.body.insertAdjacentHTML('beforeend', toastHtml); toast = document.getElementById('globalSuccessToast'); } document.getElementById('globalSuccessMessage').textContent = message; toast.style.display = 'flex'; setTimeout(() => { toast.style.display = 'none'; }, 3000); }; }
if (!window.showError) { window.showError = function(message) { let toast = document.getElementById('globalErrorToast'); if (!toast) { const toastHtml = `<div id="globalErrorToast" style="display:none; position:fixed; bottom:30px; left:50%; transform:translateX(-50%); background:#dc3545; color:white; padding:12px 25px; border-radius:8px; box-shadow:0 5px 15px rgba(0,0,0,0.2); z-index:999999; font-weight:bold; font-family:'Tajawal'; align-items:center; gap:10px;"><i class="fas fa-exclamation-triangle"></i> <span id="globalErrorMessage"></span></div>`; document.body.insertAdjacentHTML('beforeend', toastHtml); toast = document.getElementById('globalErrorToast'); } document.getElementById('globalErrorMessage').innerHTML = message; toast.style.display = 'flex'; setTimeout(() => { toast.style.display = 'none'; }, 4000); }; }
if (!window.showInfoModal) { window.showInfoModal = function(title, message, onClose) { let modal = document.getElementById('globalInfoModal'); if (!modal) { const modalHtml = `<div id="globalInfoModal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); z-index:999999; justify-content:center; align-items:center; backdrop-filter:blur(4px);"><div style="background:white; padding:25px; border-radius:15px; width:90%; max-width:350px; text-align:center; box-shadow:0 10px 30px rgba(0,0,0,0.2); animation:popIn 0.3s ease;"><div style="font-size:3.5rem; color:#007bff; margin-bottom:15px;"><i class="fas fa-info-circle"></i></div><div id="globalInfoTitle" style="font-size:1.3rem; font-weight:bold; margin-bottom:10px; color:#333;"></div><div id="globalInfoMessage" style="color:#666; margin-bottom:25px; font-size:0.95rem; line-height:1.6;"></div><div style="display:flex; justify-content:center;"><button id="globalInfoOk" style="background:#007bff; color:white; border:none; padding:12px 30px; border-radius:8px; cursor:pointer; font-weight:bold; transition:0.2s; font-family:'Tajawal'; width:100%;">حسناً، فهمت</button></div></div></div>`; document.body.insertAdjacentHTML('beforeend', modalHtml); modal = document.getElementById('globalInfoModal'); } document.getElementById('globalInfoTitle').innerHTML = title; document.getElementById('globalInfoMessage').innerHTML = message; modal.style.display = 'flex'; document.getElementById('globalInfoOk').onclick = function() { modal.style.display = 'none'; if (typeof onClose === 'function') onClose(); }; }; }

// =========================================================
// حقن التنسيقات والنوافذ
// =========================================================
function injectReviewStyles() {
    if (document.getElementById('customReviewStyles')) return;
    const style = document.createElement('style'); style.id = 'customReviewStyles';
    style.innerHTML = `.student-answer-box { padding: 15px; background: #f8f9fa; border-radius: 8px; margin-bottom: 10px; border-right: 4px solid #007bff; white-space: pre-wrap; word-break: break-word; font-size: 1.05rem; line-height: 1.6; overflow-x: hidden; } .review-question-item { border: 1px solid #e2e8f0; padding: 20px; margin-bottom: 20px; border-radius: 12px; background: #fff; box-shadow: 0 2px 10px rgba(0,0,0,0.02); } .review-q-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px; background: #f1f5f9; padding: 12px 15px; border-radius: 8px; } .score-input-container { display: flex; align-items: center; gap: 5px; background: #fff; padding: 5px 10px; border-radius: 6px; border: 1px solid #cbd5e1; } .score-input { width: 70px; text-align: center; font-weight: bold; border: 1px solid #ccc; border-radius: 4px; padding: 4px; font-size:1.1rem; color:#007bff; } .teacher-feedback-box textarea { width: 100%; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; min-height: 80px; margin-top: 10px; font-family: inherit; } .reading-word-eval { display:inline-block; font-size:1.2rem; margin:5px; cursor:pointer; padding:8px 15px; border-radius:8px; transition:0.2s; border:2px solid transparent; user-select:none; } .reading-word-eval:hover { transform:scale(1.05); } .word-neutral { background:#f1f5f9; color:#475569; border-color:#cbd5e1; } .word-correct { background:#d4edda; color:#155724; border-color:#c3e6cb; } .word-wrong { background:#f8d7da; color:#721c24; border-color:#f5c6cb; }`;
    document.head.appendChild(style);
}

function injectWordTableStyles() {
    if (document.getElementById('wordTableStyles')) return;
    const style = document.createElement('style'); style.id = 'wordTableStyles';
    style.innerHTML = `.word-table { width: 100%; border-collapse: collapse; font-family: 'Times New Roman', 'Tajawal', serif; font-size: 1rem; background: white; border: 2px solid #000; } .word-table th, .word-table td { border: 1px solid #000; padding: 8px 12px; vertical-align: middle; } .word-table th { background-color: #f2f2f2; font-weight: bold; text-align: center; border-bottom: 2px solid #000; } .word-table tr:nth-child(even) { background-color: #fafafa; } .bg-success-light { background-color: #e8f5e9 !important; } .bg-danger-light { background-color: #ffebee !important; } .bg-warning-light { background-color: #fff3e0 !important; } .bg-info-light { background-color: #e3f2fd !important; } .btn-icon { background: none; border: none; cursor: pointer; font-size: 1.1rem; padding: 0 5px; transition: transform 0.2s; } .btn-icon:hover { transform: scale(1.2); } .badge { padding: 5px 10px; border-radius: 12px; color: white; font-size: 0.8rem; } .badge-success { background-color: #28a745; } .badge-danger { background-color: #dc3545; } @media print { .no-print { display: none !important; } }`;
    document.head.appendChild(style);
}

function injectAdminEventModal() { 
    if (document.getElementById('adminEventModal')) return; 
    // تم إصلاح وضع الـ ID الخاص بالعنوان (modalTitle) هنا
    const html = `<div id="adminEventModal" class="modal"><div class="modal-content"><div class="modal-header"><h3 id="modalTitle">تسجيل حدث إداري</h3><button class="modal-close" onclick="closeAdminEventModal()">×</button></div><div class="modal-body"><input type="hidden" id="editingEventId"><div class="form-group"><label>نوع الحالة:</label><select id="manualEventType" class="form-control"><option value="excused">معفى (يخصم من الرصيد)</option><option value="vacation">إجازة (توقف مؤقت)</option></select></div><div class="form-group"><label>التاريخ:</label><input type="date" id="manualEventDate" class="form-control"></div><div class="form-group"><label>ملاحظات:</label><textarea id="manualEventNote" class="form-control"></textarea></div></div><div class="modal-footer"><button class="btn btn-secondary" onclick="closeAdminEventModal()">إلغاء</button><button class="btn btn-primary" onclick="saveAdminEvent()">حفظ السجل</button></div></div></div>`; 
    document.body.insertAdjacentHTML('beforeend', html); 
}

function injectHomeworkModal() { 
    if (document.getElementById('assignHomeworkModal')) return; 
    const html = `<div id="assignHomeworkModal" class="modal"><div class="modal-content"><div class="modal-header"><h3>إسناد واجب جديد</h3><button class="modal-close" onclick="closeModal('assignHomeworkModal')">×</button></div><div class="modal-body"><div class="form-group"><label>اختر الواجب من المكتبة:</label><select id="homeworkSelect" class="form-control"><option value="">جارِ التحميل...</option></select></div><div class="form-group"><label>تاريخ التسليم:</label><input type="date" id="homeworkDueDate" class="form-control"></div></div><div class="modal-footer"><button class="btn btn-secondary" onclick="closeModal('assignHomeworkModal')">إلغاء</button><button class="btn btn-primary" onclick="assignHomework()">حفظ الإسناد</button></div></div></div>`; 
    document.body.insertAdjacentHTML('beforeend', html); 
}

// =========================================================
// التحميل الأساسي
// =========================================================
document.addEventListener('DOMContentLoaded', function() {
    injectAdminEventModal(); 
    injectHomeworkModal(); 
    injectWordTableStyles(); 
    injectReviewStyles(); 
    
    const params = new URLSearchParams(window.location.search); 
    currentStudentId = parseInt(params.get('id'));
    if (!currentStudentId) { 
        showError('لم يتم تحديد طالب'); 
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
        showError('حدث خطأ في جلب بيانات الطالب');
        setTimeout(() => { window.location.href = 'students.html'; }, 1500);
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
    if (sectionId === 'progress') loadProgressTab();
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

        await window.supabase.from('users').update({ progress: progressPct }).eq('id', currentStudentId);
        return progressPct;
    } catch(e) { console.error(e); return 0; }
}

function calculateAutoGrade(q, studentAnsObj) {
    let maxScore = parseFloat(q.maxScore || q.passingScore || q.points || q.score || 1);
    if(isNaN(maxScore) || maxScore <= 0) maxScore = 1;
    let rawAnswer = studentAnsObj ? (studentAnsObj.answer || studentAnsObj.value) : null;
    if (rawAnswer === null || rawAnswer === undefined || rawAnswer === '') return 0;
    if (q.type.includes('mcq')) { let sAns = parseInt(rawAnswer); let cAns = parseInt(q.correctAnswer); if (!isNaN(sAns) && !isNaN(cAns) && sAns === cAns) return maxScore; return 0; } 
    if (q.type === 'drag-drop') { let totalGaps = 0; let correctGaps = 0; (q.paragraphs || []).forEach((p, pIdx) => { (p.gaps || []).forEach((g, gIdx) => { totalGaps++; let w = (rawAnswer && typeof rawAnswer === 'object' && rawAnswer[`p_${pIdx}_g_${gIdx}`]) ? rawAnswer[`p_${pIdx}_g_${gIdx}`] : ''; if (String(w).trim() === String(g.dragItem).trim() && String(w).trim() !== '') { correctGaps++; } }); }); if (totalGaps > 0) { let calc = (correctGaps / totalGaps) * maxScore; return Math.round(calc * 2) / 2; } return 0; }
    if (q.correctAnswer !== undefined && q.correctAnswer !== null && q.correctAnswer !== '') { let textAns = extractAnswerText(rawAnswer); let sAns = String(textAns).trim().toLowerCase(); let cAns = String(q.correctAnswer).trim().toLowerCase(); if (sAns === cAns && sAns !== '') return maxScore; }
    return 0; 
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
        showSuccess('تم تعيين الاختبار بنجاح.');
    } catch(e) { console.error(e); alert('حدث خطأ'); }
}

async function deleteAssignedTest(id) { 
    if(confirm('هل أنت متأكد من حذف هذا الاختبار المعين؟')) { 
        await window.supabase.from('student_tests').delete().eq('id', id);
        loadDiagnosticTab(); 
        showSuccess('تم الحذف بنجاح.'); 
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
                    const obj = (allObjectives || []).find(o => o.id == q.linkedGoalId);
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
            <div style="display:flex; gap:20px; margin-bottom:20px; flex-wrap:wrap;"><div style="flex:1; min-width:250px; border:1px solid #ddd; padding:10px;"><h6 style="background:#28a745; color:white; padding:5px; text-align:center;">نقاط القوة</h6><ul>${strengthHTML}</ul></div><div style="flex:1; min-width:250px; border:1px solid #ddd; padding:10px;"><h6 style="background:#dc3545; color:white; padding:5px; text-align:center;">نقاط الاحتياج</h6><ul>${needsHTML}</ul></div></div>
            <div class="alert alert-secondary text-center mb-4">الهدف بعيد المدى: أن يتقن التلميذ مهارات مادة <strong>${subjectName}</strong> بنسبة 80%</div>
            <h5>الأهداف التدريسية:</h5>
            <table class="table table-bordered"><thead style="background:#333; color:white;"><tr><th>#</th><th>الهدف</th><th>التحقق</th></tr></thead><tbody>${objectivesRows}</tbody></table>
        </div>`;
    } catch(e) { console.error(e); }
}

// ============================================
// 3. إدارة الدروس وتوليد الخطة التلقائي
// ============================================
function regenerateLessons() {
    autoGenerateLessons();
}

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

            const isFirst = index === 0; const isLast = index === myLessons.length - 1;
            let orderBtns = '';
            if (!isFirst) orderBtns += `<button class="btn-order" style="width:auto; height:auto; padding:2px 8px; border-radius:4px; margin-left:5px;" onclick="moveLesson(${l.id}, 'up')">تقديم</button>`;
            if (!isLast) orderBtns += `<button class="btn-order" style="width:auto; height:auto; padding:2px 8px; border-radius:4px;" onclick="moveLesson(${l.id}, 'down')">تأخير</button>`;

            return `<div class="content-card" style="${cardStyle} position:relative;"><div style="position:absolute; top:50px; left:10px; display:flex; z-index:5;">${orderBtns}</div><div style="display:flex; justify-content:space-between;"><div style="margin-right:20px;"><h4 style="margin:0;">${index+1}. ${l.title}</h4><small class="text-muted">${l.objective}</small></div><div>${statusBadge}</div></div><div style="margin-top:10px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap;"><div class="lesson-actions" style="width:100%; display:flex; gap:5px; margin-top:25px;">${controls}<button class="btn btn-danger btn-sm" onclick="deleteLesson(${l.id})">حذف</button></div></div></div>`;
        }).join('');
    } catch(e) { console.error(e); }
}

async function autoGenerateLessons() {
    showConfirmModal('توليد الخطة العلاجية تلقائياً؟<br><small>سيتم حذف الدروس الحالية وتوليد قائمة جديدة بناءً على نتيجة التشخيص ومحك الاجتياز.</small>', async function() {
        try {
            const { data: diagTests } = await window.supabase.from('student_tests').select('*').eq('studentId', currentStudentId).eq('type', 'diagnostic').eq('status', 'completed');
            if (!diagTests || diagTests.length === 0) return showError('يجب إكمال وتصحيح الاختبار التشخيصي أولاً.'); 
            
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
            
            if(newLessons.length === 0) { showInfoModal('الخطة العلاجية', 'الطالب متفوق! لقد تجاوز محك الاجتياز في جميع المهارات، ولا توجد نقاط ضعف تتطلب خطة علاجية.'); return; }

            await window.supabase.from('student_lessons').delete().eq('studentId', currentStudentId);
            await window.supabase.from('student_lessons').insert(newLessons);

            if (newAssignments.length > 0) {
                await window.supabase.from('student_assignments').delete().eq('studentId', currentStudentId);
                await window.supabase.from('student_assignments').insert(newAssignments);
            }

            showSuccess(`تم إسناد ${newLessons.length} درس و ${newAssignments.length} واجب مرتبط للطالب.`);
            loadLessonsTab(); loadAssignmentsTab(); calculateAndSetStudentProgress();
        } catch(e) { console.error(e); showError('خطأ أثناء التوليد التلقائي'); }
    });
}

async function saveAndReindexLessons(myList) {
    myList.forEach((l, i) => l.orderIndex = i);
    try {
        await window.supabase.from('student_lessons').delete().eq('studentId', currentStudentId);
        if (myList.length > 0) await window.supabase.from('student_lessons').insert(myList);
        loadLessonsTab();
    } catch(e) { console.error(e); }
}

async function moveLesson(lessonId, direction) {
    try {
        const { data: myLessons } = await window.supabase.from('student_lessons').select('*').eq('studentId', currentStudentId).order('orderIndex', { ascending: true });
        if(!myLessons) return;
        
        const idx = myLessons.findIndex(l => l.id == lessonId);
        if (idx === -1) return;
        
        if (direction === 'up' && idx > 0) [myLessons[idx], myLessons[idx-1]] = [myLessons[idx-1], myLessons[idx]];
        else if (direction === 'down' && idx < myLessons.length - 1) [myLessons[idx], myLessons[idx+1]] = [myLessons[idx+1], myLessons[idx]];
        
        await saveAndReindexLessons(myLessons);
    } catch(e) { console.error(e); }
}

function accelerateLesson(id) {
    showConfirmModal('تسريع هذا الدرس؟<br><small>سيتم اعتباره منجزاً للتميز.</small>', async function() {
        try {
            await window.supabase.from('student_lessons').update({ status: 'accelerated', completedDate: new Date().toISOString() }).eq('id', id);
            loadLessonsTab(); calculateAndSetStudentProgress(); showSuccess('تم تسريع الدرس بنجاح');
        } catch(e) { console.error(e); }
    });
}

function resetLesson(id) {
    showConfirmModal('إعادة فتح الدرس؟<br><small>سيتم مسح السجل التاريخي وإعادته للحالة المعلقة.</small>', async function() {
        try {
            await window.supabase.from('student_lessons').update({ status: 'pending', completedDate: null, answers: null, passedByAlternative: false }).eq('id', id);
            loadLessonsTab(); calculateAndSetStudentProgress(); showSuccess('تم إعادة فتح الدرس');
        } catch(e) { console.error(e); }
    });
}

function deleteLesson(id) {
    showConfirmModal('هل أنت متأكد من حذف هذا الدرس؟', async function() {
        try {
            await window.supabase.from('student_lessons').delete().eq('id', id);
            loadLessonsTab(); calculateAndSetStudentProgress(); showSuccess('تم الحذف بنجاح');
        } catch(e) { console.error(e); }
    });
}

async function showAssignLibraryLessonModal() {
    const select = document.getElementById('libraryLessonSelect');
    if (!select) return;
    try {
        const { data: allLessons } = await window.supabase.from('lessons').select('*').eq('teacherId', getCurrentUser().id);
        select.innerHTML = '<option value="">اختر درساً من القائمة...</option>';
        if (!allLessons || allLessons.length === 0) { select.innerHTML += '<option value="" disabled>مكتبة الدروس فارغة</option>'; } 
        else { allLessons.forEach(l => { select.innerHTML += `<option value="${l.id}">${l.title} ${l.subject ? `(${l.subject})` : ''}</option>`; }); }
        document.getElementById('assignLibraryLessonModal').classList.add('show');
    } catch(e) { console.error(e); }
}

async function assignLibraryLesson() {
    const select = document.getElementById('libraryLessonSelect');
    const lessonId = select.value;
    if (!lessonId) return showError('يرجى اختيار درس لإسناده');
    
    try {
        const { data: targetLesson } = await window.supabase.from('lessons').select('*').eq('id', lessonId).single();
        if (!targetLesson) return showError('الدرس المختار لم يعد موجوداً');

        const { data: myLessons } = await window.supabase.from('student_lessons').select('*').eq('studentId', currentStudentId).order('orderIndex', { ascending: true });
        let list = myLessons || [];
        let strugglingIdx = list.findIndex(l => l.status === 'struggling');
        let insertIndex = list.length;
        let rescueId = null;

        if (strugglingIdx !== -1) {
            insertIndex = strugglingIdx + 1; 
            rescueId = list[strugglingIdx].id;
        }

        const newStudentLesson = { 
            id: Date.now(), 
            studentId: currentStudentId, 
            title: targetLesson.title, 
            objective: targetLesson.linkedInstructionalGoal || 'درس إضافي', 
            originalLessonId: targetLesson.id, 
            status: 'pending', 
            isAdditional: true,
            rescueLessonId: rescueId, 
            assignedDate: new Date().toISOString(), 
            orderIndex: 0 
        };

        list.splice(insertIndex, 0, newStudentLesson);
        await saveAndReindexLessons(list);
        
        closeModal('assignLibraryLessonModal');
        showSuccess('تم إسناد الدرس الإضافي للطالب بنجاح وتوجيهه لمساره.');
    } catch(e) { console.error(e); }
}

// ============================================
// 4. الواجبات
// ============================================
async function loadAssignmentsTab() {
    try {
        const { data: list } = await window.supabase.from('student_assignments').select('*').eq('studentId', currentStudentId).order('id', { ascending: false });
        const container = document.getElementById('studentAssignmentsGrid');

        if (!list || list.length === 0) { container.innerHTML = `<div class="empty-state"><h3>لا توجد واجبات حالياً</h3><button class="btn btn-primary" onclick="showAssignHomeworkModal()"><i class="fas fa-plus-circle"></i> إسناد واجب جديد</button></div>`; return; }
        
        container.innerHTML = list.map(a => `<div class="content-card"><div style="display:flex; justify-content:space-between;"><h4 style="margin:0;">${a.title}</h4><span class="badge ${a.status === 'completed' ? 'badge-success' : 'badge-primary'}">${a.status === 'completed' ? 'مكتمل' : 'جديد'}</span></div><div class="content-meta" style="margin-top:10px;"><span>📅 التسليم: ${a.dueDate || 'مفتوح'}</span><span>تاريخ الإسناد: ${new Date(a.assignedDate).toLocaleDateString('ar-SA')}</span></div><div style="margin-top:15px; border-top:1px solid #eee; padding-top:10px;">${a.status === 'completed' ? `<button class="btn btn-sm btn-outline-success" onclick="openReviewModal(${a.id}, 'assignment')">🔍 مراجعة الحل</button>` : '<span class="text-muted text-sm">بانتظار الحل...</span>'}<button class="btn btn-sm btn-outline-danger" style="float:left;" onclick="deleteAssignment(${a.id})">حذف</button></div></div>`).join('');
    } catch(e) { console.error(e); }
}

async function showAssignHomeworkModal() { 
    const select = document.getElementById('homeworkSelect');
    if (!select) { injectHomeworkModal(); setTimeout(showAssignHomeworkModal, 50); return; }
    try {
        const { data: allAssignments } = await window.supabase.from('assignments').select('*').eq('teacherId', getCurrentUser().id);
        select.innerHTML = '<option value="">اختر من قائمة الواجبات...</option>';
        if (allAssignments && allAssignments.length > 0) { allAssignments.forEach(a => select.innerHTML += `<option value="${a.title}">${a.title}</option>`); } 
        else { select.innerHTML += `<option value="" disabled>لا توجد واجبات في المكتبة</option>`; }
        document.getElementById('homeworkDueDate').valueAsDate = new Date();
        document.getElementById('assignHomeworkModal').classList.add('show'); 
    } catch(e) { console.error(e); }
}

async function assignHomework() { 
    const select = document.getElementById('homeworkSelect'); 
    if(!select || !select.value) return showError('الرجاء اختيار واجب'); 
    try {
        await window.supabase.from('student_assignments').insert([{ id: Date.now(), studentId: currentStudentId, title: select.value, status: 'pending', dueDate: document.getElementById('homeworkDueDate').value }]);
        closeModal('assignHomeworkModal'); 
        loadAssignmentsTab(); 
        showSuccess('تم إسناد الواجب بنجاح'); 
    } catch(e) { console.error(e); }
}

function deleteAssignment(id) { 
    showConfirmModal('هل أنت متأكد من حذف هذا الواجب؟', async function() {
        try {
            await window.supabase.from('student_assignments').delete().eq('id', id);
            loadAssignmentsTab(); 
            showSuccess('تم الحذف بنجاح');
        } catch(e) { console.error(e); }
    });
}

// ============================================
// 5. سجل المتابعة والتقدم (Progress Tab)
// ============================================

async function loadProgressTab() {
    injectAdminEventModal();
    const container = document.getElementById('section-progress');
    
    container.innerHTML = `
        <div class="content-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; flex-wrap:wrap; gap:10px;">
            <div>
                <h2 style="margin:0;">سجل المتابعة اليومي</h2>
                <span id="progressBalanceBadge" class="badge badge-success" style="font-size:1.1rem; padding:8px 15px; border-radius:8px;">الرصيد: جاري الحساب...</span>
            </div>
            <div class="no-print" style="display:flex; gap:10px;">
                <button class="btn btn-secondary" onclick="printProgressLog()" style="background: #475569;"><i class="fas fa-print"></i> طباعة السجل</button>
                <button class="btn btn-primary" onclick="openAdminEventModal()"><i class="fas fa-plus-circle"></i> تسجيل حدث</button>
            </div>
        </div>
        <div class="table-responsive" id="printableProgressArea" style="overflow-x: auto; -webkit-overflow-scrolling: touch; background: white; padding: 15px; border-radius: 10px; border: 1px solid #eee; box-shadow: 0 4px 10px rgba(0,0,0,0.03);">
            <table class="word-table" style="min-width: 850px; width: 100%;">
                <thead>
                    <tr>
                        <th style="width: 30%;">اسم الدرس (الهدف)</th>
                        <th style="width: 15%;">حالة الدرس</th>
                        <th style="width: 15%;">حالة الطالب</th>
                        <th style="width: 15%;">نوع الحصة</th>
                        <th style="width: 15%;">التاريخ</th>
                        <th style="width: 10%;" class="no-print">إجراءات</th>
                    </tr>
                </thead>
                <tbody id="progressTableBody">
                    <tr><td colspan="6" class="text-center p-4">جاري التحميل من السحابة...</td></tr>
                </tbody>
            </table>
        </div>`;

    try {
        const [lessonsRes, eventsRes, scheduleRes] = await Promise.all([
            window.supabase.from('student_lessons').select('*').eq('studentId', currentStudentId),
            window.supabase.from('student_events').select('*').eq('studentId', currentStudentId),
            window.supabase.from('teacher_schedule').select('*').eq('teacherId', currentStudent.teacherId)
        ]);

        let myList = lessonsRes.data || [];
        let adminEvents = eventsRes.data || [];
        let teacherSchedule = scheduleRes.data || [];
        let holidays = JSON.parse(localStorage.getItem('academicCalendar') || '[]') || [];

        const tbody = document.getElementById('progressTableBody');
        const badge = document.getElementById('progressBalanceBadge');

        if (myList.length === 0) { 
            tbody.innerHTML = '<tr><td colspan="6" class="text-center p-4 text-muted">لم تبدأ الخطة بعد أو لا توجد دروس مسندة.</td></tr>';
            badge.textContent = 'الرصيد: 0 حصة';
            badge.className = 'badge badge-secondary';
            return; 
        }

        myList.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0)); 
        const sortedByDate = [...myList].sort((a, b) => new Date(a.assignedDate) - new Date(b.assignedDate)); 
        let planStartDate = sortedByDate.length > 0 ? new Date(sortedByDate[0].assignedDate) : new Date();
        
        let myEvents = await syncMissingDaysToArchive(myList, adminEvents, teacherSchedule, planStartDate, holidays);

        let rawLogs = [];
        myList.forEach(l => { 
            if (l.historyLog && Array.isArray(l.historyLog)) { 
                l.historyLog.forEach(log => { 
                    if(log && log.date) {
                        rawLogs.push({ dateObj: new Date(log.date), dateStr: new Date(log.date).toDateString(), type: 'lesson', status: log.status, title: l.title, lessonId: l.id, cachedType: log.cachedSessionType || null }); 
                    }
                }); 
            } 
        });
        myEvents.forEach(e => { 
            if(e && e.date) {
                rawLogs.push({ dateObj: new Date(e.date), dateStr: new Date(e.date).toDateString(), type: e.type === 'auto-absence' ? 'auto-absence' : 'event', status: e.type, title: e.title || (e.type === 'auto-absence' ? 'درس غير محدد' : 'حدث إداري'), id: e.id, note: e.note }); 
            }
        });

        let finalTimeline = []; 
        let balance = 0; 
        rawLogs.sort((a, b) => a.dateObj - b.dateObj);
        
        rawLogs.forEach(log => {
            if (log.status === 'started' || log.status === 'extension') { 
                const hasFinalStateToday = rawLogs.some(l => l.dateStr === log.dateStr && l.lessonId === log.lessonId && ['completed', 'accelerated', 'passed_by_alternative', 'struggling', 'returned', 'pending_review'].includes(l.status)); 
                if (hasFinalStateToday) return; 
            }
            
            let displayStatus = '', displayType = '', rowClass = '', studentState = '';
            if (log.type === 'event' || log.type === 'auto-absence') {
                if (log.status === 'vacation') { studentState = 'إجازة'; displayStatus = 'توقف مؤقت'; rowClass = 'bg-info-light'; }
                else if (log.status === 'excused') { studentState = 'معفى'; displayStatus = 'مؤجل'; rowClass = 'bg-warning-light'; balance--; }
                else if (log.type === 'auto-absence' || log.status === 'absence') { studentState = '<span class="text-danger font-weight-bold">غائب</span>'; displayStatus = 'لم ينفذ'; displayType = 'أساسية'; rowClass = 'bg-danger-light'; balance--; }
            } else {
                studentState = 'حاضر';
                if (log.status === 'started') displayStatus = 'بدأ';
                else if (log.status === 'extension') displayStatus = 'تمديد';
                else if (log.status === 'completed') { displayStatus = '<span class="text-success font-weight-bold">✔ متحقق</span>'; rowClass = 'bg-success-light'; }
                else if (log.status === 'accelerated') { displayStatus = '<span class="text-warning font-weight-bold">⚡ تسريع</span>'; rowClass = 'bg-warning-light'; }
                else if (log.status === 'pending_review') { displayStatus = '<span class="text-warning font-weight-bold">⏳ بانتظار تصحيح</span>'; rowClass = 'bg-warning-light'; }
                else if (log.status === 'passed_by_alternative' || log.status === 'struggling' || log.status === 'returned') { displayStatus = '<span class="text-danger font-weight-bold">لم يتحقق - يعاد الدرس</span>'; rowClass = 'bg-danger-light'; }
                
                if (log.cachedType) { 
                    if (log.cachedType === 'basic') displayType = 'أساسية'; 
                    else if (log.cachedType === 'compensation') { displayType = '<span class="text-primary font-weight-bold">تعويضية</span>'; balance++; } 
                    else if (log.cachedType === 'additional') { displayType = 'إضافية'; balance++; } 
                } else { displayType = 'أساسية'; }
            }
            finalTimeline.push({ title: log.title, lessonStatus: displayStatus, studentStatus: studentState, sessionType: displayType || '-', date: log.dateObj.toLocaleDateString('ar-SA'), rawDate: log.dateObj, actions: (log.type === 'event' || log.type === 'auto-absence') ? log.id : null, note: log.note, rowClass: rowClass });
        });
        
        let rowsHtml = finalTimeline.map(item => {
            let actionsHtml = '-'; 
            if (item.actions) { 
                actionsHtml = `<button class="btn-icon text-danger no-print" onclick="deleteAdminEvent(${item.actions})"><i class="fas fa-trash"></i></button>`; 
                if (item.rowClass !== 'bg-danger-light') { 
                    actionsHtml = `<button class="btn-icon text-primary no-print" onclick="editAdminEvent(${item.actions})"><i class="fas fa-edit"></i></button> ` + actionsHtml; 
                } 
            }
            let noteHtml = item.note ? `<br><small class="text-muted" style="font-size:0.85rem;">[${item.note}]</small>` : ''; 
            return `
            <tr class="${item.rowClass || ''}">
                <td style="padding: 12px; vertical-align: middle;"><strong>${item.title}</strong>${noteHtml}</td>
                <td class="text-center" style="vertical-align: middle;">${item.lessonStatus}</td>
                <td class="text-center" style="vertical-align: middle;">${item.studentStatus}</td>
                <td class="text-center" style="vertical-align: middle;">${item.sessionType}</td>
                <td class="text-center" style="vertical-align: middle;">${item.date}</td>
                <td class="text-center no-print" style="vertical-align: middle;">${actionsHtml}</td>
            </tr>`;
        }).join('');

        tbody.innerHTML = rowsHtml;
        
        if(badge) {
            badge.className = `badge ${balance < 0 ? 'badge-danger' : 'badge-success'}`;
            badge.textContent = `الرصيد الحالي: ${balance > 0 ? '+' + balance : balance} حصة`;
        }

    } catch(e) {
        console.error(e);
        document.getElementById('progressTableBody').innerHTML = '<tr><td colspan="6" class="text-center text-danger font-weight-bold p-4">حدث خطأ أثناء تحميل السجل. يرجى التأكد من الاتصال.</td></tr>';
    }
}

async function syncMissingDaysToArchive(myList, myEvents, teacherSchedule, planStartDate, holidays) {
    if (!planStartDate) return myEvents || []; 
    
    myList = Array.isArray(myList) ? myList : [];
    myEvents = Array.isArray(myEvents) ? myEvents : [];
    teacherSchedule = Array.isArray(teacherSchedule) ? teacherSchedule : [];
    holidays = Array.isArray(holidays) ? holidays : [];
    
    const today = new Date(); today.setHours(23, 59, 59, 999); 
    const dayMap = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']; 
    
    let newEvents = []; 
    let pendingLesson = myList.find(l => l.status === 'pending'); 
    let lessonTitleForAbsence = pendingLesson ? pendingLesson.title : 'درس غير محدد';
    
    for (let d = new Date(planStartDate); d < today; d.setDate(d.getDate() + 1)) {
        if (d.toDateString() === new Date().toDateString()) continue; 
        
        const isHoliday = holidays.some(h => { 
            if(!h.startDate || !h.endDate) return false;
            const start = new Date(h.startDate); const end = new Date(h.endDate); 
            start.setHours(0, 0, 0, 0); end.setHours(23, 59, 59, 999); 
            const checkDate = new Date(d); checkDate.setHours(12, 0, 0, 0); 
            return checkDate >= start && checkDate <= end; 
        }); 
        if (isHoliday) continue;
        
        const dateStr = d.toDateString(); 
        const hasLesson = myList.some(l => l.historyLog && Array.isArray(l.historyLog) && l.historyLog.some(log => log.date && new Date(log.date).toDateString() === dateStr)); 
        const hasEvent = myEvents.some(e => e.date && new Date(e.date).toDateString() === dateStr); 
        
        if (hasLesson || hasEvent) continue; 
        
        const dayKey = dayMap[d.getDay()]; 
        const isScheduledDay = teacherSchedule.some(s => s.day === dayKey && (s.students && Array.isArray(s.students) && s.students.includes(currentStudentId)));
        
        if (isScheduledDay) { 
            newEvents.push({ 
                id: Date.now() + Math.floor(Math.random()*10000), 
                studentId: currentStudentId, 
                date: new Date(d).toISOString(), 
                type: 'auto-absence', 
                title: lessonTitleForAbsence, 
                note: `غياب تلقائي عن درس: ${lessonTitleForAbsence}` 
            }); 
        }
    }
    
    if (newEvents.length > 0) { 
        await window.supabase.from('student_events').insert(newEvents);
        return [...myEvents, ...newEvents];
    } 
    return myEvents;
}

function openAdminEventModal() { 
    document.getElementById('editingEventId').value = ''; 
    document.getElementById('manualEventDate').valueAsDate = new Date(); 
    document.getElementById('manualEventType').value = 'excused'; 
    document.getElementById('manualEventNote').value = ''; 
    document.getElementById('adminEventModal').classList.add('show'); 
}

function closeAdminEventModal() { document.getElementById('adminEventModal').classList.remove('show'); }

async function editAdminEvent(id) { 
    try {
        const { data: event } = await window.supabase.from('student_events').select('*').eq('id', id).single();
        if (!event) return; 
        document.getElementById('editingEventId').value = id; 
        document.getElementById('manualEventType').value = event.type; 
        document.getElementById('manualEventDate').value = event.date.split('T')[0]; 
        document.getElementById('manualEventNote').value = event.note || ''; 
        document.getElementById('adminEventModal').classList.add('show');
    } catch(e) { console.error(e); } 
}

async function saveAdminEvent() { 
    const id = document.getElementById('editingEventId').value;
    const type = document.getElementById('manualEventType').value; 
    const dateInput = document.getElementById('manualEventDate').value; 
    const note = document.getElementById('manualEventNote').value; 
    
    if (!dateInput) return showError('يرجى اختيار التاريخ'); 
    const eventData = { studentId: currentStudentId, date: new Date(dateInput).toISOString(), type: type, note: note };
    
    try {
        if (id) await window.supabase.from('student_events').update(eventData).eq('id', id);
        else { eventData.id = Date.now(); await window.supabase.from('student_events').insert([eventData]); }
        closeAdminEventModal(); loadProgressTab(); showSuccess('تم حفظ الحدث بنجاح');
    } catch(e) { console.error(e); }
}

async function deleteAdminEvent(id) { 
    showConfirmModal('هل أنت متأكد من حذف هذا السجل؟', async function() {
        try {
            await window.supabase.from('student_events').delete().eq('id', id);
            loadProgressTab(); showSuccess('تم الحذف بنجاح');
        } catch(e) { console.error(e); }
    });
}

function printProgressLog() {
    const area = document.getElementById('printableProgressArea');
    if (!currentStudent || !area) { showError('بيانات الطالب غير جاهزة أو الجدول غير موجود'); return; }
    
    const tableContent = area.outerHTML; 
    const today = new Date().toLocaleDateString('ar-SA'); 
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html dir="rtl" lang="ar">
        <head>
            <title>سجل متابعة - ${currentStudent.name}</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700&display=swap');
                body { font-family: 'Tajawal', serif; padding: 40px; color: #333; }
                .print-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
                .header-side { width: 30%; font-size: 13px; line-height: 1.6; }
                .header-mid { width: 40%; text-align: center; }
                .header-mid h2 { margin: 0; font-size: 22px; }
                .student-info-box { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; background: #f9f9f9; padding: 15px; border: 1px solid #000; margin-bottom: 20px; border-radius: 5px; }
                .student-info-box div { font-size: 14px; }
                .word-table { width: 100%; border-collapse: collapse; border: 2px solid #000; }
                .word-table th, .word-table td { border: 1px solid #000; padding: 10px; text-align: center; font-size: 13px; }
                .word-table th { background-color: #eee !important; font-weight: bold; -webkit-print-color-adjust: exact; }
                .bg-success-light { background-color: #e8f5e9 !important; -webkit-print-color-adjust: exact; }
                .bg-danger-light { background-color: #ffebee !important; -webkit-print-color-adjust: exact; }
                .bg-warning-light { background-color: #fff3e0 !important; -webkit-print-color-adjust: exact; }
                .bg-info-light { background-color: #e3f2fd !important; -webkit-print-color-adjust: exact; }
                .no-print { display: none !important; }
                .footer-signatures { margin-top: 50px; display: flex; justify-content: space-between; text-align: center; font-weight: bold; }
                .footer-signatures div { width: 30%; border-top: 1px solid #000; padding-top: 10px; }
            </style>
        </head>
        <body>
            <div class="print-header">
                <div class="header-side">المملكة العربية السعودية<br>برنامج صعوبات التعلم<br>نظام ميسر التعلم</div>
                <div class="header-mid"><h2>سجل المتابعة اليومي</h2><p>تقرير التقدم الدراسي للعام 1447هـ</p></div>
                <div class="header-side" style="text-align: left;">التاريخ: ${today}<br>المعلم: أ/ صالح العجلان</div>
            </div>
            <div class="student-info-box">
                <div><strong>اسم الطالب:</strong> ${currentStudent.name}</div>
                <div><strong>الصف الدراسي:</strong> ${currentStudent.grade}</div>
                <div><strong>المادة:</strong> ${currentStudent.subject}</div>
                <div><strong>حالة الخطة:</strong> مستمرة</div>
            </div>
            ${tableContent}
            <div class="footer-signatures">
                <div>توقيع معلم صعوبات التعلم</div>
                <div>توقيع مدير المدرسة</div>
            </div>
            <script>window.onload = function() { window.print(); window.close(); }<\/script>
        </body>
        </html>
    `);
    printWindow.document.close();
}

// ============================================
// 6. المراجعة والتصحيح (Review Modal)
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
                container.innerHTML += buildTeacherReviewItem(q, index, studentAnsObj); 
            });
        } else { container.innerHTML += '<div class="text-center p-3 text-muted">لا توجد أسئلة مسجلة لعرضها.</div>'; }
        
        document.getElementById('reviewTestModal').classList.add('show');
    } catch(e) { console.error(e); showError('خطأ في جلب بيانات المراجعة'); }
}

async function saveTestReview() {
    const id = parseInt(document.getElementById('reviewAssignmentId').value);
    const type = document.getElementById('reviewAssignmentId').getAttribute('data-type');
    let tableName = type === 'test' ? 'student_tests' : (type === 'lesson' ? 'student_lessons' : 'student_assignments');

    try {
        const { data: record } = await window.supabase.from(tableName).select('*').eq('id', id).single();
        if (!record) return showError('السجل غير موجود');

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
                showSuccess('تم حفظ التصحيح. الطالب اجتاز المحك واكتمل الدرس بنجاح!');
            } else {
                updateData.status = 'returned'; 
                showError(`تم حفظ التقييم. نتيجة الطالب (${record.score}%) لم تحقق المحك (${passScore}%). أُعيد الدرس للطالب.`);
            }
        } else {
            updateData.status = 'completed';
            showSuccess('تم حفظ التصحيح واعتماد الدرجة بنجاح.');
        }

        await window.supabase.from(tableName).update(updateData).eq('id', id);
        closeModal('reviewTestModal');
        
        if (type === 'assignment') loadAssignmentsTab(); 
        else if (type === 'test') loadDiagnosticTab(); 
        else if (type === 'lesson') { loadLessonsTab(); calculateAndSetStudentProgress(); }
    } catch(e) { console.error(e); showError('حدث خطأ أثناء الحفظ'); }
}

async function returnTestForResubmission() {
    const id = parseInt(document.getElementById('reviewAssignmentId').value);
    const type = document.getElementById('reviewAssignmentId').getAttribute('data-type');
    
    showConfirmModal('إعادة الاختبار/الدرس للطالب لتعديل الإجابات؟', async function() {
        let tableName = type === 'test' ? 'student_tests' : (type === 'lesson' ? 'student_lessons' : 'student_assignments');
        await window.supabase.from(tableName).update({ status: 'returned' }).eq('id', id);
        
        closeModal('reviewTestModal');
        if (type === 'assignment') loadAssignmentsTab();
        else if (type === 'test') loadDiagnosticTab();
        else if (type === 'lesson') loadLessonsTab();
        showSuccess('تمت الإعادة للطالب بنجاح');
    });
}

function closeModal(id) { document.getElementById(id).classList.remove('show'); }

// ----------------------------------------------------------------------------------
// دوال رسم واجهة المراجعة (DOM Builders)
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

// Global scope bindings
window.showAssignTestModal = showAssignTestModal; window.assignTest = assignTest; window.deleteAssignedTest = deleteAssignedTest;
window.autoGenerateLessons = autoGenerateLessons; window.accelerateLesson = accelerateLesson; window.resetLesson = resetLesson; window.deleteLesson = deleteLesson; window.regenerateLessons = regenerateLessons;
window.showAssignHomeworkModal = showAssignHomeworkModal; window.assignHomework = assignHomework; window.deleteAssignment = deleteAssignment;
window.openReviewModal = openReviewModal; window.saveTestReview = saveTestReview; window.returnTestForResubmission = returnTestForResubmission;
window.closeModal = closeModal;
window.deleteAdminEvent = deleteAdminEvent;
window.editAdminEvent = editAdminEvent;
window.saveAdminEvent = saveAdminEvent;
window.closeAdminEventModal = closeAdminEventModal;
window.openAdminEventModal = openAdminEventModal;
window.printProgressLog = printProgressLog;
