// ============================================
// 📁 المسار: assets/js/content-library.js
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // تحميل المكتبة عند فتح الصفحة
    if (document.getElementById('testsGrid') || document.getElementById('lessonsGrid')) {
        loadContentLibrary();
    }
});

function loadContentLibrary() {
    try { loadTests(); } catch(e) { console.error("Tests Error", e); }
    try { loadLessons(); } catch(e) { console.error("Lessons Error", e); }
    try { loadObjectives(); } catch(e) { console.error("Objectives Error", e); }
}

// ==========================================
// 1. إدارة الاختبارات (النظام الكلاسيكي المستقر)
// ==========================================
function loadTests() {
    const grid = document.getElementById('testsGrid');
    if (!grid) return;

    const tests = JSON.parse(localStorage.getItem('tests') || '[]');
    const currentTeacher = getCurrentUser();
    const teacherTests = tests.filter(test => test.teacherId === currentTeacher.id);

    if (teacherTests.length === 0) {
        grid.innerHTML = `<div class="empty-content-state" style="grid-column:1/-1;text-align:center;padding:30px;"><h3>لا توجد اختبارات</h3><button class="btn btn-success mt-3" onclick="showCreateTestModal()">+ إنشاء اختبار</button></div>`;
        return;
    }

    grid.innerHTML = teacherTests.map(test => `
        <div class="content-card">
            <div class="content-header">
                <h4 title="${test.title}">${test.title}</h4>
                <span class="content-badge subject-${test.subject}">${test.subject}</span>
            </div>
            <div class="content-body">
                <p class="text-muted small">${test.description || 'لا يوجد وصف'}</p>
                <div class="content-meta">
                    <span class="questions-count">❓ ${test.questions?.length||0} أسئلة</span>
                    <span class="date-badge">📅 ${new Date(test.createdAt).toLocaleDateString('ar-SA')}</span>
                </div>
            </div>
            <div class="content-actions">
                <button class="btn btn-sm btn-warning" onclick="editTest(${test.id})" title="تعديل"><i class="fas fa-edit"></i></button>
                <button class="btn btn-sm btn-danger" onclick="deleteTest(${test.id})" title="حذف"><i class="fas fa-trash"></i></button>
            </div>
        </div>`).join('');
}

// ==========================================
// 2. إدارة الدروس (النظام المطور - 3 مراحل)
// ==========================================
function loadLessons() {
    const grid = document.getElementById('lessonsGrid');
    if (!grid) return;

    const lessons = JSON.parse(localStorage.getItem('lessons') || '[]');
    const currentTeacher = getCurrentUser();
    const teacherLessons = lessons.filter(l => l.teacherId === currentTeacher.id);

    if (teacherLessons.length === 0) {
        grid.innerHTML = `<div class="empty-content-state" style="grid-column:1/-1;text-align:center;padding:20px;"><h3>لا توجد دروس</h3><button class="btn btn-success mt-2" onclick="showCreateLessonModal()">+ درس تفاعلي جديد</button></div>`;
        return;
    }

    grid.innerHTML = teacherLessons.map(l => `
        <div class="content-card" style="border-top: 4px solid var(--secondary-color);">
            <div class="content-header">
                <h4 title="${l.title}">${l.title}</h4>
                <span class="content-badge subject-${l.subject}">${l.subject}</span>
            </div>
            <div class="content-body">
                <div class="lesson-stats small text-muted">
                    <div>🎥 التمهيد: ${l.intro?.type === 'video' ? 'فيديو' : (l.intro?.type === 'image' ? 'صورة' : 'رابط')}</div>
                    <div>📝 التمارين: ${l.exercises?.questions?.length || 0} أسئلة (اجتياز: ${l.exercises?.passScore}%)</div>
                    <div>🏆 التقييم: ${l.assessment?.questions?.length || 0} أسئلة</div>
                </div>
            </div>
            <div class="content-actions">
                <button class="btn btn-sm btn-warning" onclick="editLesson(${l.id})"><i class="fas fa-edit"></i> تعديل</button>
                <button class="btn btn-sm btn-danger" onclick="deleteLesson(${l.id})"><i class="fas fa-trash"></i> حذف</button>
            </div>
        </div>
    `).join('');
}

