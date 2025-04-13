import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { GAME_CONFIG } from './config';
import LandingPage from './LandingPage';
import HostView from './HostView';
import ParticipantView from './ParticipantView';
import './App.css';

function App() {
  const [role, setRole] = useState(null);
  const [gameId, setGameId] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [countdown, setCountdown] = useState(() => {
    const saved = localStorage.getItem('countdown');
    return saved ? parseInt(saved) : GAME_CONFIG.COUNTDOWN_SECONDS;
  });
  
  const [timeLeft, setTimeLeft] = useState(() => {
    const saved = localStorage.getItem('timeLeft');
    return saved ? parseInt(saved) : GAME_CONFIG.GAME_DURATION;
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
        const newTimeLeft = Math.max(GAME_CONFIG.GAME_DURATION - elapsed, 0);
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
      const handleGameOver = async () => {
        try {
          alarmAudio.current.play();
          setIsRunning(false);
          setIsGameOver(true);
          const response = await axios.post('/api/game-over');
          console.log('Game over - Final leaderboard saved:', response.data.filename);
        } catch (error) {
          console.error('Error handling game over:', error);
        }
      };
      handleGameOver();
    }
  }, [timeLeft, isRunning]);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.code === 'Space' && isRunning && !isGameOver && !showNameInput) {
        e.preventDefault();
        const currentTime = GAME_CONFIG.GAME_DURATION - timeLeft;
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
      setCountdown(GAME_CONFIG.COUNTDOWN_SECONDS);
      setTimeLeft(GAME_CONFIG.GAME_DURATION);
      setIsRunning(false);
      setIsGameOver(false);
      setShowNameInput(false);
      setCurrentTime(null);
      setHasStarted(false);
      setParticipants([]);
      setRole(null);
      
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

  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole);
    if (selectedRole === 'host') {
      // When selecting host role, create a new game
      handleCreateGame();
    }
  };

  const handleCreateGame = async () => {
    try {
      const response = await axios.post('/api/games/create');
      if (response.data.gameId) {
        console.log('Game created with ID:', response.data.gameId);
        setGameId(response.data.gameId);
        setPlayerName('host');
      }
    } catch (error) {
      console.error('Error creating game:', error);
      // Reset role if game creation fails
      setRole(null);
    }
  };

  const handleJoinGame = (id, name) => {
    console.log('Joining game with ID:', id, 'and name:', name);
    setGameId(id);
    setPlayerName(name);
    setHasStarted(false);  // Don't set hasStarted to true immediately
  };

  if (!role) {
    return <LandingPage onSelectRole={handleRoleSelect} onJoinGame={handleJoinGame} />;
  }

  if (role === 'host' && !hasStarted) {
    console.log('Rendering HostView with gameId:', gameId);
    return <HostView gameId={gameId} onStartGame={handleStart} />;
  }

  if (role === 'participant' && !hasStarted) {
    return <ParticipantView gameId={gameId} playerId={playerName} />;
  }

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
                </div>
              )}

              {isGameOver && (
                <div className="game-over">
                  <h2>Game Over!</h2>
                  <button onClick={toggleLeaderboard}>
                    {showLeaderboard ? 'Hide Leaderboard' : 'Show Leaderboard'}
                  </button>
                  {showLeaderboard && (
                    <div className="leaderboard" ref={leaderboardRef}>
                      <h3>Leaderboard</h3>
                      <ol>
                        {participants
                          .sort((a, b) => a.time - b.time)
                          .map((participant, index) => (
                            <li key={index}>
                              {participant.name}: {formatTime(participant.time)}
                            </li>
                          ))}
                      </ol>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App; 