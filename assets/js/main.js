/*
 * ملف JavaScript الرئيسي لنظام ميسر التعلم
 * يحتوي على الدوال الأساسية والمشتركة بين جميع الصفحات
 * تم التطوير بواسطة: الأستاذ / صالح عبد العزيز عبدالله العجلان
 */

// ==============================
// 1. تهيئة النظام والدوال الأساسية
// ==============================

/**
 * تهيئة النظام عند تحميل الصفحة
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔧 نظام ميسر التعلم - جاري التهيئة...');
    
    // تهيئة المكونات الأساسية
    initializeSystem();
    
    // تحميل معلومات المستخدم
    loadUserInfo();
    
    // تهيئة الأحداث
    initializeEvents();
    
    // التحقق من المصادقة
    checkAuthOnLoad();
    
    // تهيئة إشعارات النظام
    initSystemNotifications();
    
    console.log('✅ تم تهيئة النظام بنجاح');
});

/**
 * تهيئة النظام الأساسية
 */
function initializeSystem() {
    // إعداد اللغة والاتجاه
    document.documentElement.lang = 'ar';
    document.documentElement.dir = 'rtl';
    
    // إضافة فئة للجسم للإشارة إلى أن JavaScript يعمل
    document.body.classList.add('js-enabled');
    
    // تهيئة المستخدم الحالي من الجلسة
    const currentUser = getCurrentUser();
    if (currentUser) {
        // إضافة فئة نوع المستخدم للجسم
        document.body.classList.add(`user-${currentUser.role}`);
        
        // تحديث عنوان الصفحة بناءً على نوع المستخدم
        updatePageTitle(currentUser);
    }
    
    // تهيئة التخزين المحلي
    initLocalStorage();
    
    // إعداد النسخ الاحتياطي
    setupBackupSystem();
}

/**
 * تهيئة الأحداث الأساسية
 */
function initializeEvents() {
    // تهيئة أحداث التنقل
    initNavigationEvents();
    
    // تهيئة أحداث النماذج
    initFormEvents();
    
    // تهيئة أحداث الأزرار
    initButtonEvents();
    
    // تهيئة أحداث الاستجابة
    initResponsiveEvents();
}

/**
 * تحميل معلومات المستخدم وعرضها
 */
function loadUserInfo() {
    const user = getCurrentUser();
    
    if (!user) {
        // إخفاء عناصر المستخدم إذا لم يكن مسجل الدخول
        const userElements = document.querySelectorAll('.user-info, .user-avatar, .user-name');
        userElements.forEach(el => {
            if (el.parentElement) {
                el.parentElement.style.display = 'none';
            }
        });
        return;
    }
    
    // تحديث اسم المستخدم في جميع المواقع
    const userNameElements = document.querySelectorAll('.user-name, #userName, .username-display');
    userNameElements.forEach(element => {
        if (element) {
            element.textContent = user.name;
            element.setAttribute('title', user.role === 'teacher' ? 'معلم' : 
                                user.role === 'student' ? 'طالب' : 
                                user.role === 'admin' ? 'مدير النظام' : 'عضو لجنة');
        }
    });
    
    // تحديث الصورة الرمزية
    const avatarElements = document.querySelectorAll('.user-avatar, #userAvatar');
    avatarElements.forEach(element => {
        if (element) {
            // استخدام الحرف الأول من الاسم
            const firstLetter = user.name.charAt(0).toUpperCase();
            element.textContent = firstLetter;
            
            // إنشاء لون عشوائي للصورة الرمزية
            const colors = ['#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6', '#1abc9c'];
            const colorIndex = user.name.length % colors.length;
            element.style.backgroundColor = colors[colorIndex];
            element.style.color = 'white';
        }
    });
    
    // تحديث رسالة الترحيب
    const welcomeElements = document.querySelectorAll('.welcome-text, .welcome-message');
    welcomeElements.forEach(element => {
        if (element) {
            const hour = new Date().getHours();
            let greeting = 'مرحباً';
            
            if (hour < 12) {
                greeting = 'صباح الخير';
            } else if (hour < 18) {
                greeting = 'مساء الخير';
            } else {
                greeting = 'مساء الخير';
            }
            
            element.textContent = `${greeting}`;
        }
    });
    
    // تحديث الشريط الجانبي بناءً على نوع المستخدم
    updateSidebarBasedOnRole(user.role);
}

