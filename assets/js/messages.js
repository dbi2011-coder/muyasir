// ============================================
// 📁 المسار: assets/js/messages.js
// الوصف: نسخة احترافية كاملة - إصلاح أخطاء الـ ID وربط التنبيهات المخصصة
// ============================================

let activeChatStudentId = null;
let attachmentData = null;
let editingMessageId = null;
let mediaRecorder = null;
let audioChunks = [];
let recordingInterval = null;
let recordingStartTime = null;

document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('messages.html')) {
        try {
            injectFontAwesome();
            injectHtml2Pdf();
            cleanInterfaceAggressive(); 
            injectChatStyles();
            renderChatLayout();
            loadConversations();
            
            // إغلاق القوائم عند النقر في الخارج
            document.addEventListener('click', function(e) {
                const popup = document.getElementById('emojiPopup');
                const btn = document.getElementById('emojiBtn');
                if (popup && btn && !popup.contains(e.target) && !btn.contains(e.target)) {
                    popup.style.display = 'none';
                }
                if (!e.target.closest('.msg-options-btn')) {
                    document.querySelectorAll('.msg-dropdown').forEach(menu => menu.style.display = 'none');
                }
            });
        } catch (e) { console.error("خطأ في التحميل:", e); }
    }
});

// --- محرك التنبيهات الاحترافي (المخصص) ---

function showConfirmModal(message, onConfirm) {
    const modal = document.getElementById('confirmModal');
    const msgPara = document.getElementById('confirmMessage');
    const okBtn = document.getElementById('confirmBtnOk');

    if (!modal || !okBtn) {
        // Fallback في حال عدم وجود الـ HTML المخصص
        if (confirm(message)) onConfirm();
        return;
    }

    msgPara.textContent = message;
    modal.classList.add('show');

    // منع تكرار الأحداث عند فتح النافذة عدة مرات
    const newOkBtn = okBtn.cloneNode(true);
    okBtn.parentNode.replaceChild(newOkBtn, okBtn);

    newOkBtn.onclick = function() {
        onConfirm();
        closeConfirmModal();
    };
}

function closeConfirmModal() {
    const modal = document.getElementById('confirmModal');
    if (modal) modal.classList.remove('show');
}

function showSuccessToast(message) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.style.cssText = `
        background: #10b981; color: white; padding: 12px 25px; border-radius: 12px;
        margin-top: 10px; display: flex; align-items: center; gap: 10px;
        box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); animation: slideIn 0.3s ease-out;
        font-family: 'Tajawal', sans-serif; transition: opacity 0.5s;
    `;
    toast.innerHTML = `<i class="fas fa-check-circle"></i> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

// --- إصلاح دالة جلب المستخدم وتجنب خطأ الـ ID ---

function getCurrentUser() {
    const sessionData = sessionStorage.getItem('currentUser');
    if (!sessionData) {
        console.error("لا يوجد مستخدم مسجل في الجلسة");
        return null; 
    }
    const parsed = JSON.parse(sessionData);
    return parsed.user || parsed; // دعم لأكثر من تنسيق بيانات
}

// --- تعديل دالة الحذف لتصبح احترافية ---

function deleteEntireConversation() {
    if (!activeChatStudentId) return;

    showConfirmModal('⚠️ هل أنت متأكد من حذف كامل سجل المحادثة؟ لا يمكن التراجع عن هذا الإجراء.', function() {
        const currentUser = getCurrentUser();
        if (!currentUser) return;

        let teacherMsgs = JSON.parse(localStorage.getItem('teacherMessages') || '[]');
        teacherMsgs = teacherMsgs.filter(m => !(m.teacherId == currentUser.id && m.studentId == activeChatStudentId));
        localStorage.setItem('teacherMessages', JSON.stringify(teacherMsgs));
        
        let studentMsgs = JSON.parse(localStorage.getItem('studentMessages') || '[]');
        studentMsgs = studentMsgs.filter(m => !(m.teacherId == currentUser.id && m.studentId == activeChatStudentId));
        localStorage.setItem('studentMessages', JSON.stringify(studentMsgs));
        
        document.getElementById('chatMessagesArea').innerHTML = '<div class="empty-chat"><p>تم حذف المحادثة</p></div>';
        loadConversations();
        showSuccessToast('تم حذف المحادثة بنجاح');
    });
}

function deleteChatMessage(messageId) {
    showConfirmModal('هل تريد حذف هذه الرسالة؟', function() {
        let teacherMsgs = JSON.parse(localStorage.getItem('teacherMessages') || '[]');
        teacherMsgs = teacherMsgs.filter(m => m.id !== messageId);
        localStorage.setItem('teacherMessages', JSON.stringify(teacherMsgs));
        
        showSuccessToast('تم حذف الرسالة');
        loadChatMessages(activeChatStudentId);
    });
}

// --- بقية الدوال (بناء الواجهة، الصوت، الإرسال) ---
// (تأكد من بقاء الدوال الأصلية لديك: loadConversations, openChat, startRecording...)
