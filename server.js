require("dotenv").config();
const fs = require("fs");
const express = require("express");
const path = require("path");
const bcrypt = require("bcryptjs");
const { Database } = require("node-sqlite3-wasm");

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_DIR = path.join(__dirname, "data");
fs.mkdirSync(DATA_DIR, { recursive: true });
const DB_FILE = path.join(DATA_DIR, "socialboost.sqlite");

const db = new Database(DB_FILE);

/* =========================================================
   MIDDLEWARE
========================================================= */

app.disable("x-powered-by");
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true, limit: "100kb" }));

// Serve only the curated public directory. Database files and server source stay private.
app.use(express.static(path.join(__dirname, "public"), {
    dotfiles: "deny",
    index: "index.html"
}));


/* =========================================================
   DATABASE
========================================================= */

db.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        balance REAL NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        service TEXT NOT NULL,
        platform TEXT NOT NULL,
        link TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        price REAL NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        type TEXT NOT NULL,
        amount REAL NOT NULL,
        description TEXT,
        status TEXT NOT NULL DEFAULT 'completed',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS support_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        subject TEXT,
        message TEXT NOT NULL,
        reply TEXT,
        status TEXT NOT NULL DEFAULT 'open',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
    );
`);


/* =========================================================
   SERVICES
========================================================= */

const prices = {
    followers: 25000,
    likes: 15000,
    views: 8000,
    comments: 35000,
    saves: 12000
};


/* =========================================================
   HELPERS
========================================================= */

function getUser(id) {

    return db.get(
        `
        SELECT
            id,
            name,
            email,
            balance,
            created_at
        FROM users
        WHERE id = ?
        `,
        Number(id)
    );

}


function publicUser(user) {

    if (!user) {
        return null;
    }

    return {
        id: Number(user.id),
        name: user.name,
        email: user.email,
        balance: Number(user.balance || 0),
        created_at: user.created_at
    };

}


/* =========================================================
   HEALTH
========================================================= */

app.get("/api/health", (req, res) => {

    res.json({
        success: true,
        message: "SocialBoost server is running."
    });

});


/* =========================================================
   SERVICES
========================================================= */

app.get("/api/provider/services", async (req, res) => {
    try {

        const services = await getProviderServices();

        if (!Array.isArray(services)) {
            throw new Error("Provider services response is not an array");
        }

        const result = services.map(s => {

            const rate = Number(s.rate || 0);

            return {
                id: String(s.service || ""),
                service: String(s.service || ""),
                name: String(s.name || "سرویس بدون نام"),
                category: String(s.category || ""),
                type: String(s.type || "Default"),

                rate: rate,

                price: Math.ceil(
                    rate * 1.4 * 100
                ) / 100,

                min: Number(s.min || 0),
                max: Number(s.max || 0),

                refill:
                    s.refill === true ||
                    s.refill === 1 ||
                    s.refill === "1",

                cancel:
                    s.cancel === true ||
                    s.cancel === 1 ||
                    s.cancel === "1"
            };

        }).filter(s => s.id);

        res.json({
            success: true,
            count: result.length,
            services: result
        });

    } catch (error) {

        console.error(
            "PROVIDER SERVICES ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                error.message ||
                "خطا در دریافت سرویس‌های Provider"
        });
    }
});;;
app.get("/api/services", (req, res) => {

    res.json({

        success: true,

        services: [
            {
                id: "followers",
                name: "فالوور اینستاگرام",
                price: prices.followers
            },
            {
                id: "likes",
                name: "لایک اینستاگرام",
                price: prices.likes
            },
            {
                id: "views",
                name: "ویو اینستاگرام",
                price: prices.views
            },
            {
                id: "comments",
                name: "کامنت اینستاگرام",
                price: prices.comments
            },
            {
                id: "saves",
                name: "سیو اینستاگرام",
                price: prices.saves
            }
        ]

    });

});


/* =========================================================
   REGISTER
========================================================= */

app.post("/api/register", async (req, res) => {

    try {

        const name =
            String(req.body.name || "").trim();

        const email =
            String(req.body.email || "")
                .trim()
                .toLowerCase();

        const password =
            String(req.body.password || "");


        if (!name || !email || !password) {

            return res.status(400).json({
                success: false,
                message: "لطفاً همه اطلاعات را کامل کنید."
            });

        }


        if (password.length < 6) {

            return res.status(400).json({
                success: false,
                message: "رمز عبور باید حداقل ۶ کاراکتر باشد."
            });

        }


        const existing =
            db.get(
                `
                SELECT id
                FROM users
                WHERE email = ?
                `,
                email
            );


        if (existing) {

            return res.status(409).json({
                success: false,
                message: "این ایمیل قبلاً ثبت شده است."
            });

        }


        const passwordHash = await bcrypt.hash(password, 12);

        const result =
            db.run(
                `
                INSERT INTO users
                (
                    name,
                    email,
                    password,
                    balance
                )
                VALUES (?, ?, ?, 0)
                `,
                [
                    name,
                    email,
                    passwordHash
                ]
            );


        const user =
            getUser(
                Number(result.lastInsertRowid)
            );


        return res.json({

            success: true,

            message:
                "ثبت‌نام با موفقیت انجام شد.",

            user:
                publicUser(user)

        });


    } catch (error) {

        console.error(
            "REGISTER ERROR:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "خطا در ثبت‌نام."

        });

    }

});


/* =========================================================
   LOGIN
========================================================= */

app.post("/api/login", async (req, res) => {

    try {

        const email =
            String(req.body.email || "")
                .trim()
                .toLowerCase();

        const password =
            String(req.body.password || "");


        if (!email || !password) {

            return res.status(400).json({

                success: false,

                message:
                    "ایمیل و رمز عبور را وارد کنید."

            });

        }


        const user =
            db.get(
                `
                SELECT
                    id,
                    name,
                    email,
                    password,
                    balance,
                    created_at
                FROM users
                WHERE email = ?
                `,
                email
            );


        if (!user || !(await bcrypt.compare(password, user.password))) {

            return res.status(401).json({

                success: false,

                message:
                    "ایمیل یا رمز عبور اشتباه است."

            });

        }


        res.json({

            success: true,

            message:
                "ورود موفق بود.",

            user:
                publicUser(user)

        });


    } catch (error) {

        console.error(
            "LOGIN ERROR:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                "خطا در ورود."

        });

    }

});


/* =========================================================
   USER
========================================================= */

app.get("/api/user/:id", (req, res) => {

    try {

        const user =
            getUser(req.params.id);


        if (!user) {

            return res.status(404).json({

                success: false,

                message:
                    "کاربر پیدا نشد."

            });

        }


        res.json({

            success: true,

            user:
                publicUser(user)

        });


    } catch (error) {

        console.error(error);

        res.status(500).json({

            success: false,

            message:
                "خطا در دریافت اطلاعات کاربر."

        });

    }

});


/* =========================================================
   WALLET
========================================================= */

app.get("/api/wallet", (req, res) => {

    try {

        const userId =
            Number(req.query.userId);


        if (!userId) {

            return res.status(400).json({

                success: false,

                message:
                    "شناسه کاربر ارسال نشده است."

            });

        }


        const user =
            getUser(userId);


        if (!user) {

            return res.status(404).json({

                success: false,

                message:
                    "کاربر پیدا نشد."

            });

        }


        res.json({

            success: true,

            balance:
                Number(user.balance || 0),

            wallet: {

                balance:
                    Number(user.balance || 0)

            }

        });


    } catch (error) {

        console.error(error);

        res.status(500).json({

            success: false,

            message:
                "خطا در دریافت کیف پول."

        });

    }

});


/* =========================================================
   CHARGE WALLET
========================================================= */

app.post("/api/wallet/charge", (req, res) => {

    try {

        const userId =
            Number(req.body.userId);

        const amount =
            Number(req.body.amount);


        if (
            !userId ||
            !Number.isFinite(amount) ||
            amount <= 0
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "مبلغ شارژ نامعتبر است."

            });

        }


        const user =
            getUser(userId);


        if (!user) {

            return res.status(404).json({

                success: false,

                message:
                    "کاربر پیدا نشد."

            });

        }


        const newBalance =
            Number(user.balance || 0) +
            amount;


        db.run(
            `
            UPDATE users
            SET balance = ?
            WHERE id = ?
            `,
            [
                newBalance,
                userId
            ]
        );


        db.run(
            `
            INSERT INTO transactions
            (
                user_id,
                type,
                amount,
                description,
                status
            )
            VALUES (?, ?, ?, ?, ?)
            `,
            [
                userId,
                "deposit",
                amount,
                "شارژ کیف پول",
                "completed"
            ]
        );


        res.json({

            success: true,

            message:
                "کیف پول شارژ شد.",

            balance:
                newBalance

        });


    } catch (error) {

        console.error(error);

        res.status(500).json({

            success: false,

            message:
                "خطا در شارژ کیف پول."

        });

    }

});


/* =========================================================
   TRANSACTIONS
========================================================= */

app.get("/api/transactions", (req, res) => {

    try {

        const userId =
            Number(req.query.userId);


        if (!userId) {

            return res.status(400).json({

                success: false,

                message:
                    "شناسه کاربر ارسال نشده است."

            });

        }


        const transactions =
            db.all(
                `
                SELECT
                    id,
                    type,
                    amount,
                    description,
                    status,
                    created_at
                FROM transactions
                WHERE user_id = ?
                ORDER BY id DESC
                `,
                userId
            );


        res.json({

            success: true,

            transactions

        });


    } catch (error) {

        console.error(error);

        res.status(500).json({

            success: false,

            message:
                "خطا در دریافت تراکنش‌ها."

        });

    }

});


/* =========================================================
   CREATE ORDER
========================================================= */

app.post("/api/orders", (req, res) => {

    try {

        const userId =
            req.body.userId
                ? Number(req.body.userId)
                : null;

        const service =
            String(req.body.service || "").trim();

        const platform =
            String(req.body.platform || "").trim();

        const link =
            String(req.body.link || "").trim();

        const quantity =
            Number(req.body.quantity);


        if (
            !service ||
            !platform ||
            !link ||
            !Number.isInteger(quantity)
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "اطلاعات سفارش ناقص است."

            });

        }


        if (quantity < 100) {

            return res.status(400).json({

                success: false,

                message:
                    "حداقل تعداد سفارش ۱۰۰ است."

            });

        }


        if (!prices[service]) {

            return res.status(400).json({

                success: false,

                message:
                    "سرویس نامعتبر است."

            });

        }


        const price =
            Math.ceil(
                quantity /
                1000 *
                prices[service]
            );


        if (userId) {

            const user =
                getUser(userId);


            if (!user) {

                return res.status(404).json({

                    success: false,

                    message:
                        "کاربر پیدا نشد."

                });

            }


            if (
                Number(user.balance) < price
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "موجودی کیف پول کافی نیست."

                });

            }


            db.exec("BEGIN TRANSACTION");

            try {

                db.run(
                    `
                    UPDATE users
                    SET balance = balance - ?
                    WHERE id = ?
                    `,
                    [
                        price,
                        userId
                    ]
                );


                db.run(
                    `
                    INSERT INTO transactions
                    (
                        user_id,
                        type,
                        amount,
                        description,
                        status
                    )
                    VALUES (?, ?, ?, ?, ?)
                    `,
                    [
                        userId,
                        "payment",
                        price,
                        "پرداخت سفارش",
                        "completed"
                    ]
                );


                const orderResult =
                    db.run(
                        `
                        INSERT INTO orders
                        (
                            user_id,
                            service,
                            platform,
                            link,
                            quantity,
                            price,
                            status
                        )
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                        `,
                        [
                            userId,
                            service,
                            platform,
                            link,
                            quantity,
                            price,
                            "pending"
                        ]
                    );


                db.exec("COMMIT");


                const order =
                    db.get(
                        `
                        SELECT
                            id,
                            user_id,
                            service,
                            platform,
                            link,
                            quantity,
                            price,
                            status,
                            created_at
                        FROM orders
                        WHERE id = ?
                        `,
                        Number(
                            orderResult.lastInsertRowid
                        )
                    );


                return res.json({

                    success: true,

                    message:
                        "سفارش با موفقیت ثبت شد.",

                    order

                });


            } catch (error) {

                if (db.inTransaction) {
                    db.exec("ROLLBACK");
                }

                throw error;

            }

        }


        const orderResult =
            db.run(
                `
                INSERT INTO orders
                (
                    user_id,
                    service,
                    platform,
                    link,
                    quantity,
                    price,
                    status
                )
                VALUES (?, ?, ?, ?, ?, ?, ?)
                `,
                [
                    null,
                    service,
                    platform,
                    link,
                    quantity,
                    price,
                    "pending"
                ]
            );


        const order =
            db.get(
                `
                SELECT
                    id,
                    user_id,
                    service,
                    platform,
                    link,
                    quantity,
                    price,
                    status,
                    created_at
                FROM orders
                WHERE id = ?
                `,
                Number(
                    orderResult.lastInsertRowid
                )
            );


        res.json({

            success: true,

            message:
                "سفارش با موفقیت ثبت شد.",

            order

        });


    } catch (error) {

        console.error(
            "ORDER ERROR:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                "خطا در ثبت سفارش."

        });

    }

});


/* =========================================================
   GET ORDERS
========================================================= */

app.get("/api/orders", (req, res) => {

    try {

        const userId =
            req.query.userId
                ? Number(req.query.userId)
                : null;


        let orders;


        if (userId) {

            orders =
                db.all(
                    `
                    SELECT
                        id,
                        service,
                        platform,
                        link,
                        quantity,
                        price,
                        status,
                        created_at
                    FROM orders
                    WHERE user_id = ?
                    ORDER BY id DESC
                    `,
                    userId
                );

        } else {

            orders =
                db.all(
                    `
                    SELECT
                        id,
                        service,
                        platform,
                        link,
                        quantity,
                        price,
                        status,
                        created_at
                    FROM orders
                    ORDER BY id DESC
                    `
                );

        }


        res.json({

            success: true,

            orders

        });


    } catch (error) {

        console.error(error);

        res.status(500).json({

            success: false,

            message:
                "خطا در دریافت سفارش‌ها.",

            orders: []

        });

    }

});


/* =========================================================
   SINGLE ORDER
========================================================= */

app.get("/api/orders/:id", (req, res) => {

    try {

        const order =
            db.get(
                `
                SELECT
                    id,
                    user_id,
                    service,
                    platform,
                    link,
                    quantity,
                    price,
                    status,
                    created_at
                FROM orders
                WHERE id = ?
                `,
                Number(req.params.id)
            );


        if (!order) {

            return res.status(404).json({

                success: false,

                message:
                    "سفارش پیدا نشد."

            });

        }


        res.json({

            success: true,

            order

        });


    } catch (error) {

        console.error(error);

        res.status(500).json({

            success: false,

            message:
                "خطا در دریافت سفارش."

        });

    }

});


/* =========================================================
   SUPPORT
========================================================= */

app.post("/api/support", (req, res) => {

    try {

        const userId =
            req.body.userId
                ? Number(req.body.userId)
                : null;

        const subject =
            String(
                req.body.subject ||
                "پشتیبانی"
            ).trim();

        const message =
            String(
                req.body.message ||
                ""
            ).trim();


        if (!message) {

            return res.status(400).json({

                success: false,

                message:
                    "متن پیام را وارد کنید."

            });

        }


        db.run(
            `
            INSERT INTO support_messages
            (
                user_id,
                subject,
                message,
                status
            )
            VALUES (?, ?, ?, ?)
            `,
            [
                userId,
                subject,
                message,
                "open"
            ]
        );


        res.json({

            success: true,

            message:
                "پیام شما ارسال شد."

        });


    } catch (error) {

        console.error(error);

        res.status(500).json({

            success: false,

            message:
                "خطا در ارسال پیام."

        });

    }

});


/* =========================================================
   GET SUPPORT
========================================================= */

app.get("/api/support", (req, res) => {

    try {

        const userId =
            Number(req.query.userId);


        if (!userId) {

            return res.json({

                success: true,

                messages: []

            });

        }


        const messages =
            db.all(
                `
                SELECT
                    id,
                    subject,
                    message,
                    reply,
                    status,
                    created_at
                FROM support_messages
                WHERE user_id = ?
                ORDER BY id DESC
                `,
                userId
            );


        res.json({

            success: true,

            messages

        });


    } catch (error) {

        console.error(error);

        res.status(500).json({

            success: false,

            message:
                "خطا در دریافت پیام‌ها.",

            messages: []

        });

    }

});


/* =========================================================
   PAGE ROUTES
========================================================= */

const pages = [
    "index.html",
    "dashboard.html",
    "dashbord.html",
    "orders.html",
    "profile.html",
    "services.html",
    "wallet.html",
    "transactions.html",
    "support.html",
    "our-services.html",
    "order-platforms.html"
];


for (const page of pages) {

    app.get(
        "/" + page,
        (req, res) => {

            res.sendFile(
                path.join(
                    __dirname,
                    "public",
                    page
                )
            );

        }
    );

}


app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});
app.post("/api/provider/order", async (req, res) => {
    try {
        const { service, link, quantity } = req.body;

        if (!service || !link || !quantity) {
            return res.status(400).json({
                success: false,
                message: "service، link و quantity الزامی هستند."
            });
        }

        const result = await providerRequest({
            action: "add",
            service: String(service),
            link: String(link),
            quantity: String(quantity)
        });

        if (result.error) {
            return res.status(400).json({
                success: false,
                message: result.error
            });
        }

        return res.json({
            success: true,
            provider: result
        });

    } catch (error) {
        console.error("PROVIDER ORDER ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "خطا در ثبت سفارش در Provider",
            error: error.message
        });
    }
});



/* =========================================================
   404
========================================================= */

app.use((req, res, next) => {

    if (req.path.startsWith("/api/provider/")) return next();
    if (req.path.startsWith("/api/")) {

        return res.status(404).json({

            success: false,

            message:
                "API موردنظر پیدا نشد."

        });

    }


    res.status(404).send(`
        <!DOCTYPE html>

        <html lang="fa" dir="rtl">

        <head>

            <meta charset="UTF-8">

            <meta name="viewport"
                  content="width=device-width, initial-scale=1.0">

            <title>صفحه پیدا نشد</title>

        </head>

        <body>

            <h1>صفحه پیدا نشد</h1>

            <a href="/index.html">
                بازگشت به صفحه اصلی
            </a>

        </body>

        </html>
    `);

});


/* =========================================================
   START
========================================================= */

app.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log("");
        console.log(
            "================================"
        );

        console.log(
            "       SocialBoost Server"
        );

        console.log(
            "================================"
        );

        console.log(
            `http://127.0.0.1:${PORT}`
        );

        console.log(
            "STATUS: ONLINE"
        );

        console.log(
            "================================"
        );

    }
);


