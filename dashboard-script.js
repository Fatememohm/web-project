const API_BASE_URL = 'https://edu-api.havirkesht.ir';

// State Management
let currentState = {
    currentSection: 'dashboard',
    provinces: { data: [], total: 0, page: 1, size: 10 },
    cities: { data: [], total: 0, page: 1, size: 10, provinceFilter: '' },
    villages: { data: [], total: 0, page: 1, size: 10, cityFilter: '' },
    users: { data: [], total: 0, page: 1, size: 10 }
};

// وقتی DOM لود شد
document.addEventListener('DOMContentLoaded', function() {
    initApp();
});

// مقداردهی اولیه برنامه
async function initApp() {
    try {
        // بررسی احراز هویت
        if (!checkAuth()) {
            window.location.href = 'login.html';
            return;
        }

        // مقداردهی اولیه
        initTheme();
        initNavigation();
        initEventListeners();
        initModals();
        
        // بارگذاری اطلاعات اولیه
        await loadInitialData();
        
        // نمایش داشبورد
        showSection('dashboard');
        
        // نمایش نام کاربر
        displayUserInfo();
        
        // بررسی وضعیت API
        checkApiStatus();
        
    } catch (error) {
        console.error('خطا در مقداردهی اولیه:', error);
        showMessage('خطا در بارگذاری برنامه', 'error');
    }
}

// بررسی احراز هویت
function checkAuth() {
    const token = localStorage.getItem('havirkesht_token') || 
                  sessionStorage.getItem('havirkesht_token');
    
    if (!token) {
        showMessage('لطفاً ابتدا وارد شوید', 'error');
        return false;
    }
    
    return true;
}

// مدیریت دارک مود
function initTheme() {
    const themeToggle = document.getElementById('themeToggle');
    if (!themeToggle) return;
    
    const currentTheme = localStorage.getItem('theme') || 'light';
    
    // تنظیم تم اولیه
    document.documentElement.setAttribute('data-theme', currentTheme);
    updateThemeIcon(currentTheme);
    
    // تغییر تم
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    });
}

function updateThemeIcon(theme) {
    const icon = document.querySelector('#themeToggle i');
    if (icon) {
        icon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    }
}

// نمایش/مخفی کردن رمز عبور
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const toggleBtn = input.parentNode.querySelector('.password-toggle i');
    
    if (input.type === 'password') {
        input.type = 'text';
        toggleBtn.className = 'fas fa-eye-slash';
    } else {
        input.type = 'password';
        toggleBtn.className = 'fas fa-eye';
    }
}

// نمایش اطلاعات کاربر
function displayUserInfo() {
    const username = localStorage.getItem('havirkesht_username') || 'مدیر سیستم';
    const usernameDisplay = document.getElementById('usernameDisplay');
    if (usernameDisplay) {
        usernameDisplay.textContent = username;
    }
}

