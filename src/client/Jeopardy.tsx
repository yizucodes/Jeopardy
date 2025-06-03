import React, { useState } from 'react';

// Audio context for sound effects
const audioContext = typeof window !== 'undefined' ? new (window.AudioContext || (window as any).webkitAudioContext)() : null;

const playSound = (frequency: number, duration: number, type: 'sine' | 'square' | 'triangle' = 'sine') => {
  if (!audioContext) return;
  
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.frequency.value = frequency;
  oscillator.type = type;
  
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + duration);
};

// Sound effects
const sounds = {
  correct: () => {
    // Happy ascending notes
    playSound(523, 0.2); // C5
    setTimeout(() => playSound(659, 0.2), 100); // E5
    setTimeout(() => playSound(784, 0.3), 200); // G5
  },
  wrong: () => {
    // Descending "sad" sound
    playSound(392, 0.4, 'triangle'); // G4
    setTimeout(() => playSound(349, 0.6, 'triangle'), 200); // F4
  },
  select: () => {
    // Quick "blip" sound
    playSound(800, 0.1, 'square');
  },
  gameComplete: () => {
    // Victory fanfare
    const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
    notes.forEach((note, i) => {
      setTimeout(() => playSound(note, 0.3), i * 150);
    });
  }
};

interface Question {
  clue: string;
  answers: [string, string, string];
  correct: number;
  value: number;
}

interface GameState {
  score: number;
  completedQuestions: Set<string>;
  currentQuestion: string | null;
  gameComplete: boolean;
  showingResult: boolean;
  lastAnswerCorrect: boolean | null;
  selectedAnswerIndex: number | null;
}

// 25 hardcoded questions across 5 categories
const questions: Record<string, Question> = {
  // INTERNET CATEGORY
  "INTERNET_200": {
    clue: "This orange alien is Reddit's mascot",
    answers: ["Snoo", "Karma", "Upvote"],
    correct: 0,
    value: 200
  },
  "INTERNET_400": {
    clue: "This video sharing site was bought by Google in 2006",
    answers: ["TikTok", "YouTube", "Vimeo"],
    correct: 1,
    value: 400
  },
  "INTERNET_600": {
    clue: "The 'Like' button on this social network used to be called 'Awesome'",
    answers: ["Twitter", "Facebook", "Instagram"],
    correct: 1,
    value: 600
  },
  "INTERNET_800": {
    clue: "This messaging app is known for disappearing photos",
    answers: ["Snapchat", "WhatsApp", "Telegram"],
    correct: 0,
    value: 800
  },
  "INTERNET_1000": {
    clue: "This professional networking site was founded by Reid Hoffman",
    answers: ["LinkedIn", "AngelList", "Glassdoor"],
    correct: 0,
    value: 1000
  },

  // MOVIES CATEGORY
  "MOVIES_200": {
    clue: "This 2009 film about blue aliens became the highest-grossing movie",
    answers: ["Titanic", "Avatar", "Avengers"],
    correct: 1,
    value: 200
  },
  "MOVIES_400": {
    clue: "This wizard boy defeated Voldemort in the final film",
    answers: ["Harry Potter", "Ron Weasley", "Neville Longbottom"],
    correct: 0,
    value: 400
  },
  "MOVIES_600": {
    clue: "This Marvel hero is known as the 'First Avenger'",
    answers: ["Iron Man", "Thor", "Captain America"],
    correct: 2,
    value: 600
  },
  "MOVIES_800": {
    clue: "This 1994 film features Tom Hanks saying 'Life is like a box of chocolates'",
    answers: ["Forrest Gump", "Cast Away", "Big"],
    correct: 0,
    value: 800
  },
  "MOVIES_1000": {
    clue: "This director is known for films like Inception and The Dark Knight",
    answers: ["Steven Spielberg", "Christopher Nolan", "Martin Scorsese"],
    correct: 1,
    value: 1000
  },

  // SCIENCE CATEGORY
  "SCIENCE_200": {
    clue: "H2O is the chemical formula for this essential liquid",
    answers: ["Hydrogen", "Water", "Oxygen"],
    correct: 1,
    value: 200
  },
  "SCIENCE_400": {
    clue: "This planet is known as the 'Red Planet'",
    answers: ["Venus", "Mars", "Jupiter"],
    correct: 1,
    value: 400
  },
  "SCIENCE_600": {
    clue: "This scientist developed the theory of relativity",
    answers: ["Isaac Newton", "Albert Einstein", "Stephen Hawking"],
    correct: 1,
    value: 600
  },
  "SCIENCE_800": {
    clue: "This gas makes up about 78% of Earth's atmosphere",
    answers: ["Oxygen", "Nitrogen", "Carbon Dioxide"],
    correct: 1,
    value: 800
  },
  "SCIENCE_1000": {
    clue: "This is the smallest unit of matter",
    answers: ["Molecule", "Atom", "Electron"],
    correct: 1,
    value: 1000
  },

  // GEOGRAPHY CATEGORY
  "GEOGRAPHY_200": {
    clue: "This is the largest country in the world by land area",
    answers: ["China", "Russia", "Canada"],
    correct: 1,
    value: 200
  },
  "GEOGRAPHY_400": {
    clue: "This river is the longest in the world",
    answers: ["Amazon", "Nile", "Mississippi"],
    correct: 1,
    value: 400
  },
  "GEOGRAPHY_600": {
    clue: "This mountain range contains Mount Everest",
    answers: ["Himalayas", "Rockies", "Alps"],
    correct: 0,
    value: 600
  },
  "GEOGRAPHY_800": {
    clue: "This desert is the largest hot desert in the world",
    answers: ["Gobi", "Sahara", "Mojave"],
    correct: 1,
    value: 800
  },
  "GEOGRAPHY_1000": {
    clue: "This city is the capital of Australia",
    answers: ["Sydney", "Melbourne", "Canberra"],
    correct: 2,
    value: 1000
  },

  // FOOD CATEGORY
  "FOOD_200": {
    clue: "This Italian dish consists of dough topped with tomato sauce and cheese",
    answers: ["Pasta", "Pizza", "Lasagna"],
    correct: 1,
    value: 200
  },
  "FOOD_400": {
    clue: "This Japanese dish features raw fish over seasoned rice",
    answers: ["Sushi", "Ramen", "Tempura"],
    correct: 0,
    value: 400
  },
  "FOOD_600": {
    clue: "This spice is derived from the Crocus flower and is very expensive",
    answers: ["Cardamom", "Saffron", "Vanilla"],
    correct: 1,
    value: 600
  },
  "FOOD_800": {
    clue: "This French cooking technique involves cooking food slowly in its own fat",
    answers: ["Confit", "Sauté", "Braise"],
    correct: 0,
    value: 800
  },
  "FOOD_1000": {
    clue: "This cheese is traditionally used in Greek salad",
    answers: ["Mozzarella", "Feta", "Gouda"],
    correct: 1,
    value: 1000
  }
};

