// ============================================
// 📁 الملف: assets/js/member.js
// الوصف: بوابة العضو (تفاعل كامل مع الاستبيانات، المرفقات، ومرئيات الطلاب + قاعدة بيانات)
// ============================================

// --- إعدادات قاعدة البيانات (IndexedDB) ---
const DB_NAME = 'CommitteeAppDB';
const DB_VERSION = 1;
const STORE_NAME = 'meetings';
let db;

// فتح قاعدة البيانات
function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };

        request.onsuccess = (e) => {
            db = e.target.result;
            resolve(db);
        };
        
        request.onerror = (e) => reject('خطأ في فتح قاعدة البيانات');
    });
}

// دوال مساعدة للتعامل مع القاعدة
function dbGet(id) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.get(id);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

function dbGetAll() {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

function dbPut(item) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const request = store.put(item);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

// --- المتغيرات العامة ---
let canvas, ctx;
let isDrawing = false;
let hasSigned = false;
let lastX = 0;
let lastY = 0;
let currentMeetingId = null;

// --- عند تحميل الصفحة ---
document.addEventListener('DOMContentLoaded', async function() {
    if (typeof getCurrentUser !== 'function') return console.error("auth.js missing");
    const user = getCurrentUser();
    if (!user) { window.location.href = '../../index.html'; return; }

    // عرض بيانات العضو
    if(document.getElementById('memberNameDisplay')) {
        document.getElementById('memberNameDisplay').textContent = 'أ/ ' + user.name;
    }
    if(document.getElementById('memberRoleDisplay')) {
        document.getElementById('memberRoleDisplay').textContent = user.title || user.role;
    }

    // تهيئة قاعدة البيانات والبيانات
    await openDB();
    loadMyMeetings();
    loadMemberStudentsMultiSelect();
    
    // إعداد لوحة التوقيع
    setupSignaturePadEvents();

    // إغلاق القائمة المنسدلة عند النقر خارجها
    document.addEventListener('click', function(e) {
        const container = document.getElementById('studentMultiSelect');
        const list = document.getElementById('studentOptionsList');
        if (container && !container.contains(e.target)) {
            list.classList.remove('show');
        }
    });
});

// التبديل بين التبويبات (اجتماعاتي / التقارير)
function switchMemberTab(tabName) {
    ['meetings', 'reports'].forEach(sec => {
        const section = document.getElementById(`section-${sec}`);
        const link = document.getElementById(`link-${sec}`);
        if(section) section.classList.remove('active');
        if(link) link.classList.remove('active');
    });
    const activeSection = document.getElementById(`section-${tabName}`);
    const activeLink = document.getElementById(`link-${tabName}`);
    if(activeSection) activeSection.classList.add('active');
    if(activeLink) activeLink.classList.add('active');
}

// --- 1. تحميل الاجتماعات الخاصة بالعضو ---
async function loadMyMeetings() {
    const user = getCurrentUser();
    const container = document.getElementById('myMeetingsContainer');
    
    try {
        const meetings = await dbGetAll();
        // تصفية الاجتماعات التي يكون العضو مدعواً لها
        const myMeetings = meetings.filter(m => m.attendees && m.attendees.includes(user.id));

        if (myMeetings.length === 0) {
            container.innerHTML = '<div class="alert alert-info">لا توجد اجتماعات مجدولة لك حالياً.</div>';
            return;
        }

        let html = '<table class="table table-bordered bg-white"><thead><tr><th>عنوان الاجتماع</th><th>التاريخ</th><th>الحالة</th><th>إجراء</th></tr></thead><tbody>';
        
        myMeetings.sort((a, b) => new Date(b.date) - new Date(a.date)); // ترتيب تنازلي

        myMeetings.forEach(m => {
            const isSigned = m.signatures && m.signatures[user.id];
            const statusHTML = isSigned ? '<span class="status-signed">✔ تم التوقيع</span>' : '<span class="status-pending">⌛ بانتظار التوقيع</span>';
            html += `<tr>
                <td>${m.title}</td>
                <td>${m.date}</td>
                <td>${statusHTML}</td>
                <td><button class="btn btn-sm btn-primary" onclick="openSigningModal(${m.id})">${isSigned ? 'عرض التفاصيل' : 'مشاركة وتوقيع'}</button></td>
            </tr>`;
        });
        html += '</tbody></table>';
        container.innerHTML = html;
    } catch(e) {
        console.error(e);
        container.innerHTML = '<div class="alert alert-danger">حدث خطأ في تحميل البيانات.</div>';
    }
}

// --- 2. نافذة التوقيع والمشاركة التفاعلية ---
async function openSigningModal(id) {
    currentMeetingId = id;
    const meeting = await dbGet(id);
    const user = getCurrentUser();
    if (!meeting) return;

    document.getElementById('signModalTitle').textContent = meeting.title;
    
    // بناء محتوى التفاصيل
    let html = `<div class="meeting-meta-info"><span><strong>📅 التاريخ:</strong> ${meeting.date}</span></div>`;
    
    // عرض النص الحر
    html += `<div class="meeting-content-text">${meeting.content || 'لا يوجد نص إضافي.'}</div>`;
    
    // عرض المرفقات (إن وجدت)
    if(meeting.pdfFile || meeting.imgFile) {
        html += `<div style="margin-top:15px; padding:10px; background:#f9f9f9; border:1px solid #eee; border-radius:5px;">
            <strong style="color:#007bff;">📎 المرفقات:</strong><br>`;
        
        if(meeting.pdfFile) {
            html += `<a href="${meeting.pdfFile}" download="attachment.pdf" class="btn btn-sm btn-info mt-2">⬇️ تحميل ملف PDF</a><br>`;
        }
        if(meeting.imgFile) {
            html += `<div style="margin-top:10px;"><img src="${meeting.imgFile}" style="max-width:100%; border:1px solid #ccc; border-radius:5px;"></div>`;
        }
        html += `</div>`;
    }

    // التحقق من حالة توقيع العضو
    const isSigned = meeting.signatures && meeting.signatures[user.id];

    // --- عرض الأدوات التفاعلية (إذا لم يوقع بعد) ---
    if (!isSigned) {
        // أ) التصويت
        if(meeting.polls && meeting.polls.length > 0) {
            html += `<hr><h5 style="color:#007bff;">📊 يرجى التصويت على ما يلي:</h5>`;
            meeting.polls.forEach(poll => {
                html += `<div class="mb-3 p-3 bg-light border rounded">
                    <strong>❓ ${poll.question}</strong><br>
                    <div style="margin-top:5px;">`;
                poll.options.forEach(opt => {
                    html += `<label class="ml-3 mt-1" style="display:block; cursor:pointer">
                        <input type="radio" name="poll_${poll.id}" value="${opt}"> ${opt}
                    </label>`;
                });
                html += `</div></div>`;
            });
        }

        // ب) مرئيات الطلاب
        if(meeting.requestedFeedback && meeting.requestedFeedback.length > 0) {
            html += `<hr><h5 style="color:#28a745;">👨‍🎓 يرجى كتابة مرئياتك عن الطلاب:</h5>`;
            meeting.requestedFeedback.forEach(req => {
                html += `<div class="mb-3">
                    <label style="font-weight:bold;">الطالب: ${req.name}</label>
                    <textarea class="form-control feedback-input" data-student-id="${req.id}" rows="2" placeholder="اكتب ملاحظاتك وتوصياتك لهذا الطالب..."></textarea>
                </div>`;
            });
        }
    } else {
        // إذا كان موقعاً مسبقاً
        const mySig = meeting.signatures[user.id];
        html += `<hr><div class="alert alert-success">
            <strong>✅ لقد قمت بتعبئة النموذج واعتماد التوقيع.</strong><br>
            تاريخ الاعتماد: ${new Date(mySig.date).toLocaleDateString('ar-SA')}
        </div>`;
    }

    // وضع المحتوى في النافذة
    document.getElementById('signModalDetails').innerHTML = html;

    // إعداد مناطق التوقيع والأزرار
    const sigContainer = document.getElementById('signatureContainer');
    const savedSigDisplay = document.getElementById('savedSignatureDisplay');
    const actionArea = document.getElementById('signatureActionArea');
    const noteInput = document.getElementById('memberNoteInput');

    if (isSigned) {
        // إخفاء أدوات التوقيع وعرض الصورة المحفوظة
        sigContainer.style.display = 'none';
        savedSigDisplay.style.display = 'block';
        savedSigDisplay.innerHTML = `<img src="${meeting.signatures[user.id].image}" class="saved-signature-img">`;
        actionArea.style.display = 'none';
        noteInput.style.display = 'none'; 
    } else {
        // عرض أدوات التوقيع
        sigContainer.style.display = 'block';
        savedSigDisplay.style.display = 'none';
        actionArea.style.display = 'block';
        noteInput.style.display = 'block';
        noteInput.value = ''; // تصفير الملاحظات العامة
        
        // إعادة تهيئة الكانفاس بعد فتح النافذة بقليل
        setTimeout(initializeCanvas, 300);
    }

    document.getElementById('signMeetingModal').classList.add('show');
}

// --- 3. حفظ التوقيع والإجابات ---
async function submitSignature() {
    if (!hasSigned) { alert("الرجاء التوقيع أولاً في المربع المخصص."); return; }
    
    const user = getCurrentUser();
    const meeting = await dbGet(currentMeetingId);
    
    if(!meeting) return;

    // أ) جمع إجابات التصويت (Polls)
    const pollResponses = {};
    if(meeting.polls && meeting.polls.length > 0) {
        let allAnswered = true;
        meeting.polls.forEach(poll => {
            const selected = document.querySelector(`input[name="poll_${poll.id}"]:checked`);
            if(selected) {
                pollResponses[poll.id] = selected.value;
            } else {
                allAnswered = false;
            }
        });
        if(!allAnswered) return alert('الرجاء الإجابة على جميع بنود التصويت قبل الاعتماد.');
    }

    // ب) جمع مرئيات الطلاب (Feedback)
    const feedbackResponses = {};
    if(meeting.requestedFeedback && meeting.requestedFeedback.length > 0) {
        let allFilled = true;
        document.querySelectorAll('.feedback-input').forEach(input => {
            const val = input.value.trim();
            if(val) {
                feedbackResponses[input.dataset.studentId] = val;
            } else {
                allFilled = false;
            }
        });
        if(!allFilled) return alert('الرجاء كتابة المرئيات لجميع الطلاب المطلوبين.');
    }

    // ج) الملاحظات العامة والتوقيع
    const note = document.getElementById('memberNoteInput').value;
    const signatureImage = canvas.toDataURL('image/png');

    // د) الحفظ في كائن الاجتماع
    if (!meeting.signatures) meeting.signatures = {};
    
    meeting.signatures[user.id] = {
        name: user.name,
        date: new Date().toISOString(),
        image: signatureImage,
        note: note,
        pollResponses: pollResponses,
        feedbackResponses: feedbackResponses
    };

    // التحديث في قاعدة البيانات
    try {
        await dbPut(meeting);
        document.getElementById('signMeetingModal').classList.remove('show');
        loadMyMeetings(); // تحديث القائمة
        alert('تم الإرسال والاعتماد بنجاح ✅');
    } catch(e) {
        console.error(e);
        alert('حدث خطأ أثناء الحفظ.');
    }
}

function closeSigningModal() {
    document.getElementById('signMeetingModal').classList.remove('show');
}

// --- 4. أدوات لوحة التوقيع (Canvas) ---
function setupSignaturePadEvents() {
    canvas = document.getElementById('signature-pad');
    ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#000';
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.lineWidth = 2;

    // أحداث الماوس
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);

    // أحداث اللمس (موبايل)
    canvas.addEventListener('touchstart', startDrawing, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', stopDrawing);
}

function initializeCanvas() {
    const container = document.getElementById('signatureContainer');
    if(container && canvas) {
        canvas.width = container.offsetWidth - 4; // خصم الحدود
        canvas.height = 200;
        clearSignaturePad();
    }
}

function startDrawing(e) {
    isDrawing = true;
    hasSigned = true; // تم البدء بالتوقيع
    const pos = getEventPosition(e);
    [lastX, lastY] = [pos.x, pos.y];
}

function draw(e) {
    if (!isDrawing) return;
    e.preventDefault(); // منع التمرير في الموبايل
    const pos = getEventPosition(e);
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    [lastX, lastY] = [pos.x, pos.y];
}

function stopDrawing() {
    isDrawing = false;
}

function clearSignaturePad() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasSigned = false;
}

