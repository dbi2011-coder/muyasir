// إدارة لوحات التحكم
document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
});

function initializeDashboard() {
    // التحقق من المصادقة
    const user = checkAuth();
    if (!user) return;

    // تحديث واجهة المستخدم
    updateUserInterface(user);
    
    // تحميل الإحصائيات
    loadDashboardStats(user.role);
    
    // إعداد القائمة المتنقلة
    setupMobileMenu();
    
    // إعداد الأحداث
    setupDashboardEvents();
}

function updateUserInterface(user) {
    // تحديث اسم المستخدم
    const userNameElement = document.getElementById('userName');
    if (userNameElement) {
        userNameElement.textContent = user.name;
    }
    
    // تحديث الصورة الرمزية
    const userAvatarElement = document.getElementById('userAvatar');
    if (userAvatarElement) {
        userAvatarElement.textContent = user.name.charAt(0);
    }
    
    // تحديث عنوان الصفحة بناءً على الدور
    updatePageTitle(user.role);
}

function updatePageTitle(role) {
    const titles = {
        'admin': 'لوحة تحكم المدير',
        'teacher': 'لوحة تحكم المعلم',
        'student': 'لوحة تحكم الطالب',
        'committee': 'لوحة تحكم اللجنة'
    };
    
    const title = titles[role] || 'لوحة التحكم';
    document.title = `${title} - ميسر التعلم`;
}

function loadDashboardStats(role) {
    // محاكاة تحميل الإحصائيات (سيتم تطويرها لاحقاً)
    setTimeout(() => {
        const stats = {
            'admin': { teachers: 12, students: 150, sessions: 8, actions: 3 },
            'teacher': { students: 25, lessons: 45, assignments: 12, progress: 78 },
            'student': { lessons: 15, completed: 8, assignments: 5, average: 85 },
            'committee': { teachers: 5, students: 80, reports: 12, notes: 7 }
        };
        
        const roleStats = stats[role] || stats.admin;
        updateStatsDisplay(roleStats, role);
    }, 1000);
}

function updateStatsDisplay(stats, role) {
    // تحديث عرض الإحصائيات بناءً على الدور
    if (role === 'admin') {
        document.getElementById('teachersCount').textContent = stats.teachers;
        document.getElementById('studentsCount').textContent = stats.students;
        document.getElementById('activeSessions').textContent = stats.sessions;
        document.getElementById('pendingActions').textContent = stats.actions;
    }
    // سيتم إضافة باقي الأدوار في المراحل القادمة
}

function setupMobileMenu() {
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const sidebar = document.querySelector('.sidebar');
    
    if (mobileMenuBtn && sidebar) {
        mobileMenuBtn.addEventListener('click', function() {
            sidebar.classList.toggle('active');
        });
    }
    
    // إغلاق القائمة عند النقر خارجها
    document.addEventListener('click', function(event) {
        if (window.innerWidth <= 768) {
            const isClickInsideSidebar = sidebar.contains(event.target);
            const isClickOnMenuBtn = mobileMenuBtn.contains(event.target);
            
            if (!isClickInsideSidebar && !isClickOnMenuBtn && sidebar.classList.contains('active')) {
                sidebar.classList.remove('active');
            }
        }
    });
}

function setupDashboardEvents() {
    // إعداد الأحداث العامة للوحة التحكم
    console.log('تم إعداد لوحة التحكم بنجاح');
}

function showNotifications() {
    alert('نظام الإشعارات سيتم تطويره في المراحل القادمة');
}

// تحديث وقت النشاط
setInterval(() => {
    const loginTime = sessionStorage.getItem('loginTime');
    if (loginTime) {
        const now = new Date();
        const loginDate = new Date(loginTime);
        const hoursDiff = (now - loginDate) / (1000 * 60 * 60);
        
        // إذا اقترب وقت انتهاء الجلسة (7.5 ساعة)
        if (hoursDiff > 7.5) {
            showSessionWarning();
        }
    }
}, 60000); // التحقق كل دقيقة

function showSessionWarning() {
    if (!document.getElementById('sessionWarning')) {
        const warning = document.createElement('div');
        warning.id = 'sessionWarning';
        warning.className = 'session-warning';
        warning.innerHTML = `
            <div class="warning-content">
                <span>⚠️ جلسة العمل ستنتهي قريباً. يرجى حفظ العمل الحالي.</span>
                <button onclick="this.parentElement.parentElement.remove()">✕</button>
            </div>
        `;
        
        // إضافة الأنماط
        if (!document.querySelector('#session-warning-styles')) {
            const styles = document.createElement('style');
            styles.id = 'session-warning-styles';
            styles.textContent = `
                .session-warning {
                    position: fixed;
                    bottom: 20px;
                    left: 20px;
                    right: 20px;
                    background: #fff3cd;
                    border: 1px solid #ffeaa7;
                    border-radius: 8px;
                    padding: 15px;
                    z-index: 10000;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                }
                .warning-content {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    color: #856404;
                }
                .warning-content button {
                    background: none;
                    border: none;
                    font-size: 1.2rem;
                    cursor: pointer;
                    color: #856404;
                }
                @media (min-width: 768px) {
                    .session-warning {
                        left: auto;
                        width: 400px;
                        right: 300px;
                    }
                }
            `;
            document.head.appendChild(styles);
        }
        
        document.body.appendChild(warning);
        
        // إزالة التحذير تلقائياً بعد 30 ثانية
        setTimeout(() => {
            if (warning.parentElement) {
                warning.remove();
            }
        }, 30000);
    }
}
// إضافة هذه الدوال في نهاية الملف

// تحديث واجهة المستخدم بناءً على الدور
function updateUserInterface(user) {
    const userNameElement = document.getElementById('userName');
    const userAvatarElement = document.getElementById('userAvatar');
    
    if (userNameElement) {
        if (user.role === 'teacher') {
            userNameElement.textContent = `أ/ ${user.name}`;
        } else if (user.role === 'admin') {
            userNameElement.textContent = 'مدير النظام';
        } else if (user.role === 'student') {
            userNameElement.textContent = user.name;
        } else if (user.role === 'committee') {
            userNameElement.textContent = `أ/ ${user.name}`;
        }
    }
    
    if (userAvatarElement) {
        if (user.role === 'teacher' || user.role === 'committee') {
            userAvatarElement.textContent = user.name.charAt(0);
        } else if (user.role === 'admin') {
            userAvatarElement.textContent = 'م';
        } else if (user.role === 'student') {
            userAvatarElement.textContent = user.name.charAt(0);
        }
    }
}

// الحصول على المستخدم الحالي
function getCurrentUser() {
    const currentUser = sessionStorage.getItem('currentUser');
    return currentUser ? JSON.parse(currentUser) : null;
}

// توليد معرف فريد
function generateId() {
    return Math.floor(Math.random() * 1000000) + 1;
}