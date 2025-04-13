import React, { useState } from 'react';
import axios from 'axios';
import './LandingPage.css';

function LandingPage({ onSelectRole, onJoinGame }) {
  const [gameId, setGameId] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  const [activeSection, setActiveSection] = useState('choice');

  const handleJoin = async (e) => {
    e.preventDefault();
    setError('');
    setIsJoining(true);

    try {
      const response = await axios.post('/api/games/join', {
        gameId,
        playerName
      });
      
      if (response.data.success) {
        onSelectRole('participant');
        onJoinGame(gameId, playerName);
      } else {
        setError(response.data.message || 'Failed to join game');
      }
    } catch (error) {
      console.error('Join game error:', error);
      setError(error.response?.data?.error || 'An error occurred while joining the game');
    } finally {
      setIsJoining(false);
    }
  };

  const handleCreateGame = async () => {
    if (isCreating) return;
    
    setIsCreating(true);
    setError('');

    try {
      console.log('Creating new game...');
      const response = await axios.post('/api/games/create');
      console.log('Create game response:', response.data);
      
      if (response.data.gameId) {
        console.log('Game created successfully, redirecting...');
        onSelectRole('host');
      } else {
        setError('Failed to create game - no game ID received');
      }
    } catch (error) {
      console.error('Create game error:', error);
      setError(error.response?.data?.error || 'An error occurred while creating the game');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="landing-page">
      <div className="hero-section">
        <div className="hero-content">
          <img src="/faxe-orden.png" alt="Faxe Orden" className="hero-logo" />
          <h1>In Faxe Veritas</h1>
          <p className="hero-subtitle">The ultimate test of speed and precision</p>
        </div>
      </div>

      <div className="content-section">
        {error && <div className="error-message">{error}</div>}
        
        {activeSection === 'choice' && (
          <div className="choice-buttons fade-in">
            <button 
              className="button-secondary"
              onClick={() => setActiveSection('join')}
            >
              Join Game
            </button>
            <button 
              className="button-primary"
              onClick={() => setActiveSection('host')}
            >
              Host Game
            </button>
          </div>
        )}

        {activeSection === 'join' && (
          <div className="join-section fade-in">
            <h2>Join Game</h2>
            <form onSubmit={handleJoin}>
              <div className="form-group">
                <label htmlFor="gameId">Game ID</label>
                <input
                  type="text"
                  id="gameId"
                  value={gameId}
                  onChange={(e) => setGameId(e.target.value.toUpperCase())}
                  placeholder="Enter game ID"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="playerName">Your Name</label>
                <input
                  type="text"
                  id="playerName"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Enter your name"
                  required
                />
              </div>
              <div className="form-buttons">
                <button 
                  type="button" 
                  className="button-secondary"
                  onClick={() => {
                    setActiveSection('choice');
                    setError('');
                  }}
                >
                  Back
                </button>
                <button 
                  type="submit" 
                  className="button-primary"
                  disabled={isJoining}
                >
                  {isJoining ? 'Joining...' : 'Join Game'}
                </button>
              </div>
            </form>
          </div>
        )}

        {activeSection === 'host' && (
          <div className="host-section fade-in">
            <h2>Host Game</h2>
            <p>Create a new game and invite your friends to join!</p>
            <div className="form-buttons">
              <button 
                className="button-secondary"
                onClick={() => {
                  setActiveSection('choice');
                  setError('');
                }}
              >
                Back
              </button>
              <button 
                className="button-primary"
                onClick={handleCreateGame}
                disabled={isCreating}
              >
                {isCreating ? 'Creating Game...' : 'Create Game'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default LandingPage; 