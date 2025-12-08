// ============================================
// نظام مكتبة المحتوى التعليمي
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('📚 بدء تهيئة مكتبة المحتوى...');
    initializeContentLibrary();
});

function initializeContentLibrary() {
    // التحقق من المصادقة
    const user = getCurrentUser();
    if (!user || user.role !== 'teacher') {
        console.log('❌ يجب تسجيل الدخول كمدرس');
        showAuthNotification('يجب تسجيل الدخول كمدرس للوصول إلى هذه الصفحة', 'error');
        setTimeout(() => {
            window.location.href = '../../index.html';
        }, 2000);
        return;
    }

    console.log('✅ تم التحقق من المستخدم:', user.name);
    
    // تحديث واجهة المستخدم
    updatePageHeader(user);
    
    // إعداد تبويبات المكتبة
    setupLibraryTabs();
    
    // تحميل المحتوى
    loadLibraryContent();
    
    // إعداد الأزرار
    setupActionButtons();
    
    console.log('✅ تم تهيئة مكتبة المحتوى بنجاح');
}

function updatePageHeader(user) {
    const userNameElement = document.getElementById('userName');
    const userAvatarElement = document.getElementById('userAvatar');
    
    if (userNameElement) {
        userNameElement.textContent = user.name;
    }
    
    if (userAvatarElement) {
        userAvatarElement.textContent = user.name.charAt(0);
    }
}

function setupLibraryTabs() {
    console.log('🗂️ جاري إعداد تبويبات المكتبة...');
    
    const tabBtns = document.querySelectorAll('.library-tabs .tab-btn');
    const tabPanes = document.querySelectorAll('.library-tabs .tab-pane');
    
    if (tabBtns.length === 0 || tabPanes.length === 0) {
        console.log('⚠️ لم يتم العثور على تبويبات المكتبة');
        return;
    }
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            console.log(`📌 تم النقر على تبويب: ${tabId}`);
            
            // إزالة النشاط من جميع الأزرار
            tabBtns.forEach(b => b.classList.remove('active'));
            tabPanes.forEach(p => p.classList.remove('active'));
            
            // إضافة النشاط للزر والتبويب المحدد
            this.classList.add('active');
            
            const targetPane = document.getElementById(`${tabId}-tab`);
            if (targetPane) {
                targetPane.classList.add('active');
                console.log(`✅ تم فتح تبويب: ${tabId}`);
                
                // تحميل محتوى التبويب عند النقر
                loadTabContent(tabId);
            }
        });
    });
    
    console.log(`✅ تم إعداد ${tabBtns.length} تبويب`);
}

function loadTabContent(tabId) {
    console.log(`📥 جاري تحميل محتوى تبويب: ${tabId}`);
    
    switch (tabId) {
        case 'lessons':
            loadLessons();
            break;
        case 'exercises':
            loadExercises();
            break;
        case 'objectives':
            loadTeachingObjectives();
            break;
    }
}

function loadLibraryContent() {
    console.log('📚 جاري تحميل محتوى المكتبة...');
    
    // تحميل تبويب الدروس أولاً
    loadLessons();
    
    // تحميل التبويبات الأخرى في الخلفية
    setTimeout(() => {
        loadExercises();
        loadTeachingObjectives();
    }, 500);
}

function loadLessons() {
    console.log('📖 جاري تحميل الدروس...');
    
    const lessonsList = document.getElementById('lessonsList');
    if (!lessonsList) {
        console.log('❌ قائمة الدروس غير موجودة');
        return;
    }
    
    // محاكاة تحميل البيانات
    setTimeout(() => {
        const lessons = JSON.parse(localStorage.getItem('lessons') || '[]');
        const currentUser = getCurrentUser();
        const userLessons = lessons.filter(lesson => lesson.teacherId === currentUser.id);
        
        console.log(`📚 عدد الدروس: ${userLessons.length}`);
        
        if (userLessons.length === 0) {
            lessonsList.innerHTML = `
                <div class="empty-content-state">
                    <div class="empty-icon">📚</div>
                    <h3>لا توجد دروس</h3>
                    <p>قم بإضافة أول درس لمكتبة المحتوى</p>
                    <button class="btn btn-primary" onclick="showCreateLessonModal()">
                        <i class="fas fa-plus"></i> إضافة درس جديد
                    </button>
                </div>
            `;
        } else {
            lessonsList.innerHTML = userLessons.map(lesson => `
                <div class="content-card">
                    <div class="content-header">
                        <h4>${lesson.title || 'درس بدون عنوان'}</h4>
                        <span class="content-badge subject-${lesson.subject || 'general'}">
                            ${lesson.subject || 'عام'}
                        </span>
                    </div>
                    <div class="content-body">
                        <p>${lesson.description || 'لا يوجد وصف'}</p>
                    </div>
                    <div class="content-meta">
                        <span class="questions-count">${lesson.questions || 0} سؤال</span>
                        <span class="exercises-count">${lesson.exercises || 0} تمرين</span>
                        <span class="objectives-status ${lesson.objectivesLinked ? 'linked' : 'not-linked'}">
                            ${lesson.objectivesLinked ? 'مربوط بأهداف' : 'غير مربوط'}
                        </span>
                    </div>
                    <div class="content-actions">
                        <button class="btn btn-sm btn-primary" onclick="viewLesson(${lesson.id})">
                            <i class="fas fa-eye"></i> عرض
                        </button>
                        <button class="btn btn-sm btn-warning" onclick="editLesson(${lesson.id})">
                            <i class="fas fa-edit"></i> تعديل
                        </button>
                        <button class="btn btn-sm btn-info" onclick="linkLessonObjectives(${lesson.id})">
                            <i class="fas fa-link"></i> ربط أهداف
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteLesson(${lesson.id})">
                            <i class="fas fa-trash"></i> حذف
                        </button>
                    </div>
                </div>
            `).join('');
        }
        
        console.log('✅ تم تحميل الدروس');
    }, 1000);
}

