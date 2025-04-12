import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [countdown, setCountdown] = useState(() => {
    const saved = localStorage.getItem('countdown');
    return saved ? parseInt(saved) : 10;
  });
  
  const [timeLeft, setTimeLeft] = useState(() => {
    const saved = localStorage.getItem('timeLeft');
    return saved ? parseInt(saved) : 3600;
  });
  
  const [isRunning, setIsRunning] = useState(() => {
    const saved = localStorage.getItem('isRunning');
    return saved ? JSON.parse(saved) : false;
  });
  
  const [isGameOver, setIsGameOver] = useState(() => {
    const saved = localStorage.getItem('isGameOver');
    return saved ? JSON.parse(saved) : false;
  });
  
  const [hasStarted, setHasStarted] = useState(() => {
    const saved = localStorage.getItem('hasStarted');
    return saved ? JSON.parse(saved) : false;
  });
  
  const [participants, setParticipants] = useState([]);
  const [showNameInput, setShowNameInput] = useState(false);
  const [currentTime, setCurrentTime] = useState(null);
  const [name, setName] = useState('');
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const leaderboardRef = useRef(null);
  const [nameError, setNameError] = useState('');

  const fanfareAudio = useRef(new Audio('/fanfare.mp3'));
  const alarmAudio = useRef(new Audio('/alarm.mp3'));
  const nameInputRef = useRef(null);

  // Load participants on mount
  useEffect(() => {
    const loadParticipants = async () => {
      try {
        const response = await axios.get('/api/participants');
        setParticipants(response.data);
      } catch (error) {
        console.error('Error loading participants:', error);
      }
    };
    loadParticipants();

    // Sync with server time if game is running
    if (isRunning) {
      const startTime = localStorage.getItem('startTime');
      if (startTime) {
        const elapsed = Math.floor((Date.now() - parseInt(startTime)) / 1000);
        const newTimeLeft = Math.max(3600 - elapsed, 0);
        setTimeLeft(newTimeLeft);
        if (newTimeLeft === 0) {
          setIsRunning(false);
          setIsGameOver(true);
        }
      }
    }
  }, []);

  // Focus name input when it appears
  useEffect(() => {
    if (showNameInput && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [showNameInput]);

  // Persist state changes
  useEffect(() => {
    localStorage.setItem('countdown', countdown);
    localStorage.setItem('timeLeft', timeLeft);
    localStorage.setItem('isRunning', JSON.stringify(isRunning));
    localStorage.setItem('isGameOver', JSON.stringify(isGameOver));
    localStorage.setItem('hasStarted', JSON.stringify(hasStarted));
  }, [countdown, timeLeft, isRunning, isGameOver, hasStarted]);

  useEffect(() => {
    if (countdown > 0 && !isRunning && !isGameOver && hasStarted) {
      const timer = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else if (countdown === 0 && !isRunning && !isGameOver && hasStarted) {
      fanfareAudio.current.play();
      setIsRunning(true);
      localStorage.setItem('startTime', Date.now().toString());
    }
  }, [countdown, isRunning, isGameOver, hasStarted]);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0 && isRunning) {
      alarmAudio.current.play();
      setIsRunning(false);
      setIsGameOver(true);
    }
  }, [timeLeft, isRunning]);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.code === 'Space' && isRunning && !isGameOver && !showNameInput) {
        e.preventDefault();
        const currentTime = 3600 - timeLeft;
        setCurrentTime(currentTime);
        setShowNameInput(true);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isRunning, timeLeft, isGameOver, showNameInput]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if name already exists
    const existingParticipant = participants.find(p => p.name.toLowerCase() === name.toLowerCase());
    if (existingParticipant) {
      setNameError('This name is already taken. Please choose a different name.');
      return;
    }

    try {
      const response = await axios.post('/api/participants', { name, time: currentTime });
      setParticipants(response.data);
      setName('');
      setNameError('');
      setShowNameInput(false);
    } catch (error) {
      console.error('Error submitting participant:', error);
      setNameError('An error occurred. Please try again.');
    }
  };

  const handleReset = async () => {
    try {
      await axios.post('/api/reset');
      // Clear all localStorage
      localStorage.clear();
      
      // Reset all state
      setCountdown(10);
      setTimeLeft(3600);
      setIsRunning(false);
      setIsGameOver(false);
      setShowNameInput(false);
      setCurrentTime(null);
      setHasStarted(false);
      setParticipants([]);
      
      // Force reload participants from server
      try {
        const response = await axios.get('/api/participants');
        setParticipants(response.data);
      } catch (error) {
        console.error('Error loading participants:', error);
      }
    } catch (error) {
      console.error('Error resetting game:', error);
    }
  };

  const handleStart = () => {
    setHasStarted(true);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleLeaderboard = () => {
    setShowLeaderboard(prev => !prev);
  };

  return (
    <div className="app">
      {hasStarted && (
        <div className="dropdown-menu">
          <button className="dropdown-button">⚙️</button>
          <div className="dropdown-content">
            <button className="reset-button" onClick={handleReset}>
              Reset Game
            </button>
          </div>
        </div>
      )}
      
      <div className="content-wrapper">
        {!hasStarted && !isRunning && !isGameOver && (
          <div className="start-section">
            <img src="/faxe-orden.png" alt="Faxe" className="faxe-image" />
            <button className="start-button" onClick={handleStart}>
              La faxingen BEGYNNE
            </button>
            <img src="/faxe-orden.png" alt="Faxe" className="faxe-image" />
          </div>
        )}
        
        {hasStarted && (
          <>
            <div className="game-section">
              <img src="/faxe-orden.png" alt="Faxe" className="faxe-image" />
              
              {!isRunning && countdown > 0 && !isGameOver && (
                <div className="countdown">
                  <div className="timer">{countdown}</div>
                </div>
              )}

              {isRunning && (
                <div className="game">
                  {showNameInput && (
                    <div className="name-input">
                      {nameError && <div className="name-error">{nameError}</div>}
                      <form onSubmit={handleSubmit}>
                        <input
                          ref={nameInputRef}
                          type="text"
                          value={name}
                          onChange={(e) => {
                            setName(e.target.value);
                            setNameError(''); // Clear error when user types
                          }}
                          placeholder="Enter your name"
                          required
                        />
                        <button type="submit">Submit</button>
                      </form>
                    </div>
                  )}
                  <div className="timer">{formatTime(timeLeft)}</div>
                  <p>Press SPACE to log your time!</p>
                </div>
              )}
              
              <img src="/faxe-orden.png" alt="Faxe" className="faxe-image" />
            </div>

            <button 
              className="toggle-leaderboard-button"
              onClick={toggleLeaderboard}
            >
              {showLeaderboard ? 'Hide' : 'Show'} Leaderboard
            </button>

            <div className={`leaderboard ${showLeaderboard ? 'visible' : ''}`}>
              <h2>Leaderboard</h2>
              <div className="leaderboard-wrapper">
                <table className="leaderboard-table">
                  <thead>
                    <tr>
                      <th className="position">Position</th>
                      <th className="name">Name</th>
                      <th className="time">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {participants.map((participant, index) => (
                      <tr key={index}>
                        <td className="position">{index + 1}</td>
                        <td className="name">{participant.name}</td>
                        <td className="time">{formatTime(participant.time)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {isGameOver && (
          <div className="game-over">
            <h2>Game Over!</h2>
            <p>Time's up! The contest has ended.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App; 