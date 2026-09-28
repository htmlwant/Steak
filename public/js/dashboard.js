// DOM
const tableList = document.getElementById("tableList");
const databaseName = document.getElementById("databaseName");
const dashboardMenu = document.getElementById("dashboardMenu");
const pageTitle = document.getElementById("pageTitle");
const dashboard = document.getElementById("dashboard");
const tableView = document.getElementById("tableView");
const statDatabase = document.getElementById("statDatabase");
const statTables = document.getElementById("statTables");
const statRows = document.getElementById("statRows");
const totalUsers = document.getElementById("totalUsers");
const todayUsers = document.getElementById("todayUsers");
const weekUsers = document.getElementById("weekUsers");
const userStats = document.getElementById("userStats");
const userChartCard = document.getElementById("userChartCard");
const tableTitle = document.getElementById("tableTitle");
const rowCount = document.getElementById("rowCount");
const dataHead = document.getElementById("dataHead");
const dataBody = document.getElementById("dataBody");
const tableSearch = document.getElementById("tableSearch");

// 상태
let databaseChart = null;
let userGrowthChart = null;
let currentTable = null;
let currentColumns = [];
let currentData = [];

// API 요청
async function fetchJson(url, options = {}) {
    const response = await fetch(url, options);
    const result = await response.json();

    if (!response.ok || !result.success) {
        throw new Error(result.message || "API 요청에 실패했습니다.");
    }

    return result;
}

// 테이블 목록
async function loadTables() {
    try {
        const result = await fetchJson("/api/database/tables");

        databaseName.textContent = result.database;
        tableList.innerHTML = "";

        result.tables.forEach(table => {
            const item = document.createElement("div");
            item.className = "table-item";
            item.textContent = table;

            item.addEventListener("click", () => {
                clearActiveMenu();
                dashboardMenu.classList.remove("active");
                item.classList.add("active");
                loadTableData(table);
            });

            tableList.appendChild(item);
        });
    } catch (error) {
        console.error("TABLE 목록 오류:", error);
    }
}

function clearActiveMenu() {
    document.querySelectorAll(".table-item").forEach(item => {
        item.classList.remove("active");
    });
}

// 대시보드
async function loadDashboard() {
    await Promise.all([
        loadDatabaseStats(),
        loadUserStats()
    ]);
}

async function loadDatabaseStats() {
    try {
        const result = await fetchJson("/api/dashboard/stats");

        statDatabase.textContent = result.database;
        statTables.textContent = result.tableCount;
        statRows.textContent = result.totalRows.toLocaleString();

        createDatabaseChart(
            result.tables.map(item => item.table),
            result.tables.map(item => item.count)
        );
    } catch (error) {
        console.error("DB Dashboard 오류:", error);
    }
}

async function loadUserStats() {
    try {
        const response = await fetch("/api/dashboard/users");
        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.message || "회원 통계 조회 실패");
        }

        if (!result.available) {
            userStats.classList.add("hidden");
            userChartCard.classList.add("hidden");
            return;
        }

        userStats.classList.remove("hidden");
        userChartCard.classList.remove("hidden");

        totalUsers.textContent = result.totalUsers.toLocaleString();
        todayUsers.textContent = result.todayUsers.toLocaleString();
        weekUsers.textContent = result.weekUsers.toLocaleString();

        const growth = createSevenDayData(result.growth);
        createUserGrowthChart(growth.labels, growth.counts);
    } catch (error) {
        console.error("USER Dashboard 오류:", error);
    }
}

// 최근 7일 데이터
function createSevenDayData(serverData) {
    const labels = [];
    const counts = [];
    const dataMap = new Map(
        serverData.map(item => [item.date, Number(item.count)])
    );

    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setHours(0, 0, 0, 0);
        date.setDate(date.getDate() - i);

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const key = `${year}-${month}-${day}`;

        labels.push(`${month}/${day}`);
        counts.push(dataMap.get(key) || 0);
    }

    return { labels, counts };
}