/**
 * تحديث الشريط الجانبي بناءً على دور المستخدم
 */
function updateSidebarBasedOnRole(role) {
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;
    
    // إخفاء/إظهار عناصر القائمة بناءً على الصلاحيات
    const menuItems = sidebar.querySelectorAll('.sidebar-menu li');
    
    menuItems.forEach(item => {
        const link = item.querySelector('a');
        if (!link) return;
        
        const menuText = link.textContent || link.innerText;
        
        // تحديد العناصر التي يجب إخفاؤها لكل دور
        const hiddenForRoles = {
            'student': ['إدارة المعلمين', 'لجنة صعوبات التعلم', 'التقارير', 'الإعدادات المتقدمة'],
            'committee': ['إدارة المعلمين', 'الطلاب', 'مكتبة المحتوى', 'الإعدادات المتقدمة'],
            'admin': ['دروسي', 'واجباتي', 'اختباراتي', 'مراسلة المعلم']
        };
        
        if (hiddenForRoles[role] && hiddenForRoles[role].some(text => menuText.includes(text))) {
            item.style.display = 'none';
        }
    });
}

// ==============================
// 2. نظام المصادقة والجلسات
// ==============================

/**
 * التحقق من المصادقة عند تحميل الصفحة
 */
function checkAuthOnLoad() {
    const publicPages = ['index.html', 'login.html', 'register.html'];
    const currentPage = window.location.pathname.split('/').pop();
    
    // إذا كانت الصفحة عامة، لا تحتاج إلى مصادقة
    if (publicPages.includes(currentPage)) {
        return;
    }
    
    const user = getCurrentUser();
    
    if (!user) {
        // توجيه إلى صفحة تسجيل الدخول
        showSystemNotification('يجب تسجيل الدخول أولاً للوصول إلى هذه الصفحة', 'warning');
        setTimeout(() => {
            window.location.href = '../auth/login.html';
        }, 2000);
    } else {
        // التحقق من صلاحيات الوصول للصفحة
        if (!checkPageAccess(user.role, currentPage)) {
            showSystemNotification('ليس لديك صلاحية للوصول إلى هذه الصفحة', 'error');
            setTimeout(() => {
                window.location.href = getDashboardPath(user.role);
            }, 2000);
        }
    }
}

/**
 * الحصول على المستخدم الحالي من الجلسة
 */
function getCurrentUser() {
    try {
        const sessionData = sessionStorage.getItem('maysir_current_user');
        if (!sessionData) {
            // محاولة الاسترجاع من localStorage إذا كان "تذكرني" مفعل
            const rememberedUser = localStorage.getItem('maysir_remembered_user');
            if (rememberedUser) {
                const userData = JSON.parse(rememberedUser);
                sessionStorage.setItem('maysir_current_user', JSON.stringify(userData));
                return userData;
            }
            return null;
        }
        return JSON.parse(sessionData);
    } catch (error) {
        console.error('خطأ في قراءة بيانات المستخدم:', error);
        return null;
    }
}

/**
 * حفظ بيانات المستخدم في الجلسة
 */
function setCurrentUser(userData, rememberMe = false) {
    try {
        // حفظ في sessionStorage للجلسة الحالية
        sessionStorage.setItem('maysir_current_user', JSON.stringify(userData));
        
        // حفظ في localStorage إذا اختار "تذكرني"
        if (rememberMe) {
            localStorage.setItem('maysir_remembered_user', JSON.stringify(userData));
        } else {
            localStorage.removeItem('maysir_remembered_user');
        }
        
        // تحديث الصفحة
        loadUserInfo();
        
        return true;
    } catch (error) {
        console.error('خطأ في حفظ بيانات المستخدم:', error);
        return false;
    }
}

