// تهيئة السنة الحالية في التذييل
document.addEventListener('DOMContentLoaded', function() {
    // تحديث السنة في التذييل
    const currentYear = new Date().getFullYear();
    document.getElementById('currentYear').textContent = currentYear;
    
    // تهيئة النظام
    initializeSystem();
});

function initializeSystem() {
    console.log('نظام ميسر التعلم - تم التهيئة');
    
    // التحقق من دعم localStorage
    if (!isLocalStorageSupported()) {
        showNotification('المتصفح لا يدعم التخزين المحلي. بعض الميزات قد لا تعمل بشكل صحيح.', 'warning');
    }
    
    // تحميل البيانات الأولية إذا لم تكن موجودة
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
    // البيانات الأساسية للنظام
    const initialData = {
        users: [],
        teachers: [],
        students: [],
        tests: [],
        lessons: [],
        assignments: []
    };
    
    // تهيئة البيانات إذا لم تكن موجودة
    Object.keys(initialData).forEach(key => {
        if (!localStorage.getItem(key)) {
            localStorage.setItem(key, JSON.stringify(initialData[key]));
        }
    });
}

function showAbout() {
    alert('نظام ميسر التعلم - تم التطوير لدعم ذوي صعوبات التعلم\nالمطور: الأستاذ / صالح عبد العزيز عبدالله العجلان');
}

function showNotification(message, type = 'info') {
    // إنشاء عنصر الإشعار
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()">&times;</button>
        </div>
    `;
    
    // إضافة الأنماط إذا لم تكن موجودة
    if (!document.querySelector('#notification-styles')) {
        const styles = document.createElement('style');
        styles.id = 'notification-styles';
        styles.textContent = `
            .notification {
                position: fixed;
                top: 100px;
                left: 20px;
                right: 20px;
                background: white;
                padding: 15px;
                border-radius: 5px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 10000;
                border-right: 4px solid #3498db;
            }
            .notification-success { border-right-color: #27ae60; }
            .notification-warning { border-right-color: #f39c12; }
            .notification-error { border-right-color: #e74c3c; }
            .notification-content {
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .notification-content button {
                background: none;
                border: none;
                font-size: 1.2rem;
                cursor: pointer;
                color: #666;
            }
        `;
        document.head.appendChild(styles);
    }
    
    document.body.appendChild(notification);
    
    // إزالة الإشعار تلقائياً بعد 5 ثوانٍ
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// دوال مساعدة للتعامل مع localStorage
function saveToStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (e) {
        console.error('خطأ في حفظ البيانات:', e);
        return false;
    }
}

function getFromStorage(key) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    } catch (e) {
        console.error('خطأ في قراءة البيانات:', e);
        return null;
    }
}