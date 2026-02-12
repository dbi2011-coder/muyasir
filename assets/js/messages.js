// ============================================
// 📁 التعديل المحدث لملف: assets/js/messages.js
// الوصف: استبدال تنبيهات المتصفح بنظام Modals الاحترافي
// ============================================

// 1. تحديث دالة حذف المحادثة بالكامل
function deleteEntireConversation() {
    if (!activeChatStudentId) return;

    // استخدام النافذة الموحدة بدلاً من confirm()
    showConfirmModal('⚠️ هل أنت متأكد من حذف كامل سجل المحادثة؟ لا يمكن التراجع عن هذا الإجراء.', function() {
        const currentUser = getCurrentUser();
        
        let teacherMsgs = JSON.parse(localStorage.getItem('teacherMessages') || '[]');
        teacherMsgs = teacherMsgs.filter(m => !(m.teacherId === currentUser.id && m.studentId === activeChatStudentId));
        localStorage.setItem('teacherMessages', JSON.stringify(teacherMsgs));
        
        let studentMsgs = JSON.parse(localStorage.getItem('studentMessages') || '[]');
        studentMsgs = studentMsgs.filter(m => !(m.teacherId === currentUser.id && m.studentId === activeChatStudentId));
        localStorage.setItem('studentMessages', JSON.stringify(studentMsgs));
        
        document.getElementById('chatMessagesArea').innerHTML = '';
        
        // إظهار تنبيه نجاح احترافي
        showSuccess('تم حذف المحادثة بالكامل بنجاح');
        
        loadConversations();
        loadChatMessages(activeChatStudentId);
    });
}

// 2. تحديث دالة حذف رسالة فردية
function deleteChatMessage(messageId) {
    showConfirmModal('هل تريد حذف هذه الرسالة فعلاً؟', function() {
        let teacherMsgs = JSON.parse(localStorage.getItem('teacherMessages') || '[]');
        teacherMsgs = teacherMsgs.filter(m => m.id !== messageId);
        localStorage.setItem('teacherMessages', JSON.stringify(teacherMsgs));
        
        let studentMsgs = JSON.parse(localStorage.getItem('studentMessages') || '[]');
        studentMsgs = studentMsgs.filter(m => m.id !== (messageId + 1));
        localStorage.setItem('studentMessages', JSON.stringify(studentMsgs));
        
        showSuccess('تم حذف الرسالة');
        loadChatMessages(activeChatStudentId);
        loadConversations();
    });
}

// 3. تحديث تنبيهات التسجيل الصوتي
function startRecording() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { 
        showError('المتصفح الخاص بك لا يدعم ميزة تسجيل الصوت'); 
        return; 
    }
    
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
        // ... (كود التسجيل كما هو)
    }).catch(() => {
        showError('تعذر الوصول للميكروفون، يرجى التحقق من الصلاحيات');
    });
}
