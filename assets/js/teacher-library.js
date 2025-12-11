// ============================================
// 📁 الملف: muyasir-main/assets/js/teacher-library.js
// ============================================

// تهيئة مكتبة المحتوى التعليمي
document.addEventListener('DOMContentLoaded', function() {
    // تحقق إذا كنا في صفحة مكتبة المحتوى
    const currentPath = window.location.pathname;
    const isLibraryPage = currentPath.includes('library.html') || 
                         currentPath.includes('content-library.html');
    
    if (isLibraryPage) {
        console.log('📚 تهيئة مكتبة المحتوى التعليمي...');
        initializeTeacherLibrary();
    }
});

function initializeTeacherLibrary() {
    // التحقق من المصادقة أولاً
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== 'teacher') {
        showAuthNotification('يجب تسجيل الدخول كمعلم للوصول إلى المكتبة', 'error');
        setTimeout(() => {
            window.location.href = '../../index.html';
        }, 2000);
        return;
    }
    
    // تحميل المحتوى
    loadEducationalContent();
    setupLibraryFilters();
    setupContentActions();
    
    // تحديث الإحصائيات
    updateLibraryStats();
}

function loadEducationalContent() {
    const contentGrid = document.getElementById('contentGrid');
    const emptyState = document.getElementById('libraryEmptyState');
    
    if (!contentGrid) {
        console.error('عنصر contentGrid غير موجود في الصفحة');
        return;
    }
    
    // عرض حالة التحميل
    contentGrid.innerHTML = `
        <div class="loading-state">
            <div class="loading-spinner"></div>
            <p>جاري تحميل المحتوى التعليمي...</p>
        </div>
    `;
    
    // محاكاة تأخير الشبكة
    setTimeout(() => {
        // جلب البيانات من localStorage
        const contents = JSON.parse(localStorage.getItem('educationalContent') || '[]');
        const currentUser = getCurrentUser();
        
        // تصفية محتوى المعلم الحالي فقط
        const teacherContents = contents.filter(content => 
            content.teacherId === currentUser.id
        );
        
        if (teacherContents.length === 0) {
            contentGrid.innerHTML = '';
            if (emptyState) {
                emptyState.style.display = 'block';
            }
            return;
        }
        
        if (emptyState) {
            emptyState.style.display = 'none';
        }
        
        // بناء شبكة المحتوى
        contentGrid.innerHTML = teacherContents.map(content => `
            <div class="content-card" data-content-id="${content.id}">
                <div class="content-header">
                    <h4>${content.title || 'بدون عنوان'}</h4>
                    <span class="content-badge subject-${content.subject || 'عام'}">
                        ${content.subject || 'عام'}
                    </span>
                </div>
                <div class="content-body">
                    <p>${content.description || 'لا يوجد وصف'}</p>
                    <div class="content-meta">
                        ${content.questions ? `<span class="questions-count">${content.questions} سؤال</span>` : ''}
                        ${content.exercises ? `<span class="exercises-count">${content.exercises} تمرين</span>` : ''}
                        ${content.strategy ? `<span class="strategy">${content.strategy}</span>` : ''}
                        ${content.priority ? `<span class="priority">${content.priority}</span>` : ''}
                        ${content.grade ? `<span class="total-grade">${content.grade} درجة</span>` : ''}
                        <span class="objectives-status ${content.objectivesLinked ? 'linked' : 'not-linked'}">
                            ${content.objectivesLinked ? 'مرتبط بالأهداف' : 'غير مرتبط'}
                        </span>
                    </div>
                </div>
                <div class="content-actions">
                    <button class="btn btn-sm btn-primary" onclick="viewContentDetails(${content.id})">
                        عرض التفاصيل
                    </button>
                    <button class="btn btn-sm btn-info" onclick="linkContentObjectives(${content.id})">
                        ربط الأهداف
                    </button>
                    <button class="btn btn-sm btn-warning" onclick="editContent(${content.id})">
                        تعديل
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteContent(${content.id})">
                        حذف
                    </button>
                </div>
            </div>
        `).join('');
        
        console.log(`✅ تم تحميل ${teacherContents.length} عنصر تعليمي`);
        
    }, 1000);
}

