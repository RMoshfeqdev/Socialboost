/* =========================================================
   SocialBoost — FINAL FRONTEND CONTROLLER
========================================================= */

const prices = {
    followers: 50000,
    likes: 30000,
    views: 10000,
    engagement: 70000
};

const serviceNames = {
    followers: "فالوور",
    likes: "لایک",
    views: "بازدید",
    engagement: "تعامل",
    comments: "کامنت",
    saves: "سیو",
    shares: "اشتراک‌گذاری"
};

const serviceMap = {
    "فالوور": "followers",
    "لایک": "likes",
    "بازدید": "views",
    "تعامل": "engagement",
    "کامنت": "comments",
    "سیو": "saves",
    "اشتراک": "shares"
};

let providerServices = [];

let currentPlatformFilter = "all";

let currentTypeFilter = "all";


/* =========================================================
   HELPERS
========================================================= */

const $ = id =>
    document.getElementById(id);


function normalizeText(value) {

    return String(value || "")
        .toLowerCase()
        .replace(
            /[_\-\[\]\(\)\/:|,.]+/g,
            " "
        )
        .replace(/\s+/g, " ")
        .trim();

}


function formatToman(value) {

    return Number(value || 0)
        .toLocaleString("fa-IR") +
        " تومان";

}


function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* =========================================================
   SERVICE IDENTIFIER
========================================================= */

function getServiceId(service) {

    return String(
        service?.service ??
        service?.id ??
        ""
    );

}


function getSelectedProviderService() {

    const select =
        $("service");

    if (!select) {
        return null;
    }

    const id =
        String(select.value || "");

    if (!id) {
        return null;
    }

    return providerServices.find(
        service =>
            getServiceId(service) === id
    ) || null;

}


/* =========================================================
   SERVICE TYPE DETECTION
========================================================= */

function detectServiceType(service) {

    const text =
        normalizeText(
            [
                service?.name,
                service?.category,
                service?.type,
                service?.description
            ]
                .filter(Boolean)
                .join(" ")
        );

    const rules = {

        followers: [
            "follower",
            "followers",
            "follow",
            "فالوور",
            "فالوئر",
            "دنبال کننده",
            "دنبال‌کننده"
        ],

        likes: [
            "like",
            "likes",
            "لایک"
        ],

        views: [
            "view",
            "views",
            "بازدید",
            "ویو"
        ],

        comments: [
            "comment",
            "comments",
            "کامنت",
            "نظر"
        ],

        engagement: [
            "engagement",
            "تعامل",
            "interaction"
        ],

        saves: [
            "save",
            "saves",
            "saved",
            "سیو",
            "ذخیره"
        ],

        shares: [
            "share",
            "shares",
            "اشتراک",
            "share"
        ]

    };


    for (
        const [type, keywords]
        of Object.entries(rules)
    ) {

        if (
            keywords.some(
                keyword =>
                    text.includes(
                        normalizeText(keyword)
                    )
            )
        ) {

            return type;

        }

    }


    return "other";

}


/* =========================================================
   PLATFORM DETECTION
========================================================= */

function detectPlatform(service) {

    const text =
        normalizeText(
            [
                service?.name,
                service?.category,
                service?.type,
                service?.description
            ]
                .filter(Boolean)
                .join(" ")
        );


    const platforms = {

        instagram: [
            "instagram",
            "insta",
            "ig",
            "اینستاگرام"
        ],

        telegram: [
            "telegram",
            "tg",
            "تلگرام"
        ],

        facebook: [
            "facebook",
            "fb",
            "فیسبوک"
        ],

        twitter: [
            "twitter",
            "x twitter",
            "توییتر"
        ],

        youtube: [
            "youtube",
            "yt",
            "یوتیوب"
        ],

        spotify: [
            "spotify",
            "اسپاتیفای"
        ]

    };


    for (
        const [platform, keywords]
        of Object.entries(platforms)
    ) {

        if (
            keywords.some(
                keyword =>
                    text.includes(
                        normalizeText(keyword)
                    )
            )
        ) {

            return platform;

        }

    }


    return "other";

}


/* =========================================================
   SERVICE FILTER
========================================================= */