/**
 * التحقق من صلاحيات الوصول للصفحة
 */
function checkPageAccess(userRole, pagePath) {
    // تعيين الصفحات المسموح بها لكل دور
    const allowedPages = {
        'admin': ['dashboard.html', 'teachers.html', 'settings.html', 'reports.html'],
        'teacher': ['dashboard.html', 'students.html', 'content-library.html', 'tests.html', 
                   'lessons.html', 'assignments.html', 'reports.html', 'committee.html', 'settings.html'],
        'student': ['dashboard.html', 'my-tests.html', 'my-lessons.html', 
                   'my-assignments.html', 'messages.html', 'settings.html'],
        'committee': ['dashboard.html', 'reports.html', 'messages.html']
    };
    
    // استخراج اسم الملف من المسار
    const pageName = pagePath.split('/').pop();
    
    // التحقق إذا كان مسموحاً للدور
    return allowedPages[userRole] && allowedPages[userRole].includes(pageName);
}

/**
 * الحصول على مسار لوحة التحكم بناءً على دور المستخدم
 */
function getDashboardPath(userRole) {
    const paths = {
        'admin': '../admin/dashboard.html',
        'teacher': '../teacher/dashboard.html',
        'student': '../student/dashboard.html',
        'committee': '../committee/dashboard.html'
    };
    
    return paths[userRole] || '../index.html';
}

/**
 * تحديث عنوان الصفحة بناءً على المستخدم
 */
function updatePageTitle(user) {
    const pageTitle = document.title;
    const userTitle = user.role === 'teacher' ? 'معلم' : 
                     user.role === 'student' ? 'طالب' : 
                     user.role === 'admin' ? 'مدير النظام' : 'عضو لجنة';
    
    // إضافة دور المستخدم لعنوان الصفحة إذا لم يكن موجوداً
    if (!pageTitle.includes(userTitle)) {
        document.title = `${pageTitle} - ${userTitle}`;
    }
}

// ==============================
// 3. نظام التنقل والقوائم
// ==============================

/**
 * تهيئة أحداث التنقل
 */
function initNavigationEvents() {
    // تبديل الشريط الجانبي
    const menuButtons = document.querySelectorAll('.mobile-menu-btn, .toggle-sidebar');
    menuButtons.forEach(button => {
        button.addEventListener('click', toggleSidebar);
    });
    
    // إغلاق الشريط الجانبي عند النقر خارجيه (للجوال)
    document.addEventListener('click', function(event) {
        const sidebar = document.querySelector('.sidebar');
        const menuBtn = document.querySelector('.mobile-menu-btn');
        
        if (sidebar && sidebar.classList.contains('active') && 
            window.innerWidth <= 768 && 
            !sidebar.contains(event.target) && 
            !menuBtn.contains(event.target)) {
            toggleSidebar();
        }
    });
    
    // تحديث القائمة النشطة
    updateActiveMenu();
    
    // إضافة تأثيرات للروابط
    initLinkEffects();
}

/**
 * تبديل الشريط الجانبي
 */
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.querySelector('.main-content-dashboard');
    
    if (sidebar) {
        sidebar.classList.toggle('active');
        
        // إضافة تأثير الرجوع
        if (sidebar.classList.contains('active')) {
            sidebar.style.transform = 'translateX(0)';
            if (mainContent) {
                mainContent.style.opacity = '0.7';
            }
            
            // منع التمرير خلف الشريط
            document.body.style.overflow = 'hidden';
        } else {
            sidebar.style.transform = 'translateX(100%)';
            if (mainContent) {
                mainContent.style.opacity = '1';
            }
            
            // إعادة تمكين التمرير
            document.body.style.overflow = '';
        }
    }
}