// مقداردهی اولیه ناوبری
function initNavigation() {
    const menuItems = document.querySelectorAll('.menu-item');
    
    menuItems.forEach(item => {
        item.addEventListener('click', function() {
            const section = this.dataset.section;
            
            if (section) {
                showSection(section);
            }
            
            // بروزرسانی وضعیت فعال منو
            menuItems.forEach(i => i.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // دکمه خروج
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
}

// نمایش بخش مورد نظر
function showSection(section) {
    // مخفی کردن همه بخش‌ها
    document.querySelectorAll('.content-section').forEach(el => {
        el.classList.remove('active');
    });
    
    // نمایش بخش انتخاب شده
    const sectionElement = document.getElementById(`${section}Content`);
    if (sectionElement) {
        sectionElement.classList.add('active');
        currentState.currentSection = section;
        
        // بروزرسانی عنوان صفحه
        updatePageTitle(section);
        
        // بارگذاری داده‌های بخش
        loadSectionData(section);
    }
}

// بروزرسانی عنوان صفحه
function updatePageTitle(section) {
    const titles = {
        'dashboard': 'داشبورد اصلی',
        'province': 'مدیریت استان‌ها',
        'city': 'مدیریت شهرستان‌ها',
        'village': 'مدیریت روستاها',
        'users': 'مدیریت کاربران',
        'settings': 'تنظیمات سیستم',
        'reports': 'گزارشات و آمار'
    };
    
    const pageTitle = document.getElementById('pageTitle');
    const breadcrumbCurrent = document.getElementById('breadcrumbCurrent');
    
    if (pageTitle) {
        pageTitle.textContent = titles[section] || 'داشبورد';
    }
    if (breadcrumbCurrent) {
        breadcrumbCurrent.textContent = titles[section] || 'داشبورد';
    }
}

// مقداردهی اولیه رویدادها
function initEventListeners() {
    // دکمه رفرش
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', refreshCurrentSection);
    }
    
    // دکمه اعلان‌ها
    const notificationBtn = document.getElementById('notificationBtn');
    if (notificationBtn) {
        notificationBtn.addEventListener('click', showNotifications);
    }
    
    // دکمه منوی کاربر
    const userMenuBtn = document.getElementById('userMenuBtn');
    if (userMenuBtn) {
        userMenuBtn.addEventListener('click', toggleUserMenu);
    }
    
    // دکمه‌های افزودن
    const addProvinceBtn = document.getElementById('addProvinceBtn');
    if (addProvinceBtn) {
        addProvinceBtn.addEventListener('click', () => openModal('addProvinceModal'));
    }
    
    const addCityBtn = document.getElementById('addCityBtn');
    if (addCityBtn) {
        addCityBtn.addEventListener('click', () => openModal('addCityModal'));
    }
    
    const addVillageBtn = document.getElementById('addVillageBtn');
    if (addVillageBtn) {
        addVillageBtn.addEventListener('click', () => openModal('addVillageModal'));
    }
    
    const addUserBtn = document.getElementById('addUserBtn');
    if (addUserBtn) {
        addUserBtn.addEventListener('click', () => openModal('addUserModal'));
    }
    
    // فرم‌ها
    const provinceForm = document.getElementById('provinceForm');
    if (provinceForm) {
        provinceForm.addEventListener('submit', handleProvinceSubmit);
    }
    
    const cityForm = document.getElementById('cityForm');
    if (cityForm) {
        cityForm.addEventListener('submit', handleCitySubmit);
    }
    
    const villageForm = document.getElementById('villageForm');
    if (villageForm) {
        villageForm.addEventListener('submit', handleVillageSubmit);
    }
    
    const userForm = document.getElementById('userForm');
    if (userForm) {
        userForm.addEventListener('submit', handleUserSubmit);
    }
    
    const changePasswordForm = document.getElementById('changePasswordForm');
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', handlePasswordChange);
    }
    
    // جستجو
    const provinceSearch = document.getElementById('provinceSearch');
    if (provinceSearch) {
        provinceSearch.addEventListener('input', debounce(searchProvinces, 500));
    }
    
    const citySearch = document.getElementById('citySearch');
    if (citySearch) {
        citySearch.addEventListener('input', debounce(searchCities, 500));
    }
    
    const villageSearch = document.getElementById('villageSearch');
    if (villageSearch) {
        villageSearch.addEventListener('input', debounce(searchVillages, 500));
    }
    
    const userSearch = document.getElementById('userSearch');
    if (userSearch) {
        userSearch.addEventListener('input', debounce(searchUsers, 500));
    }
    
    // فیلترها
    const provinceFilter = document.getElementById('provinceFilter');
    if (provinceFilter) {
        provinceFilter.addEventListener('change', filterCitiesByProvince);
    }
    
    const cityFilter = document.getElementById('cityFilter');
    if (cityFilter) {
        cityFilter.addEventListener('change', filterVillagesByCity);
    }
    
    const provinceSort = document.getElementById('provinceSort');
    if (provinceSort) {
        provinceSort.addEventListener('change', sortProvinces);
    }
}

// مقداردهی اولیه مودال‌ها
function initModals() {
    // دکمه تایید حذف
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', handleDelete);
    }
    
    // بستن مودال با کلیک خارج
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('active');
            }
        });
    });
    
    // بستن مودال با کلید Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal.active').forEach(modal => {
                modal.classList.remove('active');
            });
        }
    });
}

// بارگذاری اطلاعات اولیه
async function loadInitialData() {
    try {
        // بارگذاری آمار
        await Promise.all([
            loadProvincesStats(),
            loadCitiesStats(),
            loadVillagesStats(),
            loadUsersStats()
        ]);
        
        // بارگذاری استان‌ها برای فیلتر
        await loadProvincesForFilter();
        
        // بارگذاری شهرستان‌ها برای فیلتر روستا
        await loadCitiesForFilter();
        
    } catch (error) {
        console.error('خطا در بارگذاری اطلاعات اولیه:', error);
    }
}

// بارگذاری داده‌های بخش
async function loadSectionData(section) {
    switch(section) {
        case 'province':
            await loadProvinces();
            break;
        case 'city':
            await loadCities();
            break;
        case 'village':
            await loadVillages();
            break;
        case 'users':
            await loadUsers();
            break;
    }
}

// ==================== API Request Helper ====================

async function apiRequest(endpoint, method = 'GET', params = {}, body = null) {
    // دریافت توکن
    const token = localStorage.getItem('havirkesht_token') || 
                  sessionStorage.getItem('havirkesht_token');
    
    if (!token && endpoint !== '/token') {
        logout();
        throw new Error('توکن احراز هویت یافت نشد');
    }
    
    // ساخت URL با پارامترها
    const url = new URL(`${API_BASE_URL}${endpoint}`);
    Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
            url.searchParams.append(key, params[key]);
        }
    });
    
    // تنظیم هدرها
    const headers = {
        'Accept': 'application/json'
    };
    
    if (token && endpoint !== '/token') {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    // برای فرم‌های x-www-form-urlencoded (مثل /token)
    if (endpoint === '/token') {
        headers['Content-Type'] = 'application/x-www-form-urlencoded';
    } else if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        headers['Content-Type'] = 'application/json';
    }
    
    // تنظیم گزینه‌ها
    const options = {
        method,
        headers
    };
    
    if (body) {
        if (endpoint === '/token') {
            // برای endpoint توکن، body باید FormData باشد
            options.body = body;
        } else {
            options.body = JSON.stringify(body);
        }
    }
    
    try {
        const response = await fetch(url.toString(), options);
        
        // بررسی وضعیت پاسخ
        if (!response.ok) {
            // اگر خطای 401 بود، لاگ اوت کن
            if (response.status === 401) {
                logout();
                throw new Error('احراز هویت نامعتبر است');
            }
            
            // تلاش برای خواندن پیام خطا
            let errorMessage = `خطای ${response.status}`;
            let errorDetail = '';
            
            try {
                const errorData = await response.json();
                
                // استخراج پیام خطا از پاسخ
                if (errorData.detail) {
                    if (typeof errorData.detail === 'string') {
                        errorDetail = errorData.detail;
                    } else if (Array.isArray(errorData.detail)) {
                        errorDetail = errorData.detail.map(err => 
                            `${err.loc ? err.loc.join('.') + ': ' : ''}${err.msg}`
                        ).join(', ');
                    }
                } else if (errorData.message) {
                    errorDetail = errorData.message;
                } else if (errorData.error) {
                    errorDetail = errorData.error;
                }
                
                if (errorDetail) {
                    errorMessage += ` - ${errorDetail}`;
                }
            } catch {
                // اگر پاسخ JSON نبود
                const text = await response.text();
                if (text) {
                    errorMessage += ` - ${text.substring(0, 100)}`;
                }
            }
            
            throw new Error(errorMessage);
        }
        
        // اگر پاسخ خالی بود (مثلاً در DELETE یا 201 Created)
        if (response.status === 204 || response.status === 201) {
            return {};
        }
        
        // بازگشت داده JSON
        return await response.json();
        
    } catch (error) {
        console.error(`خطا در درخواست ${method} ${endpoint}:`, error);
        throw error;
    }
}