function serviceMatchesPlatform(
    service,
    platform
) {

    if (
        platform === "all"
    ) {

        return true;

    }


    const detected =
        detectPlatform(service);


    if (
        detected === platform
    ) {

        return true;

    }


    const raw =
        normalizeText(
            [
                service?.category,
                service?.name
            ].join(" ")
        );


    const aliases = {

        instagram: [
            "instagram",
            "insta",
            "اینستاگرام"
        ],

        telegram: [
            "telegram",
            "تلگرام"
        ],

        facebook: [
            "facebook",
            "فیسبوک"
        ],

        twitter: [
            "twitter",
            "توییتر"
        ],

        youtube: [
            "youtube",
            "یوتیوب"
        ],

        spotify: [
            "spotify",
            "اسپاتیفای"
        ]

    };


    return (
        aliases[platform] || []
    )
        .some(
            keyword =>
                raw.includes(
                    normalizeText(keyword)
                )
        );

}


function serviceMatchesType(
    service,
    type
) {

    if (
        type === "all"
    ) {

        return true;

    }


    return detectServiceType(
        service
    ) === type;

}


function serviceMatchesSearch(
    service,
    query
) {

    if (!query) {
        return true;
    }


    const text =
        normalizeText(
            [
                service?.name,
                service?.category,
                service?.type,
                service?.description,
                service?.service
            ]
                .filter(Boolean)
                .join(" ")
        );


    return text.includes(
        normalizeText(query)
    );

}


/* =========================================================
   FILTER + RENDER SERVICES
========================================================= */

function getFilteredServices() {

    const search =
        $("serviceSearch")
            ?.value || "";


    return providerServices.filter(
        service =>

            serviceMatchesPlatform(
                service,
                currentPlatformFilter
            )

            &&

            serviceMatchesType(
                service,
                currentTypeFilter
            )

            &&

            serviceMatchesSearch(
                service,
                search
            )
    );

}


function renderProviderServices() {

    const select =
        $("service");

    if (!select) {
        return;
    }


    const previousValue =
        String(
            select.value || ""
        );


    const list =
        getFilteredServices();


    select.innerHTML = "";


    if (
        list.length === 0
    ) {

        const option =
            document.createElement(
                "option"
            );

        option.value = "";

        option.textContent =
            "سرویسی با این فیلتر پیدا نشد";

        select.appendChild(
            option
        );


        updateServiceCount(0);

        updateServiceInfo();

        return;

    }


    list.forEach(
        service => {

            const option =
                document.createElement(
                    "option"
                );

            const id =
                getServiceId(service);

            option.value =
                id;

            option.textContent =
                service.name ||
                `Service ${id}`;

            option.dataset.type =
                detectServiceType(
                    service
                );

            option.dataset.platform =
                detectPlatform(
                    service
                );

            select.appendChild(
                option
            );

        }
    );


    if (
        list.some(
            service =>
                getServiceId(service) ===
                previousValue
        )
    ) {

        select.value =
            previousValue;

    } else {

        select.selectedIndex = 0;

    }


    updateServiceCount(
        list.length
    );

    updateServiceInfo();

}


function updateServiceCount(
    count
) {

    const element =
        $("serviceCount");

    if (!element) {
        return;
    }

    element.textContent =
        Number(count || 0)
            .toLocaleString("fa-IR");

}


/* =========================================================
   SERVICE INFO
========================================================= */