function loadExercises() {
    console.log('🏃 جاري تحميل التمارين...');
    
    const exercisesList = document.getElementById('exercisesList');
    if (!exercisesList) {
        console.log('⚠️ قائمة التمارين غير موجودة');
        return;
    }
    
    setTimeout(() => {
        exercisesList.innerHTML = `
            <div class="empty-content-state">
                <div class="empty-icon">🏃</div>
                <h3>لا توجد تمارين</h3>
                <p>سيتم إضافة التمارين قريباً</p>
            </div>
        `;
        
        console.log('✅ تم تحميل التمارين');
    }, 800);
}

function loadTeachingObjectives() {
    console.log('🎯 جاري تحميل الأهداف التعليمية...');
    
    const objectivesList = document.getElementById('objectivesList');
    if (!objectivesList) {
        console.log('⚠️ قائمة الأهداف غير موجودة');
        return;
    }
    
    setTimeout(() => {
        objectivesList.innerHTML = `
            <div class="empty-content-state">
                <div class="empty-icon">🎯</div>
                <h3>لا توجد أهداف تعليمية</h3>
                <p>سيتم إضافة الأهداف التعليمية قريباً</p>
            </div>
        `;
        
        console.log('✅ تم تحميل الأهداف التعليمية');
    }, 600);
}

function setupActionButtons() {
    console.log('🔘 جاري إعداد أزرار الإجراءات...');
    
    // زر إضافة درس جديد
    const addLessonBtn = document.querySelector('[onclick*="showCreateLessonModal"]');
    if (addLessonBtn) {
        addLessonBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showCreateLessonModal();
        });
        console.log('✅ تم إعداد زر إضافة درس جديد');
    } else {
        console.log('⚠️ زر إضافة درس جديد غير موجود');
    }
    
    // زر إنشاء اختبار تشخيصي
    const createTestBtn = document.querySelector('[onclick*="showCreateTestModal"]');
    if (createTestBtn) {
        createTestBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showCreateTestModal();
        });
        console.log('✅ تم إعداد زر إنشاء اختبار تشخيصي');
    } else {
        console.log('⚠️ زر إنشاء اختبار تشخيصي غير موجود');
    }
}

// ============================================
// دوال النوافذ المنبثقة
// ============================================

function showCreateLessonModal() {
    console.log('➕ فتح نافذة إنشاء درس جديد...');
    
    const modal = document.getElementById('createLessonModal');
    if (modal) {
        modal.classList.add('show');
        console.log('✅ تم فتح نافذة إنشاء درس');
    } else {
        console.log('❌ نافذة إنشاء الدرس غير موجودة');
        showAuthNotification('نافذة إنشاء الدرس غير متاحة حالياً', 'error');
        
        // بديل: إنشاء نافذة منبثقة ديناميكية
        createDynamicLessonModal();
    }
}

function closeCreateLessonModal() {
    console.log('❌ إغلاق نافذة إنشاء درس...');
    
    const modal = document.getElementById('createLessonModal');
    if (modal) {
        modal.classList.remove('show');
        console.log('✅ تم إغلاق نافذة إنشاء درس');
    }
}

function createDynamicLessonModal() {
    console.log('🔧 إنشاء نافذة منبثقة ديناميكية...');
    
    // إنشاء عناصر النافذة المنبثقة
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay';
    modalOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    modalContent.style.cssText = `
        background: white;
        border-radius: 15px;
        padding: 30px;
        width: 90%;
        max-width: 500px;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    `;
    
    modalContent.innerHTML = `
        <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 15px;">
            <h3 style="margin: 0; color: #2c3e50;">إضافة درس جديد</h3>
            <button onclick="this.closest('.modal-overlay').remove()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #666;">&times;</button>
        </div>
        <div class="modal-body">
            <form id="dynamicLessonForm">
                <div class="form-group" style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: 500;">عنوان الدرس *</label>
                    <input type="text" class="form-control" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                </div>
                <div class="form-group" style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: 500;">المادة *</label>
                    <select class="form-control" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                        <option value="">اختر المادة</option>
                        <option value="لغتي">لغتي</option>
                        <option value="رياضيات">رياضيات</option>
                    </select>
                </div>
                <div class="form-group" style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: 500;">الوصف</label>
                    <textarea class="form-control" rows="3" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;"></textarea>
                </div>
            </form>
        </div>
        <div class="modal-footer" style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;">
            <button onclick="this.closest('.modal-overlay').remove()" style="background: #6c757d; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">إلغاء</button>
            <button onclick="saveDynamicLesson()" style="background: #28a745; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">حفظ الدرس</button>
        </div>
    `;
    
    modalOverlay.appendChild(modalContent);
    document.body.appendChild(modalOverlay);
    
    console.log('✅ تم إنشاء نافذة منبثقة ديناميكية');
}