// ==================== استان‌ها ====================

// بارگذاری آمار استان‌ها
async function loadProvincesStats() {
    try {
        const data = await apiRequest('/province/', 'GET', { size: 1 });
        const provinceCount = document.getElementById('provinceCount');
        if (provinceCount && data && data.total) {
            provinceCount.textContent = data.total;
        }
    } catch (error) {
        console.error('خطا در بارگذاری آمار استان‌ها:', error);
    }
}

// بارگذاری استان‌ها
async function loadProvinces(page = 1, search = '') {
    try {
        const params = {
            page,
            size: currentState.provinces.size,
            sort_by: 'created_at',
            sort_order: 'desc'
        };
        
        if (search) {
            params.search = search;
        }
        
        const data = await apiRequest('/province/', 'GET', params);
        
        if (data && data.items) {
            currentState.provinces.data = data.items;
            currentState.provinces.total = data.total || 0;
            currentState.provinces.page = page;
            
            renderProvincesTable();
            renderProvincePagination();
        } else {
            showEmptyState('provincesList', 'استانی');
        }
    } catch (error) {
        console.error('خطا در بارگذاری استان‌ها:', error);
        showMessage('خطا در بارگذاری استان‌ها', 'error');
    }
}

// رندر جدول استان‌ها
function renderProvincesTable() {
    const container = document.getElementById('provincesList');
    if (!container) return;
    
    if (!currentState.provinces.data.length) {
        showEmptyState('provincesList', 'استانی');
        return;
    }
    
    let html = '';
    currentState.provinces.data.forEach((item, index) => {
        const rowNumber = (currentState.provinces.page - 1) * currentState.provinces.size + index + 1;
        
        html += `
            <tr>
                <td>${rowNumber}</td>
                <td>${item.province || item.name}</td>
                <td>${formatDate(item.created_at)}</td>
                <td class="actions">
                    <button class="btn btn-danger btn-sm" onclick="confirmDelete('province', '${item.province || item.name}')">
                        <i class="fas fa-trash"></i>
                        <span>حذف</span>
                    </button>
                </td>
            </tr>
        `;
    });
    
    container.innerHTML = html;
}

// جستجوی استان‌ها
async function searchProvinces(e) {
    const searchTerm = e.target.value.trim();
    await loadProvinces(1, searchTerm);
}

// مرتب‌سازی استان‌ها
async function sortProvinces(e) {
    // Implementation here
    console.log('Sort by:', e.target.value);
}

// افزودن استان
async function handleProvinceSubmit(e) {
    e.preventDefault();
    
    const nameInput = document.getElementById('provinceName');
    const name = nameInput.value.trim();
    
    if (!name) {
        showMessage('لطفاً نام استان را وارد کنید', 'error');
        return;
    }
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> در حال افزودن...';
    }
    
    try {
        await apiRequest('/province/', 'POST', {}, { province: name });
        
        showMessage('استان با موفقیت اضافه شد', 'success');
        closeModal('addProvinceModal');
        nameInput.value = '';
        
        // بارگذاری مجدد استان‌ها
        await loadProvinces();
        await loadProvincesStats();
        
    } catch (error) {
        let errorMsg = error.message;
        if (error.message.includes('422')) {
            errorMsg = 'نام استان تکراری است یا فرمت آن صحیح نیست';
        }
        showMessage(`خطا در افزودن استان: ${errorMsg}`, 'error');
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-plus"></i> افزودن استان';
        }
    }
}

// ==================== شهرستان‌ها ====================

// بارگذاری آمار شهرستان‌ها
async function loadCitiesStats() {
    try {
        const data = await apiRequest('/city/', 'GET', { size: 1 });
        const cityCount = document.getElementById('cityCount');
        if (cityCount && data && data.total) {
            cityCount.textContent = data.total;
        }
    } catch (error) {
        console.error('خطا در بارگذاری آمار شهرستان‌ها:', error);
    }
}