function setupLibraryFilters() {
    // إعداد البحث
    const searchInput = document.getElementById('contentSearch');
    if (searchInput) {
        searchInput.addEventListener('input', filterContent);
    }
    
    // إعداد فلتر المادة
    const subjectFilter = document.getElementById('subjectFilter');
    if (subjectFilter) {
        subjectFilter.addEventListener('change', filterContent);
    }
}

function filterContent() {
    const searchTerm = document.getElementById('contentSearch')?.value.toLowerCase() || '';
    const subjectFilter = document.getElementById('subjectFilter')?.value || 'all';
    const contentCards = document.querySelectorAll('.content-card');
    
    let visibleCount = 0;
    
    contentCards.forEach(card => {
        const title = card.querySelector('h4')?.textContent.toLowerCase() || '';
        const description = card.querySelector('p')?.textContent.toLowerCase() || '';
        const subjectBadge = card.querySelector('.content-badge')?.textContent || '';
        
        let shouldShow = true;
        
        // فلترة حسب البحث
        if (searchTerm && !title.includes(searchTerm) && !description.includes(searchTerm)) {
            shouldShow = false;
        }
        
        // فلترة حسب المادة
        if (subjectFilter !== 'all' && subjectFilter !== subjectBadge) {
            shouldShow = false;
        }
        
        card.style.display = shouldShow ? 'block' : 'none';
        if (shouldShow) visibleCount++;
    });
    
    // عرض رسالة إذا لم توجد نتائج
    const noResults = document.getElementById('noResults');
    if (noResults) {
        noResults.style.display = visibleCount === 0 ? 'block' : 'none';
    }
}

function setupContentActions() {
    // إعداد أزرار التنزيل والاستيراد
    const importBtn = document.getElementById('importContentBtn');
    if (importBtn) {
        importBtn.addEventListener('click', importContent);
    }
    
    const exportBtn = document.getElementById('exportContentBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportContent);
    }
}

function updateLibraryStats() {
    const contents = JSON.parse(localStorage.getItem('educationalContent') || '[]');
    const currentUser = getCurrentUser();
    const teacherContents = contents.filter(content => content.teacherId === currentUser.id);
    
    // تحديث العداد إذا كان العنصر موجوداً
    const contentCount = document.getElementById('contentCount');
    if (contentCount) {
        contentCount.textContent = teacherContents.length;
    }
}

function showAddContentModal() {
    const modal = document.getElementById('addContentModal');
    if (modal) {
        modal.classList.add('show');
    } else {
        console.error('نافذة إضافة المحتوى غير موجودة');
        showAuthNotification('نافذة إضافة المحتوى غير متاحة حالياً', 'error');
    }
}

function closeAddContentModal() {
    const modal = document.getElementById('addContentModal');
    if (modal) {
        modal.classList.remove('show');
        document.getElementById('addContentForm')?.reset();
    }
}

function saveContent() {
    const titleInput = document.getElementById('contentTitle');
    const subjectInput = document.getElementById('contentSubject');
    const descriptionInput = document.getElementById('contentDescription');
    
    if (!titleInput || !subjectInput || !descriptionInput) {
        showAuthNotification('عناصر النموذج غير موجودة', 'error');
        return;
    }
    
    const title = titleInput.value.trim();
    const subject = subjectInput.value;
    const description = descriptionInput.value.trim();
    const questions = document.getElementById('contentQuestions')?.value || 0;
    const exercises = document.getElementById('contentExercises')?.value || 0;
    const strategy = document.getElementById('contentStrategy')?.value || 'تفريقي';
    const priority = document.getElementById('contentPriority')?.value || 'متوسطة';
    
    if (!title || !subject || !description) {
        showAuthNotification('يرجى ملء جميع الحقول الإجبارية', 'error');
        return;
    }
    
    const currentUser = getCurrentUser();
    const contents = JSON.parse(localStorage.getItem('educationalContent') || '[]');
    
    const newContent = {
        id: generateId(),
        title: title,
        subject: subject,
        description: description,
        questions: parseInt(questions),
        exercises: parseInt(exercises),
        strategy: strategy,
        priority: priority,
        grade: 0,
        objectivesLinked: false,
        createdAt: new Date().toISOString(),
        teacherId: currentUser.id,
        teacherName: currentUser.name
    };
    
    contents.push(newContent);
    localStorage.setItem('educationalContent', JSON.stringify(contents));
    
    showAuthNotification('تم إضافة المحتوى التعليمي بنجاح ✓', 'success');
    closeAddContentModal();
    loadEducationalContent();
    updateLibraryStats();
}

