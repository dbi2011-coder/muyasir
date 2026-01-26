// ============================================
// 📁 المسار: assets/js/content-library.js
// الوصف: إدارة المكتبة (إصلاح خطأ reading 'id')
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // التأكد من وجود مستخدم قبل تنفيذ أي كود
    const user = getCurrentUser();
    if (!user) {
        console.warn('لم يتم العثور على مستخدم. يرجى تسجيل الدخول.');
        return;
    }

    // تحميل المكتبة فقط إذا كانت عناصرها موجودة في الصفحة
    if (document.getElementById('testsGrid') || document.getElementById('lessonsGrid')) {
        injectLinkContentModal(); 
        loadContentLibrary();
    }
});

function loadContentLibrary() {
    // استخدام try-catch لمنع توقف الصفحة بالكامل عند حدوث خطأ واحد
    try { loadTests(); } catch(e) { console.error('خطأ في تحميل الاختبارات:', e); }
    try { loadLessons(); } catch(e) { console.error('خطأ في تحميل الدروس:', e); }
    try { loadObjectives(); } catch(e) { console.error('خطأ في تحميل الأهداف:', e); }
    try { loadHomeworks(); } catch(e) { console.error('خطأ في تحميل الواجبات:', e); }
}

function loadTests() {
    const grid = document.getElementById('testsGrid'); if(!grid) return;
    const user = getCurrentUser(); // استخدام الدالة الآمنة من auth.js
    
    // جلب الاختبارات الخاصة بهذا المعلم فقط
    const tests = JSON.parse(localStorage.getItem('tests') || '[]').filter(t => t.teacherId === user.id);
    
    if(tests.length === 0) { 
        grid.innerHTML = '<div class="text-center" style="grid-column:1/-1; padding:20px; color:#777;">لا توجد اختبارات مضافة.</div>'; 
        return; 
    }
    
    grid.innerHTML = tests.map(t => {
        const isLinked = t.questions && t.questions.some(q => q.linkedGoalId);
        return `<div class="content-card card-test"><div class="content-header"><h4 title="${t.title}">${t.title}</h4><span class="content-badge subject-${t.subject}">${t.subject}</span></div><div class="content-body"><p class="text-muted small" style="margin-bottom:10px;">${t.description || 'لا يوجد وصف'}</p><div class="content-meta"><span><i class="fas fa-question-circle"></i> ${t.questions?.length || 0} أسئلة</span>${isLinked ? '<span class="text-success"><i class="fas fa-link"></i> مرتبط بأهداف</span>' : ''}</div></div><div class="content-footer"><button class="btn-card-action btn-test-light" onclick="showLinkModal('test', ${t.id})"><i class="fas fa-link"></i> ربط</button><button class="btn-card-action btn-test-light" onclick="editTest(${t.id})"><i class="fas fa-pen"></i> تعديل</button><button class="btn-card-action btn-delete-card" onclick="deleteTest(${t.id})"><i class="fas fa-trash"></i> حذف</button></div></div>`;
    }).join('');
}

function loadLessons() {
    const grid = document.getElementById('lessonsGrid'); if(!grid) return;
    const user = getCurrentUser();
    
    const lessons = JSON.parse(localStorage.getItem('lessons') || '[]').filter(l => l.teacherId === user.id);
    
    if (lessons.length === 0) { 
        grid.innerHTML = `<div class="empty-content-state" style="grid-column:1/-1;text-align:center;"><h3>لا توجد دروس مضافة</h3></div>`; 
        return; 
    }
    
    grid.innerHTML = lessons.map(l => {
        const isLinked = !!l.linkedInstructionalGoal;
        return `<div class="content-card card-lesson"><div class="content-header"><h4 title="${l.title}">${l.title}</h4><span class="content-badge subject-${l.subject}">${l.subject}</span></div><div class="content-body"><div class="small text-muted" style="margin-bottom:10px;">تمهيد، تمارين (${l.exercises?.questions?.length || 0})، تقييم (${l.assessment?.questions?.length || 0})</div><div class="content-meta">${isLinked ? '<span class="text-success"><i class="fas fa-link"></i> مرتبط بهدف تدريسي</span>' : '<span><i class="fas fa-unlink"></i> غير مرتبط</span>'}</div></div><div class="content-footer"><button class="btn-card-action btn-lesson-light" onclick="showLinkModal('lesson', ${l.id})"><i class="fas fa-link"></i> ربط</button><button class="btn-card-action btn-lesson-light" onclick="editLesson(${l.id})"><i class="fas fa-pen"></i> تعديل</button><button class="btn-card-action btn-delete-card" onclick="deleteLesson(${l.id})"><i class="fas fa-trash"></i> حذف</button></div></div>`;
    }).join('');
}

// (احتفظ ببقية دوال التعديل والحذف والربط كما هي في ملفك الأصلي، أو انسخها من الردود السابقة إذا فقدتها)
// ... [بقية الدوال مثل editTest, saveTest, injectLinkContentModal تبقى كما هي]
// الأهم هو الدوال أعلاه (loadTests, loadLessons) والدالة getCurrentUser في auth.js
