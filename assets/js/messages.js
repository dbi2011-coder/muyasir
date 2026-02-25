// ============================================
// 📁 المسار: assets/js/messages.js (نسخة Supabase)
// ============================================

let activeChatStudentId = null;
let attachmentData = null;
let editingMessageId = null;
let mediaRecorder = null;
let audioChunks = [];
let recordingInterval = null;
let recordingStartTime = null;
let pendingDeleteMsgId = null;

document.addEventListener('DOMContentLoaded', async function() {
    if (window.location.pathname.includes('messages.html')) {
        try {
            injectFontAwesome();
            injectHtml2Pdf();
            cleanInterfaceAggressive(); 
            injectChatStyles(); // سيتم استخدام ستايلاتك الموجودة في الملف الأصلي
            renderChatLayout(); // سيتم استخدام نفس الهيكل
            await loadConversations();
            
            document.addEventListener('click', function(e) {
                const popup = document.getElementById('emojiPopup');
                const btn = document.getElementById('emojiBtn');
                if (popup && btn && !popup.contains(e.target) && !btn.contains(e.target)) popup.style.display = 'none';
                if (!e.target.closest('.msg-options-btn')) document.querySelectorAll('.msg-dropdown').forEach(menu => menu.style.display = 'none');
            });
        } catch (e) { console.error(e); }
    }
});

function getCurrentUser() { return JSON.parse(sessionStorage.getItem('currentUser')); }

async function loadConversations() {
    const currentUser = getCurrentUser();
    try {
        const { data: messages, error } = await window.supabase.from('messages').select('*').eq('teacherId', currentUser.id).order('sentAt', { ascending: true });
        if (error) throw error;

        const conversations = {};
        (messages || []).forEach(msg => {
            if (!conversations[msg.studentId]) conversations[msg.studentId] = { studentId: msg.studentId, lastMessage: msg, unreadCount: 0 };
            if (new Date(msg.sentAt) > new Date(conversations[msg.studentId].lastMessage.sentAt)) conversations[msg.studentId].lastMessage = msg;
            if (!msg.isFromTeacher && !msg.isRead) conversations[msg.studentId].unreadCount++;
        });

        const sortedConvos = Object.values(conversations).sort((a, b) => new Date(b.lastMessage.sentAt) - new Date(a.lastMessage.sentAt));
        renderSidebar(sortedConvos);
    } catch(e) { console.error("Error loading convos:", e); }
}

function renderSidebar(conversations) {
    const listEl = document.getElementById('chatContactsList');
    listEl.innerHTML = '';
    if (conversations.length === 0) { listEl.innerHTML = '<div class="text-center p-4 text-muted"><small>لا توجد محادثات نشطة</small></div>'; return; }
    
    // جلب الطلاب لترجمة الأسماء
    const users = JSON.parse(localStorage.getItem('users') || '[]');

    conversations.forEach(convo => {
        const student = users.find(u => u.id == convo.studentId);
        const name = student ? student.name : 'طالب';
        const activeClass = activeChatStudentId === convo.studentId ? 'active' : '';
        const unreadHtml = convo.unreadCount > 0 ? `<span class="unread-badge">${convo.unreadCount}</span>` : '';
        const timeStr = new Date(convo.lastMessage.sentAt).toLocaleTimeString('ar-SA', {hour:'2-digit', minute:'2-digit'});
        
        const html = `<div class="chat-item ${activeClass}" onclick="openChat(${convo.studentId}, '${name}')">
            <div class="avatar">${name.charAt(0)}</div>
            <div class="chat-info">
                <div class="chat-name"><span>${name}</span> <span style="font-size:0.7rem; font-weight:normal; color:inherit;">${timeStr}</span></div>
                <div class="chat-preview">${unreadHtml} ${convo.lastMessage.isVoice ? '🎤 تسجيل صوتي' : (convo.lastMessage.attachment ? '📎 مرفق أو صورة' : convo.lastMessage.content)}</div>
            </div></div>`;
        listEl.innerHTML += html;
    });
}