/**
 * تحديث القائمة النشطة بناءً على الصفحة الحالية
 */
function updateActiveMenu() {
    const currentPage = window.location.pathname.split('/').pop();
    const menuLinks = document.querySelectorAll('.sidebar-menu a, .nav-menu a');
    
    menuLinks.forEach(link => {
        link.classList.remove('active');
        
        const href = link.getAttribute('href');
        if (href && href.includes(currentPage)) {
            link.classList.add('active');
            
            // إذا كان الرابط في قائمة فرعية، فتح القائمة
            const parentItem = link.closest('.has-submenu');
            if (parentItem) {
                parentItem.classList.add('open');
            }
        }
    });
}

/**
 * إضافة تأثيرات للروابط
 */
function initLinkEffects() {
    const links = document.querySelectorAll('a:not([href^="#"]):not([href^="javascript"]):not(.btn)');
    
    links.forEach(link => {
        // إضافة تأثير عند المرور
        link.addEventListener('mouseenter', function() {
            this.style.transition = 'all 0.3s ease';
        });
        
        // إضافة مؤشر التحميل للروابط الخارجية
        if (link.href && !link.href.includes(window.location.hostname)) {
            link.addEventListener('click', function(e) {
                showLoading('جاري الانتقال...');
            });
        }
    });
}

// ==============================
// 4. نظام النماذج والإدخال
// ==============================

/**
 * تهيئة أحداث النماذج
 */
function initFormEvents() {
    const forms = document.querySelectorAll('form:not(.no-js)');
    
    forms.forEach(form => {
        // إضافة التحقق من الصحة قبل الإرسال
        form.addEventListener('submit', function(e) {
            if (!validateForm(this)) {
                e.preventDefault();
                highlightInvalidFields(this);
            } else {
                // إظهار مؤشر التحميل
                showFormLoading(this);
            }
        });
        
        // إضافة تأثيرات للحقول
        const inputs = form.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            initInputEffects(input);
        });
    });
}

/**
 * التحقق من صحة النموذج
 */
function validateForm(form) {
    let isValid = true;
    const requiredFields = form.querySelectorAll('[required]');
    
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            isValid = false;
            field.classList.add('is-invalid');
            
            // إضافة رسالة خطأ إذا لم تكن موجودة
            if (!field.nextElementSibling || !field.nextElementSibling.classList.contains('invalid-feedback')) {
                const errorDiv = document.createElement('div');
                errorDiv.className = 'invalid-feedback';
                errorDiv.textContent = 'هذا الحقل مطلوب';
                field.parentNode.insertBefore(errorDiv, field.nextSibling);
            }
        } else {
            field.classList.remove('is-invalid');
            
            // التحقق من صحة البريد الإلكتروني
            if (field.type === 'email' && !isValidEmail(field.value)) {
                isValid = false;
                field.classList.add('is-invalid');
                
                const errorDiv = field.nextElementSibling;
                if (errorDiv && errorDiv.classList.contains('invalid-feedback')) {
                    errorDiv.textContent = 'يرجى إدخال بريد إلكتروني صحيح';
                }
            }
            
            // التحقق من صحة رقم الهاتف
            if (field.type === 'tel' && !isValidPhone(field.value)) {
                isValid = false;
                field.classList.add('is-invalid');
                
                const errorDiv = field.nextElementSibling;
                if (errorDiv && errorDiv.classList.contains('invalid-feedback')) {
                    errorDiv.textContent = 'يرجى إدخال رقم هاتف صحيح';
                }
            }
        }
    });
    
    // التحقق من تطابق كلمات المرور
    const passwordFields = form.querySelectorAll('input[type="password"]');
    if (passwordFields.length >= 2) {
        const password = passwordFields[0].value;
        const confirmPassword = passwordFields[1].value;
        
        if (password !== confirmPassword) {
            isValid = false;
            passwordFields[1].classList.add('is-invalid');
            
            const errorDiv = passwordFields[1].nextElementSibling;
            if (errorDiv && errorDiv.classList.contains('invalid-feedback')) {
                errorDiv.textContent = 'كلمات المرور غير متطابقة';
            }
        }
    }
    
    return isValid;
}

