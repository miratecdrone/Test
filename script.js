const API_KEY = 'AIzaSyANi0LVaqaX_xNBfMQqsZ-YPuAf25b1IRU';  // Google Cloud Consoleから取得
const SPREADSHEET_ID = '1EmLHs1hDz7ECYz8GwHmY9tiHh-Vh4MiWHCx7UgHCASQ';  // スプレッドシートのID
const RANGE = 'シート1!A1:E100';  // 100問まで取得可能

let questions = [];
let currentQuestionIndex = 0;
let answeredQuestions = new Set();
let incorrectQuestions = [];
let startTime, timerInterval, selectedCourse = 0;


// Google Sheets APIの初期化
document.addEventListener('DOMContentLoaded', () => {
    gapi.load('client', initializeGAPI);
});

function initializeGAPI() {
    gapi.client.init({
        apiKey: API_KEY,
        discoveryDocs: ["https://sheets.googleapis.com/$discovery/rest?version=v4"]
    }).then(() => {
        console.log("Google Sheets APIが初期化されました");
    }).catch(error => {
        console.error("Google Sheets APIの初期化に失敗しました:", error);
    });
}


// Google Sheets APIからデータを取得
function fetchQuestions() {
    return gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: RANGE
    }).then(response => {
        return response.result.values.map(row => ({
            question: row[0],
            options: [row[1], row[2], row[3], row[4]],
            correct: row[5],
            explanation: row[6]
        }));
    }).catch(error => {
        console.error("スプレッドシートからデータを取得できませんでした:", error);
    });
}

// コース開始
function startCourse(numQuestions, timeLimit) {
    document.getElementById('course-selection').style.display = 'none';
    document.getElementById('quiz-area').style.display = 'block';

    fetchQuestions().then(data => {
        questions = shuffle(data).slice(0, numQuestions);
        renderQuestion(currentQuestionIndex);
        startTimer(timeLimit);
    });
}

// タイマー開始
function startTimer(minutes) {
    const timeLeftElement = document.getElementById('time-left');
    const endTime = Date.now() + minutes * 60000;
    timerInterval = setInterval(() => {
        const remainingTime = Math.max(0, endTime - Date.now());
        const minutesLeft = Math.floor(remainingTime / 60000);
        const secondsLeft = Math.floor((remainingTime % 60000) / 1000);
        timeLeftElement.textContent = `${minutesLeft}分 ${secondsLeft}秒`;
        if (remainingTime <= 0) {
            clearInterval(timerInterval);
            showResults();
        }
    }, 1000);
}

// 問題をシャッフル
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// 問題のレンダリング
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

// 解答処理
function handleAnswer(index, selectedOption) {
    const questionData = questions[index];
    if (questionData.options[selectedOption] !== questionData.correct) {
        incorrectQuestions.push({
            question: questionData.question,
            selected: questionData.options[selectedOption],
            correct: questionData.correct,
            explanation: questionData.explanation
        });
    }
    answeredQuestions.add(index);
    nextQuestion();
}

// 次の問題へ
function nextQuestion() {
    currentQuestionIndex++;
    if (currentQuestionIndex >= questions.length) {
        showResults();
    } else {
        renderQuestion(currentQuestionIndex);
    }
}

// 結果表示
function showResults() {
    clearInterval(timerInterval);
    document.getElementById('quiz-area').style.display = 'none';
    document.getElementById('result-area').style.display = 'block';

    const score = answeredQuestions.size - incorrectQuestions.length;
    document.getElementById('score').textContent = score;

    const incorrectList = document.getElementById('incorrect-answers');
    incorrectList.innerHTML = '';
    incorrectQuestions.forEach(q => {
        const li = document.createElement('li');
        li.innerHTML = `<strong>問題:</strong> ${q.question} <br> <strong>選択した答え:</strong> ${q.selected} <br> <strong>正解:</strong> ${q.correct} <br> <strong>解説:</strong> ${q.explanation}`;
        incorrectList.appendChild(li);
    });
}

// 過去の結果保存
function saveResult() {
    const pastResults = JSON.parse(localStorage.getItem('pastResults')) || [];
    pastResults.push({
        course: selectedCourse,
        score: answeredQuestions.size - incorrectQuestions.length,
        incorrect: incorrectQuestions
    });
    localStorage.setItem('pastResults', JSON.stringify(pastResults));
    alert('結果が保存されました');
}

// 過去の結果を表示
function showPastResults() {
    const pastResults = JSON.parse(localStorage.getItem('pastResults')) || [];
    document.getElementById('course-selection').style.display = 'none';
    document.getElementById('result-area').style.display = 'none';
    document.getElementById('past-results-area').style.display = 'block';

    const resultsList = document.getElementById('past-results-list');
    resultsList.innerHTML = pastResults.map(result => `
        <li>
            <strong>コース:</strong> ${result.course}問<br>
            <strong>点数:</strong> ${result.score}<br>
            <strong>間違えた問題:</strong>
            <ul>
                ${result.incorrect.map(q => `
                    <li>${q.question} - 正解: ${q.correct}</li>
                `).join('')}
            </ul>
        </li>
    `).join('');
}

function goToTop() {
    document.getElementById('course-selection').style.display = 'block';
    document.getElementById('quiz-area').style.display = 'none';
    document.getElementById('result-area').style.display = 'none';
    document.getElementById('past-results-area').style.display = 'none';
    location.reload();  // 状態をリセットするためページをリロード
}

