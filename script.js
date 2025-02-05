const ACCOUNT_SPREADSHEET_ID = '1Od2KFQtsHvsXlA3ACP5TCe4QO0EvrE95g7bd9g3SA4Q';
const ACCOUNT_API_URL = `https://docs.google.com/spreadsheets/d/${ACCOUNT_SPREADSHEET_ID}/gviz/tq?tqx=out:json`;

const QUESTIONS_SPREADSHEET_ID = '1EmLHs1hDz7ECYz8GwHmY9tiHh-Vh4MiWHCx7UgHCASQ';
const QUESTIONS_API_URL = `https://docs.google.com/spreadsheets/d/${QUESTIONS_SPREADSHEET_ID}/gviz/tq?tqx=out:json`;

let questions = [];
let currentQuestionIndex = 0;
let timerInterval;
let score = 0;
let answeredQuestions = new Set();
let incorrectQuestions = [];

// アカウント認証
function authenticateUser() {
    const accountId = document.getElementById('account-id').value.trim();

    fetch(ACCOUNT_API_URL)
        .then(response => response.text())
        .then(text => {
            const json = JSON.parse(text.substring(47).slice(0, -2));
            const rows = json.table.rows;

            for (const row of rows) {
                const storedAccountId = row.c[0].v;
                const validUntilString = row.c[1].v;

                if (validUntilString.match(/^\d{4}\/\d{2}\/\d{2}$/)) {
                    const [year, month, day] = validUntilString.split('/').map(num => parseInt(num, 10));
                    const validUntil = new Date(year, month - 1, day);

                    // 今日の日付をリセットして比較
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    validUntil.setHours(0, 0, 0, 0);

                    if (storedAccountId === accountId) {
                        if (today <= validUntil) {
                            window.location.href = 'quiz.html';
                            return;
                        } else {
                            document.getElementById('error-message').textContent = "アカウントの有効期限が切れています。";
                            return;
                        }
                    }
                }
            }

            document.getElementById('error-message').textContent = "アカウントIDが無効です。";
        })
        .catch(error => {
            console.error("認証エラー:", error);
            document.getElementById('error-message').textContent = "認証中にエラーが発生しました。";
        });
}

// 試験問題の取得
function fetchQuestions() {
    return fetch(QUESTIONS_API_URL)
        .then(response => response.text())
        .then(text => {
            const json = JSON.parse(text.substring(47).slice(0, -2));
            const rows = json.table.rows;

            return rows.map(row => ({
                question: row.c[0].v,
                options: [row.c[1].v, row.c[2].v, row.c[3].v],
                correct: row.c[4].v,
                explanation: row.c[5].v
            }));
        });
}

// 試験の開始
function startCourse(numQuestions, timeLimit) {
    document.getElementById('course-selection').style.display = 'none';
    document.getElementById('quiz-area').style.display = 'block';

    fetchQuestions().then(data => {
        questions = shuffle(data).slice(0, numQuestions);
        renderQuestion(0);
        startTimer(timeLimit);
    });
}

// タイマーの開始
function startTimer(minutes) {
    const endTime = Date.now() + minutes * 60000;

    timerInterval = setInterval(() => {
        const remainingTime = endTime - Date.now();
        const minutesLeft = Math.floor(remainingTime / 60000);
        const secondsLeft = Math.floor((remainingTime % 60000) / 1000);
        document.getElementById('time-left').textContent = `${minutesLeft}分 ${secondsLeft}秒`;

        if (remainingTime <= 0) {
            clearInterval(timerInterval);
            showResults();
        }
    }, 1000);
}

// 問題のシャッフル
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// 問題の表示
function renderQuestion(index) {
    currentQuestionIndex = index;
    const questionData = questions[index];

    document.getElementById('question-text').textContent = questionData.question;

    const answerList = document.getElementById('answer-list');
    answerList.innerHTML = '';
    questionData.options.forEach((option, i) => {
        const li = document.createElement('li');
        li.textContent = option;
        li.onclick = () => handleAnswer(index, option, li);
        answerList.appendChild(li);
    });
}

// 解答の処理
function handleAnswer(questionIndex, selectedOption, liElement) {
    const questionData = questions[questionIndex];

    if (answeredQuestions.has(questionIndex)) return;  // 二重回答防止

    answeredQuestions.add(questionIndex);
    if (selectedOption === questionData.correct) {
        score++;
        liElement.style.backgroundColor = '#4caf50';  // 正解の場合の色
    } else {
        incorrectQuestions.push(questionData);
        liElement.style.backgroundColor = '#f44336';  // 不正解の場合の色
    }

    // 自動的に次の問題へ進む
    if (currentQuestionIndex + 1 < questions.length) {
        setTimeout(() => renderQuestion(currentQuestionIndex + 1), 1000);
    } else {
        setTimeout(showResults, 1000);
    }
}

// 結果の表示
function showResults() {
    clearInterval(timerInterval);
    document.getElementById('quiz-area').style.display = 'none';
    document.getElementById('result-area').style.display = 'block';

    document.getElementById('score').textContent = `${score} / ${questions.length}`;
    const incorrectList = document.getElementById('incorrect-answers');
    incorrectList.innerHTML = '';

    incorrectQuestions.forEach(question => {
        const li = document.createElement('li');
        li.textContent = `${question.question} - 正解: ${question.correct} - 解説: ${question.explanation}`;
        incorrectList.appendChild(li);
    });

    saveResult(score, questions.length);
}

// 結果をローカルストレージに保存
function saveResult(score, total) {
    const results = JSON.parse(localStorage.getItem('examResults')) || [];
    const resultEntry = {
        date: new Date().toLocaleString(),
        score: `${score} / ${total}`
    };

    results.push(resultEntry);
    localStorage.setItem('examResults', JSON.stringify(results));
}

// 過去の結果を表示
function showPastResults() {
    document.getElementById('course-selection').style.display = 'none';
    document.getElementById('past-results-area').style.display = 'block';

    const results = JSON.parse(localStorage.getItem('examResults')) || [];
    const resultsList = document.getElementById('past-results-list');
    resultsList.innerHTML = '';

    results.forEach(result => {
        const li = document.createElement('li');
        li.textContent = `${result.date} - 点数: ${result.score}`;
        resultsList.appendChild(li);
    });
}
