import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './HostView.css';
import Timer from './components/Timer';
import ScoreboardView from './components/ScoreboardView';

function HostView({ gameId: initialGameId, onStartGame }) {
  console.log('HostView rendered with gameId:', initialGameId);
  const [players, setPlayers] = useState([]);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [error, setError] = useState('');
  const [showCountdown, setShowCountdown] = useState(false);

  useEffect(() => {
    // Set up polling for players
    const pollPlayers = setInterval(async () => {
      if (initialGameId) {
        try {
          const response = await axios.get(`/api/games/${initialGameId}/players`);
          setPlayers(response.data);
        } catch (error) {
          console.error('Error fetching players:', error);
        }
      }
    }, 2000);

    return () => clearInterval(pollPlayers);
  }, [initialGameId, isGameStarted]);

  const handleStartGame = async () => {
    setShowCountdown(true);
    onStartGame(); // Call onStartGame when starting the game
  };

  const handleCountdownComplete = async () => {
    try {
      await axios.post(`/api/games/${initialGameId}/start`);
      setIsGameStarted(true);
    } catch (error) {
      setError('Failed to start game. Please try again.');
      console.error('Error starting game:', error);
    }
  };

  return (
    <div className="host-view">
      <div className="hero-section">
        <div className="hero-content">
          <img src="/faxe-orden.png" alt="Faxe Orden" className="hero-logo" />
          <h1>Faxe Orden</h1>
        </div>
      </div>
      
      {error && <div className="error-message">{error}</div>}

      {!showCountdown && !isGameStarted && (
        <div className="pre-game">
          <div className="game-id-section">
            <h2>Faxe-ID</h2>
            <div className="game-id">{initialGameId}</div>
          </div>

          <div className="players-section">
            <h2>Players ({players.length})</h2>
            <div className="players-list">
              {players.map((player, index) => (
                <div key={index} className="player">
                  {player.name}
                </div>
              ))}
              {players.length === 0 && (
                <div className="no-players">Waiting for players to join...</div>
              )}
            </div>
          </div>

          <button 
            className="start-game-button" 
            onClick={handleStartGame}
            disabled={players.length === 0}
          >
            {players.length === 0 ? 'Waiting for Players...' : 'La faxingen begynne'}
          </button>
        </div>
      )}

      {showCountdown && !isGameStarted && (
        <div className="countdown-section">
          <Timer 
            isCountdown={true}
            onCountdownComplete={handleCountdownComplete}
          />
        </div>
      )}

      {isGameStarted && (
        <div className="dashboard">
          <div className="dashboard-timer">
            <Timer 
              isCountdown={false}
              onComplete={() => {}}
            />
          </div>
          <div className="dashboard-scoreboard">
            <ScoreboardView 
              players={players}
              isHost={true}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default HostView; 