// إدارة الأهداف القصيرة
document.addEventListener('DOMContentLoaded', function() {
    initializeShortTermObjectives();
});

function initializeShortTermObjectives() {
    // إنشاء أهداف افتراضية إذا لم تكن موجودة
    if (!localStorage.getItem('shortTermObjectives')) {
        const defaultObjectives = [
            // أهداف مادة لغتي
            { id: 1, subject: 'لغتي', text: 'التعرف على الحروف العربية', grade: 'الصف الأول' },
            { id: 2, subject: 'لغتي', text: 'قراءة الكلمات البسيطة', grade: 'الصف الأول' },
            { id: 3, subject: 'لغتي', text: 'كتابة الحروف بشكل صحيح', grade: 'الصف الأول' },
            { id: 4, subject: 'لغتي', text: 'التعرف على الحركات (الفتحة، الكسرة، الضمة)', grade: 'الصف الأول' },
            
            // أهداف مادة الرياضيات
            { id: 5, subject: 'رياضيات', text: 'التعرف على الأرقام من 1 إلى 10', grade: 'الصف الأول' },
            { id: 6, subject: 'رياضيات', text: 'الجمع البسيط حتى 10', grade: 'الصف الأول' },
            { id: 7, subject: 'رياضيات', text: 'الطرح البسيط حتى 10', grade: 'الصف الأول' },
            { id: 8, subject: 'رياضيات', text: 'التعرف على الأشكال الهندسية البسيطة', grade: 'الصف الأول' }
        ];
        
        localStorage.setItem('shortTermObjectives', JSON.stringify(defaultObjectives));
    }
}

function getShortTermObjectives(subject = null, grade = null) {
    const objectives = JSON.parse(localStorage.getItem('shortTermObjectives') || '[]');
    
    let filtered = objectives;
    
    if (subject) {
        filtered = filtered.filter(obj => obj.subject === subject);
    }
    
    if (grade) {
        filtered = filtered.filter(obj => obj.grade === grade);
    }
    
    return filtered;
}

function addShortTermObjective(objective) {
    const objectives = getShortTermObjectives();
    objective.id = generateId();
    objectives.push(objective);
    localStorage.setItem('shortTermObjectives', JSON.stringify(objectives));
}

function updateShortTermObjective(id, updatedObjective) {
    const objectives = getShortTermObjectives();
    const index = objectives.findIndex(obj => obj.id === id);
    
    if (index !== -1) {
        objectives[index] = { ...objectives[index], ...updatedObjective };
        localStorage.setItem('shortTermObjectives', JSON.stringify(objectives));
    }
}

function deleteShortTermObjective(id) {
    const objectives = getShortTermObjectives();
    const updatedObjectives = objectives.filter(obj => obj.id !== id);
    localStorage.setItem('shortTermObjectives', JSON.stringify(updatedObjectives));
}
