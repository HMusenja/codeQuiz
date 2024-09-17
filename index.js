import inquirer from 'inquirer';
import fs from 'fs';
import chalk from 'chalk';

let totalScore = 0;  // Cumulative score across sessions
let highestScore = 0;  // Keeps track of the highest score achieved in a single session

// Load questions from JSON
const questionsData = JSON.parse(fs.readFileSync('questions.json', 'utf8'));

// Introduction to the quiz
function intro() {
    console.log(chalk.bold.blue("\nWelcome to the codeQuiz Game!"));
    console.log(chalk.yellow("Test your knowledge in JavaScript, HTML, and CSS."));
    console.log("You'll be asked to choose a category and difficulty level, and then answer a set number of questions.\n");
    console.log("Earn points based on the difficulty level:");
    console.log(chalk.green("Easy: 2 points/question"));
    console.log(chalk.yellow("Medium: 3 points/question"));
    console.log(chalk.red("Hard: 5 points/question"));
    console.log(chalk.cyan("\nTry to get the highest score and track your progress as you play!\n"));
}

// Ask player for their name
async function askName() {
    const answers = await inquirer.prompt([
        {
            type: 'input',
            name: 'name',
            message: 'Enter your name:'
        }
    ]);
    return answers.name;
}

// Ask for quiz category
async function chooseCategory() {
    const answers = await inquirer.prompt([
        {
            type: 'list',
            name: 'category',
            message: 'Choose a category (or "Mixed" for all):',
            choices: ['JavaScript', 'HTML', 'CSS', 'Mixed']
        }
    ]);
    return answers.category;
}

// Ask for difficulty level
async function chooseDifficulty() {
    const answers = await inquirer.prompt([
        {
            type: 'list',
            name: 'difficulty',
            message: 'Choose difficulty (Easy, Medium, Hard):',
            choices: ['Easy', 'Medium', 'Hard']
        }
    ]);
    return answers.difficulty;
}

// Ask for the number of questions
async function chooseNumQuestions() {
    const answers = await inquirer.prompt([
        {
            type: 'list',
            name: 'numQuestions',
            message: 'How many questions do you want to answer?',
            choices: [5, 10, 15]
        }
    ]);
    return answers.numQuestions;
}

// Shuffle array (used for shuffling both questions and answers)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// Filter questions based on category and difficulty
function filterQuestions(category, difficulty) {
    let allQuestions = [];
    
    if (category === 'Mixed') {
        const categories = ['JavaScript', 'HTML', 'CSS'];
        for (let cat of categories) {
            allQuestions = allQuestions.concat(questionsData[cat][difficulty]);
        }
    } else {
        allQuestions = questionsData[category][difficulty];
    }

    shuffleArray(allQuestions);
    return allQuestions;
}

// Calculate score based on difficulty
function calculateScore(difficulty, isCorrect) {
    let points = 0;
    switch (difficulty) {
        case 'Easy':
            points = 2;
            break;
        case 'Medium':
            points = 3;
            break;
        case 'Hard':
            points = 5;
            break;
    }
    return isCorrect ? points : 0;
}

// Ask each question and evaluate the answer
async function askQuestion(question, difficulty) {
    // Create a copy of the answer choices and shuffle them
    const shuffledChoices = [...question.choices];
    shuffleArray(shuffledChoices); // Shuffle the answer choices

    const answers = await inquirer.prompt([
        {
            type: 'list',
            name: 'userAnswer',
            message: question.question,
            choices: shuffledChoices
        }
    ]);

    const isCorrect = answers.userAnswer === question.answer;
    const pointsEarned = calculateScore(difficulty, isCorrect);

    if (isCorrect) {
        console.log(chalk.green('Correct!'));
    } else {
        console.log(chalk.red('Incorrect!'));
        console.log(chalk.blue(`The correct answer was: ${question.answer}`));
    }

    console.log(chalk.blue(`Explanation: ${question.explanation}\n`));

    return pointsEarned;
}

// Display scorecard at the end of the quiz
function displayScorecard(name, correctAnswers, incorrectAnswers, currentScore) {
    console.log(chalk.bold(`\nScorecard for ${name}:`));
    console.log(chalk.green(`Correct Answers: ${correctAnswers}`));
    console.log(chalk.red(`Incorrect Answers: ${incorrectAnswers}`));

    if (currentScore > highestScore) {
        highestScore = currentScore;
    }

    console.log(chalk.blue(`Score this round: ${currentScore} points`));
    console.log(chalk.magenta(`Total Score: ${totalScore} points`));
    console.log(chalk.yellow(`Highest Score: ${highestScore} points\n`));
}

// Prompt user for next action (retake, next level, or exit)
async function promptNextAction(currentDifficulty) {
    const answers = await inquirer.prompt([
        {
            type: 'list',
            name: 'nextAction',
            message: 'What would you like to do next?',
            choices: ['Retake the quiz', 'Go to next level', 'Exit']
        }
    ]);

    if (answers.nextAction === 'Retake the quiz') {
        console.log(chalk.blueBright('Retaking the quiz...'));
        await startQuiz(currentDifficulty); // Retake the quiz
    } else if (answers.nextAction === 'Go to next level') {
        const nextDifficulty = getNextDifficulty(currentDifficulty);
        if (nextDifficulty) {
            console.log(chalk.blueBright(`Proceeding to ${nextDifficulty} level...`));
            await startQuiz(nextDifficulty); // Start new game with next difficulty
        } else {
            console.log(chalk.blueBright('No higher difficulty levels available. Thank you for playing!'));
        }
    } else {
        console.log(chalk.yellowBright('Thank you for playing! Exiting now...'));
        process.exit(0); // Exit the game
    }
}

// Get the next difficulty level
function getNextDifficulty(currentDifficulty) {
    const difficulties = ['Easy', 'Medium', 'Hard'];
    const currentIndex = difficulties.indexOf(currentDifficulty);
    return currentIndex < difficulties.length - 1 ? difficulties[currentIndex + 1] : null;
}

// Start the quiz
async function startQuiz(difficultyOverride) {
    intro();

    const name = await askName();
    const category = await chooseCategory();
    const difficulty = difficultyOverride || await chooseDifficulty();
    const numQuestions = await chooseNumQuestions();

    let filteredQuestions = filterQuestions(category, difficulty);
    let correctAnswers = 0;
    let incorrectAnswers = 0;
    let currentScore = 0;

    // Ask the filtered questions
    for (let i = 0; i < numQuestions && i < filteredQuestions.length; i++) {
        const pointsEarned = await askQuestion(filteredQuestions[i], difficulty);
        if (pointsEarned > 0) {
            correctAnswers++;
        } else {
            incorrectAnswers++;
        }
        currentScore += pointsEarned;
    }

    // Update total score and display scorecard
    totalScore += currentScore;
    displayScorecard(name, correctAnswers, incorrectAnswers, currentScore);

    // Prompt user for the next action
    await promptNextAction(difficulty);
}

// Run the quiz
startQuiz();

