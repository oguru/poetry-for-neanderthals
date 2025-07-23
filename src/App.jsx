import './App.css'

import { useEffect, useState } from 'react'

import { gameData } from './assets/gameData.js'

function App() {
  // Check for dev mode in URL
  const isDevMode = new URLSearchParams(window.location.search).get('dev') === 'true';

  // Load saved team names from localStorage if available
  const getSavedTeamNames = () => {
    try {
      const savedTeam1 = localStorage.getItem('team1Name') || 'Team 1';
      const savedTeam2 = localStorage.getItem('team2Name') || 'Team 2';
      const savedTeam1Players = parseInt(localStorage.getItem('team1Players')) || 2;
      const savedTeam2Players = parseInt(localStorage.getItem('team2Players')) || 2;
      return [
        { name: savedTeam1, players: savedTeam1Players, playerInput: savedTeam1Players.toString() },
        { name: savedTeam2, players: savedTeam2Players, playerInput: savedTeam2Players.toString() }
      ];
    } catch (e) {
      console.error('Error loading saved team names:', e);
      return [
        { name: 'Team 1', players: 2, playerInput: '2' },
        { name: 'Team 2', players: 2, playerInput: '2' }
      ];
    }
  };

  // Get saved player names from localStorage
  const getSavedPlayerNames = () => {
    try {
      const savedPlayerNames = JSON.parse(localStorage.getItem('playerNames')) || {};
      return savedPlayerNames;
    } catch (e) {
      console.error('Error loading saved player names:', e);
      return {};
    }
  };

  // Get saved timer duration
  const getSavedTimerDuration = () => {
    try {
      const savedDuration = localStorage.getItem('timerDuration');
      return savedDuration ? parseInt(savedDuration) : 60;
    } catch (e) {
      return 60;
    }
  };

  const [gameState, setGameState] = useState('setup') // setup, playing, roundEnd, gameEnd
  const [teams, setTeams] = useState([
    { name: getSavedTeamNames()[0].name, score: 0, turns: 0, players: getSavedTeamNames()[0].players, playerInput: getSavedTeamNames()[0].playerInput, currentPlayer: 1 },
    { name: getSavedTeamNames()[1].name, score: 0, turns: 0, players: getSavedTeamNames()[1].players, playerInput: getSavedTeamNames()[1].playerInput, currentPlayer: 1 }
  ])
  const [playerNames, setPlayerNames] = useState(getSavedPlayerNames())
  const [currentTeam, setCurrentTeam] = useState(0)
  const [currentRound, setCurrentRound] = useState(1)
  const [totalRounds, setTotalRounds] = useState(5)
  const [timeLeft, setTimeLeft] = useState(60)
  const savedDuration = getSavedTimerDuration();
  const [timerDuration, setTimerDuration] = useState(savedDuration) // Default from localStorage or 60 seconds
  const [timerInputValue, setTimerInputValue] = useState(savedDuration.toString()) // String value for the input
  const [timerActive, setTimerActive] = useState(false)
  const [gameCards, setGameCards] = useState([...gameData])
  const [currentCard, setCurrentCard] = useState(null)
  const [totalCardsPlayed, setTotalCardsPlayed] = useState(0)
  const [totalPlayersTaken, setTotalPlayersTaken] = useState(0) // Track how many players have taken their turn

  // Handle team name change
  const handleTeamNameChange = (index, newName) => {
    const updatedTeams = [...teams]
    updatedTeams[index] = { ...updatedTeams[index], name: newName }
    setTeams(updatedTeams)
    
    // Save to localStorage
    localStorage.setItem(`team${index + 1}Name`, newName)
  }

  // Handle player name change
  const handlePlayerNameChange = (teamIndex, playerIndex, newName) => {
    const key = `team${teamIndex + 1}_player${playerIndex + 1}`;
    const updatedPlayerNames = { ...playerNames, [key]: newName };
    setPlayerNames(updatedPlayerNames);
    
    // Save to localStorage
    localStorage.setItem('playerNames', JSON.stringify(updatedPlayerNames));
  }

  // Clear a single player name
  const clearPlayerName = (teamIndex, playerIndex) => {
    const key = `team${teamIndex + 1}_player${playerIndex + 1}`;
    const updatedPlayerNames = { ...playerNames };
    delete updatedPlayerNames[key];
    setPlayerNames(updatedPlayerNames);
    
    // Save to localStorage
    localStorage.setItem('playerNames', JSON.stringify(updatedPlayerNames));
  }

  // Clear all player names
  const clearAllPlayerNames = () => {
    setPlayerNames({});
    localStorage.removeItem('playerNames');
  }

  // Get player name or default
  const getPlayerName = (teamIndex, playerIndex) => {
    const key = `team${teamIndex + 1}_player${playerIndex + 1}`;
    return playerNames[key] || `Player ${playerIndex + 1}`;
  }

  // Handle team player count input change
  const handleTeamPlayerCountChange = (index, inputValue) => {
    // Store the raw input value
    const updatedTeams = [...teams]
    updatedTeams[index] = { 
      ...updatedTeams[index], 
      playerInput: inputValue 
    }
    
    // Only update the actual player count if it's a valid number
    if (inputValue.trim() !== '') {
      const count = parseInt(inputValue)
      if (!isNaN(count)) {
        // Apply min/max constraints
        const validCount = Math.max(1, Math.min(10, count))
        updatedTeams[index].players = validCount
        
        // Save to localStorage
        localStorage.setItem(`team${index + 1}Players`, validCount.toString())
      }
    }
    
    setTeams(updatedTeams)
  }

  // Validate player count on blur
  const validatePlayerCount = (index) => {
    const updatedTeams = [...teams]
    const currentTeam = updatedTeams[index]
    
    // If input is empty or invalid, reset to 1
    if (currentTeam.playerInput.trim() === '' || isNaN(parseInt(currentTeam.playerInput))) {
      currentTeam.players = 1
      currentTeam.playerInput = '1'
    } else {
      // Ensure the displayed value matches the actual value
      const validCount = Math.max(1, Math.min(10, parseInt(currentTeam.playerInput)))
      currentTeam.players = validCount
      currentTeam.playerInput = validCount.toString()
    }
    
    setTeams(updatedTeams)
    localStorage.setItem(`team${index + 1}Players`, currentTeam.players.toString())
  }

  // Handle total rounds change
  const handleRoundsChange = (newRounds) => {
    setTotalRounds(Math.max(1, parseInt(newRounds) || 1))
  }

  // Handle timer duration input change
  const handleTimerInputChange = (value) => {
    // Allow the user to type freely, just store the raw input
    setTimerInputValue(value)
    
    // Only update the actual timer duration if it's a valid number
    if (!isNaN(value) && value.trim() !== '') {
      const duration = parseInt(value)
      // Only apply limits when actually starting the game
      if (duration > 0) {
        setTimerDuration(duration)
        // Save to localStorage
        localStorage.setItem('timerDuration', duration.toString())
      }
    }
  }

  // Force end the current turn (for dev mode)
  const forceEndTurn = () => {
    setTimeLeft(0);
  }

  // Calculate total number of players
  const getTotalPlayers = () => {
    return teams.reduce((sum, team) => sum + team.players, 0);
  }

  // Start the game
  const startGame = () => {
    // Validate player counts one last time
    const finalTeams = teams.map(team => {
      const validCount = Math.max(1, Math.min(10, team.players))
      return {
        ...team,
        players: validCount,
        playerInput: validCount.toString()
      }
    })
    setTeams(finalTeams)
    
    // Final validation of timer duration before starting
    let finalDuration = parseInt(timerInputValue) || 60
    
    // Apply min/max only when starting the game
    finalDuration = Math.min(Math.max(1, finalDuration), 300)
    setTimerDuration(finalDuration)
    localStorage.setItem('timerDuration', finalDuration.toString())
    
    setGameState('playing')
    setCurrentTeam(0)
    setCurrentRound(1)
    setTotalCardsPlayed(0)
    setTotalPlayersTaken(0)
    
    // Reset current player for each team
    const resetTeams = finalTeams.map(team => ({
      ...team,
      currentPlayer: 1,
      turns: 0,
      score: 0
    }));
    setTeams(resetTeams);
    
    // Shuffle the game cards at the start
    setGameCards([...gameData].sort(() => Math.random() - 0.5))
    startTurn(finalDuration) // use the newly validated duration for the first turn
  }

  // Start a team's turn
  const startTurn = (duration = timerDuration) => {
    setTimeLeft(duration) // Use the provided or current timer duration
    setTimerActive(true)
    drawCard()
  }

  // Draw a new card
  const drawCard = () => {
    if (gameCards.length > 0) {
      const randomIndex = Math.floor(Math.random() * gameCards.length)
      setCurrentCard(gameCards[randomIndex])
    } else {
      setGameState('gameEnd')
    }
  }

  // Handle card action (1 or 3 points)
  const handleCardAction = (points) => {
    // Add points to current team
    const updatedTeams = [...teams]
    updatedTeams[currentTeam] = { 
      ...updatedTeams[currentTeam], 
      score: updatedTeams[currentTeam].score + points 
    }
    setTeams(updatedTeams)

    // Remove current card from deck
    if (currentCard) {
      setGameCards(gameCards.filter(card => 
        card["1"] !== currentCard["1"] || card["3"] !== currentCard["3"]))
      setTotalCardsPlayed(totalCardsPlayed + 1)
    }
    
    // Draw a new card
    drawCard()
  }

  // Skip card without penalty
  const skipCardWithoutPenalty = () => {
    // Remove current card from deck without changing score
    if (currentCard) {
      setGameCards(gameCards.filter(card => 
        card["1"] !== currentCard["1"] || card["3"] !== currentCard["3"]))
      setTotalCardsPlayed(totalCardsPlayed + 1)
    }
    
    // Draw a new card
    drawCard()
  }

  // End current turn
  const endTurn = () => {
    setTimerActive(false)
    
    // Update turns for current team and advance current player
    const updatedTeams = [...teams]
    const teamIndex = currentTeam;
    
    updatedTeams[teamIndex] = { 
      ...updatedTeams[teamIndex], 
      turns: updatedTeams[teamIndex].turns + 1,
      currentPlayer: updatedTeams[teamIndex].currentPlayer < updatedTeams[teamIndex].players 
        ? updatedTeams[teamIndex].currentPlayer + 1 
        : 1
    }
    
    setTeams(updatedTeams)
    setTotalPlayersTaken(totalPlayersTaken + 1)
    
    setGameState('roundEnd')
  }

  // Determine if the game should end
  const shouldGameEnd = () => {
    return false; // Let nextTeamTurn handle the end game logic
  }

  // Check if this is the final turn
  const isFinalTurn = () => {
    const totalPlayers = getTotalPlayers();
    const updatedPlayersTaken = totalPlayersTaken + 1;
    
    // We're in the final round
    if (currentRound === totalRounds) {
      // Check if this was the last player's turn
      return updatedPlayersTaken >= totalPlayers;
    }
    return false;
  }

  // Determine if the game should end after the current round is complete
  const isGameOverAfterRound = () => {
    const totalPlayers = getTotalPlayers();
    // Game is over if we are in the final round and every player has already taken their turn in that round
    return currentRound === totalRounds && totalPlayersTaken >= totalPlayers;
  }

  // Start next team's turn (called from the Round End screen)
  const nextTeamTurn = () => {
    const totalPlayers = getTotalPlayers();

    // If the current round is the last one and everyone has played -> end game
    if (currentRound === totalRounds && totalPlayersTaken >= totalPlayers) {
      setGameState('gameEnd');
      return;
    }

    // Determine if we've completed the round (all players have played)
    const roundComplete = totalPlayersTaken >= totalPlayers;

    // If the round is complete, advance to the next round and reset the per-round player counter
    if (roundComplete) {
      setCurrentRound(currentRound + 1);
      setTotalPlayersTaken(0);
    }

    // Rotate to the next team for the upcoming turn
    setCurrentTeam((currentTeam + 1) % 2);

    // Resume the game
    setGameState('playing');
    startTurn();
  }

  // Reset the game
  const resetGame = () => {
    // Keep team names and player counts, but reset scores and turns
    setTeams(teams.map(team => ({
      ...team,
      score: 0,
      turns: 0,
      currentPlayer: 1
    })))
    
    setCurrentTeam(0)
    setCurrentRound(1)
    setTotalCardsPlayed(0)
    setTotalPlayersTaken(0)
    setGameCards([...gameData].sort(() => Math.random() - 0.5))
    setGameState('setup')
  }

  // Timer effect
  useEffect(() => {
    let timer
    if (timerActive && timeLeft > 0) {
      timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1)
      }, 1000)
    } else if (timerActive && timeLeft === 0) {
      endTurn()
    }
    
    return () => clearTimeout(timer)
  }, [timerActive, timeLeft])

  // Format time as mm:ss
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  // Get current player info text
  const getCurrentPlayerText = () => {
    const team = teams[currentTeam];
    const playerIndex = team.currentPlayer - 1;
    const playerName = getPlayerName(currentTeam, playerIndex);
    return `${team.name} - ${playerName}`;
  }

  // Render player name inputs for a team
  const renderPlayerNameInputs = (teamIndex) => {
    const team = teams[teamIndex];
    const inputs = [];
    
    for (let i = 0; i < team.players; i++) {
      const playerKey = `team${teamIndex + 1}_player${i + 1}`;
      inputs.push(
        <div key={playerKey} className="player-name-input">
          <label>Player {i + 1} Name:</label>
          <div className="input-with-button">
            <input
              type="text"
              value={playerNames[playerKey] || ''}
              onChange={(e) => handlePlayerNameChange(teamIndex, i, e.target.value)}
              placeholder={`Player ${i + 1}`}
            />
            <button 
              className="clear-button"
              onClick={() => clearPlayerName(teamIndex, i)}
              title="Clear player name"
            >
              ×
            </button>
          </div>
        </div>
      );
    }
    
    return inputs;
  };

  return (
    <div className="app-container">
      {gameState === 'setup' && (
        <div className="setup-screen">
          <h1>Poetry for Neanderthals</h1>
          
          <div className="team-setup">
            <h2>Team Setup</h2>
            {teams.map((team, index) => (
              <div key={index} className="team-setup-group">
                <div className="team-info-section">
                  <div className="team-input">
                    <label>Team {index + 1} Name:</label>
                    <input
                      type="text"
                      value={team.name}
                      onChange={(e) => handleTeamNameChange(index, e.target.value)}
                    />
                  </div>
                  <div className="player-count-input">
                    <label>Number of Players:</label>
                    <input
                      type="text"
                      min="1"
                      max="10"
                      value={team.playerInput}
                      onChange={(e) => handleTeamPlayerCountChange(index, e.target.value)}
                      onBlur={() => validatePlayerCount(index)}
                    />
                  </div>
                </div>
                
                <div className="player-names-section">
                  <h3>Player Names</h3>
                  {renderPlayerNameInputs(index)}
                </div>
              </div>
            ))}
            
            <div className="clear-all-container">
              <button 
                className="clear-all-button"
                onClick={clearAllPlayerNames}
              >
                Clear All Player Names
              </button>
            </div>
          </div>
          
          <div className="game-settings">
            <h2>Game Settings</h2>
            <div className="rounds-input">
              <label>Number of Rounds:</label>
              <input
                type="number"
                min="1"
                value={totalRounds}
                onChange={(e) => handleRoundsChange(e.target.value)}
              />

            </div>
            
            <div className="timer-input">
              <label>Timer Duration (seconds):</label>
              <input
                type="text"
                value={timerInputValue}
                onChange={(e) => handleTimerInputChange(e.target.value)}
                placeholder="Enter seconds (10-300)"
              />
            </div>
            
            <div className="timer-preview">
              {!isNaN(timerInputValue) && timerInputValue.trim() !== '' && parseInt(timerInputValue) > 0
                ? `Round timer will be: ${formatTime(parseInt(timerInputValue))}`
                : "Please enter a valid time in seconds"
              }
            </div>
          </div>
          
          <button 
            className="start-button" 
            onClick={startGame}
            disabled={isNaN(timerInputValue) || timerInputValue.trim() === '' || parseInt(timerInputValue) <= 0}
          >
            Start Game
          </button>
        </div>
      )}

      {gameState === 'playing' && (
        <div className="game-screen">
          <div className="game-header">
            <div className="team-info">
              <h2>{getCurrentPlayerText()}'s Turn</h2>
              <div className="scores">
                {teams.map((team, index) => (
                  <div key={index} className={`team-score ${index === currentTeam ? 'active' : ''}`}>
                    {team.name}: {team.score}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="game-status">
              <div className={`timer ${timeLeft <= 10 ? 'warning' : ''}`}>
                Time: {formatTime(timeLeft)}
              </div>
              <div className="round-info">Round: {currentRound}/{totalRounds}</div>
              <div className="cards-info">Cards: {gameCards.length}/{gameData.length}</div>
            </div>
          </div>
          
          {currentCard && (
            <div className="card-container">
              <div 
                className="card-half top-half" 
                onClick={() => handleCardAction(1)}
              >
                <div className="point-value">1</div>
                <div className="word">{currentCard["1"]}</div>
              </div>
              
              <div className="card-divider"></div>
              
              <div 
                className="card-half bottom-half" 
                onClick={() => handleCardAction(3)}
              >
                <div className="word">{currentCard["3"]}</div>
                <div className="point-value">3</div>
              </div>
            </div>
          )}
          
          <div className="game-buttons">
            <button className="penalty-button" onClick={() => handleCardAction(-1)}>
              Skip / Penalty (-1 point)
            </button>
            
            <button className="skip-button" onClick={skipCardWithoutPenalty}>
              Skip (No Penalty)
            </button>
            
            {isDevMode && (
              <button className="dev-button end-turn-dev-button" onClick={forceEndTurn}>
                End Turn (Dev)
              </button>
            )}
          </div>
        </div>
      )}

      {gameState === 'roundEnd' && (
        <div className="round-end-screen">
          <h2>Time's Up!</h2>
          <div className="round-summary">
            <h3>
              {teams[currentTeam].name} - {getPlayerName(currentTeam, teams[currentTeam].currentPlayer === 1 
                ? teams[currentTeam].players - 1 
                : teams[currentTeam].currentPlayer - 2)}'s turn is over
            </h3>
            <p>Round {currentRound}</p>
            <p>Current Score: {teams[currentTeam].score}</p>
            <p>Cards remaining: {gameCards.length}</p>
            <p>Next up: {teams[(currentTeam + 1) % 2].name} - {getPlayerName((currentTeam + 1) % 2, teams[(currentTeam + 1) % 2].currentPlayer - 1)}</p>
          </div>
          
          <button 
            className="next-turn-button" 
            onClick={nextTeamTurn}
          >
            {isGameOverAfterRound() 
              ? "See Final Results" 
              : `Start ${teams[(currentTeam + 1) % 2].name} - ${getPlayerName((currentTeam + 1) % 2, teams[(currentTeam + 1) % 2].currentPlayer - 1)}'s Turn`}
          </button>
        </div>
      )}

      {gameState === 'gameEnd' && (
        <div className="game-end-screen">
          <h2>Game Over!</h2>
          
          <div className="final-scores">
            <h3>Final Scores</h3>
            {teams.map((team, index) => (
              <div key={index} className={`team-final-score ${
                teams[0].score !== teams[1].score && 
                ((teams[0].score > teams[1].score && index === 0) || 
                (teams[0].score < teams[1].score && index === 1)) 
                  ? 'winner' : ''
              }`}>
                {team.name} ({team.players} players): {team.score} points
              </div>
            ))}
            <p className="game-stats">
              Total cards played: {totalCardsPlayed} of {gameData.length}
            </p>
          </div>
          
          <button className="play-again-button" onClick={resetGame}>
            Play Again
          </button>
        </div>
      )}
      
      {isDevMode && (
        <div className="dev-indicator">
          Dev Mode | 
          Round: {currentRound}/{totalRounds} | 
          Players Taken: {totalPlayersTaken}/{getTotalPlayers()} | 
          Current Team: {currentTeam} | 
          Current Player: {teams[currentTeam].currentPlayer}
        </div>
      )}
    </div>
  );
}

export default App;