function updateServiceInfo() {

    const service =
        getSelectedProviderService();

    const info =
        $("serviceInfo");


    if (!info) {
        return;
    }


    if (!service) {

        info.innerHTML = `

            <div class="service-info-head">

                <span class="selected-service-name">
                    سرویس را انتخاب کنید
                </span>

                <span class="selected-service-id">
                    —
                </span>

            </div>

            <div class="service-stats">

                <div class="service-stat">
                    <span>حداقل</span>
                    <strong>—</strong>
                </div>

                <div class="service-stat">
                    <span>حداکثر</span>
                    <strong>—</strong>
                </div>

                <div class="service-stat">
                    <span>قیمت / 1000</span>
                    <strong>—</strong>
                </div>

                <div class="service-stat success">
                    <span>Refill</span>
                    <strong>—</strong>
                </div>

            </div>
        `;


        updateSummary();

        calculateProviderPrice();

        return;

    }


    const min =
        Number(
            service.min || 0
        );

    const max =
        Number(
            service.max || 0
        );


    const quantity =
        $("quantity");


    if (quantity) {

        if (
            Number.isFinite(min) &&
            min > 0
        ) {

            quantity.min =
                min;

        }


        if (
            Number.isFinite(max) &&
            max > 0
        ) {

            quantity.max =
                max;

        }


        const current =
            Number(
                quantity.value
            );


        if (
            min > 0 &&
            (
                !Number.isFinite(current) ||
                current < min
            )
        ) {

            quantity.value =
                min;

        }


        if (
            max > 0 &&
            Number(quantity.value) > max
        ) {

            quantity.value =
                max;

        }

    }


    info.innerHTML = `

        <div class="service-info-head">

            <span class="selected-service-name">
                ${escapeHTML(
                    service.name ||
                    "سرویس"
                )}
            </span>

            <span class="selected-service-id">
                ID:
                ${escapeHTML(
                    getServiceId(service)
                )}
            </span>

        </div>

        <div class="service-stats">

            <div class="service-stat">

                <span>
                    حداقل
                </span>

                <strong>
                    ${Number(min || 0)
                        .toLocaleString("fa-IR")}
                </strong>

            </div>

            <div class="service-stat">

                <span>
                    حداکثر
                </span>

                <strong>
                    ${Number(max || 0)
                        .toLocaleString("fa-IR")}
                </strong>

            </div>

            <div class="service-stat">

                <span>
                    قیمت / 1000
                </span>

                <strong>
                    ${formatToman(
                        service.rate
                    )}
                </strong>

            </div>

            <div class="service-stat success">

                <span>
                    Refill
                </span>

                <strong>
                    ${
                        service.refill
                            ? "دارد"
                            : "ندارد"
                    }
                </strong>

            </div>

        </div>

    `;


    if ($("status")) {

        $("status").value =
            "فعال";

    }


    updateSummary();

    calculateProviderPrice();

}


/* =========================================================
   PRICE
========================================================= */

function calculateProviderPrice() {

    const service =
        getSelectedProviderService();

    const quantityEl =
        $("quantity");

    const priceEl =
        $("price");


    if (
        !quantityEl ||
        !priceEl
    ) {

        return;

    }


    if (!service) {

        priceEl.innerText =
            formatToman(0);

        return;

    }


    const rate =
        Number(
            service.rate || 0
        );


    const quantity =
        Number(
            quantityEl.value || 0
        );


    if (
        !Number.isFinite(rate) ||
        !Number.isFinite(quantity) ||
        quantity <= 0
    ) {

        priceEl.innerText =
            formatToman(0);

        return;

    }


    const total =
        Math.ceil(
            quantity / 1000 *
            rate
        );


    priceEl.innerText =
        formatToman(total);

}


function calculatePrice() {

    calculateProviderPrice();

}


/* =========================================================
   SUMMARY
========================================================= */

function getPlatformName(
    platform
) {

    const names = {

        all: "همه سرویس‌ها",

        instagram: "Instagram",

        telegram: "Telegram",

        facebook: "Facebook",

        twitter: "Twitter",

        youtube: "YouTube",

        spotify: "Spotify"

    };


    return (
        names[platform] ||
        platform ||
        "—"
    );

}


function updateSummary() {

    const service =
        getSelectedProviderService();


    const platform =
        $("platform")
            ?.value || "all";


    const quantity =
        Number(
            $("quantity")
                ?.value || 0
        );


    const platformEl =
        $("summaryPlatform");


    const typeEl =
        $("summaryType");


    const quantityEl =
        $("summaryQuantity");


    const statusEl =
        $("summaryStatus");


    if (platformEl) {

        platformEl.textContent =
            getPlatformName(
                platform
            );

    }


    if (quantityEl) {

        quantityEl.textContent =
            quantity
                .toLocaleString("fa-IR");

    }


    if (typeEl) {

        typeEl.textContent =
            service
                ? (
                    serviceNames[
                        detectServiceType(
                            service
                        )
                    ] ||
                    service.name ||
                    "سرویس"
                )
                : "—";

    }


    if (statusEl) {

        statusEl.textContent =
            service
                ? "آماده ثبت"
                : "انتخاب سرویس";

    }

}