// --- وظائف إضافة وتعديل الدرس ---

function showCreateLessonModal() {
    // تصفير الحقول لدرس جديد
    document.getElementById('editLessonId').value = '';
    document.getElementById('lessonTitle').value = '';
    document.getElementById('lessonSubject').value = 'لغتي';
    
    // تصفير التمهيد
    document.getElementById('introType').value = 'video';
    document.getElementById('introUrl').value = '';
    document.getElementById('introText').value = '';
    toggleIntroInputs(); // تحديث العرض

    // تصفير التمارين والتقييم
    document.getElementById('exercisesPassScore').value = '80';
    document.getElementById('exercisesContainer').innerHTML = '';
    document.getElementById('assessmentContainer').innerHTML = '';
    
    // إضافة سؤال افتراضي واحد في كل قسم لتسهيل البداية
    addLessonQuestion('exercisesContainer');
    addLessonQuestion('assessmentContainer');
    
    // العودة للخطوة الأولى
    switchLessonStep('intro');
    document.getElementById('createLessonModal').classList.add('show');
}

function editLesson(id) {
    const lessons = JSON.parse(localStorage.getItem('lessons') || '[]');
    const lesson = lessons.find(l => l.id === id);
    if(!lesson) return;

    // 1. تعبئة البيانات الأساسية
    document.getElementById('editLessonId').value = lesson.id;
    document.getElementById('lessonTitle').value = lesson.title;
    document.getElementById('lessonSubject').value = lesson.subject;

    // 2. تعبئة التمهيد
    if (lesson.intro) {
        document.getElementById('introType').value = lesson.intro.type;
        document.getElementById('introUrl').value = lesson.intro.url;
        document.getElementById('introText').value = lesson.intro.text || '';
        toggleIntroInputs();
    }

    // 3. تعبئة التمارين
    document.getElementById('exercisesPassScore').value = lesson.exercises?.passScore || 80;
    const exContainer = document.getElementById('exercisesContainer');
    exContainer.innerHTML = '';
    if (lesson.exercises && lesson.exercises.questions) {
        lesson.exercises.questions.forEach(q => addQuestionToContainer(exContainer, 'سؤال', q));
    } else {
        addLessonQuestion('exercisesContainer');
    }

    // 4. تعبئة التقييم
    const asContainer = document.getElementById('assessmentContainer');
    asContainer.innerHTML = '';
    if (lesson.assessment && lesson.assessment.questions) {
        lesson.assessment.questions.forEach(q => addQuestionToContainer(asContainer, 'سؤال', q));
    } else {
        addLessonQuestion('assessmentContainer');
    }

    // فتح المودال والذهاب لأول خطوة
    switchLessonStep('intro');
    document.getElementById('createLessonModal').classList.add('show');
}

function saveLesson() {
    const editId = document.getElementById('editLessonId').value;
    const title = document.getElementById('lessonTitle').value;
    const subject = document.getElementById('lessonSubject').value;
    
    if(!title) { alert('عنوان الدرس مطلوب'); return; }

    // 1. بيانات التمهيد
    const intro = {
        type: document.getElementById('introType').value,
        url: document.getElementById('introUrl').value,
        text: document.getElementById('introText').value
    };

    // 2. بيانات التمارين (نجمع الأسئلة من حاوية التمارين)
    const exQuestions = collectQuestionsFromContainer('exercisesContainer');
    const exercises = {
        passScore: parseInt(document.getElementById('exercisesPassScore').value) || 50,
        questions: exQuestions
    };

    // 3. بيانات التقييم (نجمع الأسئلة من حاوية التقييم)
    const asQuestions = collectQuestionsFromContainer('assessmentContainer');
    const assessment = {
        questions: asQuestions
    };

    const lessons = JSON.parse(localStorage.getItem('lessons') || '[]');

    const lessonData = {
        id: editId ? parseInt(editId) : Date.now(),
        teacherId: getCurrentUser().id,
        title, subject, intro, exercises, assessment,
        createdAt: new Date().toISOString()
    };

    if (editId) {
        // تحديث درس موجود
        const index = lessons.findIndex(l => l.id == editId);
        if (index !== -1) lessons[index] = lessonData;
    } else {
        // إنشاء درس جديد
        lessons.push(lessonData);
    }

    localStorage.setItem('lessons', JSON.stringify(lessons));
    document.getElementById('createLessonModal').classList.remove('show');
    loadLessons();
    alert('تم حفظ الدرس بنجاح');
}

