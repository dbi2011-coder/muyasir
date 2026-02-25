// ==========================================
// دوال نافذة "محادثة جديدة" للمعلم
// ==========================================

async function showNewMessageModal() { 
    const currentUser = getCurrentUser(); 
    const recipientSelect = document.getElementById('messageRecipient'); 
    
    if(recipientSelect) { 
        // عرض حالة التحميل
        recipientSelect.innerHTML = '<option value="">جاري تحميل القائمة...</option>';
        document.getElementById('newMessageModal').classList.add('show'); 
        
        // جلب قائمة الطلاب المرتبطين بالمعلم من السحابة
        await loadStudentsForMessaging(currentUser.id); 
    } else { 
        alert("خطأ: لم يتم العثور على قائمة الطلاب في الواجهة."); 
    } 
}

async function loadStudentsForMessaging(teacherId) { 
    const recipientSelect = document.getElementById('messageRecipient'); 
    if(!recipientSelect) return; 
    
    try {
        const { data: myStudents, error } = await window.supabase
            .from('users')
            .select('id, name')
            .eq('role', 'student')
            .eq('teacherId', teacherId);

        if (error) throw error;

        recipientSelect.innerHTML = '<option value="">اختر الطالب</option>'; 
        
        if (myStudents && myStudents.length > 0) {
            myStudents.forEach(s => { 
                recipientSelect.innerHTML += `<option value="${s.id}">${s.name}</option>`; 
            }); 
        } else {
            recipientSelect.innerHTML = '<option value="" disabled>لا يوجد طلاب مسجلين لديك</option>'; 
        }
    } catch (e) {
        console.error("Error loading students for messages:", e);
        recipientSelect.innerHTML = '<option value="">حدث خطأ أثناء جلب الطلاب</option>'; 
    }
}

function closeNewMessageModal() { 
    document.getElementById('newMessageModal').classList.remove('show'); 
}

async function sendNewMessage() { 
    const select = document.getElementById('messageRecipient');
    const sId = select.value; 
    
    if(sId) { 
        const studentName = select.options[select.selectedIndex].text;
        closeNewMessageModal(); 
        
        // فتح المحادثة وتمرير اسم الطالب
        await openChat(parseInt(sId), studentName); 
    } else {
        alert("يرجى اختيار طالب أولاً.");
    }
}

// تصدير الدوال لتتعرف عليها أزرار الـ HTML
window.showNewMessageModal = showNewMessageModal; 
window.sendNewMessage = sendNewMessage; 
window.closeNewMessageModal = closeNewMessageModal;