/**
 * إضافة تأثيرات لحقول الإدخال
 */
function initInputEffects(input) {
    // تأثير التركيز
    input.addEventListener('focus', function() {
        this.parentElement.classList.add('focused');
        this.classList.add('focused');
    });
    
    input.addEventListener('blur', function() {
        this.parentElement.classList.remove('focused');
        this.classList.remove('focused');
        
        // التحقق من الصحة عند الخروج
        if (this.hasAttribute('required') && !this.value.trim()) {
            this.classList.add('is-invalid');
        } else {
            this.classList.remove('is-invalid');
        }
    });
    
    // تأثير الكتابة
    input.addEventListener('input', function() {
        if (this.value.trim()) {
            this.classList.add('has-value');
        } else {
            this.classList.remove('has-value');
        }
        
        // إزالة حالة الخطأ عند البدء بالكتابة
        if (this.classList.contains('is-invalid')) {
            this.classList.remove('is-invalid');
            const errorDiv = this.nextElementSibling;
            if (errorDiv && errorDiv.classList.contains('invalid-feedback')) {
                errorDiv.remove();
            }
        }
    });
    
    // تأثير خاص لحقول البحث
    if (input.type === 'search') {
        const clearBtn = document.createElement('button');
        clearBtn.type = 'button';
        clearBtn.className = 'clear-search';
        clearBtn.innerHTML = '&times;';
        clearBtn.style.display = 'none';
        
        clearBtn.addEventListener('click', function() {
            input.value = '';
            input.focus();
            this.style.display = 'none';
            
            // تشغيل حدث البحث إذا كان هناك دالة
            if (typeof window.onSearch === 'function') {
                window.onSearch('');
            }
        });
        
        input.parentNode.insertBefore(clearBtn, input.nextSibling);
        
        input.addEventListener('input', function() {
            clearBtn.style.display = this.value ? 'block' : 'none';
        });
    }
}

/**
 * إظهار مؤشر تحميل للنموذج
 */
function showFormLoading(form) {
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> جاري المعالجة...';
        submitBtn.disabled = true;
        
        // استعادة النص الأصلي بعد 10 ثواني (في حالة عدم التحديث)
        setTimeout(() => {
            if (submitBtn.disabled) {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        }, 10000);
    }
}

/**
 * تسليط الضوء على الحقول غير الصالحة
 */
function highlightInvalidFields(form) {
    const invalidFields = form.querySelectorAll('.is-invalid');
    
    invalidFields.forEach(field => {
        field.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // تأثير اهتزاز
        field.style.animation = 'shake 0.5s ease-in-out';
        setTimeout(() => {
            field.style.animation = '';
        }, 500);
    });
    
    // إظهار رسالة خطأ عامة
    if (invalidFields.length > 0) {
        showSystemNotification('يرجى تصحيح الأخطاء في النموذج', 'error');
    }
}

// ==============================
// 5. نظام الأزرار والإجراءات
// ==============================

/**
 * تهيئة أحداث الأزرار
 */
function initButtonEvents() {
    // إضافة تأثيرات للجميع الأزرار
    const buttons = document.querySelectorAll('.btn:not(.no-effect)');
    
    buttons.forEach(button => {
        // تأثير الضغط
        button.addEventListener('mousedown', function() {
            this.style.transform = 'scale(0.98)';
            this.style.transition = 'transform 0.1s ease';
        });
        
        button.addEventListener('mouseup', function() {
            this.style.transform = '';
        });
        
        button.addEventListener('mouseleave', function() {
            this.style.transform = '';
        });
        
        // تأثير التمرير
        button.addEventListener('mouseenter', function() {
            this.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        });
        
        button.addEventListener('mouseleave', function() {
            this.style.boxShadow = '';
        });
        
        // إضافة صوت النقر (اختياري)
        if (button.classList.contains('btn-audio')) {
            button.addEventListener('click', function() {
                playClickSound();
            });
        }
    });
    
    // تهيئة أزرار الإجراءات الخاصة
    initActionButtons();
}