async function openChat(studentId, studentName) {
    activeChatStudentId = studentId;
    cancelEdit();
    const sidebar = document.querySelector('.chat-sidebar');
    if(sidebar) sidebar.classList.remove('show-contacts');

    document.getElementById('chatHeader').style.display = 'flex';
    document.getElementById('chatInputArea').style.display = 'flex';
    document.getElementById('chatHeaderName').textContent = studentName || 'طالب';
    document.getElementById('chatHeaderAvatar').textContent = (studentName || '?').charAt(0);
    
    await loadChatMessages(studentId);
    await loadConversations();
}

async function loadChatMessages(studentId) {
    const currentUser = getCurrentUser();
    try {
        const { data: chatMsgs, error } = await window.supabase.from('messages').select('*').eq('teacherId', currentUser.id).eq('studentId', studentId).order('sentAt', { ascending: true });
        if (error) throw error;

        const area = document.getElementById('chatMessagesArea');
        area.innerHTML = '';
        let unreadIds = [];

        (chatMsgs || []).forEach(msg => {
            const isMe = msg.isFromTeacher; 
            const bubbleClass = isMe ? 'msg-me' : 'msg-other';
            let contentHtml = msg.content;
            let attachHtml = '';

            if (msg.isVoice) {
                contentHtml = `<div style="display:flex; align-items:center; gap:5px;"><audio controls src="${msg.content}"></audio></div>`;
            } else if (msg.attachment) {
                const isImg = msg.attachment.startsWith('data:image');
                if (isImg) {
                    let caption = (contentHtml && contentHtml !== 'مرفق' && contentHtml !== '📎 مرفق') ? `<div style="margin-top:8px; font-size:0.95rem;">${contentHtml}</div>` : '';
                    contentHtml = `<div class="msg-image-wrapper"><img src="${msg.attachment}" onclick="window.open('${msg.attachment}', '_blank')" style="cursor:pointer;" alt="صورة مرسلة"></div>${caption}`;
                } else {
                    attachHtml = `<a href="${msg.attachment}" download="file" class="msg-attachment"><i class="fas fa-file-download"></i> تحميل المرفق</a>`;
                    if (contentHtml === 'مرفق' || contentHtml === '📎 مرفق') contentHtml = '';
                    else if (contentHtml) contentHtml = `<div style="margin-top:5px;">${contentHtml}</div>`;
                    contentHtml = attachHtml + contentHtml;
                }
            }

            let menuHtml = '';
            if (isMe) {
                menuHtml = `<div class="msg-options-btn" onclick="toggleMessageMenu(event, ${msg.id})">⋮</div>
                <div class="msg-dropdown" id="msgMenu_${msg.id}">
                    ${!msg.isVoice ? `<div class="msg-dropdown-item" onclick="startEditMessage(${msg.id}, '${msg.content}')"><i class="fas fa-pen"></i> تعديل</div>` : ''}
                    <div class="msg-dropdown-item delete" onclick="deleteChatMessage(${msg.id})"><i class="fas fa-trash"></i> حذف</div>
                </div>`;
            }

            const html = `<div class="msg-bubble ${bubbleClass}">${menuHtml} ${contentHtml} <span class="msg-time">${new Date(msg.sentAt).toLocaleTimeString('ar-SA', {hour:'2-digit', minute:'2-digit'})}</span></div>`;
            area.innerHTML += html;
            
            if (!msg.isFromTeacher && !msg.isRead) unreadIds.push(msg.id);
        });

        // تحديث حالة القراءة في السحابة
        if (unreadIds.length > 0) {
            await window.supabase.from('messages').update({ isRead: true }).in('id', unreadIds);
        }
        
        area.scrollTop = area.scrollHeight;
    } catch(e) { console.error(e); }
}