/* =========================================================
   NOTIFICATION
========================================================= */

function showNotification(
    message
) {

    let notification =
        $("notification");


    if (!notification) {

        notification =
            document.createElement(
                "div"
            );

        notification.id =
            "notification";

        document.body.appendChild(
            notification
        );

    }


    notification.textContent =
        message;


    notification.classList.add(
        "show"
    );


    clearTimeout(
        window.__notificationTimer
    );


    window.__notificationTimer =
        setTimeout(
            () => {

                notification.classList.remove(
                    "show"
                );

            },
            3500
        );

}


/* =========================================================
   MODALS
========================================================= */

function openModal(id) {

    const modal =
        $(id);


    if (!modal) {
        return;
    }


    modal.classList.add(
        "active"
    );


    document.body.classList.add(
        "modal-open"
    );


    const firstInput =
        modal.querySelector(
            "input"
        );


    setTimeout(
        () =>
            firstInput?.focus(),
        50
    );

}


function closeModal(id) {

    const modal =
        $(id);


    if (!modal) {
        return;
    }


    modal.classList.remove(
        "active"
    );


    if (
        !document.querySelector(
            ".modal.active"
        )
    ) {

        document.body.classList.remove(
            "modal-open"
        );

    }

}


function switchToRegister() {

    closeModal(
        "loginModal"
    );

    openModal(
        "registerModal"
    );

}


function switchToLogin() {

    closeModal(
        "registerModal"
    );

    openModal(
        "loginModal"
    );

}


/* =========================================================
   USER
========================================================= */

function setLoggedInUser(user) {

    localStorage.setItem(
        "socialboost_user",
        JSON.stringify(user)
    );


    updateAuthUI();

}


function getLoggedInUser() {

    try {

        return JSON.parse(
            localStorage.getItem(
                "socialboost_user"
            ) || "null"
        );

    } catch {

        return null;

    }

}


function getUser() {

    return getLoggedInUser();

}


function logout() {

    localStorage.removeItem(
        "socialboost_user"
    );


    updateAuthUI();


    showNotification(
        "از حساب کاربری خارج شدید."
    );

}


function showAccountMenu() {

    const user =
        getLoggedInUser();


    if (!user) {

        openModal(
            "loginModal"
        );

        return;

    }


    const message =
        `سلام ${user.name || "کاربر"} 👋\n\n` +
        `ایمیل: ${user.email || "-"}\n\n` +
        `برای خروج، دکمه OK را بزنید.`;


    if (
        window.confirm(
            message
        )
    ) {

        logout();

    }

}


/* =========================================================
   AUTH UI
========================================================= */

function updateAuthUI() {

    const user =
        getLoggedInUser();


    const loginButton =
        document.querySelector(
            ".login-button"
        );


    const registerButton =
        document.querySelector(
            ".register-button"
        );


    if (!loginButton) {
        return;
    }


    if (user) {

        loginButton.textContent =
            `حساب ${
                user.name || ""
            }`.trim();


        loginButton.onclick =
            () =>
                showAccountMenu();


        loginButton.classList.add(
            "user-pill"
        );


        if (registerButton) {

            registerButton.textContent =
                "خروج";


            registerButton.onclick =
                () =>
                    logout();

        }

    } else {

        loginButton.textContent =
            "ورود";


        loginButton.onclick =
            () =>
                openModal(
                    "loginModal"
                );


        loginButton.classList.remove(
            "user-pill"
        );


        if (registerButton) {

            registerButton.textContent =
                "ثبت‌نام";


            registerButton.onclick =
                () =>
                    openModal(
                        "registerModal"
                    );

        }

    }

}


/* =========================================================
   API
========================================================= */

async function apiRequest(
    url,
    options = {}
) {

    const response =
        await fetch(
            url,
            {

                headers: {

                    "Content-Type":
                        "application/json",

                    ...(options.headers || {})

                },

                ...options

            }
        );


    let data;


    try {

        data =
            await response.json();

    } catch {

        data = {

            success: false,

            message:
                "پاسخ نامعتبر از سرور دریافت شد."

        };

    }


    if (!response.ok) {

        throw new Error(

            data.message ||
            "درخواست با خطا مواجه شد."

        );

    }


    return data;

}