/**
 * تهيئة أزرار الإجراءات الخاصة
 */
function initActionButtons() {
    // زر النسخ
    const copyButtons = document.querySelectorAll('.btn-copy');
    copyButtons.forEach(button => {
        button.addEventListener('click', function() {
            const textToCopy = this.getAttribute('data-copy') || 
                             this.previousElementSibling?.value || 
                             this.previousElementSibling?.textContent;
            
            if (textToCopy) {
                copyToClipboard(textToCopy);
                showSystemNotification('تم النسخ إلى الحافظة', 'success');
            }
        });
    });
    
    // زر الطباعة
    const printButtons = document.querySelectorAll('.btn-print');
    printButtons.forEach(button => {
        button.addEventListener('click', function() {
            const printElement = document.querySelector(this.getAttribute('data-print')) || 
                               this.closest('.printable') || 
                               document.body;
            printElement(printElement);
        });
    });
    
    // زر التنزيل
    const downloadButtons = document.querySelectorAll('.btn-download');
    downloadButtons.forEach(button => {
        button.addEventListener('click', function() {
            const url = this.getAttribute('data-url') || this.href;
            const filename = this.getAttribute('data-filename') || 'download';
            
            if (url) {
                downloadFile(url, filename);
            }
        });
    });
}

// ==============================
// 6. نظام الإشعارات والتنبيهات
// ==============================

/**
 * تهيئة إشعارات النظام
 */
function initSystemNotifications() {
    // إنشاء حاوية الإشعارات إذا لم تكن موجودة
    if (!document.getElementById('notifications-container')) {
        const container = document.createElement('div');
        container.id = 'notifications-container';
        container.className = 'notifications-container';
        document.body.appendChild(container);
    }
    
    // إضافة الأنماط للإشعارات
    addNotificationStyles();
}

/**
 * إظهار إشعار نظام
 */
