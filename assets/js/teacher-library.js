// ============================================
// 📁 الملف: muyasir-main/assets/js/teacher-library.js
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('library.html')) {
        initializeTeacherLibrary();
    }
});

function initializeTeacherLibrary() {
    loadEducationalContent();
    setupLibraryFilters();
    setupContentModal();
}

function loadEducationalContent() {
    const contentGrid = document.getElementById('contentGrid');
    
    if (!contentGrid) return;
    
    // محاكاة بيانات المحتوى التعليمي
    const contentData = [
        {
            id: 1,
            title: 'درس في القراءة',
            subject: 'لغتي',
            description: 'تمارين قراءة للصف الأول',
            questions: 10,
            exercises: 5,
            strategy: 'تعاوني',
            priority: 'عالية',
            grade: 90,
            objectivesLinked: true
        },
        {
            id: 2,
            title: 'تمارين رياضيات',
            subject: 'رياضيات',
            description: 'تمارين جمع وطرح',
            questions: 15,
            exercises: 8,
            strategy: 'تفريقي',
            priority: 'متوسطة',
            grade: 85,
            objectivesLinked: false
        }
    ];
    
    if (contentData.length === 0) {
        contentGrid.innerHTML = `
            <div class="empty-content-state">
                <div class="empty-icon">📚</div>
                <h3>لا يوجد محتوى تعليمي</h3>
                <p>قم بإضافة أول محتوى تعليمي للبدء</p>
                <button class="btn btn-success" onclick="showAddContentModal()">
                    إضافة محتوى جديد
                </button>
            </div>
        `;
        return;
    }
    
    contentGrid.innerHTML = contentData.map(content => `
        <div class="content-card">
            <div class="content-header">
                <h4>${content.title}</h4>
                <span class="content-badge subject-${content.subject}">
                    ${content.subject}
                </span>
            </div>
            <div class="content-body">
                <p>${content.description}</p>
                <div class="content-meta">
                    <span class="questions-count">${content.questions} سؤال</span>
                    <span class="exercises-count">${content.exercises} تمرين</span>
                    <span class="strategy">${content.strategy}</span>
                    <span class="priority">${content.priority}</span>
                    <span class="total-grade">${content.grade} درجة</span>
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
}

function setupLibraryFilters() {
    // إعداد فلاتر البحث
    const searchInput = document.querySelector('.content-search');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            filterContent();
        });
    }
    
    const subjectFilter = document.querySelector('.subject-filter');
    if (subjectFilter) {
        subjectFilter.addEventListener('change', function() {
            filterContent();
        });
    }
}

function filterContent() {
    const searchTerm = document.querySelector('.content-search')?.value.toLowerCase() || '';
    const subjectFilter = document.querySelector('.subject-filter')?.value || 'all';
    const contentCards = document.querySelectorAll('.content-card');
    
    contentCards.forEach(card => {
        const title = card.querySelector('h4').textContent.toLowerCase();
        const description = card.querySelector('p').textContent.toLowerCase();
        const subjectBadge = card.querySelector('.content-badge').textContent;
        
        let shouldShow = true;
        
        // فلترة حسب البحث
        if (searchTerm && !title.includes(searchTerm) && !description.includes(searchTerm)) {
            shouldShow = false;
        }
        
        // فلترة حسب المادة
        if (subjectFilter !== 'all' && !subjectBadge.includes(subjectFilter)) {
            shouldShow = false;
        }
        
        card.style.display = shouldShow ? 'block' : 'none';
    });
}

function showAddContentModal() {
    document.getElementById('addContentModal').classList.add('show');
}

function closeAddContentModal() {
    document.getElementById('addContentModal').classList.remove('show');
}

function saveContent() {
    const title = document.getElementById('contentTitle').value.trim();
    const subject = document.getElementById('contentSubject').value;
    const description = document.getElementById('contentDescription').value.trim();
    const questions = document.getElementById('contentQuestions').value;
    const exercises = document.getElementById('contentExercises').value;
    
    if (!title || !subject || !description) {
        showAuthNotification('يرجى ملء جميع الحقول الإجبارية', 'error');
        return;
    }
    
    // حفظ المحتوى في localStorage
    const contents = JSON.parse(localStorage.getItem('educationalContent') || '[]');
    const newContent = {
        id: generateId(),
        title: title,
        subject: subject,
        description: description,
        questions: parseInt(questions) || 0,
        exercises: parseInt(exercises) || 0,
        createdAt: new Date().toISOString(),
        teacherId: getCurrentUser()?.id
    };
    
    contents.push(newContent);
    localStorage.setItem('educationalContent', JSON.stringify(contents));
    
    showAuthNotification('تم إضافة المحتوى التعليمي بنجاح', 'success');
    closeAddContentModal();
    loadEducationalContent();
}

function viewContentDetails(contentId) {
    const contents = JSON.parse(localStorage.getItem('educationalContent') || '[]');
    const content = contents.find(c => c.id === contentId);
    
    if (!content) {
        showAuthNotification('المحتوى غير موجود', 'error');
        return;
    }
    
    document.getElementById('contentModalTitle').textContent = content.title;
    document.getElementById('contentModalBody').innerHTML = `
        <div class="content-details">
            <p><strong>المادة:</strong> ${content.subject}</p>
            <p><strong>الوصف:</strong> ${content.description}</p>
            <p><strong>عدد الأسئلة:</strong> ${content.questions}</p>
            <p><strong>عدد التمارين:</strong> ${content.exercises}</p>
            <p><strong>تاريخ الإضافة:</strong> ${formatDate(content.createdAt)}</p>
        </div>
    `;
    
    document.getElementById('viewContentModal').classList.add('show');
}

function closeContentModal() {
    document.getElementById('viewContentModal').classList.remove('show');
}

function linkContentObjectives(contentId) {
    const contents = JSON.parse(localStorage.getItem('educationalContent') || '[]');
    const contentIndex = contents.findIndex(c => c.id === contentId);
    
    if (contentIndex === -1) {
        showAuthNotification('المحتوى غير موجود', 'error');
        return;
    }
    
    // في التطبيق الحقيقي، سيتم عرض قائمة الأهداف للربط
    showAuthNotification('جاري تحميل قائمة الأهداف للربط...', 'info');
    
    setTimeout(() => {
        contents[contentIndex].objectivesLinked = true;
        localStorage.setItem('educationalContent', JSON.stringify(contents));
        
        showAuthNotification('تم ربط المحتوى بالأهداف التعليمية', 'success');
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
    
    // تعبئة نموذج التعديل
    document.getElementById('editContentId').value = content.id;
    document.getElementById('editContentTitle').value = content.title;
    document.getElementById('editContentSubject').value = content.subject;
    document.getElementById('editContentDescription').value = content.description;
    document.getElementById('editContentQuestions').value = content.questions;
    document.getElementById('editContentExercises').value = content.exercises;
    
    document.getElementById('editContentModal').classList.add('show');
}

function closeEditContentModal() {
    document.getElementById('editContentModal').classList.remove('show');
}

function updateContent() {
    const contentId = parseInt(document.getElementById('editContentId').value);
    const title = document.getElementById('editContentTitle').value.trim();
    const subject = document.getElementById('editContentSubject').value;
    const description = document.getElementById('editContentDescription').value.trim();
    const questions = document.getElementById('editContentQuestions').value;
    const exercises = document.getElementById('editContentExercises').value;
    
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
    
    contents[contentIndex].title = title;
    contents[contentIndex].subject = subject;
    contents[contentIndex].description = description;
    contents[contentIndex].questions = parseInt(questions) || 0;
    contents[contentIndex].exercises = parseInt(exercises) || 0;
    contents[contentIndex].updatedAt = new Date().toISOString();
    
    localStorage.setItem('educationalContent', JSON.stringify(contents));
    
    showAuthNotification('تم تحديث المحتوى بنجاح', 'success');
    closeEditContentModal();
    loadEducationalContent();
}

function deleteContent(contentId) {
    if (!confirm('هل أنت متأكد من حذف هذا المحتوى التعليمي؟')) {
        return;
    }
    
    const contents = JSON.parse(localStorage.getItem('educationalContent') || '[]');
    const updatedContents = contents.filter(c => c.id !== contentId);
    
    localStorage.setItem('educationalContent', JSON.stringify(updatedContents));
    
    showAuthNotification('تم حذف المحتوى التعليمي بنجاح', 'success');
    loadEducationalContent();
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