/* =========================================================
   LOGIN
========================================================= */

async function login() {

    const email =
        $("loginEmail")
            ?.value
            .trim();


    const password =
        $("loginPassword")
            ?.value || "";


    if (
        !email ||
        !password
    ) {

        showNotification(
            "لطفاً ایمیل و رمز عبور را کامل کنید."
        );

        return;

    }


    const button =
        document.querySelector(
            "#loginModal .modal-button"
        );


    if (button) {

        button.disabled =
            true;

        button.textContent =
            "در حال ورود...";

    }


    try {

        const data =
            await apiRequest(
                "/api/login",
                {

                    method: "POST",

                    body:
                        JSON.stringify({

                            email,

                            password

                        })

                }
            );


        if (!data.success) {

            throw new Error(
                data.message ||
                "ورود ناموفق بود."
            );

        }


        setLoggedInUser(
            data.user
        );


        closeModal(
            "loginModal"
        );


        if ($("loginPassword")) {

            $("loginPassword").value =
                "";

        }


        showNotification(
            data.message ||
            "ورود موفق بود."
        );


    } catch (error) {

        showNotification(
            error.message
        );


    } finally {

        if (button) {

            button.disabled =
                false;

            button.textContent =
                "ورود";

        }

    }

}


/* =========================================================
   REGISTER
========================================================= */

async function register() {

    const name =
        $("registerName")
            ?.value
            .trim();


    const email =
        $("registerEmail")
            ?.value
            .trim();


    const password =
        $("registerPassword")
            ?.value || "";


    if (
        !name ||
        !email ||
        !password
    ) {

        showNotification(
            "لطفاً همه فیلدها را کامل کنید."
        );

        return;

    }


    if (
        password.length < 6
    ) {

        showNotification(
            "رمز عبور باید حداقل ۶ کاراکتر باشد."
        );

        return;

    }


    const button =
        document.querySelector(
            "#registerModal .modal-button"
        );


    if (button) {

        button.disabled =
            true;

        button.textContent =
            "در حال ساخت حساب...";

    }


    try {

        const data =
            await apiRequest(
                "/api/register",
                {

                    method: "POST",

                    body:
                        JSON.stringify({

                            name,

                            email,

                            password

                        })

                }
            );


        if (!data.success) {

            throw new Error(
                data.message ||
                "ثبت‌نام ناموفق بود."
            );

        }


        closeModal(
            "registerModal"
        );


        [
            "registerName",
            "registerEmail",
            "registerPassword"
        ]
            .forEach(
                id => {

                    if ($(id)) {
                        $(id).value = "";
                    }

                }
            );


        showNotification(
            data.message ||
            "حساب با موفقیت ساخته شد."
        );


        setTimeout(
            () => {

                if ($("loginEmail")) {

                    $("loginEmail").value =
                        email;

                }


                openModal(
                    "loginModal"
                );

            },
            500
        );


    } catch (error) {

        showNotification(
            error.message
        );


    } finally {

        if (button) {

            button.disabled =
                false;

            button.textContent =
                "ساخت حساب";

        }

    }

}


/* =========================================================
   SUBMIT ORDER
========================================================= */

