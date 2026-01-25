// ============================================
// 📁 الملف: muyasir-main/assets/js/admin-settings.js
// ============================================

// إدارة إعدادات النظام للمدير
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('settings.html')) {
        initializeAdminSettings();
    }
});

function initializeAdminSettings() {
    loadSystemSettings();
    setupSettingsForm();
    loadBackupHistory();
    loadSystemLogs();
}

function loadSystemSettings() {
    const settings = JSON.parse(localStorage.getItem('systemSettings') || '{}');
    
    // تعبئة النموذج بالإعدادات الحالية
    if (settings) {
        document.getElementById('systemName').value = settings.systemName || 'ميسر التعلم';
        document.getElementById('systemEmail').value = settings.systemEmail || '';
        document.getElementById('sessionTimeout').value = settings.sessionTimeout || 60;
        document.getElementById('maxLoginAttempts').value = settings.maxLoginAttempts || 5;
        document.getElementById('enableNotifications').checked = settings.enableNotifications !== false;
        document.getElementById('enableAutoBackup').checked = settings.enableAutoBackup || false;
        document.getElementById('backupFrequency').value = settings.backupFrequency || 'daily';
    }
}

function setupSettingsForm() {
    const form = document.getElementById('systemSettingsForm');
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        saveSystemSettings();
    });
}

function saveSystemSettings() {
    const settings = {
        systemName: document.getElementById('systemName').value.trim(),
        systemEmail: document.getElementById('systemEmail').value.trim(),
        sessionTimeout: parseInt(document.getElementById('sessionTimeout').value),
        maxLoginAttempts: parseInt(document.getElementById('maxLoginAttempts').value),
        enableNotifications: document.getElementById('enableNotifications').checked,
        enableAutoBackup: document.getElementById('enableAutoBackup').checked,
        backupFrequency: document.getElementById('backupFrequency').value,
        lastUpdated: new Date().toISOString()
    };

    // التحقق من صحة البيانات
    if (!settings.systemName) {
        showAuthNotification('يرجى إدخال اسم النظام', 'error');
        return;
    }

    if (settings.systemEmail && !isValidEmail(settings.systemEmail)) {
        showAuthNotification('البريد الإلكتروني غير صالح', 'error');
        return;
    }

    if (settings.sessionTimeout < 5 || settings.sessionTimeout > 480) {
        showAuthNotification('مهلة الجلسة يجب أن تكون بين 5 و 480 دقيقة', 'error');
        return;
    }

    // حفظ الإعدادات
    localStorage.setItem('systemSettings', JSON.stringify(settings));
    
    // إضافة سجل
    addSystemLog('تم تحديث إعدادات النظام', 'settings');
    
    showAuthNotification('تم حفظ الإعدادات بنجاح', 'success');
    
    // إعادة تحميل الإعدادات لعرض التغييرات
    setTimeout(() => {
        loadSystemSettings();
    }, 1000);
}

function resetSettings() {
    if (confirm('هل أنت متأكد من إعادة تعيين الإعدادات إلى القيم الافتراضية؟')) {
        const defaultSettings = {
            systemName: 'ميسر التعلم',
            systemEmail: '',
            sessionTimeout: 60,
            maxLoginAttempts: 5,
            enableNotifications: true,
            enableAutoBackup: false,
            backupFrequency: 'daily',
            lastUpdated: new Date().toISOString()
        };
        
        localStorage.setItem('systemSettings', JSON.stringify(defaultSettings));
        
        // إضافة سجل
        addSystemLog('تم إعادة تعيين إعدادات النظام', 'settings');
        
        showAuthNotification('تم إعادة تعيين الإعدادات بنجاح', 'success');
        
        // إعادة تحميل النموذج
        setTimeout(() => {
            loadSystemSettings();
        }, 500);
    }
}