function getEventPosition(e) {
    const rect = canvas.getBoundingClientRect();
    let x, y;
    if (e.touches && e.touches[0]) {
        x = e.touches[0].clientX - rect.left;
        y = e.touches[0].clientY - rect.top;
    } else {
        x = e.clientX - rect.left;
        y = e.clientY - rect.top;
    }
    return { x, y };
}

// --- 5. القائمة متعددة الاختيار (Multi-Select) للتقارير ---
function loadMemberStudentsMultiSelect() {
    const listContainer = document.getElementById('studentOptionsList');
    if(!listContainer) return;

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const students = users.filter(u => u.role === 'student');

    if(students.length === 0) {
        listContainer.innerHTML = '<div style="padding:10px;">لا يوجد طلاب.</div>';
        return;
    }

    // خيار "تحديد الكل"
    let html = `
        <div class="multi-select-option select-all-option" onclick="toggleSelectAllStudents(this)">
            <input type="checkbox" id="selectAllCheckbox">
            <label for="selectAllCheckbox">👥 تحديد الكل</label>
        </div>
    `;

    // قائمة الطلاب
    students.forEach(s => {
        html += `
            <div class="multi-select-option" onclick="toggleStudentCheckbox(this)">
                <input type="checkbox" value="${s.id}" class="student-checkbox">
                <label>${s.name}</label>
            </div>
        `;
    });

    listContainer.innerHTML = html;
}

