// دالة المساعدة لتنسيق التاريخ
function formatDate(dateString) {
    if (!dateString) return 'غير محدد';
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// دالة المساعدة لتنسيق التاريخ المختصر
function formatDateShort(dateString) {
    if (!dateString) return 'غير محدد';
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA');
}

// دالة لإنشاء معرف فريد
function generateId() {
    return Math.floor(Math.random() * 1000000) + 1;
}

// دالة التحقق من المستخدم الحالي
function getCurrentUser() {
    const sessionData = sessionStorage.getItem('currentUser');
    return sessionData ? JSON.parse(sessionData).user : null;
}

// دالة التحقق من الجلسة
function checkAuth() {
    const user = getCurrentUser();
    
    if (!user) {
        showAuthNotification('يجب تسجيل الدخول أولاً', 'warning');
        setTimeout(() => {
            window.location.href = '../../index.html';
        }, 2000);
        return null;
    }
    
    return user;
}

// دالة إظهار الإشعارات
function showAuthNotification(message, type = 'info', duration = 5000) {
    const notification = document.createElement('div');
    notification.className = `auth-notification auth-notification-${type}`;
    notification.innerHTML = `
        <div class="auth-notification-content">
            <span class="auth-notification-message">${message}</span>
            <button class="auth-notification-close">&times;</button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('auth-notification-show');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('auth-notification-show');
        setTimeout(() => notification.remove(), 300);
    }, duration);
}

// تصدير الدوال للاستخدام العالمي
window.formatDate = formatDate;
window.formatDateShort = formatDateShort;
window.generateId = generateId;
window.getCurrentUser = getCurrentUser;
window.checkAuth = checkAuth;