const categories = ["INTERNET", "MOVIES", "SCIENCE", "GEOGRAPHY", "FOOD"];
const values = [200, 400, 600, 800, 1000];

export const Jeopardy: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    completedQuestions: new Set(),
    currentQuestion: null,
    gameComplete: false,
    showingResult: false,
    lastAnswerCorrect: null,
    selectedAnswerIndex: null
  });
  const [soundEnabled, setSoundEnabled] = useState(true);

  const handleQuestionSelect = (questionId: string) => {
    if (!gameState.completedQuestions.has(questionId)) {
      if (soundEnabled) sounds.select(); // Play selection sound
      setGameState(prev => ({
        ...prev,
        currentQuestion: questionId
      }));
    }
  };

  const handleAnswer = (answerIndex: number) => {
    if (!gameState.currentQuestion || gameState.showingResult) return;

    const question = questions[gameState.currentQuestion];
    if (!question) return;
    
    const isCorrect = answerIndex === question.correct;
    
    // Play sound based on answer
    if (soundEnabled) {
      if (isCorrect) {
        sounds.correct();
      } else {
        sounds.wrong();
      }
    }
    
    // Show result modal first
    setGameState(prev => ({
      ...prev,
      showingResult: true,
      lastAnswerCorrect: isCorrect,
      selectedAnswerIndex: answerIndex
    }));
    
    // After 3 seconds, complete the question and close modal
    setTimeout(() => {
      setGameState(prev => {
        if (!prev.currentQuestion) return prev;
        
        const questionData = questions[prev.currentQuestion];
        if (!questionData) return prev;
        
        const newCompletedQuestions = new Set(prev.completedQuestions);
        newCompletedQuestions.add(prev.currentQuestion);
        
        const newScore = isCorrect 
          ? prev.score + questionData.value 
          : prev.score; // Don't subtract points for wrong answers
        
        const gameComplete = newCompletedQuestions.size === 25;
        
        // Play victory sound if game complete
        if (gameComplete && soundEnabled) {
          setTimeout(() => sounds.gameComplete(), 500);
        }
        
        return {
          score: newScore,
          completedQuestions: newCompletedQuestions,
          currentQuestion: null,
          gameComplete,
          showingResult: false,
          lastAnswerCorrect: null,
          selectedAnswerIndex: null
        };
      });
    }, 3000); // 3 second delay
  };

  const resetGame = () => {
    setGameState({
      score: 0,
      completedQuestions: new Set(),
      currentQuestion: null,
      gameComplete: false,
      showingResult: false,
      lastAnswerCorrect: null,
      selectedAnswerIndex: null
    });
  };

  const currentQuestionData = gameState.currentQuestion ? questions[gameState.currentQuestion] : null;

  if (gameState.gameComplete) {
    return (
      <div className="w-full h-screen bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-8 text-center shadow-2xl max-w-md">
          <div className="text-6xl mb-4">🏆</div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Game Complete!</h2>
          <div className="text-2xl text-blue-600 font-bold mb-6">
            Final Score: ${gameState.score.toLocaleString()}
          </div>
          <button
            onClick={resetGame}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-bold"
          >
            🎯 Play Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 p-4">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex justify-between items-center mb-4">
          <div className="w-16"></div> {/* Spacer */}
          <h1 className="text-4xl md:text-6xl font-bold text-white">
            🎯 JEOPARDY!
          </h1>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="w-16 h-16 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full flex items-center justify-center text-2xl transition-colors"
            title={soundEnabled ? "Mute sounds" : "Enable sounds"}
          >
            {soundEnabled ? '🔊' : '🔇'}
          </button>
        </div>
        <div className="text-2xl md:text-3xl text-yellow-300 font-bold">
          Score: ${gameState.score.toLocaleString()}
        </div>
      </div>

      {/* Game Board */}
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-5 gap-2 md:gap-4">
          {/* Category Headers */}
          {categories.map(category => (
            <div
              key={category}
              className="bg-blue-600 text-white p-3 md:p-4 text-center font-bold text-sm md:text-lg rounded-t-lg"
            >
              {category}
            </div>
          ))}
          
          {/* Question Cards */}
          {values.map(value => 
            categories.map(category => {
              const questionId = `${category}_${value}`;
              const isCompleted = gameState.completedQuestions.has(questionId);
              
              return (
                <button
                  key={questionId}
                  onClick={() => handleQuestionSelect(questionId)}
                  disabled={isCompleted}
                  className={`
                    h-16 md:h-20 text-xl md:text-2xl font-bold rounded-lg transition-all duration-200
                    ${isCompleted 
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                      : 'bg-blue-800 text-yellow-300 hover:bg-blue-700 hover:scale-105 cursor-pointer shadow-lg'
                    }
                  `}
                >
                  {isCompleted ? '✓' : `$${value}`}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Question/Result Modal */}
      {currentQuestionData && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 md:p-8 max-w-2xl w-full shadow-2xl">
            {!gameState.showingResult ? (
              // Normal Question View
              <>
                <div className="text-center mb-6">
                  <div className="text-2xl md:text-3xl font-bold text-blue-800 mb-4">
                    ${currentQuestionData.value}
                  </div>
                  <div className="text-lg md:text-xl text-gray-800 leading-relaxed">
                    {currentQuestionData.clue}
                  </div>
                </div>
                
                <div className="space-y-3">
                  {currentQuestionData.answers.map((answer, index) => (
                    <button
                      key={index}
                      onClick={() => handleAnswer(index)}
                      className="w-full p-4 text-left bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors border-2 border-transparent hover:border-blue-400 text-lg"
                    >
                      <span className="font-bold text-blue-600 mr-3">
                        {String.fromCharCode(65 + index)}.
                      </span>
                      {answer}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              // Result View
              <div className="text-center">
                {gameState.lastAnswerCorrect ? (
                  // Correct Answer
                  <div className="space-y-6">
                    <div className="text-8xl">✅</div>
                    <div className="text-3xl font-bold text-green-600">Correct!</div>
                    <div className="text-xl text-gray-700">
                      You earned <span className="font-bold text-green-600">${currentQuestionData.value}</span> points!
                    </div>
                    <div className="text-lg text-gray-600">
                      Your answer: <span className="font-semibold">{currentQuestionData.answers[gameState.selectedAnswerIndex!]}</span>
                    </div>
                  </div>
                ) : (
                  // Wrong Answer
                  <div className="space-y-6">
                    <div className="text-8xl">❌</div>
                    <div className="text-3xl font-bold text-red-600">Wrong!</div>
                    <div className="text-lg text-gray-700">
                      Your answer: <span className="font-semibold text-red-600">{currentQuestionData.answers[gameState.selectedAnswerIndex!]}</span>
                    </div>
                    <div className="text-lg text-gray-700">
                      Correct answer: <span className="font-semibold text-green-600">{currentQuestionData.answers[currentQuestionData.correct]}</span>
                    </div>
                    <div className="text-sm text-gray-500">No points awarded</div>
                  </div>
                )}
                
                <div className="mt-8 text-sm text-gray-500">
                  Returning to game board in a moment...
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}; 