/* =========================================================
   SAFE SHUTDOWN
========================================================= */

function shutdown() {

    try {

        db.close();

    } catch (error) {

        console.error(error);

    }

    process.exit(0);

}


process.on(
    "SIGINT",
    shutdown
);

process.on(
    "SIGTERM",
    shutdown
);

/* =========================================================
   MASTER SMM PROVIDER API
========================================================= */

const PROVIDER_URL = "https://api.mastersmmprovider.com";
const PROVIDER_KEY = process.env.MASTER_SMM_API_KEY;

async function providerRequest(params) {
    if (!PROVIDER_KEY) {
        throw new Error("MASTER_SMM_API_KEY is not configured.");
    }

    const body = new URLSearchParams({
        key: PROVIDER_KEY,
        ...params
    });

    const response = await fetch(PROVIDER_URL + "/api/v2", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body
    });

    const text = await response.text();

    try {
        return JSON.parse(text);
    } catch {
        return {
            success: false,
            error: text
        };
    }
}

/* تست اتصال Provider */
app.get("/api/provider/balance", async (req, res) => {
    try {

        if (!PROVIDER_KEY) {
            return res.status(500).json({
                success: false,
                message: "MASTER_SMM_API_KEY تنظیم نشده است."
            });
        }

        const result = await providerRequest({
            action: "balance"
        });

        res.json({
            success: true,
            provider: result
        });

    } catch (error) {

        console.error("PROVIDER ERROR:", error);

        res.status(500).json({
            success: false,
            message: "خطا در اتصال به Provider",
            error: error.message
        });
    }
});

/* دریافت سرویس‌های Provider */

/* =========================================================
   PROVIDER SERVICES
========================================================= */


async function getProviderServices() {
    if (!PROVIDER_KEY) {
        throw new Error("Provider API key is not configured");
    }

    const response = await fetch(PROVIDER_URL + "/api/v2", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
            key: PROVIDER_KEY,
            action: "services"
        })
    });

    const data = await response.json();

    if (!response.ok || data.error) {
        throw new Error(
            data.error || "Provider services request failed"
        );
    }

    return data;
}



/* =========================================================
   PROVIDER SERVICES - PUBLIC CATALOG
========================================================= */



/* =========================================================
   PROVIDER SERVICES - PUBLIC CATALOG
========================================================= */



/* =========================================================
   PROVIDER SERVICES - PUBLIC CATALOG
========================================================= */

