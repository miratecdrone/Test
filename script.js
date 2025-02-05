let questions = [];
let currentQuestionIndex = 0;
let timerInterval;
let score = 0;
let answeredQuestions = {};
let incorrectQuestions = [];

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

// 試験開始
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

    document.getElementById('current-question-number').textContent = `${index + 1}問目`;
    document.getElementById('question-text').textContent = questionData.question;

    const answerList = document.getElementById('answer-list');
    answerList.innerHTML = '';

    questionData.options.forEach((option, i) => {
        const li = document.createElement('li');
        li.textContent = option;
        li.onclick = () => handleAnswer(index, option, li);
        if (answeredQuestions[index] === option) {
            li.style.backgroundColor = '#4caf50';  // 選択済みの色
        }
        answerList.appendChild(li);
    });

    renderNavButtons();
}

// 解答の処理
function handleAnswer(questionIndex, selectedOption, liElement) {
    answeredQuestions[questionIndex] = selectedOption;

    const questionData = questions[questionIndex];
    document.querySelectorAll('#answer-list li').forEach(li => li.style.backgroundColor = '');

    if (selectedOption === questionData.correct) {
        liElement.style.backgroundColor = '#4caf50';  // 正解の色
    } else {
        liElement.style.backgroundColor = '#f44336';  // 不正解の色
    }
}

// 前の問題へ戻る
function prevQuestion() {
    if (currentQuestionIndex > 0) {
        renderQuestion(currentQuestionIndex - 1);
    }
}

// 次の問題へ進む
function nextQuestion() {
    if (currentQuestionIndex + 1 < questions.length) {
        renderQuestion(currentQuestionIndex + 1);
    }
}

// ナビゲーションボタンの表示
function renderNavButtons() {
    const navButtons = document.getElementById('nav-buttons');
    navButtons.innerHTML = '';

    questions.forEach((_, i) => {
        const button = document.createElement('button');
        button.textContent = i + 1;
        button.classList.add(answeredQuestions[i] ? 'answered' : 'unanswered');
        button.onclick = () => renderQuestion(i);
        navButtons.appendChild(button);
    });
}

// 結果の表示
function showResults() {
    clearInterval(timerInterval);
    document.getElementById('quiz-area').style.display = 'none';
    document.getElementById('result-area').style.display = 'block';

    score = Object.keys(answeredQuestions).filter(i => {
        return answeredQuestions[i] === questions[i].correct;
    }).length;

    document.getElementById('score').textContent = `${score} / ${questions.length}`;
    const incorrectList = document.getElementById('incorrect-answers');
    incorrectList.innerHTML = '';

    questions.forEach((question, i) => {
        if (answeredQuestions[i] !== question.correct) {
            const li = document.createElement('li');
            li.textContent = `${question.question} - 正解: ${question.correct} - 解説: ${question.explanation}`;
            incorrectList.appendChild(li);
        }
    });
}

// TOPに戻る
function goToTop() {
    clearInterval(timerInterval);
    document.getElementById('quiz-area').style.display = 'none';
    document.getElementById('result-area').style.display = 'none';
    document.getElementById('course-selection').style.display = 'block';
}