async function submitOrder() {

    const service =
        $("service")
            ?.value;


    const platform =
        $("platform")
            ?.value;


    const link =
        $("link")
            ?.value
            .trim();


    const quantity =
        Number(
            $("quantity")
                ?.value
        );


    const user =
        getLoggedInUser();


    if (!user) {

        showNotification(
            "برای ثبت سفارش ابتدا وارد حساب کاربری شوید."
        );


        openModal(
            "loginModal"
        );


        return;

    }


    if (!service) {

        showNotification(
            "لطفاً سرویس را انتخاب کنید."
        );

        return;

    }


    if (!link) {

        showNotification(
            "لطفاً لینک هدف را وارد کنید."
        );


        $("link")?.focus();


        return;

    }


    if (
        !Number.isInteger(
            quantity
        ) ||
        quantity <= 0
    ) {

        showNotification(
            "تعداد سفارش نامعتبر است."
        );


        $("quantity")?.focus();


        return;

    }


    const selectedService =
        getSelectedProviderService();


    if (!selectedService) {

        showNotification(
            "سرویس انتخاب‌شده معتبر نیست."
        );

        return;

    }


    const min =
        Number(
            selectedService.min || 0
        );


    const max =
        Number(
            selectedService.max || 0
        );


    if (
        min > 0 &&
        quantity < min
    ) {

        showNotification(
            `حداقل سفارش این سرویس ${
                min.toLocaleString("fa-IR")
            } است.`
        );


        $("quantity")?.focus();


        return;

    }


    if (
        max > 0 &&
        quantity > max
    ) {

        showNotification(
            `حداکثر سفارش این سرویس ${
                max.toLocaleString("fa-IR")
            } است.`
        );


        $("quantity")?.focus();


        return;

    }


    const button =
        $("submitOrder") ||
        document.querySelector(
            ".submit-order"
        );


    if (button) {

        button.disabled =
            true;

        button.textContent =
            "در حال ثبت سفارش...";

    }


    try {

        const data =
            await apiRequest(
                "/api/orders",
                {

                    method: "POST",

                    body:
                        JSON.stringify({

                            userId:
                                user.id,

                            service,

                            platform,

                            link,

                            quantity

                        })

                }
            );


        if (!data.success) {

            throw new Error(
                data.message ||
                "ثبت سفارش ناموفق بود."
            );

        }


        showNotification(

            `سفارش #${
                data.order?.id || ""
            } با موفقیت ثبت شد.`

        );


        if ($("link")) {

            $("link").value =
                "";

        }


        if ($("quantity")) {

            $("quantity").value =
                min > 0
                    ? min
                    : 100;

        }


        calculateProviderPrice();

        updateSummary();


        setTimeout(
            () => {

                window.location.href =
                    "orders.html";

            },
            900
        );


    } catch (error) {

        showNotification(
            error.message
        );


    } finally {

        if (button) {

            button.disabled =
                false;

            button.textContent =
                "ثبت سفارش ←";

        }

    }

}


/* =========================================================
   LOAD ORDERS
========================================================= */

async function loadOrders() {

    const user =
        getLoggedInUser();


    if (!user) {
        return [];
    }


    try {

        const data =
            await apiRequest(
                "/api/orders?userId=" +
                encodeURIComponent(
                    user.id
                )
            );


        return data.orders || [];

    } catch {

        return [];

    }

}


/* =========================================================
   SERVICE PAGE
========================================================= */

async function loadProviderServices() {

    const serviceSelect =
        $("service");


    if (!serviceSelect) {
        return;
    }


    try {

        const data =
            await apiRequest(
                "/api/provider/services",
                {
                    method: "GET",
                    cache: "no-store"
                }
            );


        if (
            !data ||
            !data.success ||
            !Array.isArray(
                data.services
            )
        ) {

            throw new Error(
                data?.message ||
                "لیست سرویس‌ها از Provider دریافت نشد."
            );

        }


        providerServices =
            data.services
                .map(
                    service => ({
                        ...service,
                        service:
                            getServiceId(
                                service
                            )
                    })
                )
                .filter(
                    service =>
                        getServiceId(
                            service
                        )
                );


        if (
            providerServices.length === 0
        ) {

            throw new Error(
                "هیچ سرویسی از Provider دریافت نشد."
            );

        }


        renderProviderServices();


    } catch (error) {

        console.error(
            "PROVIDER SERVICES ERROR:",
            error
        );


        serviceSelect.innerHTML = `

            <option value="">
                خطا در دریافت سرویس‌ها
            </option>

        `;


        if ($("status")) {

            $("status").value =
                "خطا";

        }


        showNotification(
            error.message
        );

    }

}


/* =========================================================
   SERVICE FILTER EVENTS
========================================================= */