function deleteLesson(id) {
    if(!confirm('هل أنت متأكد من حذف هذا الدرس؟')) return;
    const lessons = JSON.parse(localStorage.getItem('lessons') || '[]');
    localStorage.setItem('lessons', JSON.stringify(lessons.filter(l => l.id !== id)));
    loadLessons();
}

// دالة مساعدة لضبط حقول الإدخال في التمهيد
function toggleIntroInputs() {
    const type = document.getElementById('introType').value;
    const urlInput = document.getElementById('introUrl');
    
    if (type === 'video') urlInput.placeholder = 'رابط يوتيوب (مثال: https://youtu.be/...)';
    else if (type === 'image') urlInput.placeholder = 'رابط الصورة (URL)';
    else urlInput.placeholder = 'الرابط الخارجي';
}

// دالة مساعدة لجمع الأسئلة من أي حاوية
function collectQuestionsFromContainer(containerId) {
    const questions = [];
    document.querySelectorAll(`#${containerId} .question-item`).forEach(item => {
        const type = item.querySelector('.question-type').value;
        const text = item.querySelector('.q-text')?.value || 'سؤال';
        const score = item.querySelector('.passing-score').value;
        
        let qData = { id: Date.now()+Math.random(), type, text, passingScore: parseInt(score) };
        
        // جمع التفاصيل حسب النوع
        if(item.querySelector('.q-choice')) qData.choices = Array.from(item.querySelectorAll('.q-choice')).map(c => c.value);
        if(item.querySelector('.q-media')) qData.mediaUrl = item.querySelector('.q-media').value;
        if(item.querySelector('.q-reading-text')) qData.readingText = item.querySelector('.q-reading-text').value;
        if(item.querySelector('.q-full-word')) { qData.spellingWord = item.querySelector('.q-full-word').value; qData.fullWord = item.querySelector('.q-full-word').value; }
        if(item.querySelector('.q-missing-word')) qData.missingWord = item.querySelector('.q-missing-word').value;
        
        questions.push(qData);
    });
    return questions;
}

// دالة لإضافة سؤال في حاوية الدرس
function addLessonQuestion(containerId) {
    const container = document.getElementById(containerId);
    addQuestionToContainer(container, 'سؤال');
}


// ==========================================
// 3. إدارة الأهداف (النظام الكلاسيكي المستقر)
// ==========================================
function loadObjectives() {
    const list = document.getElementById('objectivesList');
    if (!list) return;
    
    const objs = JSON.parse(localStorage.getItem('objectives') || '[]').filter(o => o.teacherId === getCurrentUser().id);
    
    if (objs.length === 0) {
        list.innerHTML = '<div class="text-center p-3">لا توجد أهداف. <button class="btn btn-sm btn-success" onclick="showCreateObjectiveModal()">+ إضافة</button></div>';
        return;
    }

    list.innerHTML = objs.map(o => `
        <div class="objective-item card p-2 mb-2" style="border-right: 4px solid var(--primary-color);">
            <div class="d-flex justify-content-between">
                <div><strong>${o.shortTermGoal}</strong><br><small class="text-muted">${o.subject}</small></div>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteObjective(${o.id})">×</button>
            </div>
        </div>`).join('');
}

function showCreateObjectiveModal() { document.getElementById('createObjectiveModal').classList.add('show'); }
function saveObjective() { 
    const s = document.getElementById('objSubject').value;
    const g = document.getElementById('shortTermGoal').value;
    if(!g) return;
    const objs = JSON.parse(localStorage.getItem('objectives')||'[]');
    objs.push({id:Date.now(), teacherId:getCurrentUser().id, subject:s, shortTermGoal:g});
    localStorage.setItem('objectives', JSON.stringify(objs));
    document.getElementById('createObjectiveModal').classList.remove('show');
    loadObjectives();
}
function deleteObjective(id) {
    const objs = JSON.parse(localStorage.getItem('objectives')||'[]');
    localStorage.setItem('objectives', JSON.stringify(objs.filter(o=>o.id!==id)));
    loadObjectives();
}