// بارگذاری استان‌ها برای فیلتر
async function loadProvincesForFilter() {
    try {
        const data = await apiRequest('/province/', 'GET', { size: 100 });
        const select = document.getElementById('provinceFilter');
        const cityProvinceSelect = document.getElementById('cityProvinceSelect');
        
        if (data && data.items) {
            let options = '<option value="">همه استان‌ها</option>';
            let cityOptions = '<option value="">انتخاب استان</option>';
            
            data.items.forEach(item => {
                const provinceName = item.province || item.name;
                const provinceId = item.id || provinceName;
                
                options += `<option value="${provinceId}">${provinceName}</option>`;
                cityOptions += `<option value="${provinceId}">${provinceName}</option>`;
            });
            
            if (select) select.innerHTML = options;
            if (cityProvinceSelect) cityProvinceSelect.innerHTML = cityOptions;
        }
    } catch (error) {
        console.error('خطا در بارگذاری استان‌ها برای فیلتر:', error);
    }
}

// بارگذاری شهرستان‌ها
async function loadCities(page = 1, search = '', provinceId = '') {
    try {
        const params = {
            page,
            size: currentState.cities.size,
            sort_by: 'created_at',
            sort_order: 'desc'
        };
        
        if (search) {
            params.search = search;
        }
        
        if (provinceId) {
            params.province_id = provinceId;
        }
        
        const data = await apiRequest('/city/', 'GET', params);
        
        if (data && data.items) {
            currentState.cities.data = data.items;
            currentState.cities.total = data.total || 0;
            currentState.cities.page = page;
            currentState.cities.provinceFilter = provinceId;
            
            renderCitiesTable();
            renderCityPagination();
        } else {
            showEmptyState('citiesList', 'شهرستانی');
        }
    } catch (error) {
        console.error('خطا در بارگذاری شهرستان‌ها:', error);
        showMessage('خطا در بارگذاری شهرستان‌ها', 'error');
    }
}

// رندر جدول شهرستان‌ها
function renderCitiesTable() {
    const container = document.getElementById('citiesList');
    if (!container) return;
    
    if (!currentState.cities.data.length) {
        showEmptyState('citiesList', 'شهرستانی');
        return;
    }
    
    let html = '';
    currentState.cities.data.forEach((item, index) => {
        const rowNumber = (currentState.cities.page - 1) * currentState.cities.size + index + 1;
        
        html += `
            <tr>
                <td>${rowNumber}</td>
                <td>${item.city || item.name}</td>
                <td>${item.province_name || item.province || '-'}</td>
                <td>${formatDate(item.created_at)}</td>
                <td class="actions">
                    <button class="btn btn-danger btn-sm" onclick="confirmDelete('city', '${item.city || item.name}')">
                        <i class="fas fa-trash"></i>
                        <span>حذف</span>
                    </button>
                </td>
            </tr>
        `;
    });
    
    container.innerHTML = html;
}

// جستجوی شهرستان‌ها
async function searchCities(e) {
    const searchTerm = e.target.value.trim();
    await loadCities(1, searchTerm, currentState.cities.provinceFilter);
}

// فیلتر شهرستان‌ها بر اساس استان
async function filterCitiesByProvince(e) {
    const provinceId = e.target.value;
    await loadCities(1, '', provinceId);
}

// افزودن شهرستان
async function handleCitySubmit(e) {
    e.preventDefault();
    
    const provinceSelect = document.getElementById('cityProvinceSelect');
    const nameInput = document.getElementById('cityName');
    
    if (!provinceSelect || !nameInput) return;
    
    const provinceId = provinceSelect.value;
    const provinceName = provinceSelect.options[provinceSelect.selectedIndex].text;
    const name = nameInput.value.trim();
    
    if (!provinceId) {
        showMessage('لطفاً استان را انتخاب کنید', 'error');
        return;
    }
    
    if (!name) {
        showMessage('لطفاً نام شهرستان را وارد کنید', 'error');
        return;
    }
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> در حال افزودن...';
    }
    
    try {
        const body = { city: name };
        
        if (!isNaN(provinceId)) {
            body.province_id = parseInt(provinceId);
        } else {
            body.province = provinceName;
        }
        
        await apiRequest('/city/', 'POST', {}, body);
        
        showMessage('شهرستان با موفقیت اضافه شد', 'success');
        closeModal('addCityModal');
        nameInput.value = '';
        
        // بارگذاری مجدد شهرستان‌ها
        await loadCities();
        await loadCitiesStats();
        
    } catch (error) {
        let errorMsg = error.message;
        if (error.message.includes('422')) {
            errorMsg = 'نام شهرستان تکراری است یا فرمت آن صحیح نیست';
        }
        showMessage(`خطا در افزودن شهرستان: ${errorMsg}`, 'error');
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-plus"></i> افزودن شهرستان';
        }
    }
}

// ==================== روستاها ====================

// بارگذاری آمار روستاها
async function loadVillagesStats() {
    try {
        const data = await apiRequest('/village/', 'GET', { size: 1 });
        const villageCount = document.getElementById('villageCount');
        if (villageCount && data && data.total) {
            villageCount.textContent = data.total;
        }
    } catch (error) {
        console.error('خطا در بارگذاری آمار روستاها:', error);
    }
}