function toggleMultiSelect() {
    const list = document.getElementById('studentOptionsList');
    list.classList.toggle('show');
}

function toggleSelectAllStudents(optionDiv) {
    const mainCheckbox = optionDiv.querySelector('input');
    // تأخير بسيط لضمان التقاط الحدث
    setTimeout(() => {
        const isChecked = mainCheckbox.checked;
        const allCheckboxes = document.querySelectorAll('.student-checkbox');
        allCheckboxes.forEach(cb => cb.checked = isChecked);
        updateMultiSelectLabel();
    }, 0);
}

function toggleStudentCheckbox(optionDiv) {
    setTimeout(() => {
        updateMultiSelectLabel();
        
        // تحديث حالة "تحديد الكل"
        const allCheckboxes = document.querySelectorAll('.student-checkbox');
        const checkedCount = document.querySelectorAll('.student-checkbox:checked').length;
        const selectAllCb = document.getElementById('selectAllCheckbox');
        if(selectAllCb) {
            selectAllCb.checked = (allCheckboxes.length > 0 && checkedCount === allCheckboxes.length);
        }
    }, 0);
}

function updateMultiSelectLabel() {
    const labelSpan = document.getElementById('multiSelectLabel');
    const checkedBoxes = document.querySelectorAll('.student-checkbox:checked');
    const totalCount = document.querySelectorAll('.student-checkbox').length;
    
    if (checkedBoxes.length === 0) {
        labelSpan.textContent = '-- اختر الطلاب --';
        labelSpan.style.color = '#666';
    } else if (checkedBoxes.length === totalCount) {
        labelSpan.textContent = `👥 الجميع (${totalCount})`;
        labelSpan.style.color = '#007bff';
        labelSpan.style.fontWeight = 'bold';
    } else if (checkedBoxes.length === 1) {
        const name = checkedBoxes[0].parentElement.querySelector('label').textContent;
        labelSpan.textContent = `👤 ${name}`;
        labelSpan.style.color = '#333';
        labelSpan.style.fontWeight = 'normal';
    } else {
        labelSpan.textContent = `✅ تم اختيار ${checkedBoxes.length} طلاب`;
        labelSpan.style.color = '#007bff';
        labelSpan.style.fontWeight = 'bold';
    }
}

