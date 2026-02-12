// ============================================
// 📁 المسار: assets/js/messages.js
// الوصف: شات المعلم (نسخة التنبيهات الاحترافية الموحدة)
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
            
            document.addEventListener('click', function(e) {
                const popup = document.getElementById('emojiPopup');
                const btn = document.getElementById('emojiBtn');
                if (popup && btn && !popup.contains(e.target) && !btn.contains(e.target)) {
                    if(popup) popup.style.display = 'none';
                }
                if (!e.target.closest('.msg-options-btn')) {
                    document.querySelectorAll('.msg-dropdown').forEach(menu => menu.style.display = 'none');
                }
            });
        } catch (e) { console.error(e); }
    }
});

// --- الدوال المساعدة للتنبيهات (في حال لم تكن معرفة عالمياً) ---
function showSuccess(msg) { if(window.showToast) window.showToast(msg, 'success'); else console.log('Success:', msg); }
function showError(msg) { if(window.showToast) window.showToast(msg, 'danger'); else console.log('Error:', msg); }

// --- الوظائف الأساسية ---
function injectFontAwesome() {
    if (!document.getElementById('fontAwesomeLink')) {
        const link = document.createElement('link');
        link.id = 'fontAwesomeLink';
        link.rel = 'stylesheet';
        link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
        document.head.appendChild(link);
    }
}

function injectHtml2Pdf() {
    if (!document.getElementById('html2pdfScript')) {
        const script = document.createElement('script');
        script.id = 'html2pdfScript';
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
        document.body.appendChild(script);
    }
}

function getCurrentUser() {
    const session = sessionStorage.getItem('currentUser');
    return session ? JSON.parse(session).user : null;
}

function cleanInterfaceAggressive() {
    const targetContainer = document.getElementById('messagesList');
    if (!targetContainer) return;
    const parent = targetContainer.parentElement;
    if (parent) {
        Array.from(parent.children).forEach(child => {
            // نضمن عدم إخفاء حاوية الشات أو أي Modal تنبيه
            if (child.id !== 'messagesList' && child.tagName !== 'SCRIPT' && child.tagName !== 'STYLE' && !child.classList.contains('modal')) {
                child.style.display = 'none';
            }
        });
    }
}

// (ملاحظة: دالة injectChatStyles و renderChatLayout تبقى كما هي في ملفك الأصلي مع التأكد من IDs)

// --- دالة حذف المحادثة الاحترافية ---
function deleteEntireConversation() {
    if (!activeChatStudentId) return;

    // استدعاء نافذة التأكيد الموحدة من مشروعك
    showConfirmModal('⚠️ هل أنت متأكد من حذف كامل سجل المحادثة؟ لا يمكن التراجع عن هذا الإجراء.', function() {
        const currentUser = getCurrentUser();
        let teacherMsgs = JSON.parse(localStorage.getItem('teacherMessages') || '[]');
        teacherMsgs = teacherMsgs.filter(m => !(m.teacherId === currentUser.id && m.studentId === activeChatStudentId));
        localStorage.setItem('teacherMessages', JSON.stringify(teacherMsgs));
        
        let studentMsgs = JSON.parse(localStorage.getItem('studentMessages') || '[]');
        studentMsgs = studentMsgs.filter(m => !(m.teacherId === currentUser.id && m.studentId === activeChatStudentId));
        localStorage.setItem('studentMessages', JSON.stringify(studentMsgs));
        
        document.getElementById('chatMessagesArea').innerHTML = '<div class="empty-chat"><p>تم حذف المحادثة</p></div>';
        showSuccess('تم حذف المحادثة بنجاح');
        loadConversations();
    });
}

// --- دالة حذف رسالة فردية احترافية ---
function deleteChatMessage(messageId) {
    showConfirmModal('هل تريد حذف هذه الرسالة؟', function() {
        let teacherMsgs = JSON.parse(localStorage.getItem('teacherMessages') || '[]');
        teacherMsgs = teacherMsgs.filter(m => m.id !== messageId);
        localStorage.setItem('teacherMessages', JSON.stringify(teacherMsgs));
        
        let studentMsgs = JSON.parse(localStorage.getItem('studentMessages') || '[]');
        studentMsgs = studentMsgs.filter(m => m.id !== (messageId + 1));
        localStorage.setItem('studentMessages', JSON.stringify(studentMsgs));
        
        showSuccess('تمت إزالة الرسالة');
        loadChatMessages(activeChatStudentId);
        loadConversations();
    });
}

// (بقية الدوال مثل startRecording و sendChatMessage تتبع نفس نمط الـ Error/Success)