// بارگذاری شهرستان‌ها برای فیلتر روستا
async function loadCitiesForFilter() {
    try {
        const data = await apiRequest('/city/', 'GET', { size: 100 });
        const select = document.getElementById('cityFilter');
        const villageCitySelect = document.getElementById('villageCitySelect');
        
        if (data && data.items) {
            let options = '<option value="">همه شهرستان‌ها</option>';
            let villageOptions = '<option value="">انتخاب شهرستان</option>';
            
            data.items.forEach(item => {
                const cityName = item.city || item.name;
                const cityId = item.id || cityName;
                
                options += `<option value="${cityId}">${cityName}</option>`;
                villageOptions += `<option value="${cityId}">${cityName}</option>`;
            });
            
            if (select) select.innerHTML = options;
            if (villageCitySelect) villageCitySelect.innerHTML = villageOptions;
        }
    } catch (error) {
        console.error('خطا در بارگذاری شهرستان‌ها برای فیلتر:', error);
    }
}

// بارگذاری روستاها
async function loadVillages(page = 1, search = '', cityId = '') {
    try {
        const params = {
            page,
            size: currentState.villages.size,
            sort_by: 'created_at',
            sort_order: 'desc'
        };
        
        if (search) {
            params.search = search;
        }
        
        if (cityId) {
            params.city_id = cityId;
        }
        
        const data = await apiRequest('/village/', 'GET', params);
        
        if (data && data.items) {
            currentState.villages.data = data.items;
            currentState.villages.total = data.total || 0;
            currentState.villages.page = page;
            currentState.villages.cityFilter = cityId;
            
            renderVillagesTable();
            renderVillagePagination();
        } else {
            showEmptyState('villagesList', 'روستایی');
        }
    } catch (error) {
        console.error('خطا در بارگذاری روستاها:', error);
        showMessage('خطا در بارگذاری روستاها', 'error');
    }
}

// رندر جدول روستاها
function renderVillagesTable() {
    const container = document.getElementById('villagesList');
    if (!container) return;
    
    if (!currentState.villages.data.length) {
        showEmptyState('villagesList', 'روستایی');
        return;
    }
    
    let html = '';
    currentState.villages.data.forEach((item, index) => {
        const rowNumber = (currentState.villages.page - 1) * currentState.villages.size + index + 1;
        
        html += `
            <tr>
                <td>${rowNumber}</td>
                <td>${item.village || item.name}</td>
                <td>${item.city_name || item.city || '-'}</td>
                <td>${item.province_name || item.province || '-'}</td>
                <td>${formatDate(item.created_at)}</td>
                <td class="actions">
                    <button class="btn btn-danger btn-sm" onclick="confirmDelete('village', '${item.village || item.name}')">
                        <i class="fas fa-trash"></i>
                        <span>حذف</span>
                    </button>
                </td>
            </tr>
        `;
    });
    
    container.innerHTML = html;
}

// جستجوی روستاها
async function searchVillages(e) {
    const searchTerm = e.target.value.trim();
    await loadVillages(1, searchTerm, currentState.villages.cityFilter);
}

// فیلتر روستاها بر اساس شهرستان
async function filterVillagesByCity(e) {
    const cityId = e.target.value;
    await loadVillages(1, '', cityId);
}

// افزودن روستا
async function handleVillageSubmit(e) {
    e.preventDefault();
    
    const citySelect = document.getElementById('villageCitySelect');
    const nameInput = document.getElementById('villageName');
    
    if (!citySelect || !nameInput) return;
    
    const cityId = citySelect.value;
    const cityName = citySelect.options[citySelect.selectedIndex].text;
    const name = nameInput.value.trim();
    
    if (!cityId) {
        showMessage('لطفاً شهرستان را انتخاب کنید', 'error');
        return;
    }
    
    if (!name) {
        showMessage('لطفاً نام روستا را وارد کنید', 'error');
        return;
    }
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> در حال افزودن...';
    }
    
    try {
        const body = { village: name };
        
        if (!isNaN(cityId)) {
            body.city_id = parseInt(cityId);
        } else {
            body.city = cityName;
        }
        
        await apiRequest('/village/', 'POST', {}, body);
        
        showMessage('روستا با موفقیت اضافه شد', 'success');
        closeModal('addVillageModal');
        nameInput.value = '';
        
        // بارگذاری مجدد روستاها
        await loadVillages();
        await loadVillagesStats();
        
    } catch (error) {
        let errorMsg = error.message;
        if (error.message.includes('422')) {
            errorMsg = 'نام روستا تکراری است یا فرمت آن صحیح نیست';
        }
        showMessage(`خطا در افزودن روستا: ${errorMsg}`, 'error');
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-plus"></i> افزودن روستا';
        }
    }
}

// ==================== کاربران ====================

// بارگذاری آمار کاربران
async function loadUsersStats() {
    try {
        const data = await apiRequest('/users/', 'GET', { size: 1 });
        const userCount = document.getElementById('userCount');
        if (userCount && data && data.total) {
            userCount.textContent = data.total;
        }
    } catch (error) {
        console.error('خطا در بارگذاری آمار کاربران:', error);
    }
}

// بارگذاری کاربران
async function loadUsers(page = 1, search = '') {
    try {
        const params = {
            page,
            size: currentState.users.size,
            sort_by: 'created_at',
            sort_order: 'desc'
        };
        
        if (search) {
            params.search = search;
        }
        
        const data = await apiRequest('/users/', 'GET', params);
        
        if (data && data.items) {
            currentState.users.data = data.items;
            currentState.users.total = data.total || 0;
            currentState.users.page = page;
            
            renderUsersTable();
            renderUserPagination();
        } else {
            showEmptyState('usersList', 'کاربر');
        }
    } catch (error) {
        console.error('خطا در بارگذاری کاربران:', error);
        showMessage('خطا در بارگذاری کاربران', 'error');
    }
}

