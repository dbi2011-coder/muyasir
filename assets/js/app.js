// ============================================
// 📁 المسار: assets/js/app.js
// الوصف: المحرك العام للتنبيهات والاشعارات الاحترافية
// ============================================

/**
 * 1. دالة إظهار نافذة التأكيد الاحترافية (Confirm Modal)
 * تستخدم بدلاً من confirm() التقليدية التي يظهر فيها رابط الموقع
 */
function showConfirmModal(message, onConfirm) {
    // نبحث عن Modal التأكيد في الصفحة
    let modalEl = document.getElementById('confirmModal');
    
    // إذا لم يكن الـ HTML موجوداً، ننشئه برمجياً لضمان عدم توقف الكود
    if (!modalEl) {
        const modalHtml = `
            <div class="modal fade" id="confirmModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content" style="border-radius: 15px; border: none; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
                        <div class="modal-body text-center p-4">
                            <div class="mb-3"><i class="fas fa-exclamation-triangle fa-3x text-warning"></i></div>
                            <p id="confirmModalMessage" class="fw-bold" style="font-size: 1.1rem; color: #334155;"></p>
                            <div class="d-flex justify-content-center gap-2 mt-4">
                                <button type="button" class="btn btn-light px-4" data-bs-dismiss="modal" style="border-radius: 10px;">إلغاء</button>
                                <button type="button" id="confirmModalBtn" class="btn btn-danger px-4" style="border-radius: 10px;">تأكيد</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        modalEl = document.getElementById('confirmModal');
    }

    // تحديث الرسالة
    document.getElementById('confirmModalMessage').textContent = message;
    
    // تجهيز زر التأكيد (إزالة المستمعات السابقة لمنع التكرار)
    const confirmBtn = document.getElementById('confirmModalBtn');
    const newBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newBtn, confirmBtn);

    // تشغيل الـ Modal (يفترض وجود Bootstrap 5)
    const bsModal = new bootstrap.Modal(modalEl);
    bsModal.show();

    newBtn.onclick = function() {
        onConfirm();
        bsModal.hide();
    };
}

/**
 * 2. دالة إظهار التنبيهات العائمة (Toasts)
 */
function showToast(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        container.style.zIndex = '10000';
        document.body.appendChild(container);
    }

    const id = 'toast-' + Date.now();
    const bgColor = type === 'success' ? '#10b981' : '#ef4444';
    const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';

    const html = `
        <div id="${id}" class="toast align-items-center text-white border-0 mb-2" role="alert" style="background-color: ${bgColor}; border-radius: 10px;">
            <div class="d-flex">
                <div class="toast-body" style="font-family: 'Tajawal', sans-serif;">
                    <i class="fas ${icon} me-2"></i> ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        </div>`;

    container.insertAdjacentHTML('beforeend', html);
    const element = document.getElementById(id);
    const toast = new bootstrap.Toast(element, { delay: 3000 });
    toast.show();
    element.addEventListener('hidden.bs.toast', () => element.remove());
}

// تصدير الدوال للنافذة العالمية ليراها ملف messages.js
window.showConfirmModal = showConfirmModal;
window.showSuccess = (msg) => showToast(msg, 'success');
window.showError = (msg) => showToast(msg, 'danger');