function installServiceFilters() {

    const platformButtons =
        document.querySelectorAll(
            ".platform"
        );


    platformButtons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    platformButtons
                        .forEach(
                            item =>
                                item.classList.remove(
                                    "active"
                                )
                        );


                    button.classList.add(
                        "active"
                    );


                    currentPlatformFilter =
                        button.dataset.platform ||
                        "all";


                    if ($("platform")) {

                        $("platform").value =
                            currentPlatformFilter;

                    }


                    renderProviderServices();

                }
            );

        }
    );


    const typeButtons =
        document.querySelectorAll(
            ".service-type"
        );


    typeButtons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    typeButtons
                        .forEach(
                            item =>
                                item.classList.remove(
                                    "active"
                                )
                        );


                    button.classList.add(
                        "active"
                    );


                    currentTypeFilter =
                        button.dataset.type ||
                        "all";


                    renderProviderServices();

                }
            );

        }
    );


    $("serviceSearch")
        ?.addEventListener(
            "input",
            () => {

                renderProviderServices();

            }
        );


    $("platform")
        ?.addEventListener(
            "change",
            () => {

                currentPlatformFilter =
                    $("platform").value ||
                    "all";


                platformButtons
                    .forEach(
                        button => {

                            button.classList.toggle(
                                "active",
                                button.dataset.platform ===
                                currentPlatformFilter
                            );

                        }
                    );


                renderProviderServices();

            }
        );


    $("service")
        ?.addEventListener(
            "change",
            () => {

                updateServiceInfo();

            }
        );


    $("quantity")
        ?.addEventListener(
            "input",
            () => {

                calculateProviderPrice();

                updateSummary();

            }
        );


    $("quantity")
        ?.addEventListener(
            "change",
            () => {

                calculateProviderPrice();

                updateSummary();

            }
        );


    $("submitOrder")
        ?.addEventListener(
            "click",
            submitOrder
        );

}


/* =========================================================
   MOBILE MENU
========================================================= */

function installMobileMenu() {

    const links =
        document.querySelector(
            ".nav-links"
        );


    const menuToggle =
        $("menuToggle");


    if (
        !links ||
        !menuToggle
    ) {

        return;

    }


    if (
        menuToggle.dataset.bound === "true"
    ) {

        return;

    }


    menuToggle.dataset.bound =
        "true";


    menuToggle.addEventListener(
        "click",
        () => {

            const open =
                links.classList.toggle(
                    "mobile-open"
                );


            menuToggle.textContent =
                open
                    ? "×"
                    : "☰";

            menuToggle.setAttribute(
                "aria-expanded",
                String(open)
            );

        }
    );


    links
        .querySelectorAll("a")
        .forEach(
            link => {

                link.addEventListener(
                    "click",
                    () => {

                        links.classList.remove(
                            "mobile-open"
                        );


                        menuToggle.textContent =
                            "☰";


                        menuToggle.setAttribute(
                            "aria-expanded",
                            "false"
                        );

                    }
                );

            }
        );

}


/* =========================================================
   FORM IMPROVEMENTS
========================================================= */

function improveForms() {

    document
        .querySelectorAll(
            ".modal"
        )
        .forEach(
            modal => {

                modal.addEventListener(
                    "click",
                    event => {

                        if (
                            event.target ===
                            modal
                        ) {

                            closeModal(
                                modal.id
                            );

                        }

                    }
                );

            }
        );


    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key ===
                "Escape"
            ) {

                document
                    .querySelectorAll(
                        ".modal.active"
                    )
                    .forEach(
                        modal => {

                            closeModal(
                                modal.id
                            );

                        }
                    );

            }

        }
    );


    $("loginPassword")
        ?.addEventListener(
            "keydown",
            event => {

                if (
                    event.key ===
                    "Enter"
                ) {

                    login();

                }

            }
        );


    $("registerPassword")
        ?.addEventListener(
            "keydown",
            event => {

                if (
                    event.key ===
                    "Enter"
                ) {

                    register();

                }

            }
        );

}


/* =========================================================
   AUTH QUERY
========================================================= */

function handleAuthQuery() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    if (
        params.get("login") === "1"
    ) {

        openModal(
            "loginModal"
        );

    }


    if (
        params.get("register") === "1"
    ) {

        openModal(
            "registerModal"
        );

    }

}


/* =========================================================
   START
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        installMobileMenu();

        improveForms();

        updateAuthUI();

        handleAuthQuery();

        installServiceFilters();

        await loadProviderServices();

        calculateProviderPrice();

        updateSummary();

    }
);