// رندر جدول کاربران
function renderUsersTable() {
    const container = document.getElementById('usersList');
    if (!container) return;
    
    if (!currentState.users.data.length) {
        showEmptyState('usersList', 'کاربر');
        return;
    }
    
    let html = '';
    currentState.users.data.forEach((item, index) => {
        const rowNumber = (currentState.users.page - 1) * currentState.users.size + index + 1;
        
        html += `
            <tr>
                <td>${rowNumber}</td>
                <td>${item.username || '-'}</td>
                <td>${item.fullname || '-'}</td>
                <td>${item.email || '-'}</td>
                <td>${item.phone_number || '-'}</td>
                <td>
                    <span class="badge ${item.role_id === 1 ? 'badge-primary' : item.role_id === 2 ? 'badge-secondary' : 'badge-success'}">
                        ${item.role_id === 1 ? 'مدیر' : item.role_id === 2 ? 'کاربر' : 'کارشناس'}
                    </span>
                </td>
                <td>
                    <span class="status ${!item.disabled ? 'active' : 'inactive'}">
                        <i class="fas fa-circle"></i>
                        ${!item.disabled ? 'فعال' : 'غیرفعال'}
                    </span>
                </td>
                <td class="actions">
                    <button class="btn btn-secondary btn-sm" onclick="editUser(${item.id})">
                        <i class="fas fa-edit"></i>
                        <span>ویرایش</span>
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="confirmDelete('user', ${item.id})">
                        <i class="fas fa-trash"></i>
                        <span>حذف</span>
                    </button>
                </td>
            </tr>
        `;
    });
    
    container.innerHTML = html;
}

// جستجوی کاربران
async function searchUsers(e) {
    const searchTerm = e.target.value.trim();
    await loadUsers(1, searchTerm);
}

// ایجاد کاربر جدید توسط ادمین - کاملاً اصلاح شده مطابق API
async function handleUserSubmit(e) {
    e.preventDefault();
    
    const username = document.getElementById('userUsername').value.trim();
    const password = document.getElementById('userPassword').value;
    const fullname = document.getElementById('userFullName').value.trim();
    const email = document.getElementById('userEmail').value.trim();
    const phoneNumber = document.getElementById('userPhoneNumber').value.trim();
    const roleId = document.getElementById('userRoleId').value;
    const disabled = document.getElementById('userDisabled').checked;
    
    // اعتبارسنجی
    if (!username || !password || !fullname || !email) {
        showMessage('لطفاً فیلدهای الزامی را پر کنید', 'error');
        return;
    }
    
    if (!roleId) {
        showMessage('لطفاً نقش کاربر را انتخاب کنید', 'error');
        return;
    }
    
    if (password.length < 6) {
        showMessage('رمز عبور باید حداقل ۶ کاراکتر باشد', 'error');
        return;
    }
    
    // اعتبارسنجی ایمیل
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showMessage('فرمت ایمیل صحیح نیست', 'error');
        return;
    }
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> در حال ایجاد...';
    }
    
    try {
        // ساخت داده‌های کاربر مطابق API
        const userData = {
            username: username,
            password: password,
            fullname: fullname,
            email: email,
            disabled: disabled,
            role_id: parseInt(roleId)
        };
        
        // اضافه کردن شماره تلفن اگر وارد شده باشد
        if (phoneNumber) {
            userData.phone_number = phoneNumber;
        }
        
        await apiRequest('/users/admin/', 'POST', {}, userData);
        
        showMessage('کاربر با موفقیت ایجاد شد', 'success');
        closeModal('addUserModal');
        
        // پاک کردن فرم
        document.getElementById('userForm').reset();
        
        // بارگذاری مجدد لیست کاربران
        await loadUsers();
        await loadUsersStats();
        
    } catch (error) {
        let errorMsg = 'خطا در ایجاد کاربر';
        
        // نمایش پیام خطای مناسب
        if (error.message.includes('400')) {
            errorMsg = 'نام کاربری یا ایمیل تکراری است';
        } else if (error.message.includes('422')) {
            try {
                const errorData = JSON.parse(error.message.split(' - ')[1] || '{}');
                if (errorData.detail) {
                    if (Array.isArray(errorData.detail)) {
                        errorMsg = errorData.detail.map(err => err.msg).join(', ');
                    } else {
                        errorMsg = errorData.detail;
                    }
                }
            } catch {
                errorMsg = 'اطلاعات وارد شده معتبر نیست';
            }
        } else if (error.message.includes('403')) {
            errorMsg = 'شما دسترسی ایجاد کاربر جدید را ندارید';
        }
        
        showMessage(`${errorMsg}`, 'error');
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-plus"></i> ایجاد کاربر';
        }
    }
}

// ==================== تغییر رمز عبور ====================