function viewContentDetails(contentId) {
    const contents = JSON.parse(localStorage.getItem('educationalContent') || '[]');
    const content = contents.find(c => c.id === contentId);
    
    if (!content) {
        showAuthNotification('المحتوى غير موجود', 'error');
        return;
    }
    
    const modalTitle = document.getElementById('contentModalTitle');
    const modalBody = document.getElementById('contentModalBody');
    
    if (modalTitle) modalTitle.textContent = content.title;
    
    if (modalBody) {
        modalBody.innerHTML = `
            <div class="content-details">
                <div class="detail-item">
                    <strong>المادة:</strong>
                    <span>${content.subject}</span>
                </div>
                <div class="detail-item">
                    <strong>الوصف:</strong>
                    <p>${content.description}</p>
                </div>
                <div class="detail-item">
                    <strong>عدد الأسئلة:</strong>
                    <span>${content.questions}</span>
                </div>
                <div class="detail-item">
                    <strong>عدد التمارين:</strong>
                    <span>${content.exercises}</span>
                </div>
                <div class="detail-item">
                    <strong>استراتيجية التعليم:</strong>
                    <span>${content.strategy}</span>
                </div>
                <div class="detail-item">
                    <strong>الأولوية:</strong>
                    <span>${content.priority}</span>
                </div>
                <div class="detail-item">
                    <strong>تاريخ الإضافة:</strong>
                    <span>${formatDate(content.createdAt)}</span>
                </div>
                <div class="detail-item">
                    <strong>الحالة:</strong>
                    <span class="objectives-status ${content.objectivesLinked ? 'linked' : 'not-linked'}">
                        ${content.objectivesLinked ? 'مرتبط بالأهداف' : 'غير مرتبط'}
                    </span>
                </div>
            </div>
        `;
    }
    
    const modal = document.getElementById('viewContentModal');
    if (modal) {
        modal.classList.add('show');
    }
}

