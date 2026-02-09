const API_BASE_URL = 'https://edu-api.havirkesht.ir';
let currentPage = 1;
let provinces = [];
let provinceToDelete = null;

// وقتی DOM لود شد
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    initDashboard();
    checkApiStatus();
    loadProvinces();
});

// بررسی احراز هویت
// بررسی احراز هویت در داشبورد
function checkAuth() {
    const token = localStorage.getItem('havirkesht_token');
    const username = localStorage.getItem('havirkesht_username');
    
    console.log('بررسی احراز در داشبورد:', { token: !!token, username });
    
    if (!token || !username) {
        console.log('توکن یا نام کاربری وجود ندارد، انتقال به صفحه لاگین');
        // از replace استفاده کنید تا از تاریخچه مرورگر پاک شود
        window.location.replace('login.html');
        return;
    }
    
    // نمایش نام کاربر
    const usernameDisplay = document.getElementById('usernameDisplay');
    if (usernameDisplay) {
        usernameDisplay.textContent = username;
    }
}

// مقداردهی اولیه داشبورد
function initDashboard() {
    // دکمه خروج
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    
    // دکمه افزودن استان
    const addBtn = document.getElementById('addProvinceBtn');
    if (addBtn) {
        addBtn.addEventListener('click', addProvince);
    }
    
    // فیلد ورودی استان
    const provinceInput = document.getElementById('provinceNameInput');
    if (provinceInput) {
        provinceInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                addProvince();
            }
        });
    }
    
    // دکمه‌های صفحه‌بندی
    const prevPageBtn = document.getElementById('prevPageBtn');
    const nextPageBtn = document.getElementById('nextPageBtn');
    
    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', () => changePage(-1));
    }
    
    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', () => changePage(1));
    }
    
    // مودال حذف
    const deleteModal = document.getElementById('deleteModal');
    const closeDeleteModal = document.getElementById('closeDeleteModal');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    
    if (closeDeleteModal) {
        closeDeleteModal.addEventListener('click', closeDeleteModalFunc);
    }
    
    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', closeDeleteModalFunc);
    }
    
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', confirmDelete);
    }
    
    // بستن مودال با کلیک خارج
    if (deleteModal) {
        deleteModal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeDeleteModalFunc();
            }
        });
    }
}

// بررسی وضعیت API
async function checkApiStatus() {
    const indicator = document.getElementById('apiStatusIndicator');
    const text = document.getElementById('apiStatusText');
    
    if (!indicator || !text) return;
    
    indicator.className = 'status-indicator status-disconnected';
    text.textContent = 'در حال اتصال...';
    
    try {
        const response = await fetch(`${API_BASE_URL}/`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });
        
        if (response.ok) {
            indicator.className = 'status-indicator status-connected';
            text.textContent = 'متصل ✓';
        } else {
            text.textContent = `خطا: ${response.status}`;
        }
    } catch (error) {
        text.textContent = 'عدم اتصال';
        console.warn('خطا در بررسی وضعیت API:', error);
    }
}