// تغییر رمز عبور - کاملاً اصلاح شده مطابق API
async function handlePasswordChange(e) {
    e.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // اعتبارسنجی
    if (!currentPassword || !newPassword || !confirmPassword) {
        showMessage('لطفاً تمام فیلدها را پر کنید', 'error');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showMessage('رمز عبور جدید با تأیید آن مطابقت ندارد', 'error');
        return;
    }
    
    if (newPassword.length < 6) {
        showMessage('رمز عبور باید حداقل ۶ کاراکتر باشد', 'error');
        return;
    }
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> در حال تغییر...';
    }
    
    try {
        // ارسال درخواست تغییر رمز عبور مطابق API
        await apiRequest('/changepassword/', 'POST', {}, {
            current_password: currentPassword,
            new_password: newPassword
        });
        
        showMessage('رمز عبور با موفقیت تغییر کرد', 'success');
        
        // پاک کردن فرم
        document.getElementById('changePasswordForm').reset();
        
        // لاگ‌اوت کاربر برای ورود مجدد با رمز جدید
        setTimeout(() => {
            showMessage('لطفاً با رمز عبور جدید وارد شوید', 'info');
            setTimeout(() => {
                logout();
            }, 1000);
        }, 1500);
        
    } catch (error) {
        let errorMsg = 'خطا در تغییر رمز عبور';
        
        // نمایش پیام خطای مناسب
        if (error.message.includes('400')) {
            errorMsg = 'رمز عبور فعلی اشتباه است';
        } else if (error.message.includes('422')) {
            try {
                const errorData = JSON.parse(error.message.split(' - ')[1] || '{}');
                if (errorData.detail) {
                    if (Array.isArray(errorData.detail)) {
                        errorMsg = errorData.detail.map(err => err.msg).join(', ');
                    } else {
                        errorMsg = errorData.detail;
                    }
                }
            } catch {
                errorMsg = 'رمز عبور باید حداقل ۶ کاراکتر باشد';
            }
        }
        showMessage(`${errorMsg}`, 'error');
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-save"></i> ذخیره تغییرات';
        }
    }
}

// ==================== مودال‌ها ====================

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// تایید حذف
function confirmDelete(type, id) {
    const messages = {
        'province': `آیا از حذف استان "${id}" اطمینان دارید؟`,
        'city': `آیا از حذف شهرستان "${id}" اطمینان دارید؟`,
        'village': `آیا از حذف روستای "${id}" اطمینان دارید؟`,
        'user': `آیا از حذف کاربر با شناسه ${id} اطمینان دارید؟`
    };
    
    const deleteMessage = document.getElementById('deleteMessage');
    if (deleteMessage) {
        deleteMessage.textContent = messages[type] || 'آیا از حذف این آیتم اطمینان دارید؟';
    }
    
    // ذخیره اطلاعات برای حذف
    window.deleteInfo = { type, id };
    
    openModal('deleteModal');
}

// هندل کردن حذف
async function handleDelete() {
    const { type, id } = window.deleteInfo;
    
    if (!type || !id) return;
    
    const confirmBtn = document.getElementById('confirmDeleteBtn');
    if (confirmBtn) {
        confirmBtn.disabled = true;
        confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> در حال حذف...';
    }
    
    try {
        let endpoint;
        switch(type) {
            case 'province':
                endpoint = `/province/${encodeURIComponent(id)}`;
                break;
            case 'city':
                endpoint = `/city/${encodeURIComponent(id)}`;
                break;
            case 'village':
                endpoint = `/village/${encodeURIComponent(id)}`;
                break;
            case 'user':
                endpoint = `/users/${id}`;
                break;
            default:
                throw new Error('نوع نامعتبر');
        }
        
        await apiRequest(endpoint, 'DELETE');
        
        showMessage('آیتم با موفقیت حذف شد', 'success');
        closeModal('deleteModal');
        
        // بارگذاری مجدد داده‌ها
        switch(type) {
            case 'province':
                await loadProvinces();
                await loadProvincesStats();
                break;
            case 'city':
                await loadCities();
                await loadCitiesStats();
                break;
            case 'village':
                await loadVillages();
                await loadVillagesStats();
                break;
            case 'user':
                await loadUsers();
                await loadUsersStats();
                break;
        }
        
    } catch (error) {
        let errorMsg = `خطا در حذف: ${error.message}`;
        
        // نمایش پیام خطای مناسب
        if (type === 'village' && error.message.includes('400')) {
            errorMsg = 'امکان حذف روستای در حال استفاده وجود ندارد';
        }
        
        showMessage(errorMsg, 'error');
    } finally {
        if (confirmBtn) {
            confirmBtn.disabled = false;
            confirmBtn.innerHTML = '<i class="fas fa-trash"></i> حذف';
        }
    }
}

// ==================== پاکت‌بندی ====================

function renderProvincePagination() {
    const container = document.getElementById('provincePagination');
    if (container) {
        renderPagination(container, currentState.provinces, loadProvinces);
    }
}

function renderCityPagination() {
    const container = document.getElementById('cityPagination');
    if (container) {
        renderPagination(container, currentState.cities, loadCities);
    }
}

function renderVillagePagination() {
    const container = document.getElementById('villagePagination');
    if (container) {
        renderPagination(container, currentState.villages, loadVillages);
    }
}

function renderUserPagination() {
    const container = document.getElementById('userPagination');
    if (container) {
        renderPagination(container, currentState.users, loadUsers);
    }
}

