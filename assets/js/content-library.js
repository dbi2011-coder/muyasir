// ============================================
// 📁 الملف: muyasir-main/assets/js/content-library.js
// ============================================

// نظام مكتبة المحتوى التعليمي للمعلمين
document.addEventListener('DOMContentLoaded', function() {
    initializeContentLibrary();
    setupLibraryTabs();
});

function initializeContentLibrary() {
    // التحقق من المصادقة
    const user = checkAuth();
    if (!user) {
        redirectToLogin();
        return;
    }
    
    if (user.role !== 'teacher') {
        showAuthNotification('غير مصرح لك بالوصول إلى هذه الصفحة', 'error');
        setTimeout(() => {
            window.location.href = '../../index.html';
        }, 2000);
        return;
    }
    
    // تحديث واجهة المستخدم
    updateLibraryUI(user);
    
    // تحميل المحتوى
    loadContentLibrary();
}

function setupLibraryTabs() {
    const tabBtns = document.querySelectorAll('.library-tabs .tab-btn');
    const tabPanes = document.querySelectorAll('.library-tabs .tab-pane');
    
    if (tabBtns.length === 0 || tabPanes.length === 0) return;
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // إزالة النشاط من جميع الأزرار
            tabBtns.forEach(b => b.classList.remove('active'));
            tabPanes.forEach(p => p.classList.remove('active'));
            
            // إضافة النشاط للزر والتبويب المحدد
            this.classList.add('active');
            const targetPane = document.getElementById(`${tabId}-tab`);
            if (targetPane) {
                targetPane.classList.add('active');
            }
            
            // تحميل محتوى التبويب إذا لزم الأمر
            loadTabContent(tabId);
        });
    });
}

function updateLibraryUI(user) {
    const userNameElement = document.getElementById('userName');
    const userAvatarElement = document.getElementById('userAvatar');
    
    if (userNameElement) {
        userNameElement.textContent = user.name;
    }
    
    if (userAvatarElement) {
        userAvatarElement.textContent = user.name.charAt(0);
    }
}

function loadContentLibrary() {
    loadLessons();
    loadExercises();
    loadTeachingObjectives();
    updateLibraryStats();
}

function loadTabContent(tabId) {
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

function loadLessons() {
    const lessonsList = document.getElementById('lessonsList');
    if (!lessonsList) return;
    
    const currentUser = getCurrentUser();
    const lessons = JSON.parse(localStorage.getItem('lessons') || '[]');
    const userLessons = lessons.filter(lesson => lesson.teacherId === currentUser.id);
    
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
        return;
    }
    
    // ترتيب الدروس حسب تاريخ الإنشاء
    userLessons.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    lessonsList.innerHTML = userLessons.map(lesson => {
        const subjectClass = lesson.subject === 'لغتي' ? 'subject-لغتي' : 'subject-رياضيات';
        const statusClass = lesson.objectivesLinked ? 'linked' : 'not-linked';
        const statusText = lesson.objectivesLinked ? 'مربوط بأهداف' : 'غير مربوط';
        
        return `
            <div class="content-card">
                <div class="content-header">
                    <h4>${lesson.title || 'درس بدون عنوان'}</h4>
                    <span class="content-badge ${subjectClass}">
                        ${lesson.subject || 'غير محدد'}
                    </span>
                </div>
                <div class="content-body">
                    <p>${lesson.description || 'لا يوجد وصف للدرس'}</p>
                </div>
                <div class="content-meta">
                    <span class="questions-count">
                        <i class="fas fa-question-circle"></i> ${lesson.questionsCount || 0}
                    </span>
                    <span class="exercises-count">
                        <i class="fas fa-running"></i> ${lesson.exercisesCount || 0}
                    </span>
                    <span class="objectives-status ${statusClass}">
                        <i class="fas fa-link"></i> ${statusText}
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
        `;
    }).join('');
}