// --- 6. توليد التقارير ---
function memberGenerateReport() {
    const checkedBoxes = document.querySelectorAll('.student-checkbox:checked');
    const type = document.getElementById('memberReportType').value;
    const container = document.getElementById('reportPreviewArea');

    if (checkedBoxes.length === 0) {
        container.innerHTML = '<div class="alert alert-warning">الرجاء اختيار طالب واحد على الأقل.</div>';
        return;
    }

    // جمع الـ IDs في مصفوفة
    const targetIds = Array.from(checkedBoxes).map(cb => cb.value);

    try {
        // هذه الدوال موجودة في reports.js
        const reportFuncs = {
            'attendance': generateAttendanceReport, 
            'achievement': generateAchievementReport, 
            'assignments': generateAssignmentsReport,
            'iep': generateIEPReport, 
            'diagnostic': generateDiagnosticReport, 
            'schedule': generateScheduleReport, 
            'credit': generateCreditReport
        };
        
        if (reportFuncs[type] && typeof reportFuncs[type] === 'function') {
            reportFuncs[type](targetIds, container);
        } else {
            container.innerHTML = '<div class="alert alert-danger">نوع التقرير غير مدعوم أو الملف reports.js غير محمل.</div>';
        }
    } catch (e) { 
        console.error(e); 
        container.innerHTML = '<div class="alert alert-danger">حدث خطأ أثناء إنشاء التقرير. تأكد من تحميل ملف reports.js</div>'; 
    }
}