async function sendChatMessage(base64Audio = null) {
    if (!activeChatStudentId) return; 
    
    const input = document.getElementById('chatInput'); 
    const content = base64Audio ? base64Audio : input.value.trim();
    if (!content && !attachmentData) return;
    
    const currentUser = getCurrentUser();
    const isVoice = base64Audio !== null;

    if (editingMessageId && !isVoice) {
        try {
            let updateData = { content: content };
            if (attachmentData) updateData.attachment = attachmentData;
            await window.supabase.from('messages').update(updateData).eq('id', editingMessageId);
            cancelEdit(); 
            await loadChatMessages(activeChatStudentId); 
            await loadConversations();
            return;
        } catch(e) { console.error(e); return; }
    }

    const newMessage = {
        id: Date.now(),
        teacherId: currentUser.id,
        studentId: activeChatStudentId,
        content: content || (attachmentData ? '📎 مرفق' : ''),
        attachment: attachmentData,
        isVoice: isVoice,
        isFromTeacher: true,
        isRead: false
    };

    try {
        await window.supabase.from('messages').insert([newMessage]);
        if(!isVoice) { input.value = ''; clearAttachment(); document.getElementById('emojiPopup').style.display = 'none'; }
        await loadChatMessages(activeChatStudentId); 
        await loadConversations();
    } catch(e) { console.error(e); alert('فشل الإرسال'); }
}

async function executeSingleMessageDelete() {
    if (!pendingDeleteMsgId || !activeChatStudentId) return;
    try {
        await window.supabase.from('messages').delete().eq('id', pendingDeleteMsgId);
        closeSingleDeleteModal();
        await loadChatMessages(activeChatStudentId); 
        await loadConversations();
    } catch(e) { console.error(e); }
}

// ... (يرجى الاحتفاظ بدوال التسجيل الصوتي، والمرفقات، والواجهة الموجودة بملفك الأصلي كما هي) ...
// لتوفير المساحة، دوال UI متطابقة وتستخدم sendChatMessage()
function handleEnter(e) { if (e.key === 'Enter') sendChatMessage(); }
function cancelEdit() { editingMessageId = null; const input = document.getElementById('chatInput'); input.value = ''; input.classList.remove('editing'); const sendBtn = document.getElementById('sendBtn'); sendBtn.innerHTML = 'أرسل <i class="fas fa-paper-plane"></i>'; sendBtn.classList.remove('update-mode'); document.getElementById('cancelEditBtn').style.display = 'none'; }
function toggleMessageMenu(e, msgId) { e.stopPropagation(); document.querySelectorAll('.msg-dropdown').forEach(m => m.style.display = 'none'); const menu = document.getElementById(`msgMenu_${msgId}`); if (menu) menu.style.display = 'block'; }
function deleteChatMessage(messageId) { pendingDeleteMsgId = messageId; document.querySelectorAll('.msg-dropdown').forEach(m => m.style.display = 'none'); document.getElementById('deleteSingleMsgModal').style.display = 'flex'; }
function closeSingleDeleteModal() { pendingDeleteMsgId = null; document.getElementById('deleteSingleMsgModal').style.display = 'none'; }
function startEditMessage(id, content) { editingMessageId = id; const input = document.getElementById('chatInput'); input.value = content; input.focus(); input.classList.add('editing'); document.getElementById('sendBtn').innerHTML = 'تحديث <i class="fas fa-check"></i>'; document.getElementById('sendBtn').classList.add('update-mode'); document.getElementById('cancelEditBtn').style.display = 'block'; }
function clearAttachment() { attachmentData = null; document.getElementById('attachmentPreviewBox').style.display = 'none'; document.getElementById('chatFileInput').value = ''; document.getElementById('chatCamInput').value = ''; }
function readFileAsBase64(file) { return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = error => reject(error); reader.readAsDataURL(file); }); }
async function handleChatAttachment(input) { if (input.files && input.files[0]) { attachmentData = await readFileAsBase64(input.files[0]); document.getElementById('attachmentPreviewBox').style.display = 'block'; document.getElementById('chatInput').focus(); } }

window.sendChatMessage = sendChatMessage;
window.executeSingleMessageDelete = executeSingleMessageDelete;
window.deleteChatMessage = deleteChatMessage;
window.closeSingleDeleteModal = closeSingleDeleteModal;
window.startEditMessage = startEditMessage;
window.cancelEdit = cancelEdit;
window.handleChatAttachment = handleChatAttachment;
window.clearAttachment = clearAttachment;
window.openChat = openChat;