// 가입자 그래프
function createUserGrowthChart(labels, counts) {
    const canvas = document.getElementById("userGrowthChart");
    if (!canvas) return;

    if (userGrowthChart) userGrowthChart.destroy();

    userGrowthChart = new Chart(canvas, {
        type: "line",
        data: {
            labels,
            datasets: [{
                label: "New Users",
                data: counts,
                borderWidth: 2,
                tension: 0.3,
                fill: false,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            }
        }
    });
}

// DB 그래프
function createDatabaseChart(labels, counts) {
    const canvas = document.getElementById("databaseChart");
    if (!canvas) return;

    if (databaseChart) databaseChart.destroy();

    databaseChart = new Chart(canvas, {
        type: "bar",
        data: {
            labels,
            datasets: [{
                label: "Rows",
                data: counts,
                borderWidth: 1,
                borderRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            }
        }
    });
}

function showDashboard() {
    currentTable = null;
    currentColumns = [];
    currentData = [];

    tableView.classList.add("hidden");
    dashboard.classList.remove("hidden");

    pageTitle.textContent = "Dashboard";
    tableSearch.value = "";

    clearActiveMenu();
    dashboardMenu.classList.add("active");

    loadDashboard();
}

// 테이블 조회
async function loadTableData(table) {
    try {
        const result = await fetchJson(
            `/api/database/tables/${encodeURIComponent(table)}`
        );

        currentTable = table;
        currentColumns = result.columns;
        currentData = result.data;

        dashboard.classList.add("hidden");
        tableView.classList.remove("hidden");

        pageTitle.textContent = result.table;
        tableTitle.textContent = result.table;
        rowCount.textContent = `${result.rowCount} rows`;
        tableSearch.value = "";

        createTable(currentColumns, currentData);
    } catch (error) {
        console.error("TABLE 오류:", error);
        alert(error.message);
    }
}

// 테이블 생성
function createTable(columns, data) {
    dataHead.innerHTML = "";
    dataBody.innerHTML = "";

    const primaryColumns = columns.filter(column => column.Key === "PRI");
    const primaryColumn = primaryColumns.length === 1 ? primaryColumns[0] : null;

    const headerRow = document.createElement("tr");

    columns.forEach(column => {
        const th = document.createElement("th");
        th.textContent = column.Field;
        headerRow.appendChild(th);
    });

    const actionHeader = document.createElement("th");
    actionHeader.textContent = "ACTION";
    headerRow.appendChild(actionHeader);
    dataHead.appendChild(headerRow);

    if (data.length === 0) {
        const tr = document.createElement("tr");
        const td = document.createElement("td");

        td.colSpan = columns.length + 1;
        td.textContent = "데이터가 없습니다.";
        td.className = "empty-data";

        tr.appendChild(td);
        dataBody.appendChild(tr);
        return;
    }

    data.forEach(row => {
        const tr = document.createElement("tr");

        columns.forEach(column => {
            const td = document.createElement("td");
            let value = row[column.Field];

            if (isSensitiveColumn(column.Field)) {
                value = "••••••••";
            } else if (value === null) {
                value = "NULL";
            } else if (isDateValue(value)) {
                value = formatDate(value);
            } else if (typeof value === "object") {
                value = JSON.stringify(value);
            }

            td.textContent = value ?? "";
            tr.appendChild(td);
        });

        const actionTd = document.createElement("td");

        if (primaryColumn) {
            const button = document.createElement("button");
            button.className = "delete-btn";
            button.textContent = "Delete";

            button.addEventListener("click", () => {
                deleteRow(currentTable, row[primaryColumn.Field]);
            });

            actionTd.appendChild(button);
        } else {
            actionTd.textContent = "-";
        }

        tr.appendChild(actionTd);
        dataBody.appendChild(tr);
    });
}

// 민감정보 확인
function isSensitiveColumn(columnName) {
    return /password|passwd|secret|token|api[_-]?key/i.test(columnName);
}

// 날짜 처리
function isDateValue(value) {
    return typeof value === "string" &&
        /^\d{4}-\d{2}-\d{2}T/.test(value);
}

function formatDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
    }).format(date);
}

// 삭제
async function deleteRow(table, id) {
    const check = confirm(
        `${table} 테이블의 데이터를 삭제하시겠습니까?\n\nPrimary Key : ${id}`
    );

    if (!check) return;

    try {
        await fetchJson(
            `/api/database/tables/${encodeURIComponent(table)}/${encodeURIComponent(id)}`,
            { method: "DELETE" }
        );

        alert("데이터가 삭제되었습니다.");
        await loadTableData(table);
    } catch (error) {
        console.error("DELETE 오류:", error);
        alert(error.message);
    }
}

// 검색
function searchTable() {
    const keyword = tableSearch.value.trim().toLowerCase();

    if (!keyword) {
        createTable(currentColumns, currentData);
        return;
    }

    const filtered = currentData.filter(row => {
        return currentColumns.some(column => {
            if (isSensitiveColumn(column.Field)) return false;

            const value = row[column.Field];
            if (value === null || value === undefined) return false;

            return String(value).toLowerCase().includes(keyword);
        });
    });

    createTable(currentColumns, filtered);
}

// 이벤트
dashboardMenu.addEventListener("click", showDashboard);
tableSearch.addEventListener("input", searchTable);

async function init() {
    await loadTables();
    showDashboard();
}

init();