function renderPagination(container, state, loadFunction) {
    const totalPages = Math.ceil(state.total / state.size);
    
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }
    
    let html = '';
    
    // دکمه قبلی
    if (state.page > 1) {
        html += `<button class="pagination-btn" onclick="${loadFunction.name}(${state.page - 1})">
                    <i class="fas fa-chevron-right"></i>
                 </button>`;
    }
    
    // صفحات
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= state.page - 2 && i <= state.page + 2)) {
            html += `<button class="pagination-btn ${i === state.page ? 'active' : ''}" 
                            onclick="${loadFunction.name}(${i})">${i}</button>`;
        } else if (i === state.page - 3 || i === state.page + 3) {
            html += '<span class="pagination-dots">...</span>';
        }
    }
    
    // دکمه بعدی
    if (state.page < totalPages) {
        html += `<button class="pagination-btn" onclick="${loadFunction.name}(${state.page + 1})">
                    <i class="fas fa-chevron-left"></i>
                 </button>`;
    }
    
    container.innerHTML = html;
}

// ==================== توابع کمکی ====================

// نمایش وضعیت خالی
function showEmptyState(containerId, itemName) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `
            <tr>
                <td colspan="100%" class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <p>هیچ ${itemName} یافت نشد</p>
                </td>
            </tr>
        `;
    }
}

// نمایش پیام
function showMessage(message, type = 'info') {
    const container = document.getElementById('messageContainer');
    if (!container) return;
    
    const messageElement = document.createElement('div');
    messageElement.className = `message ${type}`;
    messageElement.innerHTML = `
        <i class="fas fa-${getMessageIcon(type)}"></i>
        <span>${message}</span>
    `;
    
    container.appendChild(messageElement);
    
    // حذف خودکار پیام بعد از 5 ثانیه
    setTimeout(() => {
        messageElement.style.opacity = '0';
        setTimeout(() => {
            if (messageElement.parentNode) {
                messageElement.parentNode.removeChild(messageElement);
            }
        }, 300);
    }, 5000);
}

function getMessageIcon(type) {
    switch(type) {
        case 'success': return 'check-circle';
        case 'error': return 'exclamation-circle';
        case 'warning': return 'exclamation-triangle';
        default: return 'info-circle';
    }
}

// قالب‌بندی تاریخ
function formatDate(dateString) {
    if (!dateString) return '-';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('fa-IR');
    } catch {
        return '-';
    }
}

// Debounce برای جستجو
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// بررسی وضعیت API
async function checkApiStatus() {
    const statusElement = document.getElementById('apiStatus');
    if (!statusElement) return;
    
    const statusIcon = statusElement.querySelector('i');
    const statusText = statusElement.querySelector('span');
    
    if (!statusIcon || !statusText) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/`, {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
        });
        
        if (response.ok) {
            statusIcon.style.color = '#27ae60';
            statusText.textContent = 'متصل';
        } else {
            statusIcon.style.color = '#e74c3c';
            statusText.textContent = 'خطا';
        }
    } catch (error) {
        statusIcon.style.color = '#e74c3c';
        statusText.textContent = 'قطع';
        console.warn('خطا در بررسی وضعیت API:', error);
    }
}

// نمایش اعلان‌ها
function showNotifications() {
    showMessage('این قابلیت به زودی اضافه خواهد شد', 'info');
}

// منوی کاربر
function toggleUserMenu() {
    showMessage('منوی کاربر به زودی اضافه خواهد شد', 'info');
}

// رفرش بخش جاری
function refreshCurrentSection() {
    const section = currentState.currentSection;
    loadSectionData(section);
    showMessage('داده‌ها با موفقیت به‌روزرسانی شدند', 'success');
}

// ویرایش کاربر
function editUser(userId) {
    showMessage('ویرایش کاربر به زودی اضافه خواهد شد', 'info');
}

// خروج از سیستم
function logout() {
    // فراخوانی API لاگ‌اوت
    const token = localStorage.getItem('havirkesht_token') || 
                  sessionStorage.getItem('havirkesht_token');
    
    if (token) {
        fetch(`${API_BASE_URL}/logout?access_token=${token}`, {
            method: 'POST'
        }).catch(console.error);
    }
    
    // پاک کردن اطلاعات ذخیره شده
    localStorage.removeItem('havirkesht_token');
    localStorage.removeItem('havirkesht_refresh_token');
    localStorage.removeItem('havirkesht_username');
    localStorage.removeItem('havirkesht_token_expiry');
    
    sessionStorage.removeItem('havirkesht_token');
    
    // هدایت به صفحه لاگین
    window.location.href = 'login.html';
}

// توابع عمومی برای استفاده در HTML
window.confirmDelete = confirmDelete;
window.editUser = editUser;
window.openModal = openModal;
window.closeModal = closeModal;
window.togglePassword = togglePassword;

// بهبود UX موبایل
function setupMobileUX() {
    // جلوگیری از زوم در فیلدهای ورودی در iOS
    document.addEventListener('touchstart', function(e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
            document.body.style.zoom = "100%";
        }
    }, { passive: true });
    
    // بهبود اسکرول در iOS
    document.addEventListener('touchmove', function(e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            e.stopPropagation();
        }
    }, { passive: false });
    
    // بهبود کلیک روی دکمه‌ها در موبایل
    document.addEventListener('touchstart', function(e) {
        if (e.target.tagName === 'BUTTON' || e.target.tagName === 'A') {
            e.target.style.transform = 'scale(0.95)';
        }
    }, { passive: true });
    
    document.addEventListener('touchend', function(e) {
        if (e.target.tagName === 'BUTTON' || e.target.tagName === 'A') {
            e.target.style.transform = '';
        }
    }, { passive: true });
}

// اجرای تنظیمات UX موبایل
if ('ontouchstart' in window || navigator.maxTouchPoints) {
    setupMobileUX();
}