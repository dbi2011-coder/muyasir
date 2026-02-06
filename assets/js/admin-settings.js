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
        if(document.getElementById('systemName')) document.getElementById('systemName').value = settings.systemName || 'ميسر التعلم';
        if(document.getElementById('systemEmail')) document.getElementById('systemEmail').value = settings.systemEmail || '';
        if(document.getElementById('sessionTimeout')) document.getElementById('sessionTimeout').value = settings.sessionTimeout || 60;
        // تم حذف maxLoginAttempts سابقاً بناء على طلبك، لكن نبقيه في الكود في حال كان موجوداً في الذاكرة
        if(document.getElementById('enableNotifications')) document.getElementById('enableNotifications').checked = settings.enableNotifications !== false;
        if(document.getElementById('enableAutoBackup')) document.getElementById('enableAutoBackup').checked = settings.enableAutoBackup || false;
        if(document.getElementById('backupFrequency')) document.getElementById('backupFrequency').value = settings.backupFrequency || 'daily';
    }
}

function setupSettingsForm() {
    const form = document.getElementById('systemSettingsForm');
    if (!form) return;

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        saveSystemSettings();
    });
}

function saveSystemSettings() {
    const oldSettings = JSON.parse(localStorage.getItem('systemSettings') || '{}');
    
    const settings = {
        ...oldSettings,
        sessionTimeout: parseInt(document.getElementById('sessionTimeout').value),
        enableNotifications: document.getElementById('enableNotifications').checked,
        enableAutoBackup: document.getElementById('enableAutoBackup').checked,
        lastUpdated: new Date().toISOString()
    };

    if (settings.sessionTimeout < 5 || settings.sessionTimeout > 480) {
        alert('مهلة الجلسة يجب أن تكون بين 5 و 480 دقيقة');
        return;
    }

    localStorage.setItem('systemSettings', JSON.stringify(settings));
    addSystemLog('تم تحديث إعدادات النظام', 'settings');
    alert('تم حفظ الإعدادات بنجاح');
    
    setTimeout(() => { loadSystemSettings(); }, 1000);
}

function resetSettings() {
    if (confirm('هل أنت متأكد من إعادة تعيين الإعدادات إلى القيم الافتراضية؟')) {
        const defaultSettings = {
            systemName: 'ميسر التعلم',
            sessionTimeout: 60,
            enableNotifications: true,
            enableAutoBackup: false,
            lastUpdated: new Date().toISOString()
        };
        
        localStorage.setItem('systemSettings', JSON.stringify(defaultSettings));
        addSystemLog('تم إعادة تعيين إعدادات النظام', 'settings');
        alert('تم إعادة تعيين الإعدادات بنجاح');
        
        setTimeout(() => { loadSystemSettings(); }, 500);
    }
}

// ----------------------------------------------------------------
// 🔥 قسم النسخ الاحتياطي (استيراد وتصدير JSON)
// ----------------------------------------------------------------

