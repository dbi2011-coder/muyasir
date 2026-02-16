document.addEventListener('DOMContentLoaded', function() {
    // تحديث السنة في التذييل
    const yearSpan = document.getElementById('currentYear');
    if(yearSpan) yearSpan.textContent = new Date().getFullYear();
    
    // تهيئة النظام
    initializeSystem();
});

function initializeSystem() {
    console.log('نظام ميسر التعلم - تم التهيئة');
    if (!isLocalStorageSupported()) {
        console.warn('المتصفح لا يدعم التخزين المحلي.');
    }
    initializeData();
}

function isLocalStorageSupported() {
    try {
        const test = 'test';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
    } catch (e) {
        return false;
    }
}

function initializeData() {
    const initialData = {
        users: [],
        teachers: [],
        students: [],
        tests: [],
        lessons: [],
        assignments: []
    };
    Object.keys(initialData).forEach(key => {
        if (!localStorage.getItem(key)) {
            localStorage.setItem(key, JSON.stringify(initialData[key]));
        }
    });
}