function closeContentModal() {
    const modal = document.getElementById('viewContentModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

function linkContentObjectives(contentId) {
    showAuthNotification('جاري تحميل قائمة الأهداف...', 'info');
    
    setTimeout(() => {
        const contents = JSON.parse(localStorage.getItem('educationalContent') || '[]');
        const contentIndex = contents.findIndex(c => c.id === contentId);
        
        if (contentIndex === -1) {
            showAuthNotification('المحتوى غير موجود', 'error');
            return;
        }
        
        contents[contentIndex].objectivesLinked = true;
        localStorage.setItem('educationalContent', JSON.stringify(contents));
        
        showAuthNotification('تم ربط المحتوى بالأهداف التعليمية ✓', 'success');
        loadEducationalContent();
    }, 1500);
}

function editContent(contentId) {
    const contents = JSON.parse(localStorage.getItem('educationalContent') || '[]');
    const content = contents.find(c => c.id === contentId);
    
    if (!content) {
        showAuthNotification('المحتوى غير موجود', 'error');
        return;
    }
    
    // تعبئة النموذج
    const idInput = document.getElementById('editContentId');
    const titleInput = document.getElementById('editContentTitle');
    const subjectInput = document.getElementById('editContentSubject');
    const descriptionInput = document.getElementById('editContentDescription');
    
    if (idInput) idInput.value = content.id;
    if (titleInput) titleInput.value = content.title;
    if (subjectInput) subjectInput.value = content.subject;
    if (descriptionInput) descriptionInput.value = content.description;
    
    // بقية الحقول
    const questionsInput = document.getElementById('editContentQuestions');
    const exercisesInput = document.getElementById('editContentExercises');
    const strategyInput = document.getElementById('editContentStrategy');
    const priorityInput = document.getElementById('editContentPriority');
    
    if (questionsInput) questionsInput.value = content.questions;
    if (exercisesInput) exercisesInput.value = content.exercises;
    if (strategyInput) strategyInput.value = content.strategy;
    if (priorityInput) priorityInput.value = content.priority;
    
    const modal = document.getElementById('editContentModal');
    if (modal) {
        modal.classList.add('show');
    }
}

function closeEditContentModal() {
    const modal = document.getElementById('editContentModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

function updateContent() {
    const contentId = parseInt(document.getElementById('editContentId')?.value);
    
    if (!contentId) {
        showAuthNotification('معرّف المحتوى غير صالح', 'error');
        return;
    }
    
    const title = document.getElementById('editContentTitle')?.value.trim();
    const subject = document.getElementById('editContentSubject')?.value;
    const description = document.getElementById('editContentDescription')?.value.trim();
    
    if (!title || !subject || !description) {
        showAuthNotification('يرجى ملء جميع الحقول الإجبارية', 'error');
        return;
    }
    
    const contents = JSON.parse(localStorage.getItem('educationalContent') || '[]');
    const contentIndex = contents.findIndex(c => c.id === contentId);
    
    if (contentIndex === -1) {
        showAuthNotification('المحتوى غير موجود', 'error');
        return;
    }
    
    // تحديث البيانات
    contents[contentIndex].title = title;
    contents[contentIndex].subject = subject;
    contents[contentIndex].description = description;
    contents[contentIndex].questions = parseInt(document.getElementById('editContentQuestions')?.value || 0);
    contents[contentIndex].exercises = parseInt(document.getElementById('editContentExercises')?.value || 0);
    contents[contentIndex].strategy = document.getElementById('editContentStrategy')?.value || 'تفريقي';
    contents[contentIndex].priority = document.getElementById('editContentPriority')?.value || 'متوسطة';
    contents[contentIndex].updatedAt = new Date().toISOString();
    
    localStorage.setItem('educationalContent', JSON.stringify(contents));
    
    showAuthNotification('تم تحديث المحتوى بنجاح ✓', 'success');
    closeEditContentModal();
    loadEducationalContent();
}

function deleteContent(contentId) {
    if (!confirm('هل أنت متأكد من حذف هذا المحتوى التعليمي؟ هذا الإجراء لا يمكن التراجع عنه.')) {
        return;
    }
    
    const contents = JSON.parse(localStorage.getItem('educationalContent') || '[]');
    const updatedContents = contents.filter(c => c.id !== contentId);
    
    localStorage.setItem('educationalContent', JSON.stringify(updatedContents));
    
    showAuthNotification('تم حذف المحتوى التعليمي بنجاح ✓', 'success');
    loadEducationalContent();
    updateLibraryStats();
}

function importContent() {
    showAuthNotification('خاصية الاستيراد قيد التطوير', 'info');
}

function exportContent() {
    const currentUser = getCurrentUser();
    const contents = JSON.parse(localStorage.getItem('educationalContent') || '[]');
    const teacherContents = contents.filter(content => content.teacherId === currentUser.id);
    
    if (teacherContents.length === 0) {
        showAuthNotification('لا توجد بيانات للتصدير', 'warning');
        return;
    }
    
    const dataStr = JSON.stringify(teacherContents, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `educational-content-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    showAuthNotification('تم تصدير المحتوى بنجاح ✓', 'success');
}

// تصدير الدوال للاستخدام العالمي
window.showAddContentModal = showAddContentModal;
window.closeAddContentModal = closeAddContentModal;
window.saveContent = saveContent;
window.viewContentDetails = viewContentDetails;
window.closeContentModal = closeContentModal;
window.linkContentObjectives = linkContentObjectives;
window.editContent = editContent;
window.closeEditContentModal = closeEditContentModal;
window.updateContent = updateContent;
window.deleteContent = deleteContent;
window.importContent = importContent;
window.exportContent = exportContent;