function showSystemNotification(message, type = 'info', duration = 5000) {
    const container = document.getElementById('notifications-container');
    if (!container) return;
    
    // إنشاء الإشعار
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.setAttribute('role', 'alert');
    notification.setAttribute('aria-live', 'assertive');
    
    // الرموز حسب النوع
    const icons = {
        'success': '✅',
        'error': '❌',
        'warning': '⚠️',
        'info': 'ℹ️'
    };
    
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">${icons[type] || icons.info}</span>
            <span class="notification-message">${message}</span>
            <button class="notification-close" aria-label="إغلاق الإشعار">&times;</button>
        </div>
        <div class="notification-progress">
            <div class="progress-bar" style="animation-duration: ${duration}ms"></div>
        </div>
    `;
    
    // إضافة للإشعارات الحاوية
    container.appendChild(notification);
    
    // إظهار الإشعار مع تأثير
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // إضافة حدث الإغلاق
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        closeNotification(notification);
    });
    
    // الإغلاق التلقائي بعد المدة
    if (duration > 0) {
        setTimeout(() => {
            closeNotification(notification);
        }, duration);
    }
    
    return notification;
}

/**
 * إغلاق الإشعار
 */
function closeNotification(notification) {
    if (!notification) return;
    
    notification.classList.remove('show');
    notification.classList.add('hiding');
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 300);
}

/**
 * إضافة أنماط الإشعارات
 */
function addNotificationStyles() {
    const styles = `
        .notifications-container {
            position: fixed;
            top: 20px;
            left: 20px;
            z-index: 9999;
            max-width: 350px;
            width: 100%;
        }
        
        .notification {
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            margin-bottom: 10px;
            overflow: hidden;
            transform: translateX(-100%);
            opacity: 0;
            transition: all 0.3s ease;
            border-right: 4px solid #3498db;
        }
        
        .notification.show {
            transform: translateX(0);
            opacity: 1;
        }
        
        .notification.hiding {
            transform: translateX(-100%);
            opacity: 0;
        }
        
        .notification-success {
            border-right-color: #27ae60;
        }
        
        .notification-error {
            border-right-color: #e74c3c;
        }
        
        .notification-warning {
            border-right-color: #f39c12;
        }
        
        .notification-content {
            padding: 15px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .notification-icon {
            font-size: 1.2rem;
            flex-shrink: 0;
        }
        
        .notification-message {
            flex: 1;
            font-size: 0.9rem;
            line-height: 1.4;
        }
        
        .notification-close {
            background: none;
            border: none;
            font-size: 1.5rem;
            cursor: pointer;
            padding: 0;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #666;
            transition: color 0.3s ease;
        }
        
        .notification-close:hover {
            color: #e74c3c;
        }
        
        .notification-progress {
            height: 3px;
            background: #f0f0f0;
        }
        
        .notification-progress .progress-bar {
            height: 100%;
            background: currentColor;
            width: 100%;
            transform-origin: left;
            animation: progressBar linear forwards;
        }
        
        @keyframes progressBar {
            from { transform: scaleX(1); }
            to { transform: scaleX(0); }
        }
        
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
    `;
    
    const styleElement = document.createElement('style');
    styleElement.textContent = styles;
    document.head.appendChild(styleElement);
}

// ==============================
// 7. نظام التحميل والمؤشرات
// ==============================

/**
 * إظهار مؤشر التحميل
 */
function showLoading(message = 'جاري التحميل...') {
    // إخفاء أي مؤشر تحميل سابق
    hideLoading();
    
    // إنشاء عنصر التحميل
    const loader = document.createElement('div');
    loader.id = 'global-loader';
    loader.className = 'global-loader';
    loader.setAttribute('aria-live', 'polite');
    loader.setAttribute('aria-label', 'جاري التحميل');
    
    loader.innerHTML = `
        <div class="loader-overlay"></div>
        <div class="loader-content">
            <div class="spinner"></div>
            <div class="loader-message">${message}</div>
        </div>
    `;
    
    document.body.appendChild(loader);
    
    // إضافة الأنماط إذا لم تكن موجودة
    addLoaderStyles();
    
    return loader;
}

/**
 * إخفاء مؤشر التحميل
 */
function hideLoading() {
    const loader = document.getElementById('global-loader');
    if (loader) {
        loader.classList.add('hiding');
        setTimeout(() => {
            if (loader.parentNode) {
                loader.parentNode.removeChild(loader);
            }
        }, 300);
    }
}

/**
 * إضافة أنماط مؤشر التحميل
 */
function addLoaderStyles() {
    if (document.getElementById('loader-styles')) return;
    
    const styles = `
        .global-loader {
            position: fixed;
            top: 0;
            right: 0;
            bottom: 0;
            left: 0;
            z-index: 99999;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .loader-overlay {
            position: absolute;
            top: 0;
            right: 0;
            bottom: 0;
            left: 0;
            background: rgba(255, 255, 255, 0.9);
            backdrop-filter: blur(2px);
        }
        
        .loader-content {
            position: relative;
            z-index: 1;
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            text-align: center;
            min-width: 200px;
        }
        
        .spinner {
            width: 50px;
            height: 50px;
            border: 3px solid #f3f3f3;
            border-top: 3px solid var(--primary-color);
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 15px;
        }
        
        .loader-message {
            color: var(--secondary-color);
            font-weight: 500;
        }
        
        .global-loader.hiding {
            opacity: 0;
            transition: opacity 0.3s ease;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;
    
    const styleElement = document.createElement('style');
    styleElement.id = 'loader-styles';
    styleElement.textContent = styles;
    document.head.appendChild(styleElement);
}

// ==============================
// 8. نظام التخزين والنسخ الاحتياطي
// ==============================

/**
 * تهيئة التخزين المحلي
 */
function initLocalStorage() {
    const storageKeys = [
        'maysir_settings',
        'maysir_recent_actions',
        'maysir_user_preferences'
    ];
    
    storageKeys.forEach(key => {
        if (!localStorage.getItem(key)) {
            localStorage.setItem(key, JSON.stringify({}));
        }
    });
    
    // تهيئة إعدادات المستخدم
    initUserPreferences();
}

/**
 * تهيئة إعدادات المستخدم
 */
function initUserPreferences() {
    const user = getCurrentUser();
    if (!user) return;
    
    const userKey = `maysir_prefs_${user.id}`;
    if (!localStorage.getItem(userKey)) {
        const defaultPrefs = {
            theme: 'light',
            fontSize: 'medium',
            notifications: true,
            autoSave: true,
            language: 'ar'
        };
        
        localStorage.setItem(userKey, JSON.stringify(defaultPrefs));
    }
}

/**
 * الحصول على إعدادات المستخدم
 */
function getUserPreferences() {
    const user = getCurrentUser();
    if (!user) return null;
    
    const userKey = `maysir_prefs_${user.id}`;
    const prefs = localStorage.getItem(userKey);
    
    return prefs ? JSON.parse(prefs) : null;
}

/**
 * حفظ إعدادات المستخدم
 */
function saveUserPreferences(prefs) {
    const user = getCurrentUser();
    if (!user) return false;
    
    const userKey = `maysir_prefs_${user.id}`;
    const currentPrefs = getUserPreferences() || {};
    const mergedPrefs = { ...currentPrefs, ...prefs };
    
    try {
        localStorage.setItem(userKey, JSON.stringify(mergedPrefs));
        
        // تطبيق الإعدادات مباشرة
        applyUserPreferences(mergedPrefs);
        
        return true;
    } catch (error) {
        console.error('خطأ في حفظ الإعدادات:', error);
        return false;
    }
}

/**
 * تطبيق إعدادات المستخدم
 */
function applyUserPreferences(prefs) {
    // تطبيق السمة
    if (prefs.theme) {
        document.body.classList.remove('theme-light', 'theme-dark');
        document.body.classList.add(`theme-${prefs.theme}`);
    }
    
    // تطبيق حجم الخط
    if (prefs.fontSize) {
        const sizes = {
            'small': '14px',
            'medium': '16px',
            'large': '18px',
            'x-large': '20px'
        };
        
        document.documentElement.style.fontSize = sizes[prefs.fontSize] || '16px';
    }
    
    // تطبيق اللغة
    if (prefs.language) {
        document.documentElement.lang = prefs.language;
    }
}

/**
 * إعداد نظام النسخ الاحتياطي
 */
function setupBackupSystem() {
    // نسخ احتياطي تلقائي كل 24 ساعة
    const lastBackup = localStorage.getItem('maysir_last_backup');
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    
    if (!lastBackup || (now - parseInt(lastBackup)) > oneDay) {
        createBackup();
    }
    
    // نسخ احتياطي عند إغلاق الصفحة
    window.addEventListener('beforeunload', function() {
        if (navigator.sendBeacon) {
            const data = JSON.stringify({
                timestamp: now,
                action: 'autosave'
            });
            navigator.sendBeacon('/api/autosave', data);
        }
    });
}

/**
 * إنشاء نسخة احتياطية
 */
function createBackup() {
    try {
        const backupData = {
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            data: {
                tests: JSON.parse(localStorage.getItem('maysir_tests') || '[]'),
                objectives: JSON.parse(localStorage.getItem('maysir_objectives') || '[]'),
                preferences: getUserPreferences()
            }
        };
        
        const backupKey = `maysir_backup_${new Date().toISOString().split('T')[0]}`;
        localStorage.setItem(backupKey, JSON.stringify(backupData));
        localStorage.setItem('maysir_last