// ==========================================
// دوال الأسئلة المشتركة (Backbone)
// ==========================================

function showCreateTestModal() {
    document.getElementById('editTestId').value = ''; 
    document.getElementById('createTestForm').reset();
    document.getElementById('questionsContainer').innerHTML = '';
    addQuestion(); 
    document.getElementById('createTestModal').classList.add('show');
}
function closeCreateTestModal() { document.getElementById('createTestModal').classList.remove('show'); }

// إضافة سؤال (تستخدم للاختبارات)
function addQuestion() {
    const container = document.getElementById('questionsContainer');
    addQuestionToContainer(container, 'السؤال');
}

// بناء HTML السؤال (مشتركة لكل شيء)
function addQuestionToContainer(container, labelPrefix, existingData = null) {
    const index = container.children.length;
    const typeVal = existingData ? existingData.type : 'multiple-choice';
    const scoreVal = existingData ? (existingData.passingScore || 5) : 5;
    
    const html = `
        <div class="question-item card p-3 mb-3" data-index="${index}" style="border:1px solid #ddd; padding:15px; border-radius:8px; background:#fff;">
            <div class="d-flex justify-content-between mb-2">
                <h5>${labelPrefix} ${index + 1}</h5>
                <button type="button" class="btn btn-danger btn-sm" onclick="this.parentElement.parentElement.remove()">حذف</button>
            </div>
            <div class="row" style="display:flex; gap:10px; margin-bottom:10px;">
                <div class="form-group" style="flex:1;">
                    <label>نوع السؤال</label>
                    <select class="form-control question-type" onchange="renderQuestionInputs(this, ${index})">
                        <option value="multiple-choice" ${typeVal==='multiple-choice'?'selected':''}>اختيار من متعدد</option>
                        <option value="drag-drop" ${typeVal==='drag-drop'?'selected':''}>سحب وإفلات (إكمال فراغات)</option>
                        <option value="open-ended" ${typeVal==='open-ended'?'selected':''}>سؤال مفتوح</option>
                        <option value="ai-reading" ${typeVal==='ai-reading'?'selected':''}>تقييم قراءة آلي</option>
                        <option value="ai-spelling" ${typeVal==='ai-spelling'?'selected':''}>تقييم إملاء آلي</option>
                        <option value="missing-letter" ${typeVal==='missing-letter'?'selected':''}>أكمل الحرف الناقص</option>
                    </select>
                </div>
                <div class="form-group" style="width:100px;">
                    <label>الدرجة</label>
                    <input type="number" class="form-control passing-score" value="${scoreVal}" min="1">
                </div>
            </div>
            <div class="question-inputs-area" style="background:#f8f9fa; padding:10px; border-radius:5px;"></div>
        </div>`;
    
    container.insertAdjacentHTML('beforeend', html);
    renderQuestionInputs(container.lastElementChild.querySelector('.question-type'), index, existingData);
}