function loadExercises() {
    const exercisesList = document.getElementById('exercisesList');
    if (!exercisesList) return;
    
    const currentUser = getCurrentUser();
    const exercises = JSON.parse(localStorage.getItem('exercises') || '[]');
    const userExercises = exercises.filter(exercise => exercise.teacherId === currentUser.id);
    
    if (userExercises.length === 0) {
        exercisesList.innerHTML = `
            <div class="empty-content-state">
                <div class="empty-icon">🏃‍♂️</div>
                <h3>لا توجد تمارين</h3>
                <p>قم بإضافة أول تمرين لمكتبة المحتوى</p>
                <button class="btn btn-primary" onclick="showCreateExerciseModal()">
                    <i class="fas fa-plus"></i> إضافة تمرين جديد
                </button>
            </div>
        `;
        return;
    }
    
    exercisesList.innerHTML = userExercises.map(exercise => {
        const subjectClass = exercise.subject === 'لغتي' ? 'subject-لغتي' : 'subject-رياضيات';
        
        return `
            <div class="content-card">
                <div class="content-header">
                    <h4>${exercise.title || 'تمرين بدون عنوان'}</h4>
                    <span class="content-badge ${subjectClass}">
                        ${exercise.subject || 'غير محدد'}
                    </span>
                </div>
                <div class="content-body">
                    <p>${exercise.description || 'لا يوجد وصف للتمرين'}</p>
                    <div class="exercise-meta">
                        <span><strong>المستوى:</strong> ${exercise.level || 'متوسط'}</span>
                        <span><strong>الوقت:</strong> ${exercise.duration || 10} دقيقة</span>
                    </div>
                </div>
                <div class="content-actions">
                    <button class="btn btn-sm btn-primary" onclick="viewExercise(${exercise.id})">
                        <i class="fas fa-eye"></i> عرض
                    </button>
                    <button class="btn btn-sm btn-warning" onclick="editExercise(${exercise.id})">
                        <i class="fas fa-edit"></i> تعديل
                    </button>
                    <button class="btn btn-sm btn-success" onclick="assignExercise(${exercise.id})">
                        <i class="fas fa-share"></i> تعيين
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteExercise(${exercise.id})">
                        <i class="fas fa-trash"></i> حذف
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function loadTeachingObjectives() {
    const objectivesList = document.getElementById('objectivesList');
    if (!objectivesList) return;
    
    const currentUser = getCurrentUser();
    const objectives = JSON.parse(localStorage.getItem('teachingObjectives') || '[]');
    const userObjectives = objectives.filter(obj => obj.teacherId === currentUser.id);
    
    if (userObjectives.length === 0) {
        objectivesList.innerHTML = `
            <div class="empty-content-state">
                <div class="empty-icon">🎯</div>
                <h3>لا توجد أهداف تعليمية</h3>
                <p>قم بإضافة أول هدف تعليمي</p>
                <button class="btn btn-primary" onclick="showCreateObjectiveModal()">
                    <i class="fas fa-plus"></i> إضافة هدف جديد
                </button>
            </div>
        `;
        return;
    }
    
    // تجميع الأهداف حسب المادة
    const arabicObjectives = userObjectives.filter(obj => obj.subject === 'لغتي');
    const mathObjectives = userObjectives.filter(obj => obj.subject === 'رياضيات');
    
    objectivesList.innerHTML = '';
    
    // عرض أهداف مادة لغتي
    if (arabicObjectives.length > 0) {
        objectivesList.innerHTML += `
            <div class="objectives-subject-section">
                <h4><i class="fas fa-book"></i> أهداف مادة لغتي</h4>
                <div class="objectives-container">
                    ${arabicObjectives.map(obj => `
                        <div class="objective-item">
                            <div class="objective-header">
                                <h5>${obj.title}</h5>
                                <span class="objective-level">${obj.level || 'مبتدئ'}</span>
                            </div>
                            <div class="objective-description">
                                <p>${obj.description}</p>
                            </div>
                            <div class="objective-meta">
                                <span><i class="fas fa-link"></i> ${obj.linkedContent || 0} مرتبط</span>
                                <span><i class="fas fa-calendar"></i> ${formatDateShort(obj.createdAt)}</span>
                            </div>
                            <div class="objective-actions">
                                <button class="btn btn-sm btn-primary" onclick="editObjective(${obj.id})">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-sm btn-danger" onclick="deleteObjective(${obj.id})">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    // عرض أهداف مادة رياضيات
    if (mathObjectives.length > 0) {
        objectivesList.innerHTML += `
            <div class="objectives-subject-section">
                <h4><i class="fas fa-calculator"></i> أهداف مادة رياضيات</h4>
                <div class="objectives-container">
                    ${mathObjectives.map(obj => `
                        <div class="objective-item">
                            <div class="objective-header">
                                <h5>${obj.title}</h5>
                                <span class="objective-level">${obj.level || 'مبتدئ'}</span>
                            </div>
                            <div class="objective-description">
                                <p>${obj.description}</p>
                            </div>
                            <div class="objective-meta">
                                <span><i class="fas fa-link"></i> ${obj.linkedContent || 0} مرتبط</span>
                                <span><i class="fas fa-calendar"></i> ${formatDateShort(obj.createdAt)}</span>
                            </div>
                            <div class="objective-actions">
                                <button class="btn btn-sm btn-primary" onclick="editObjective(${obj.id})">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-sm btn-danger" onclick="deleteObjective(${obj.id})">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
}

function updateLibraryStats() {
    const currentUser = getCurrentUser();
    
    // حساب الإحصائيات
    const lessons = JSON.parse(localStorage.getItem('lessons') || '[]');
    const exercises = JSON.parse(localStorage.getItem('exercises') || '[]');
    const objectives = JSON.parse(localStorage.getItem('teachingObjectives') || '[]');
    
    const userLessons = lessons.filter(l => l.teacherId === currentUser.id);
    const userExercises = exercises.filter(e => e.teacherId === currentUser.id);
    const userObjectives = objectives.filter(o => o.teacherId === currentUser.id);
    
    const linkedLessons = userLessons.filter(l => l.objectivesLinked).length;
    const arabicObjectives = userObjectives.filter(o => o.subject === 'لغتي').length;
    const mathObjectives = userObjectives.filter(o => o.subject === 'رياضيات').length;
    
    // تحديث العناصر إذا وجدت
    updateStatElement('totalLessons', userLessons.length);
    updateStatElement('totalExercises', userExercises.length);
    updateStatElement('linkedLessons', linkedLessons);
    updateStatElement('arabicObjectives', arabicObjectives);
    updateStatElement('mathObjectives', mathObjectives);
}

function updateStatElement(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = value;
    }
}

// ============================================
// إدارة الدروس
// ============================================

function showCreateLessonModal() {
    const modal = document.getElementById('createLessonModal');
    if (modal) {
        modal.classList.add('show');
        document.getElementById('createLessonForm')?.reset();
    } else {
        console.error('Modal element not found');
        // بديل: عرض رسالة
        showAuthNotification('نافذة إنشاء الدرس غير متاحة حالياً', 'warning');
    }
}

function closeCreateLessonModal() {
    const modal = document.getElementById('createLessonModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

function createNewLesson() {
    const form = document.getElementById('createLessonForm');
    if (!form) return;
    
    const title = form.querySelector('[name="lessonTitle"]')?.value.trim();
    const subject = form.querySelector('[name="lessonSubject"]')?.value;
    const description = form.querySelector('[name="lessonDescription"]')?.value.trim();
    
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
        description: description,
        teacherId: currentUser.id,
        teacherName: currentUser.name,
        questionsCount: 0,
        exercisesCount: 0,
        objectivesLinked: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    lessons.push(newLesson);
    localStorage.setItem('lessons', JSON.stringify(lessons));
    
    showAuthNotification('تم إنشاء الدرس بنجاح', 'success');
    closeCreateLessonModal();
    loadLessons();
    updateLibraryStats();
    
    // إضافة سجل النظام
    addSystemLog(`تم إنشاء درس جديد: ${title}`, 'content');
}

function viewLesson(lessonId) {
    const lessons = JSON.parse(localStorage.getItem('lessons') || '[]');
    const lesson = lessons.find(l => l.id === lessonId);
    
    if (!lesson) {
        showAuthNotification('الدرس غير موجود', 'error');
        return;
    }
    
    // عرض تفاصيل الدرس
    document.getElementById('viewLessonTitle').textContent = lesson.title;
    document.getElementById('viewLessonSubject').textContent = lesson.subject;
    document.getElementById('viewLessonDescription').textContent = lesson.description || 'لا يوجد وصف';
    document.getElementById('viewLessonCreated').textContent = formatDate(lesson.createdAt);
    document.getElementById('viewLessonQuestions').textContent = lesson.questionsCount || 0;
    document.getElementById('viewLessonExercises').textContent = lesson.exercisesCount || 0;
    document.getElementById('viewLessonStatus').textContent = 
        lesson.objectivesLinked ? 'مربوط بأهداف' : 'غير مربوط';
    
    document.getElementById('viewLessonModal').classList.add('show');
}

function closeViewLessonModal() {
    document.getElementById('viewLessonModal').classList.remove('show');
}

function editLesson(lessonId) {
    // في تطبيق حقيقي، هنا ننتقل إلى صفحة تحرير الدرس
    showAuthNotification('ميزة تحرير الدرس قيد التطوير', 'info');
}

function linkLessonObjectives(lessonId) {
    const lessons = JSON.parse(localStorage.getItem('lessons') || '[]');
    const lesson = lessons.find(l => l.id === lessonId);
    
    if (!lesson) {
        showAuthNotification('الدرس غير موجود', 'error');
        return;
    }
    
    // عرض واجهة ربط الأهداف
    document.getElementById('linkObjectivesModal').classList.add('show');
    document.getElementById('linkLessonId').value = lessonId;
    document.getElementById('linkLessonTitle').textContent = lesson.title;
    
    // تحميل الأهداف المتاحة
    loadAvailableObjectives(lesson.subject);
}

function closeLinkObjectivesModal() {
    document.getElementById('linkObjectivesModal').classList.remove('show');
}

function loadAvailableObjectives(subject) {
    const currentUser = getCurrentUser();
    const objectives = JSON.parse(localStorage.getItem('teachingObjectives') || '[]');
    const availableObjectives = objectives.filter(obj => 
        obj.teacherId === currentUser.id && obj.subject === subject
    );
    
    const objectivesList = document.getElementById('availableObjectivesList');
    if (!objectivesList) return;
    
    if (availableObjectives.length === 0) {
        objectivesList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🎯</div>
                <h4>لا توجد أهداف متاحة</h4>
                <p>قم بإنشاء أهداف تعليمية أولاً</p>
                <button class="btn btn-primary" onclick="showCreateObjectiveModal()">
                    إنشاء هدف جديد
                </button>
            </div>
        `;
        return;
    }
    
    objectivesList.innerHTML = availableObjectives.map(obj => `
        <div class="objective-option">
            <input type="checkbox" id="obj_${obj.id}" value="${obj.id}">
            <label for="obj_${obj.id}">
                <strong>${obj.title}</strong>
                <p>${obj.description}</p>
                <span class="objective-level">${obj.level || 'مبتدئ'}</span>
            </label>
        </div>
    `).join('');
}

function linkSelectedObjectives() {
    const lessonId = parseInt(document.getElementById('linkLessonId').value);
    const checkboxes = document.querySelectorAll('#availableObjectivesList input[type="checkbox"]:checked');
    
    if (checkboxes.length === 0) {
        showAuthNotification('يرجى اختيار هدف واحد على الأقل', 'warning');
        return;
    }
    
    const selectedObjectiveIds = Array.from(checkboxes).map(cb => parseInt(cb.value));
    
    // تحديث الدرس
    const lessons = JSON.parse(localStorage.getItem('lessons') || '[]');
    const lessonIndex = lessons.findIndex(l => l.id === lessonId);
    
    if (lessonIndex !== -1) {
        lessons[lessonIndex].objectivesLinked = true;
        lessons[lessonIndex].objectiveIds = selectedObjectiveIds;
        lessons[lessonIndex].updatedAt = new Date().toISOString();
        
        localStorage.setItem('lessons', JSON.stringify(lessons));
        
        showAuthNotification('تم ربط الأهداف بنجاح', 'success');
        closeLinkObjectivesModal();
        loadLessons();
        updateLibraryStats();
    }
}

function deleteLesson(lessonId) {
    if (!confirm('هل أنت متأكد من حذف هذا الدرس؟ لا يمكن التراجع عن هذا الإجراء.')) {
        return;
    }
    
    const lessons = JSON.parse(localStorage.getItem('lessons') || '[]');
    const updatedLessons = lessons.filter(l => l.id !== lessonId);
    
    localStorage.setItem('lessons', JSON.stringify(updatedLessons));
    
    showAuthNotification('تم حذف الدرس بنجاح', 'success');
    loadLessons();
    updateLibraryStats();
}

// ============================================
// إدارة التمارين
// ============================================

function showCreateExerciseModal() {
    const modal = document.getElementById('createExerciseModal');
    if (modal) {
        modal.classList.add('show');
    } else {
        // إذا لم تكن النافذة موجودة، أنشئها ديناميكياً
        createDynamicExerciseModal();
    }
}

function createDynamicExerciseModal() {
    // إنشاء نافذة منبثقة ديناميكية
    const modalHTML = `
        <div class="modal" id="createExerciseModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>إنشاء تمرين جديد</h3>
                    <button class="modal-close" onclick="closeCreateExerciseModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <p>ميزة إنشاء التمارين قيد التطوير. سيتم إضافتها قريباً.</p>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="closeCreateExerciseModal()">إغلاق</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // إظهار النافذة بعد إنشائها
    setTimeout(() => {
        document.getElementById('createExerciseModal').classList.add('show');
    }, 100);
}

function closeCreateExerciseModal() {
    const modal = document.getElementById('createExerciseModal');
    if (modal) {
        modal.classList.remove('show');
        // إزالة النافذة من DOM بعد الاختفاء
        setTimeout(() => {
            if (modal.parentElement) {
                modal.remove();
            }
        }, 300);
    }
}

// ============================================
// إدارة الأهداف التعليمية
// ============================================

function showCreateObjectiveModal() {
    const modal = document.getElementById('createObjectiveModal');
    if (modal) {
        modal.classList.add('show');
        document.getElementById('createObjectiveForm')?.reset();
    } else {
        createDynamicObjectiveModal();
    }
}

function createDynamicObjectiveModal() {
    const modalHTML = `
        <div class="modal" id="createObjectiveModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>إنشاء هدف تعليمي جديد</h3>
                    <button class="modal-close" onclick="closeCreateObjectiveModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="createObjectiveForm">
                        <div class="form-group">
                            <label>عنوان الهدف *</label>
                            <input type="text" name="objectiveTitle" class="form-control" required 
                                   placeholder="مثال: قراءة الكلمات المكونة من ثلاثة أحرف">
                        </div>
                        <div class="form-group">
                            <label>المادة *</label>
                            <select name="objectiveSubject" class="form-control" required>
                                <option value="">اختر المادة</option>
                                <option value="لغتي">لغتي</option>
                                <option value="رياضيات">رياضيات</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>المستوى</label>
                            <select name="objectiveLevel" class="form-control">
                                <option value="مبتدئ">مبتدئ</option>
                                <option value="متوسط">متوسط</option>
                                <option value="متقدم">متقدم</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>وصف الهدف</label>
                            <textarea name="objectiveDescription" class="form-control" rows="3"
                                      placeholder="وصف تفصيلي للهدف التعليمي..."></textarea>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="closeCreateObjectiveModal()">إلغاء</button>
                    <button class="btn btn-success" onclick="createNewObjective()">حفظ الهدف</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    setTimeout(() => {
        document.getElementById('createObjectiveModal').classList.add('show');
    }, 100);
}

function closeCreateObjectiveModal() {
    const modal = document.getElementById('createObjectiveModal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            if (modal.parentElement) {
                modal.remove();
            }
        }, 300);
    }
}

function createNewObjective() {
    const form = document.getElementById('createObjectiveForm');
    if (!form) return;
    
    const title = form.querySelector('[name="objectiveTitle"]')?.value.trim();
    const subject = form.querySelector('[name="objectiveSubject"]')?.value;
    const level = form.querySelector('[name="objectiveLevel"]')?.value;
    const description = form.querySelector('[name="objectiveDescription"]')?.value.trim();
    
    if (!title || !subject) {
        showAuthNotification('يرجى ملء جميع الحقول الإجبارية', 'error');
        return;
    }
    
    const currentUser = getCurrentUser();
    const objectives = JSON.parse(localStorage.getItem('teachingObjectives') || '[]');
    
    const newObjective = {
        id: generateId(),
        title: title,
        subject: subject,
        level: level || 'مبتدئ',
        description: description,
        teacherId: currentUser.id,
        teacherName: currentUser.name,
        linkedContent: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    objectives.push(newObjective);
    localStorage.setItem('teachingObjectives', JSON.stringify(objectives));
    
    showAuthNotification('تم إنشاء الهدف التعليمي بنجاح', 'success');
    closeCreateObjectiveModal();
    loadTeachingObjectives();
    updateLibraryStats();
}

// ============================================
// إنشاء الاختبارات التشخيصية
// ============================================

function showCreateTestModal() {
    const modal = document.getElementById('createTestModal');
    if (modal) {
        modal.classList.add('show');
    } else {
        // إذا لم تكن النافذة موجودة، انتقل مباشرة إلى صفحة إنشاء الاختبار
        window.location.href = 'create-test.html';
    }
}

function closeCreateTestModal() {
    const modal = document.getElementById('createTestModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

// ============================================
// دوال البحث والفلترة
// ============================================

function searchContent() {
    const searchInput = document.querySelector('.library-tabs .search-box input');
    const searchTerm = searchInput?.value.toLowerCase() || '';
    
    if (!searchTerm) return;
    
    const activeTab = document.querySelector('.library-tabs .tab-btn.active');
    if (!activeTab) return;
    
    const tabId = activeTab.getAttribute('data-tab');
    
    switch (tabId) {
        case 'lessons':
            searchLessons(searchTerm);
            break;
        case 'exercises':
            searchExercises(searchTerm);
            break;
        case 'objectives':
            searchObjectives(searchTerm);
            break;
    }
}

function searchLessons(searchTerm) {
    const currentUser = getCurrentUser();
    const lessons = JSON.parse(localStorage.getItem('lessons') || '[]');
    const userLessons = lessons.filter(lesson => lesson.teacherId === currentUser.id);
    
    const filteredLessons = userLessons.filter(lesson => 
        lesson.title.toLowerCase().includes(searchTerm) ||
        lesson.description.toLowerCase().includes(searchTerm) ||
        lesson.subject.toLowerCase().includes(searchTerm)
    );
    
    const lessonsList = document.getElementById('lessonsList');
    if (!lessonsList) return;
    
    if (filteredLessons.length === 0) {
        lessonsList.innerHTML = `
            <div class="empty-content-state">
                <div class="empty-icon">🔍</div>
                <h3>لا توجد نتائج</h3>
                <p>لم يتم العثور على دروس تطابق البحث: "${searchTerm}"</p>
            </div>
        `;
        return;
    }
    
    // عرض الدروس المصفاة (بنفس تنسيق loadLessons)
    lessonsList.innerHTML = filteredLessons.map(lesson => {
        const subjectClass = lesson.subject === 'لغتي' ? 'subject-لغتي' : 'subject-رياضيات';
        const statusClass = lesson.objectivesLinked ? 'linked' : 'not-linked';
        const statusText = lesson.objectivesLinked ? 'مربوط بأهداف' : 'غير مربوط';
        
        return `
            <div class="content-card">
                <div class="content-header">
                    <h4>${highlightSearchTerm(lesson.title, searchTerm)}</h4>
                    <span class="content-badge ${subjectClass}">
                        ${lesson.subject}
                    </span>
                </div>
                <div class="content-body">
                    <p>${highlightSearchTerm(lesson.description || '', searchTerm)}</p>
                </div>
                <div class="content-meta">
                    <span class="questions-count">
                        <i class="fas fa-question-circle"></i> ${lesson.questionsCount || 0}
                    </span>
                    <span class="exercises-count">
                        <i class="fas fa-running"></i> ${lesson.exercisesCount || 0}
                    </span>
                    <span class="objectives-status ${statusClass}">
                        <i class="fas fa-link"></i> ${statusText}
                    </span>
                </div>
                <div class="content-actions">
                    <button class="btn btn-sm btn-primary" onclick="viewLesson(${lesson.id})">
                        <i class="fas fa-eye"></i> عرض
                    </button>
                    <button class="btn btn-sm btn-warning" onclick="editLesson(${lesson.id})">
                        <i class="fas fa-edit"></i> تعديل
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function highlightSearchTerm(text, term) {
    if (!term || !text) return text;
    
    const regex = new RegExp(`(${term})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
}

// ============================================
// دوال مساعدة
// ============================================

function redirectToLogin() {
    showAuthNotification('يجب تسجيل الدخول أولاً', 'warning');
    setTimeout(() => {
        window.location.href = '../../index.html';
    }, 2000);
}

function addSystemLog(message, type = 'info') {
    try {
        const logs = JSON.parse(localStorage.getItem('systemLogs') || '[]');
        const currentUser = getCurrentUser();
        
        logs.push({
            timestamp: new Date().toISOString(),
            type: type,
            message: message,
            user: currentUser ? currentUser.name : 'النظام'
        });
        
        localStorage.setItem('systemLogs', JSON.stringify(logs));
    } catch (error) {
        console.error('خطأ في إضافة سجل النظام:', error);
    }
}

// ============================================
// تصدير الدوال للاستخدام العالمي
// ============================================

window.showCreateLessonModal = showCreateLessonModal;
window.closeCreateLessonModal = closeCreateLessonModal;
window.createNewLesson = createNewLesson;
window.viewLesson = viewLesson;
window.closeViewLessonModal = closeViewLessonModal;
window.editLesson = editLesson;
window.linkLessonObjectives = linkLessonObjectives;
window.closeLinkObjectivesModal = closeLinkObjectivesModal;
window.linkSelectedObjectives = linkSelectedObjectives;
window.deleteLesson = deleteLesson;

window.showCreateExerciseModal = showCreateExerciseModal;
window.closeCreateExerciseModal = closeCreateExerciseModal;

window.showCreateObjectiveModal = showCreateObjectiveModal;
window.closeCreateObjectiveModal = closeCreateObjectiveModal;
window.createNewObjective = createNewObjective;

window.showCreateTestModal = showCreateTestModal;
window.closeCreateTestModal = closeCreateTestModal;

window.searchContent = searchContent;