function saveDynamicLesson() {
    console.log('💾 جاري حفظ الدرس...');
    
    const form = document.querySelector('#dynamicLessonForm');
    if (!form) return;
    
    const title = form.querySelector('input[type="text"]').value.trim();
    const subject = form.querySelector('select').value;
    
    if (!title || !subject) {
        showAuthNotification('يرجى ملء جميع الحقول الإجبارية', 'error');
        return;
    }
    
    const currentUser = getCurrentUser();
    const lessons = JSON.parse(localStorage.getItem('lessons') || '[]');
    
    const newLesson = {
        id: generateId(),
        title: title,
        subject: subject,
        description: form.querySelector('textarea').value.trim(),
        teacherId: currentUser.id,
        teacherName: currentUser.name,
        questions: 0,
        exercises: 0,
        objectivesLinked: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    lessons.push(newLesson);
    localStorage.setItem('lessons', JSON.stringify(lessons));
    
    // إغلاق النافذة المنبثقة
    const modalOverlay = document.querySelector('.modal-overlay');
    if (modalOverlay) {
        modalOverlay.remove();
    }
    
    showAuthNotification('تم إضافة الدرس بنجاح', 'success');
    
    // إعادة تحميل قائمة الدروس
    loadLessons();
    
    console.log('✅ تم حفظ الدرس:', newLesson.title);
}

function showCreateTestModal() {
    console.log('📊 فتح نافذة إنشاء اختبار تشخيصي...');
    
    const modal = document.getElementById('createTestModal');
    if (modal) {
        modal.classList.add('show');
        console.log('✅ تم فتح نافذة إنشاء اختبار');
    } else {
        console.log('❌ نافذة إنشاء الاختبار غير موجودة');
        
        // بديل: الانتقال إلى صفحة إنشاء الاختبار
        showAuthNotification('سيتم توجيهك إلى صفحة إنشاء الاختبار...', 'info');
        setTimeout(() => {
            window.location.href = 'create-test.html';
        }, 1500);
    }
}

function closeCreateTestModal() {
    console.log('❌ إغلاق نافذة إنشاء اختبار...');
    
    const modal = document.getElementById('createTestModal');
    if (modal) {
        modal.classList.remove('show');
        console.log('✅ تم إغلاق نافذة إنشاء اختبار');
    }
}

// ============================================
// دوال إدارة المحتوى
// ============================================

function viewLesson(lessonId) {
    console.log(`👁️ عرض الدرس: ${lessonId}`);
    showAuthNotification(`عرض الدرس ${lessonId}`, 'info');
}

function editLesson(lessonId) {
    console.log(`✏️ تعديل الدرس: ${lessonId}`);
    showAuthNotification(`تعديل الدرس ${lessonId}`, 'info');
}

function linkLessonObjectives(lessonId) {
    console.log(`🔗 ربط أهداف الدرس: ${lessonId}`);
    showAuthNotification(`ربط أهداف الدرس ${lessonId}`, 'info');
}

function deleteLesson(lessonId) {
    console.log(`🗑️ حذف الدرس: ${lessonId}`);
    
    if (confirm('هل أنت متأكد من حذف هذا الدرس؟')) {
        const lessons = JSON.parse(localStorage.getItem('lessons') || '[]');
        const updatedLessons = lessons.filter(lesson => lesson.id !== lessonId);
        
        localStorage.setItem('lessons', JSON.stringify(updatedLessons));
        
        showAuthNotification('تم حذف الدرس بنجاح', 'success');
        loadLessons();
        
        console.log(`✅ تم حذف الدرس: ${lessonId}`);
    }
}

// ============================================
// تصدير الدوال
// ============================================

// تصدير الدوال للاستخدام العالمي
window.showCreateLessonModal = showCreateLessonModal;
window.closeCreateLessonModal = closeCreateLessonModal;
window.showCreateTestModal = showCreateTestModal;
window.closeCreateTestModal = closeCreateTestModal;
window.viewLesson = viewLesson;
window.editLesson = editLesson;
window.linkLessonObjectives = linkLessonObjectives;
window.deleteLesson = deleteLesson;
window.saveDynamicLesson = saveDynamicLesson;

console.log('📤 تم تصدير دوال مكتبة المحتوى');
