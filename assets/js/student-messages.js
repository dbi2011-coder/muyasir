// ============================================
// 📁 المسار: assets/js/student-messages.js (نسخة Supabase)
// ============================================

let attachmentData = null;
let editingMessageId = null;
let pendingDeleteMessageId = null; 

document.addEventListener('DOMContentLoaded', async function() {
    if (window.location.pathname.includes('messages.html')) {
        try {
            injectChatStyles();
            renderStudentChatLayout();
            await loadChatWithTeacher();
        } catch(e) { console.error(e); }
    }
});

function getCurrentUser() { return JSON.parse(sessionStorage.getItem('currentUser')); }

async function getMyTeacherId() {
    const me = getCurrentUser();
    if (me.teacherId) return me.teacherId;
    const { data: teacher } = await window.supabase.from('users').select('id').eq('role', 'teacher').limit(1).single();
    return teacher ? teacher.id : null;
}

async function loadChatWithTeacher() {
    const teacherId = await getMyTeacherId();
    const area = document.getElementById('studentChatArea');

    if (!teacherId) {
        area.innerHTML = '<div class="text-center p-5">لا يوجد معلم مرتبط.</div>';
        return;
    }

    const currentUser = getCurrentUser();
    try {
        const { data: myMsgs, error } = await window.supabase.from('messages').select('*').eq('studentId', currentUser.id).eq('teacherId', teacherId).order('sentAt', { ascending: true });
        if (error) throw error;

        area.innerHTML = '';
        if (!myMsgs || myMsgs.length === 0) { 
            area.innerHTML = '<div class="text-center text-muted mt-5"><p>ابدأ المحادثة مع معلمك الآن</p></div>'; 
            return;
        }
        
        let unreadIds = [];

        myMsgs.forEach(msg => {
            const isMe = !msg.isFromTeacher;
            const bubbleClass = isMe ? 'msg-me' : 'msg-other';
            let contentHtml = msg.content;
            let attachHtml = '';
            
            if (msg.isVoice) {
                contentHtml = `<div style="display:flex; align-items:center; gap:5px;"><audio controls src="${msg.content}"></audio></div>`;
            } else if (msg.attachment) {
                const isImg = msg.attachment.startsWith('data:image');
                if (isImg) {
                    contentHtml = `<div class="msg-image-wrapper"><img src="${msg.attachment}" style="max-width:100%; border-radius:8px;"></div><div>${contentHtml}</div>`;
                } else {
                    attachHtml = `<a href="${msg.attachment}" download="file" class="msg-attachment">تحميل المرفق</a>`;
                    contentHtml = attachHtml + `<div>${contentHtml}</div>`;
                }
            }

            let menuHtml = '';
            if (isMe) {
                menuHtml = `<div class="msg-options-btn" onclick="toggleMessageMenu(event, ${msg.id})">⋮</div>
                <div class="msg-dropdown" id="msgMenu_${msg.id}">
                    ${!msg.isVoice ? `<div class="msg-dropdown-item" onclick="startEditMessage(${msg.id}, '${msg.content}')">تعديل</div>` : ''}
                    <div class="msg-dropdown-item delete" onclick="deleteMessage(${msg.id})">حذف</div>
                </div>`;
            }
            
            area.innerHTML += `<div class="msg-bubble ${bubbleClass}">${menuHtml} ${contentHtml} <span class="msg-time">${new Date(msg.sentAt).toLocaleTimeString('ar-SA', {hour:'2-digit', minute:'2-digit'})}</span></div>`;
            if (msg.isFromTeacher && !msg.isRead) unreadIds.push(msg.id);
        });
        
        if (unreadIds.length > 0) {
            await window.supabase.from('messages').update({ isRead: true }).in('id', unreadIds);
        }
        area.scrollTop = area.scrollHeight;
    } catch(e) { console.error(e); }
}

async function sendToTeacher(base64Audio = null) {
    const teacherId = await getMyTeacherId(); 
    if (!teacherId) return alert('خطأ: لا يوجد معلم'); 
    
    const input = document.getElementById('chatInput'); 
    const content = base64Audio ? base64Audio : input.value.trim();
    if (!content && !attachmentData) return;
    
    const currentUser = getCurrentUser();
    const isVoice = base64Audio !== null;

    if (editingMessageId && !isVoice) {
        await window.supabase.from('messages').update({ content: content, attachment: attachmentData }).eq('id', editingMessageId);
        cancelEdit(); 
        await loadChatWithTeacher(); 
        return;
    }
    
    const newMessage = {
        id: Date.now(),
        studentId: currentUser.id,
        teacherId: teacherId,
        content: content || (attachmentData ? '📎 مرفق' : ''),
        attachment: attachmentData,
        isVoice: isVoice,
        isFromTeacher: false,
        isRead: false
    };

    await window.supabase.from('messages').insert([newMessage]);
    if(!isVoice) { input.value = ''; clearAttachment(); }
    await loadChatWithTeacher();
}

async function executeMessageDelete() {
    if (!pendingDeleteMessageId) return;
    await window.supabase.from('messages').delete().eq('id', pendingDeleteMessageId);
    closeDeleteModal();
    await loadChatWithTeacher(); 
}

// ... (الدوال المساعدة المشابهة لملف المعلم)
function toggleMessageMenu(e, msgId) { e.stopPropagation(); document.querySelectorAll('.msg-dropdown').forEach(m => m.style.display = 'none'); const menu = document.getElementById(`msgMenu_${msgId}`); if (menu) menu.style.display = 'block'; }
function deleteMessage(messageId) { pendingDeleteMessageId = messageId; document.getElementById('deleteConfirmModal').style.display = 'flex'; }
function closeDeleteModal() { pendingDeleteMessageId = null; document.getElementById('deleteConfirmModal').style.display = 'none'; }
function startEditMessage(id, content) { editingMessageId = id; const input = document.getElementById('chatInput'); input.value = content; input.focus(); input.classList.add('editing'); document.getElementById('sendBtn').innerHTML = 'تحديث'; document.getElementById('sendBtn').classList.add('update-mode'); document.getElementById('cancelEditBtn').style.display = 'block'; }
function cancelEdit() { editingMessageId = null; document.getElementById('chatInput').value = ''; document.getElementById('chatInput').classList.remove('editing'); document.getElementById('sendBtn').innerHTML = 'أرسل'; document.getElementById('sendBtn').classList.remove('update-mode'); document.getElementById('cancelEditBtn').style.display = 'none'; }
function clearAttachment() { attachmentData = null; document.getElementById('attachmentPreviewBox').style.display = 'none'; }

window.sendToTeacher = sendToTeacher;
window.executeMessageDelete = executeMessageDelete;
window.deleteMessage = deleteMessage;
window.closeDeleteModal = closeDeleteModal;
window.startEditMessage = startEditMessage;
window.cancelEdit = cancelEdit;
window.clearAttachment = clearAttachment;