function loadBackupHistory() {
    const backupList = document.getElementById('backupList');
    if (!backupList) return;

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
    // 1. تجميع كافة بيانات النظام (تحديث القائمة لتشمل كل شيء)
    const backupData = {};
    const keys = [
        'users', 'teachers', 'students', 
        'tests', 'lessons', 'assignments', 'objectives', // المحتوى
        'studentLessons', 'studentTests', 'studentAssignments', 'studentEvents', // بيانات الطلاب التفصيلية
        'teacherSchedule', 'academicCalendar', // الجداول والتقويم
        'systemSettings', 'systemLogs', // الإعدادات والسجلات
        'committeeMembers', 'committeeNotes', 'committeeReports' // اللجان
    ];
    
    keys.forEach(key => {
        if (localStorage.getItem(key)) {
            backupData[key] = JSON.parse(localStorage.getItem(key));
        }
    });
    
    // 2. الحفظ في السجل الداخلي (للاستعادة السريعة)
    const backups = JSON.parse(localStorage.getItem('systemBackups') || '[]');
    const newBackup = {
        id: Date.now(),
        createdAt: new Date().toISOString(),
        type: 'manual',
        data: backupData,
        size: JSON.stringify(backupData).length + ' bytes'
    };
    
    backups.push(newBackup);
    localStorage.setItem('systemBackups', JSON.stringify(backups));
    
    // 3. التصدير كملف JSON حقيقي
    const blob = new Blob([JSON.stringify(backupData, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-muyasir-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    addSystemLog('تم إنشاء وتصدير نسخة احتياطية', 'backup');
    loadBackupHistory();
}

// فتح نافذة الاستيراد
function importBackup() {
    const modal = document.getElementById('importBackupModal');
    if(modal) modal.classList.add('show');
}

function closeImportBackupModal() {
    const modal = document.getElementById('importBackupModal');
    if(modal) modal.classList.remove('show');
    const fileInput = document.getElementById('backupFile');
    if(fileInput) fileInput.value = '';
}

// تنفيذ عملية الاستيراد من الملف
function processBackupImport() {
    const fileInput = document.getElementById('backupFile');
    const replaceExisting = document.getElementById('replaceExisting').checked;
    
    if (!fileInput || !fileInput.files[0]) {
        alert('يرجى اختيار ملف النسخة الاحتياطية');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const backupData = JSON.parse(e.target.result);
            
            if (replaceExisting) {
                // مسح واستبدال كامل
                if (!confirm('⚠️ تحذير: سيتم مسح جميع البيانات الحالية واستبدالها ببيانات الملف. هل أنت متأكد؟')) return;
                
                // نحتفظ فقط بالنسخ الاحتياطية السابقة للأمان
                const oldBackups = localStorage.getItem('systemBackups');
                localStorage.clear();
                if(oldBackups) localStorage.setItem('systemBackups', oldBackups);
                
                Object.keys(backupData).forEach(key => {
                    localStorage.setItem(key, JSON.stringify(backupData[key]));
                });
            } else {
                // دمج البيانات (الاحتفاظ بالقديم وإضافة الجديد)
                Object.keys(backupData).forEach(key => {
                    const existing = localStorage.getItem(key);
                    if (existing) {
                        try {
                            const parsedExisting = JSON.parse(existing);
                            const parsedNew = backupData[key];
                            if (Array.isArray(parsedExisting) && Array.isArray(parsedNew)) {
                                // دمج المصفوفات مع منع التكرار بالاعتماد على ID إن وجد
                                const mergedMap = new Map();
                                [...parsedExisting, ...parsedNew].forEach(item => {
                                    if(item.id) mergedMap.set(item.id, item);
                                    else mergedMap.set(JSON.stringify(item), item);
                                });
                                localStorage.setItem(key, JSON.stringify(Array.from(mergedMap.values())));
                            } else {
                                // للكائنات، نحدث القيم
                                localStorage.setItem(key, JSON.stringify({...parsedExisting, ...parsedNew}));
                            }
                        } catch (err) {
                            localStorage.setItem(key, JSON.stringify(backupData[key]));
                        }
                    } else {
                        localStorage.setItem(key, JSON.stringify(backupData[key]));
                    }
                });
            }
            
            addSystemLog('تم استيراد نسخة احتياطية من ملف خارجي', 'backup');
            alert('تم استيراد البيانات بنجاح');
            closeImportBackupModal();
            location.reload(); // إعادة تحميل لتطبيق التغييرات
            
        } catch (error) {
            alert('خطأ في قراءة الملف: ' + error.message);
        }
    };
    reader.readAsText(fileInput.files[0]);
}

function downloadBackup(backupIndex) {
    const backups = JSON.parse(localStorage.getItem('systemBackups') || '[]');
    const backup = backups[backupIndex];
    
    if (!backup) return;
    
    const blob = new Blob([JSON.stringify(backup.data, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-${backup.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    addSystemLog(`تم تحميل النسخة الاحتياطية ${backup.id}`, 'backup');
}

function restoreBackup(backupIndex) {
    const backups = JSON.parse(localStorage.getItem('systemBackups') || '[]');
    const backup = backups[backupIndex];
    
    if (!backup) return;
    
    if (!confirm('⚠️ تحذير: استعادة النسخة الاحتياطية ستحل محل جميع البيانات الحالية. هل أنت متأكد؟')) {
        return;
    }
    
    Object.keys(backup.data).forEach(key => {
        localStorage.setItem(key, JSON.stringify(backup.data[key]));
    });
    
    addSystemLog(`تم استعادة النسخة الاحتياطية ${backup.id}`, 'backup');
    alert('تم استعادة النسخة الاحتياطية بنجاح');
    location.reload();
}

function deleteBackup(backupIndex) {
    const backups = JSON.parse(localStorage.getItem('systemBackups') || '[]');
    if (backupIndex >= backups.length) return;
    
    if (!confirm('هل أنت متأكد من حذف هذه النسخة؟')) return;
    
    backups.splice(backupIndex, 1);
    localStorage.setItem('systemBackups', JSON.stringify(backups));
    
    addSystemLog('تم حذف نسخة احتياطية', 'backup');
    loadBackupHistory();
}

function loadSystemLogs() {
    const logsList = document.getElementById('logsList');
    if (!logsList) return;

    const logs = JSON.parse(localStorage.getItem('systemLogs') || '[]');
    
    if (logs.length === 0) {
        logsList.innerHTML = `<tr><td colspan="4" class="text-center">لا توجد سجلات</td></tr>`;
        return;
    }
    
    logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const recentLogs = logs.slice(0, 50);
    
    logsList.innerHTML = recentLogs.map(log => `
        <tr>
            <td>${formatDate(log.timestamp)}</td>
            <td><span class="badge ${getLogTypeClass(log.type)}">${getLogTypeText(log.type)}</span></td>
            <td>${log.message}</td>
            <td>${log.user || 'النظام'}</td>
        </tr>
    `).join('');
}

function addSystemLog(message, type = 'info', user = null) {
    const logs = JSON.parse(localStorage.getItem('systemLogs') || '[]');
    const currentUser = getCurrentUser(); // يفترض وجود هذه الدالة في auth.js
    
    logs.push({
        timestamp: new Date().toISOString(),
        type: type,
        message: message,
        user: user || (currentUser ? currentUser.name : 'النظام')
    });
    
    if (logs.length > 1000) logs.splice(0, logs.length - 1000);
    
    localStorage.setItem('systemLogs', JSON.stringify(logs));
    
    if (document.getElementById('logs-tab') && document.getElementById('logs-tab').style.display !== 'none') {
        loadSystemLogs();
    }
}

function clearLogs() {
    if (!confirm('هل أنت متأكد من مسح جميع سجلات النظام؟')) return;
    localStorage.removeItem('systemLogs');
    addSystemLog('تم مسح جميع سجلات النظام', 'warning');
    loadSystemLogs();
}

function exportLogs() {
    const logs = JSON.parse(localStorage.getItem('systemLogs') || '[]');
    if (logs.length === 0) { alert('لا توجد سجلات للتصدير'); return; }
    
    const logText = logs.map(log => `${formatDate(log.timestamp)} - ${getLogTypeText(log.type)}: ${log.message}`).join('\n');
    const blob = new Blob([logText], {type: 'text/plain'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system-logs-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
}

// دوال مساعدة
function formatDate(date) { return date ? new Date(date).toLocaleDateString('ar-SA', {year:'numeric',month:'long',day:'numeric',hour:'2-digit',minute:'2-digit'}) : ''; }
function getLogTypeClass(type) { const m = {'info':'badge-info','warning':'badge-warning','error':'badge-danger','success':'badge-success','settings':'badge-primary'}; return m[type] || 'badge-light'; }
function getLogTypeText(type) { const m = {'info':'معلومات','warning':'تحذير','error':'خطأ','success':'نجاح','settings':'إعدادات'}; return m[type] || type; }
function filterLogs() { /* كود الفلترة */ }
function clearSearch() { document.getElementById('logSearch').value = ''; filterLogs(); }

// تصدير الدوال للاستخدام العالمي في HTML
window.resetSettings = resetSettings;
window.createBackup = createBackup;
window.downloadBackup = downloadBackup;
window.restoreBackup = restoreBackup;
window.deleteBackup = deleteBackup;
window.importBackup = importBackup;
window.closeImportBackupModal = closeImportBackupModal;
window.processBackupImport = processBackupImport;
window.clearLogs = clearLogs;
window.exportLogs = exportLogs;
window.filterLogs = filterLogs;
window.clearSearch = clearSearch;
