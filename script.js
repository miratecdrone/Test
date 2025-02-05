const SPREADSHEET_ID = '1EmLHs1hDz7ECYz8GwHmY9tiHh-Vh4MiWHCx7UgHCASQ';
const API_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:json`;

let questions = [];
let currentQuestionIndex = 0;
let answeredQuestions = new Set();
let incorrectQuestions = [];
let timerInterval;

// データ取得
function fetchQuestions() {
    fetch(API_URL)
        .then(response => response.text())
        .then(text => {
            const json = JSON.parse(text.substring(47).slice(0, -2));
            const rows = json.table.rows;

            questions = rows.map(row => ({
                question: row.c[0].v,
                options: [row.c[1].v, row.c[2].v, row.c[3].v, row.c[4].v],
                correct: row.c[5].v,
                explanation: row.c[6].v
            }));

            renderQuestion(0);
        });
}

// コース開始
function startCourse(numQuestions, timeLimit) {
    document.getElementById('course-selection').style.display = 'none';
    document.getElementById('quiz-area').style.display = 'block';

    shuffle(questions).slice(0, numQuestions);
    renderQuestion(0);
    startTimer(timeLimit);
}

// タイマー開始
function startTimer(minutes) {
    const endTime = Date.now() + minutes * 60000;
    timerInterval = setInterval(() => {
        const remainingTime = Math.max(0, endTime - Date.now());
        const minutesLeft = Math.floor(remainingTime / 60000);
        const secondsLeft = Math.floor((remainingTime % 60000) / 1000);
        document.getElementById('time-left').textContent = `${minutesLeft}分 ${secondsLeft}秒`;

        if (remainingTime <= 0) {
            clearInterval(timerInterval);
            showResults();
        }
    }, 1000);
}

// 問題レンダリング
function renderQuestion(index) {
    const questionData = questions[index];
    document.getElementById('question-text').textContent = questionData.question;
    const answerList = document.getElementById('answer-list');
    answerList.innerHTML = '';

    questionData.options.forEach((option, i) => {
        const li = document.createElement('li');
        li.textContent = option;
        li.onclick = () => handleAnswer(index, i);
        answerList.appendChild(li);
    });
}

// 結果表示、保存、過去の実績表示の関数は同様です