function loadBackupHistory() {
    const backupList = document.getElementById('backupList');
    const backups = JSON.parse(localStorage.getItem('systemBackups') || '[]');
    
    if (backups.length === 0) {
        backupList.innerHTML = `
            <tr>
                <td colspan="5" class="text-center">
                    <div class="empty-state">
                        <div class="empty-icon">💾</div>
                        <h3>لا توجد نسخ احتياطية</h3>
                        <p>لم يتم إنشاء أي نسخ احتياطية بعد</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    // ترتيب النسخ الاحتياطية من الأحدث إلى الأقدم
    backups.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    backupList.innerHTML = backups.map((backup, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${formatDate(backup.createdAt)}</td>
            <td>${backup.type === 'manual' ? 'يدوي' : 'تلقائي'}</td>
            <td>${backup.size || 'غير معروف'}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-primary" onclick="downloadBackup(${index})">تحميل</button>
                    <button class="btn btn-sm btn-warning" onclick="restoreBackup(${index})">استعادة</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteBackup(${index})">حذف</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function createBackup() {
    showAuthNotification('جاري إنشاء نسخة احتياطية...', 'info');
    
    setTimeout(() => {
        // جمع جميع البيانات من localStorage
        const backupData = {};
        const keys = [
            'users', 'teachers', 'students', 'tests', 'lessons', 
            'assignments', 'systemSettings', 'committeeMembers',
            'committeeNotes', 'committeeReports', 'loginLogs'
        ];
        
        keys.forEach(key => {
            if (localStorage.getItem(key)) {
                backupData[key] = JSON.parse(localStorage.getItem(key));
            }
        });
        
        // إنشاء كائن النسخة الاحتياطية
        const backups = JSON.parse(localStorage.getItem('systemBackups') || '[]');
        const newBackup = {
            id: generateId(),
            createdAt: new Date().toISOString(),
            type: 'manual',
            data: backupData,
            size: JSON.stringify(backupData).length + ' bytes'
        };
        
        backups.push(newBackup);
        localStorage.setItem('systemBackups', JSON.stringify(backups));
        
        // حفظ البيانات في ملف تنزيل (محاكاة)
        const blob = new Blob([JSON.stringify(backupData, null, 2)], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        // إضافة سجل
        addSystemLog('تم إنشاء نسخة احتياطية يدوية', 'backup');
        
        showAuthNotification('تم إنشاء النسخة الاحتياطية بنجاح', 'success');
        loadBackupHistory();
    }, 2000);
}

function downloadBackup(backupIndex) {
    const backups = JSON.parse(localStorage.getItem('systemBackups') || '[]');
    const backup = backups[backupIndex];
    
    if (!backup) {
        showAuthNotification('النسخة الاحتياطية غير موجودة', 'error');
        return;
    }
    
    const blob = new Blob([JSON.stringify(backup.data, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-${backup.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // إضافة سجل
    addSystemLog(`تم تحميل النسخة الاحتياطية ${backup.id}`, 'backup');
    
    showAuthNotification('تم تحميل النسخة الاحتياطية', 'success');
}

function restoreBackup(backupIndex) {
    const backups = JSON.parse(localStorage.getItem('systemBackups') || '[]');
    const backup = backups[backupIndex];
    
    if (!backup) {
        showAuthNotification('النسخة الاحتياطية غير موجودة', 'error');
        return;
    }
    
    if (!confirm('⚠️ تحذير: استعادة النسخة الاحتياطية ستحل محل جميع البيانات الحالية. هل أنت متأكد؟')) {
        return;
    }
    
    showAuthNotification('جاري استعادة البيانات...', 'warning');
    
    setTimeout(() => {
        // استعادة البيانات من النسخة الاحتياطية
        Object.keys(backup.data).forEach(key => {
            localStorage.setItem(key, JSON.stringify(backup.data[key]));
        });
        
        // إضافة سجل
        addSystemLog(`تم استعادة النسخة الاحتياطية ${backup.id}`, 'backup');
        
        showAuthNotification('تم استعادة النسخة الاحتياطية بنجاح', 'success');
        
        // إعادة تحميل الصفحة بعد التأكيد
        setTimeout(() => {
            if (confirm('تمت الاستعادة بنجاح. هل تريد إعادة تحميل الصفحة؟')) {
                location.reload();
            }
        }, 1000);
    }, 1500);
}

function deleteBackup(backupIndex) {
    const backups = JSON.parse(localStorage.getItem('systemBackups') || '[]');
    
    if (backupIndex >= backups.length) {
        showAuthNotification('النسخة الاحتياطية غير موجودة', 'error');
        return;
    }
    
    const backup = backups[backupIndex];
    
    if (!confirm(`هل أنت متأكد من حذف النسخة الاحتياطية المؤرخة ${formatDate(backup.createdAt)}؟`)) {
        return;
    }
    
    backups.splice(backupIndex, 1);
    localStorage.setItem('systemBackups', JSON.stringify(backups));
    
    // إضافة سجل
    addSystemLog(`تم حذف النسخة الاحتياطية ${backup.id}`, 'backup');
    
    showAuthNotification('تم حذف النسخة الاحتياطية بنجاح', 'success');
    loadBackupHistory();
}

function loadSystemLogs() {
    const logsList = document.getElementById('logsList');
    const logs = JSON.parse(localStorage.getItem('systemLogs') || '[]');
    
    if (logs.length === 0) {
        logsList.innerHTML = `
            <tr>
                <td colspan="4" class="text-center">
                    <div class="empty-state">
                        <div class="empty-icon">📋</div>
                        <h3>لا توجد سجلات نظام</h3>
                        <p>سيظهر هنا سجل الأنشطة والنظام</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    // ترتيب السجلات من الأحدث إلى الأقدم
    logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // عرض آخر 50 سجل فقط
    const recentLogs = logs.slice(0, 50);
    
    logsList.innerHTML = recentLogs.map(log => `
        <tr>
            <td>${formatDate(log.timestamp)}</td>
            <td>
                <span class="log-type-${log.type}">${getLogTypeText(log.type)}</span>
            </td>
            <td>${log.message}</td>
            <td>${log.user || 'النظام'}</td>
        </tr>
    `).join('');
}

function addSystemLog(message, type = 'info', user = null) {
    const logs = JSON.parse(localStorage.getItem('systemLogs') || '[]');
    const currentUser = getCurrentUser();
    
    logs.push({
        timestamp: new Date().toISOString(),
        type: type,
        message: message,
        user: user || (currentUser ? currentUser.name : 'النظام')
    });
    
    // الاحتفاظ فقط بآخر 1000 سجل
    if (logs.length > 1000) {
        logs.splice(0, logs.length - 1000);
    }
    
    localStorage.setItem('systemLogs', JSON.stringify(logs));
    
    // تحديث عرض السجلات إذا كانت الصفحة مفتوحة
    if (window.location.pathname.includes('settings.html')) {
        loadSystemLogs();
    }
}

function clearLogs() {
    if (!confirm('هل أنت متأكد من مسح جميع سجلات النظام؟ لا يمكن التراجع عن هذا الإجراء.')) {
        return;
    }
    
    localStorage.removeItem('systemLogs');
    
    // إضافة سجل للمسح نفسه
    addSystemLog('تم مسح جميع سجلات النظام', 'warning');
    
    showAuthNotification('تم مسح سجلات النظام بنجاح', 'success');
    loadSystemLogs();
}

function exportLogs() {
    const logs = JSON.parse(localStorage.getItem('systemLogs') || '[]');
    
    if (logs.length === 0) {
        showAuthNotification('لا توجد سجلات للتصدير', 'warning');
        return;
    }
    
    const logText = logs.map(log => 
        `${formatDate(log.timestamp)} - ${getLogTypeText(log.type)} - ${log.user || 'النظام'}: ${log.message}`
    ).join('\n');
    
    const blob = new Blob([logText], {type: 'text/plain'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system-logs-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showAuthNotification('تم تصدير سجلات النظام بنجاح', 'success');
}

// دوال مساعدة
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function getLogTypeText(type) {
    const types = {
        'info': 'معلومات',
        'warning': 'تحذير',
        'error': 'خطأ',
        'success': 'نجاح',
        'settings': 'إعدادات',
        'backup': 'نسخ احتياطي',
        'user': 'مستخدم',
        'security': 'أمان'
    };
    return types[type] || type;
}

function filterLogs() {
    const filterType = document.getElementById('logFilter').value;
    const searchTerm = document.getElementById('logSearch').value.toLowerCase();
    const rows = document.querySelectorAll('#logsList tr');
    
    rows.forEach(row => {
        if (row.cells.length < 4) return; // تخطى صفوف الرسائل الفارغة
        
        const type = row.cells[1].querySelector('span')?.className || '';
        const message = row.cells[2].textContent.toLowerCase();
        const user = row.cells[3].textContent.toLowerCase();
        
        let showRow = true;
        
        // الفلترة حسب النوع
        if (filterType !== 'all' && !type.includes(filterType)) {
            showRow = false;
        }
        
        // البحث في النص
        if (searchTerm && !message.includes(searchTerm) && !user.includes(searchTerm)) {
            showRow = false;
        }
        
        row.style.display = showRow ? '' : 'none';
    });
}

function clearSearch() {
    document.getElementById('logSearch').value = '';
    filterLogs();
}

// تصدير الدوال للاستخدام العالمي
window.resetSettings = resetSettings;
window.createBackup = createBackup;
window.downloadBackup = downloadBackup;
window.restoreBackup = restoreBackup;
window.deleteBackup = deleteBackup;
window.clearLogs = clearLogs;
window.exportLogs = exportLogs;
window.filterLogs = filterLogs;
window.clearSearch = clearSearch;