// بارگذاری استان‌ها
async function loadProvinces() {
    const tableBody = document.getElementById('provincesTableBody');
    const provinceCount = document.getElementById('provinceCount');
    const pagination = document.getElementById('pagination');
    
    if (!tableBody) return;
    
    // نمایش حالت لودینگ
    tableBody.innerHTML = `
        <tr>
            <td colspan="5" class="loading">
                <i class="fas fa-spinner fa-spin"></i>
                در حال بارگذاری استان‌ها...
            </td>
        </tr>
    `;
    
    try {
        const response = await apiRequest('/province/', 'GET');
        
        if (response && response.items) {
            provinces = response.items;
            
            // به‌روزرسانی تعداد استان‌ها
            if (provinceCount) {
                provinceCount.textContent = provinces.length;
            }
            
            // نمایش استان‌ها
            displayProvinces(provinces);
            
            // نمایش یا پنهان کردن صفحه‌بندی
            if (pagination) {
                pagination.style.display = 'flex';
                updatePaginationButtons();
            }
        } else {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 40px; color: var(--gray);">
                        <i class="fas fa-database" style="font-size: 48px; margin-bottom: 15px; opacity: 0.5;"></i>
                        <p>هیچ استان‌ای یافت نشد</p>
                        <p style="font-size: 14px; margin-top: 10px;">اولین استان خود را اضافه کنید</p>
                    </td>
                </tr>
            `;
            
            if (pagination) {
                pagination.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('خطا در بارگذاری استان‌ها:', error);
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 40px; color: var(--danger);">
                    <i class="fas fa-exclamation-circle" style="font-size: 48px; margin-bottom: 15px;"></i>
                    <p>خطا در بارگذاری استان‌ها</p>
                    <p style="font-size: 14px; margin-top: 10px;">${error.message}</p>
                </td>
            </tr>
        `;
        
        if (pagination) {
            pagination.style.display = 'none';
        }
    }
}

// نمایش استان‌ها در جدول
function displayProvinces(provincesToShow) {
    const tableBody = document.getElementById('provincesTableBody');
    
    if (!tableBody || !provincesToShow || provincesToShow.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 40px; color: var(--gray);">
                    <i class="fas fa-database" style="font-size: 48px; margin-bottom: 15px; opacity: 0.5;"></i>
                    <p>هیچ استان‌ای یافت نشد</p>
                </td>
            </tr>
        `;
        return;
    }
    
    let html = '';
    
    provincesToShow.forEach((province, index) => {
        const rowNumber = (currentPage - 1) * 10 + index + 1;
        const createdDate = province.created_at ? 
            new Date(province.created_at).toLocaleDateString('fa-IR') : 
            'نامشخص';
        
        html += `
            <tr>
                <td>${rowNumber}</td>
                <td>
                    <div style="font-weight: 600; color: var(--primary);">${province.province}</div>
                </td>
                <td>
                    <div style="color: var(--gray);">${createdDate}</div>
                </td>
                <td>
                    <span class="status-badge status-active">فعال</span>
                </td>
                <td>
                    <div class="table-actions">
                        <button class="action-btn btn-view" title="مشاهده">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-btn btn-edit" title="ویرایش">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn btn-delete" 
                                onclick="openDeleteModal('${province.province}')"
                                title="حذف">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
    
    tableBody.innerHTML = html;
}

// افزودن استان جدید
async function addProvince() {
    const input = document.getElementById('provinceNameInput');
    const addBtn = document.getElementById('addProvinceBtn');
    
    if (!input || !addBtn) return;
    
    const provinceName = input.value.trim();
    
    // اعتبارسنجی
    if (!provinceName) {
        showMessage('لطفاً نام استان را وارد کنید', 'error');
        input.focus();
        return;
    }
    
    if (provinceName.length > 50) {
        showMessage('نام استان نباید بیشتر از ۵۰ کاراکتر باشد', 'error');
        return;
    }
    
    // تنظیم حالت لودینگ
    const originalText = addBtn.innerHTML;
    addBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> در حال افزودن...';
    addBtn.disabled = true;
    
    try {
        await apiRequest('/province/', 'POST', {
            province: provinceName
        });
        
        showMessage(`استان "${provinceName}" با موفقیت اضافه شد`, 'success');
        
        // پاک کردن فیلد ورودی
        input.value = '';
        
        // بارگذاری مجدد لیست استان‌ها
        await loadProvinces();
        
    } catch (error) {
        showMessage(`خطا در افزودن استان: ${error.message}`, 'error');
    } finally {
        // بازگرداندن دکمه به حالت عادی
        addBtn.innerHTML = originalText;
        addBtn.disabled = false;
        input.focus();
    }
}

// باز کردن مودال حذف
function openDeleteModal(provinceName) {
    const modal = document.getElementById('deleteModal');
    const message = document.getElementById('deleteMessage');
    
    if (!modal || !message) return;
    
    provinceToDelete = provinceName;
    message.textContent = `آیا از حذف استان "${provinceName}" اطمینان دارید؟ این عمل غیرقابل بازگشت است.`;
    
    modal.style.display = 'flex';
}

// بستن مودال حذف
function closeDeleteModalFunc() {
    const modal = document.getElementById('deleteModal');
    if (modal) {
        modal.style.display = 'none';
        provinceToDelete = null;
    }
}

// تایید حذف استان
async function confirmDelete() {
    if (!provinceToDelete) return;
    
    const confirmBtn = document.getElementById('confirmDeleteBtn');
    const originalText = confirmBtn.innerHTML;
    
    // تنظیم حالت لودینگ
    confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> در حال حذف...';
    confirmBtn.disabled = true;
    
    try {
        // کدگذاری نام استان برای URL
        const encodedProvinceName = encodeURIComponent(provinceToDelete);
        
        await apiRequest(`/province/${encodedProvinceName}`, 'DELETE');
        
        showMessage(`استان "${provinceToDelete}" با موفقیت حذف شد`, 'success');
        
        // بستن مودال
        closeDeleteModalFunc();
        
        // بارگذاری مجدد لیست استان‌ها
        await loadProvinces();
        
    } catch (error) {
        showMessage(`خطا در حذف استان: ${error.message}`, 'error');
    } finally {
        // بازگرداندن دکمه به حالت عادی
        confirmBtn.innerHTML = originalText;
        confirmBtn.disabled = false;
    }
}

// تغییر صفحه
function changePage(direction) {
    currentPage += direction;
    
    // محاسبه شروع و پایان
    const start = (currentPage - 1) * 10;
    const end = start + 10;
    
    // نمایش استان‌های صفحه فعلی
    const provincesToShow = provinces.slice(start, end);
    displayProvinces(provincesToShow);
    
    // به‌روزرسانی صفحه‌بندی
    updatePaginationButtons();
}

// به‌روزرسانی دکمه‌های صفحه‌بندی
function updatePaginationButtons() {
    const prevBtn = document.getElementById('prevPageBtn');
    const nextBtn = document.getElementById('nextPageBtn');
    const pageInfo = document.getElementById('pageInfo');
    
    if (!prevBtn || !nextBtn || !pageInfo) return;
    
    const totalPages = Math.ceil(provinces.length / 10);
    
    // به‌روزرسانی اطلاعات صفحه
    pageInfo.textContent = `صفحه ${currentPage} از ${totalPages}`;
    
    // فعال/غیرفعال کردن دکمه‌ها
    prevBtn.disabled = currentPage <= 1;
    nextBtn.disabled = currentPage >= totalPages;
}

// نمایش پیام
function showMessage(message, type = 'info') {
    const messageBox = document.getElementById('messageBox');
    if (!messageBox) return;
    
    // تنظیم نوع پیام
    messageBox.className = `message-box message-${type}`;
    messageBox.innerHTML = `
        <i class="fas fa-${getMessageIcon(type)}"></i>
        <span>${message}</span>
    `;
    messageBox.style.display = 'flex';
    
    // پنهان کردن خودکار
    setTimeout(() => {
        messageBox.style.display = 'none';
    }, 5000);
}

// دریافت آیکون مناسب برای پیام
function getMessageIcon(type) {
    switch(type) {
        case 'success': return 'check-circle';
        case 'error': return 'exclamation-circle';
        case 'warning': return 'exclamation-triangle';
        default: return 'info-circle';
    }
}

// درخواست API
async function apiRequest(endpoint, method = 'GET', body = null) {
    const token = localStorage.getItem('havirkesht_token');
    
    if (!token && endpoint !== '/') {
        throw new Error('توکن احراز هویت یافت نشد');
    }
    
    const headers = {
        'Accept': 'application/json'
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    if (body && method !== 'GET') {
        headers['Content-Type'] = 'application/json';
    }
    
    const options = {
        method,
        headers
    };
    
    if (body && method !== 'GET') {
        options.body = JSON.stringify(body);
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        
        // اگر توکن منقضی شده باشد
        if (response.status === 401) {
            logout();
            throw new Error('احراز هویت نامعتبر است');
        }
        
        if (!response.ok) {
            let errorMessage = `خطا: ${response.status}`;
            
            try {
                const errorData = await response.json();
                
                if (errorData.detail && Array.isArray(errorData.detail)) {
                    errorMessage = errorData.detail.map(err => err.msg).join(', ');
                } else if (errorData.detail) {
                    errorMessage = errorData.detail;
                } else if (errorData.message) {
                    errorMessage = errorData.message;
                }
            } catch {
                // اگر پاسخ JSON نبود
                const text = await response.text();
                if (text) {
                    errorMessage = text;
                }
            }
            
            throw new Error(errorMessage);
        }
        
        // اگر پاسخ بدون محتوا بود
        if (response.status === 204) {
            return {};
        }
        
        // پردازش پاسخ JSON
        return await response.json();
        
    } catch (error) {
        console.error(`خطا در درخواست ${endpoint}:`, error);
        throw error;
    }
}

// خروج از سیستم
function logout() {
    // پاک کردن اطلاعات احراز هویت
    localStorage.removeItem('havirkesht_token');
    localStorage.removeItem('havirkesht_refresh_token');
    localStorage.removeItem('havirkesht_username');
    localStorage.removeItem('havirkesht_login_time');
    
    // هدایت به صفحه لاگین
    window.location.href = 'Login.html';
}

// رویداد فشار کلیدهای صفحه‌کلید
document.addEventListener('keydown', function(e) {
    // بستن مودال با کلید Escape
    if (e.key === 'Escape') {
        closeDeleteModalFunc();
    }
});