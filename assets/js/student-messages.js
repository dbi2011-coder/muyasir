// ============================================
// 📁 المسار: assets/js/student-messages.js
// الوصف: نسخة الطالب مع التنبيهات الموحدة
// ============================================

// ... (الأكواد التعريفية والـ Styles كما هي في ملفك)

function deleteEntireConversation(studentId) {
    // التأكد من استدعاء النافذة الموحدة بشكل صحيح
    if(typeof showConfirmModal === 'function') {
        showConfirmModal('⚠️ هل أنت متأكد من حذف كامل المحادثة مع هذا المعلم؟', function() {
            const teacherId = getCurrentUser().id;
            let tMsgs = JSON.parse(localStorage.getItem('teacherMessages') || '[]'); 
            tMsgs = tMsgs.filter(m => !(m.studentId == studentId && m.teacherId == teacherId)); 
            localStorage.setItem('teacherMessages', JSON.stringify(tMsgs));

            let sMsgs = JSON.parse(localStorage.getItem('studentMessages') || '[]'); 
            sMsgs = sMsgs.filter(m => !(m.studentId == studentId && m.teacherId == teacherId)); 
            localStorage.setItem('studentMessages', JSON.stringify(sMsgs));
            
            if(window.showSuccess) showSuccess('تم الحذف بنجاح');
            openChat(studentId);
        });
    } else {
        // fallback في حال لم تكن الدالة جاهزة بعد
        if(confirm('حذف المحادثة؟')) { 
            /* كود الحذف السريع */ 
        }
    }
}

// ... (بقية ملف الطالب كما هو مع استبدال التنبيهات بدوال النجاح)