function renderQuestionInputs(selectElement, index, data = null) {
    const type = selectElement.value;
    const area = selectElement.parentElement.parentElement.parentElement.querySelector('.question-inputs-area');
    const textVal = data ? data.text : '';
    let html = '';
    
    if (type === 'multiple-choice') {
        const choices = data?.choices || ['', '', ''];
        html = `<div class="form-group mb-2"><label>نص السؤال</label><input type="text" class="form-control q-text" value="${textVal}"></div>
                <label>الخيارات</label>${choices.map((c, i) => `<input type="text" class="form-control mb-1 q-choice" value="${c}" placeholder="الخيار ${i+1}">`).join('')}`;
    } 
    else if (type === 'drag-drop') {
        html = `
            <div class="form-group mb-2">
                <label>نص الجملة (ضع الإجابات بين قوسين {})</label>
                <div class="alert alert-info small p-1">مثال: عاصمة السعودية هي {الرياض}.</div>
                <textarea class="form-control q-text" rows="3">${textVal}</textarea>
            </div>`;
    }
    else if (type === 'open-ended') {
        html = `<div class="form-group mb-2"><label>السؤال</label><input type="text" class="form-control q-text" value="${textVal}"></div>`;
    }
    else if (type.includes('reading')) {
        html = `<div class="form-group mb-2"><label>التعليمات</label><input type="text" class="form-control q-text" value="${textVal}"></div>
                <div class="form-group"><label>النص المقروء</label><textarea class="form-control q-reading-text">${data?.readingText || ''}</textarea></div>`;
    }
    else if (type.includes('spelling') || type === 'missing-letter') {
        html = `<div class="form-group mb-2"><label>التعليمات</label><input type="text" class="form-control q-text" value="${textVal}"></div>
                <div class="form-group"><label>الكلمة</label><input type="text" class="form-control q-full-word" value="${data?.fullWord || data?.spellingWord || ''}"></div>
                ${type === 'missing-letter' ? `<div class="form-group mt-2"><label>الكلمة ناقصة (_)</label><input type="text" class="form-control q-missing-word" value="${data?.missingWord || ''}"></div>` : ''}`;
    }
    area.innerHTML = html;
}

// حفظ الاختبار
function saveTest() {
    const title = document.getElementById('testTitle').value;
    if (!title) { alert('العنوان مطلوب'); return; }
    
    const questions = [];
    document.querySelectorAll('#questionsContainer .question-item').forEach(item => {
        const type = item.querySelector('.question-type').value;
        const text = item.querySelector('.q-text')?.value || 'سؤال';
        const score = item.querySelector('.passing-score').value;
        
        let qData = { id: Date.now()+Math.random(), type, text, passingScore: parseInt(score) };
        if(item.querySelector('.q-choice')) qData.choices = Array.from(item.querySelectorAll('.q-choice')).map(c => c.value);
        if(item.querySelector('.q-reading-text')) qData.readingText = item.querySelector('.q-reading-text').value;
        if(item.querySelector('.q-full-word')) { qData.spellingWord = item.querySelector('.q-full-word').value; qData.fullWord = item.querySelector('.q-full-word').value; }
        if(item.querySelector('.q-missing-word')) qData.missingWord = item.querySelector('.q-missing-word').value;
        questions.push(qData);
    });

    const tests = JSON.parse(localStorage.getItem('tests') || '[]');
    const editId = document.getElementById('editTestId').value;
    const newTest = {
        id: editId ? parseInt(editId) : Date.now(),
        teacherId: getCurrentUser().id,
        title, subject: document.getElementById('testSubject').value, description: document.getElementById('testDescription').value,
        questions, createdAt: new Date().toISOString()
    };

    if (editId) {
        const idx = tests.findIndex(t => t.id == editId);
        if(idx !== -1) tests[idx] = newTest;
    } else {
        tests.push(newTest);
    }
    localStorage.setItem('tests', JSON.stringify(tests));
    closeCreateTestModal();
    loadTests();
    alert('تم الحفظ');
}

function editTest(id) {
    const t = JSON.parse(localStorage.getItem('tests')).find(x => x.id === id);
    if(!t) return;
    document.getElementById('editTestId').value = t.id;
    document.getElementById('testTitle').value = t.title;
    document.getElementById('testSubject').value = t.subject;
    document.getElementById('testDescription').value = t.description;
    document.getElementById('questionsContainer').innerHTML = '';
    t.questions.forEach(q => addQuestionToContainer(document.getElementById('questionsContainer'), 'سؤال', q));
    document.getElementById('createTestModal').classList.add('show');
}
function deleteTest(id) { if(confirm('حذف؟')) { const t = JSON.parse(localStorage.getItem('tests')).filter(x => x.id !== id); localStorage.setItem('tests', JSON.stringify(t)); loadTests(); } }

function getCurrentUser() { return JSON.parse(sessionStorage.getItem('currentUser')).user; }
