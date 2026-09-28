require("dotenv").config();

const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect((error) => {
    if (error) {
        console.error("DB 연결 실패");
        console.error(error);
        return;
    }

    console.log("DB 연결 성공");
    console.log(`DATABASE : ${process.env.DB_NAME}`);
});


// =============================================
// DB STATUS
// =============================================

app.get("/api/status", (req, res) => {

    db.ping((error) => {

        if (error) {
            return res.status(500).json({
                success: false,
                database: "disconnected"
            });
        }

        res.json({
            success: true,
            database: "connected",
            databaseName: process.env.DB_NAME
        });

    });

});


// =============================================
// TABLE LIST
// =============================================

app.get("/api/database/tables", (req, res) => {

    db.query("SHOW TABLES", (error, results) => {

        if (error) {
            console.error(error);

            return res.status(500).json({
                success: false,
                message: "테이블 조회 실패"
            });
        }

        const tables = results.map(row =>
            Object.values(row)[0]
        );

        res.json({
            success: true,
            database: process.env.DB_NAME,
            tableCount: tables.length,
            tables
        });

    });

});


// =============================================
// DASHBOARD 기본 통계
// =============================================

app.get("/api/dashboard/stats", async (req, res) => {

    try {

        const [tables] =
            await db.promise().query("SHOW TABLES");

        const tableList =
            tables.map(row => Object.values(row)[0]);

        const statistics = [];

        let totalRows = 0;

        for (const table of tableList) {

            const [result] =
                await db.promise().query(
                    `SELECT COUNT(*) AS count
                     FROM \`${table}\``
                );

            const count =
                Number(result[0].count);

            totalRows += count;

            statistics.push({
                table,
                count
            });
        }

        res.json({
            success: true,
            database: process.env.DB_NAME,
            tableCount: tableList.length,
            totalRows,
            tables: statistics
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: "통계 조회 실패"
        });

    }

});


// =============================================
// USER DASHBOARD 통계
// =============================================

app.get("/api/dashboard/users", async (req, res) => {

    try {

        // users 테이블 존재 확인
        const [tables] =
            await db.promise().query(
                "SHOW TABLES LIKE 'users'"
            );

        if (tables.length === 0) {

            return res.json({
                success: true,
                available: false,
                message: "users 테이블이 없습니다."
            });

        }


        // created_at 컬럼 존재 확인
        const [columns] =
            await db.promise().query(
                "SHOW COLUMNS FROM `users` LIKE 'created_at'"
            );

        if (columns.length === 0) {

            return res.json({
                success: true,
                available: false,
                message: "users.created_at 컬럼이 없습니다."
            });

        }


        // 전체 회원
        const [totalResult] =
            await db.promise().query(
                `SELECT COUNT(*) AS count
                 FROM users`
            );


        // 오늘 가입
        const [todayResult] =
            await db.promise().query(
                `SELECT COUNT(*) AS count
                 FROM users
                 WHERE created_at >= CURDATE()
                   AND created_at < CURDATE() + INTERVAL 1 DAY`
            );


        // 최근 7일 가입
        // 오늘 포함 7일이므로 6일 전 00:00부터
        const [weekResult] =
            await db.promise().query(
                `SELECT COUNT(*) AS count
                 FROM users
                 WHERE created_at >= CURDATE() - INTERVAL 6 DAY
                   AND created_at < CURDATE() + INTERVAL 1 DAY`
            );


        // 최근 7일 일별 가입
        const [growthResult] =
            await db.promise().query(
                `SELECT
                    DATE_FORMAT(created_at, '%Y-%m-%d') AS signup_date,
                    COUNT(*) AS count
                 FROM users
                 WHERE created_at >= CURDATE() - INTERVAL 6 DAY
                   AND created_at < CURDATE() + INTERVAL 1 DAY
                 GROUP BY DATE(created_at)
                 ORDER BY DATE(created_at)`
            );


        res.json({

            success: true,
            available: true,

            totalUsers:
                Number(totalResult[0].count),

            todayUsers:
                Number(todayResult[0].count),

            weekUsers:
                Number(weekResult[0].count),

            growth:
                growthResult.map(row => ({
                    date: row.signup_date,
                    count: Number(row.count)
                }))

        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: "회원 통계 조회 실패"
        });

    }

});


// =============================================
// TABLE DATA
// =============================================

app.get(
    "/api/database/tables/:tableName",
    async (req, res) => {

        const tableName =
            req.params.tableName;

        try {

            const [tables] =
                await db.promise().query(
                    "SHOW TABLES"
                );

            const tableList =
                tables.map(row =>
                    Object.values(row)[0]
                );


            if (!tableList.includes(tableName)) {

                return res.status(404).json({
                    success: false,
                    message: "존재하지 않는 테이블입니다."
                });

            }


            const [columns] =
                await db.promise().query(
                    `DESCRIBE \`${tableName}\``
                );


            const [countResult] =
                await db.promise().query(
                    `SELECT COUNT(*) AS count
                     FROM \`${tableName}\``
                );


            const [rows] =
                await db.promise().query(
                    `SELECT *
                     FROM \`${tableName}\`
                     LIMIT 100`
                );


            res.json({

                success: true,

                table:
                    tableName,

                rowCount:
                    Number(countResult[0].count),

                columns,

                data:
                    rows

            });

        } catch (error) {

            console.error(error);

            res.status(500).json({
                success: false,
                message: "테이블 데이터 조회 실패"
            });

        }

    }
);


// =============================================
// DELETE ROW
// =============================================

app.delete(
    "/api/database/tables/:tableName/:id",
    async (req, res) => {

        const tableName =
            req.params.tableName;

        const id =
            req.params.id;

        try {

            const [tables] =
                await db.promise().query(
                    "SHOW TABLES"
                );

            const tableList =
                tables.map(row =>
                    Object.values(row)[0]
                );


            if (!tableList.includes(tableName)) {

                return res.status(404).json({
                    success: false,
                    message: "존재하지 않는 테이블입니다."
                });

            }


            const [keys] =
                await db.promise().query(
                    `SHOW KEYS
                     FROM \`${tableName}\`
                     WHERE Key_name = 'PRIMARY'`
                );


            if (keys.length === 0) {

                return res.status(400).json({
                    success: false,
                    message: "Primary Key가 없는 테이블입니다."
                });

            }


            if (keys.length > 1) {

                return res.status(400).json({
                    success: false,
                    message: "복합 Primary Key는 현재 지원하지 않습니다."
                });

            }


            const primaryKey =
                keys[0].Column_name;


            const [result] =
                await db.promise().query(

                    `DELETE
                     FROM \`${tableName}\`
                     WHERE \`${primaryKey}\` = ?
                     LIMIT 1`,

                    [id]

                );


            if (result.affectedRows === 0) {

                return res.status(404).json({
                    success: false,
                    message: "삭제할 데이터를 찾을 수 없습니다."
                });

            }


            res.json({
                success: true,
                message: "데이터가 삭제되었습니다."
            });

        } catch (error) {

            console.error(error);

            res.status(500).json({
                success: false,
                message: "데이터 삭제 실패"
            });

        }

    }
);


// =============================================
// SERVER
// =============================================

app.listen(PORT, () => {

    console.log("");
    console.log("============================");
    console.log("🥩 STEAK API Server");
    console.log(`Server : http://localhost:${PORT}`);
    console.log("============================");

});