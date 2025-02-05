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
                const [year, month, day] = validUntilString.split('/').map(num => parseInt(num, 10));
                const validUntil = new Date(year, month - 1, day);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                if (storedAccountId === accountId && today <= validUntil) {
                    window.location.href = 'quiz.html';
                    return;
                }
            }
            document.getElementById('error-message').textContent = "アカウントIDが無効か、期限切れです。";
        });
}

// 試験問題の取得
function fetchQuestions() {
    return fetch(QUESTIONS_API_URL)
        .then(response => response.text())
        .then(text => {
            const json = JSON.parse(text.substring(47).slice(0, -2));
            return json.table.rows.map(row => ({
                question: row.c[0].v,
                options: [row.c[1].v, row.c[2].v, row.c[3].v],
                correct: row.c[4].v,
                explanation: row.c[5].v
            }));
        });
}

// コース選択による試験開始
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
    if (answeredQuestions.has(questionIndex)) return;  
    answeredQuestions.add(questionIndex);
    const questionData = questions[questionIndex];
    if (selectedOption === questionData.correct) {
        score++;
        liElement.style.backgroundColor = '#4caf50'; 
    } else {
        incorrectQuestions.push(questionData);
        liElement.style.backgroundColor = '#f44336';  
    }
    setTimeout(() => {
        if (currentQuestionIndex + 1 < questions.length) {
            renderQuestion(currentQuestionIndex + 1);
        } else {
            showResults();
        }
    }, 1000);
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
}

// TOPに戻る
function goToTop() {
    clearInterval(timerInterval);
    document.getElementById('quiz-area').style.display = 'none';
    document.getElementById('result-area').style.display = 'none';
    document.getElementById('course-selection').style.display = 'block';
}
