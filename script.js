const ACCOUNT_SPREADSHEET_ID = '1Od2KFQtsHvsXlA3ACP5TCe4QO0EvrE95g7bd9g3SA4Q';
const ACCOUNT_API_URL = `https://docs.google.com/spreadsheets/d/${ACCOUNT_SPREADSHEET_ID}/gviz/tq?tqx=out:json`;

const QUESTIONS_SPREADSHEET_ID = '1EmLHs1hDz7ECYz8GwHmY9tiHh-Vh4MiWHCx7UgHCASQ';
const QUESTIONS_API_URL = `https://docs.google.com/spreadsheets/d/${QUESTIONS_SPREADSHEET_ID}/gviz/tq?tqx=out:json`;

let authenticated = false;

// アカウント認証処理
function authenticateUser() {
    const accountId = document.getElementById('account-id').value.trim();

    fetch(ACCOUNT_API_URL)
        .then(response => response.text())
        .then(text => {
            const json = JSON.parse(text.substring(47).slice(0, -2));
            const rows = json.table.rows;

            let isAuthenticated = false;

            for (const row of rows) {
                const storedAccountId = row.c[0].v;
                const validUntilString = row.c[1].v;

                // 「YYYY/MM/DD」形式の日付文字列を正確にパース
                const [year, month, day] = validUntilString.split('/');
                const validUntil = new Date(year, month - 1, day);  // 月は0から始まる

                // 現在の日付の時刻をクリアして比較
                const today = new Date();
                today.setHours(0, 0, 0, 0);  // 現在の日付を00:00にリセット
                validUntil.setHours(0, 0, 0, 0);  // 有効期限も00:00にリセット
console.log("今日の日付:", today);
console.log("有効期限:", validUntil);
                if (storedAccountId === accountId) {
                    if (today <= validUntil) {
                        isAuthenticated = true;
                        window.location.href = 'quiz.html';
                        return;
                    } else {
                        document.getElementById('error-message').textContent = "アカウントの有効期限が切れています。";
                        return;
                    }
                }
            }

            if (!isAuthenticated) {
                document.getElementById('error-message').textContent = "アカウントIDが無効です。";
            }
        })
        .catch(error => {
            console.error("認証エラー:", error);
            document.getElementById('error-message').textContent = "認証中にエラーが発生しました。";
        });
}

// 問題の読み込みと試験開始
function fetchQuestionsAndStartExam() {
    fetch(QUESTIONS_API_URL)
        .then(response => response.text())
        .then(text => {
            const json = JSON.parse(text.substring(47).slice(0, -2));
            const rows = json.table.rows;
            const questions = rows.map(row => ({
                question: row.c[0].v,
                options: [row.c[1].v, row.c[2].v, row.c[3].v],
                correct: row.c[4].v,
                explanation: row.c[5].v
            }));

            startExam(questions);
        });
}

// 試験のロジックと結果表示はここに続きます。
