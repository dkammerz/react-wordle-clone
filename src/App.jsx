import { useState, useEffect, useCallback, useMemo } from 'react';
import './App.css';

const MAX_TRIES = 6;
const WORD_LENGTH = 5;
const INITIAL_GUESSES = Array(MAX_TRIES).fill('');
const AVAILABLE_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/**
 * Calculates the color for a single letter tile.
 * @param {string} letter - The guessed letter.
 * @param {number} position - The index of the letter in the guess.
 * @param {string} word - The secret word.
 * @returns {'green'|'yellow'|'grey'|'white'} The color/status.
 */
const calculateTileStatus = (letter, position, word) => {
  if (!letter) return 'white';
  const upperLetter = letter.toUpperCase();
  const upperWord = word.toUpperCase();

  if (upperLetter === upperWord[position]) return 'green';
  if (upperWord.includes(upperLetter)) return 'yellow';
  return 'grey';
};

const Tile = ({ letter, status }) => {
  return (
    <div className={`tile ${status}`}>
      {letter.toUpperCase()}
    </div>
  );
};

const GameField = ({
  word,
  guessedWords,
  setGuessedWords,
  currentTry,
  setCurrentTry,
  isGameOver,
  setIsGameOver,
  currentGuess,
  setCurrentGuess,
}) => {
  const fullGrid = useMemo(() => {
    const grid = [...guessedWords];
    grid[currentTry] = currentGuess.padEnd(WORD_LENGTH, '');
    return grid;
  }, [guessedWords, currentTry, currentGuess]);

  const handleSubmitGuess = useCallback(() => {
    if (currentGuess.length !== WORD_LENGTH) {
      alert('Must be a 5-letter word!');
      return;
    }

    const submittedWord = currentGuess.toUpperCase();
    const secretWord = word.toUpperCase();

    setGuessedWords(prev => {
      const newGuesses = [...prev];
      newGuesses[currentTry] = submittedWord;
      return newGuesses;
    });

    if (submittedWord === secretWord) {
      setIsGameOver(true);
      return;
    }

    if (currentTry >= MAX_TRIES - 1) {
      alert(`Game Over! The word was: ${word}`);
      setIsGameOver(true);
      return;
    }

    setCurrentGuess('');

    setCurrentTry(prev => prev + 1);
  }, [currentGuess, setCurrentGuess, word, currentTry, setGuessedWords, setCurrentTry, setIsGameOver]);

  useEffect(() => {
    if (isGameOver) return;

    const handleKeyPress = (event) => {
      const key = event.key.toUpperCase();

      if (key === 'ENTER') {
        handleSubmitGuess();
        return;
      }

      if (key === 'BACKSPACE' || key === 'DELETE') {
        setCurrentGuess(prev => prev.slice(0, -1));
        return;
      }

      if (AVAILABLE_LETTERS.includes(key) && currentGuess.length < WORD_LENGTH) {
        setCurrentGuess(prev => prev + key);
      }
    };

    window.addEventListener('keydown', handleKeyPress);

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [isGameOver, currentGuess, handleSubmitGuess, setCurrentGuess]);


  return (
    <div className="game-field">
      {fullGrid.map((guess, guessIndex) => (
        <div key={`guess-${guessIndex}`} className='tilesBox'>
          {Array.from({ length: WORD_LENGTH }).map((_, letterIndex) => {
            const letter = guess[letterIndex] || '';
            const status = (guessIndex < currentTry || (isGameOver && guessIndex === currentTry))
              ? calculateTileStatus(letter, letterIndex, word)
              : 'white';

            return (
              <Tile
                key={`${guessIndex}-${letterIndex}`}
                letter={letter}
                status={status}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
};

const App = () => {
  const [word, setWord] = useState('');
  const [guessedWords, setGuessedWords] = useState(INITIAL_GUESSES);
  const [currentTry, setCurrentTry] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [currentGuess, setCurrentGuess] = useState('');

  useEffect(() => {
    const fetchWord = async () => {
      const currentDate = new Date().toISOString().split('T')[0];
      try {
        const response = await fetch(`/svc/wordle/v2/${currentDate}.json`);
        if (!response.ok) throw new Error('Failed to fetch word');
        const { solution } = await response.json();
        setWord(solution.toUpperCase());
      } catch (error) {
        console.error("Error fetching word:", error);
        alert('Error fetching word, using fallback word!');
        setWord('HELLO');
      }
    };

    fetchWord();
  }, []);

  const revealWord = () => {
    alert(`The word is: ${word}`);
  };

  const resetGame = useCallback(() => {
    setGuessedWords(INITIAL_GUESSES);
    setCurrentTry(0);
    setIsGameOver(false);
    setCurrentGuess('');
  }, []);

  if (!word) {
    return <div>Loading word...</div>;
  }

  return (
    <div className="app-container">
      <h1>React Wordle Clone</h1>
      <button onClick={revealWord} disabled={isGameOver}>Reveal Word</button>
      <GameField
        word={word}
        guessedWords={guessedWords}
        setGuessedWords={setGuessedWords}
        currentTry={currentTry}
        setCurrentTry={setCurrentTry}
        isGameOver={isGameOver}
        setIsGameOver={setIsGameOver}
        currentGuess={currentGuess}
        setCurrentGuess={setCurrentGuess}
      />
      {isGameOver && (
        <div className="game-status">
          <p>{guessedWords.includes(word) ? 'You Win!' : 'You Lost!'}</p>
        </div>
      )}
      <button onClick={resetGame}>Reset Game</button>
    </div>
  );
}

export default App;