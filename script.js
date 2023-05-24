// Variables declaration
const pokeApiBaseUrl = 'https://pokeapi.co/api/v2';
let cards = [];
let firstCard = null;
let secondCard = null;
let maxPokemonId = 0;
let clicks = 0;
let pairsLeft = 0;
let pairsMatched = 0;
let totalPairs = 0;
let timerId;
let time = 0;
let gameLost = false;
// Time Limit Variables in Seconds
let easyTimeLimit = 90;      
let mediumTimeLimit = 75;    
let hardTimeLimit = 60;
// Default difficulty and theme    
let difficulty = 'easy';
let theme = 'light';

// Setup the game
const setup = async () => {
  await fetchMaxPokemonId();
  createCards();
  addEventListeners();
};

// Create cards and add them to the game grid
const createCards = () => {
  const gameGrid = document.getElementById('game-grid');
  gameGrid.innerHTML = '';

  const uniquePokemons = getRandomUniquePokemons(totalPairs);
  const randomizedCards = [];

  // Create initial cards for uniquePokemons
  uniquePokemons.forEach(pokemonId => {
    const card = createCard(pokemonId);
    randomizedCards.push(card);
  });

  randomizedCards.sort(() => Math.random() - 0.5); // Randomize the order of cards

  // Create matching cards for uniquePokemons
  randomizedCards.forEach(card => {
    const duplicateCard = createCard(card.dataset.pokemonId);
    randomizedCards.push(duplicateCard);
  });

  randomizedCards.sort(() => Math.random() - 0.5); // Randomize the order again

  randomizedCards.forEach(card => {
    gameGrid.appendChild(card);
    cards.push(card);
  });

  pairsLeft = totalPairs; // Update the number of pairs left
  document.getElementById('pairs-left').textContent = `Pairs Left: ${pairsLeft}`;
  document.getElementById('total-pairs').textContent = `Total Pairs: ${totalPairs}`;
};

// Create the card element
const createCard = (pokemonId) => {
  const card = document.createElement('div');
  card.classList.add('card');
  card.dataset.pokemonId = pokemonId; 

  const frontFace = document.createElement('img');
  frontFace.classList.add('front-face');
  fetchPokemonImage(pokemonId, frontFace);

  const backFace = document.createElement('img');
  backFace.classList.add('back-face');
  backFace.src = 'back.webp';

  card.appendChild(backFace);
  card.appendChild(frontFace);

  return card;
};

// Get random unique Pokémon IDs and return them as an array
const getRandomUniquePokemons = (count) => {
  const uniquePokemons = new Set();
  while (uniquePokemons.size < count) {
    uniquePokemons.add(getRandomPokemonId());
  }
  return Array.from(uniquePokemons);
};

// Get the pokemons official artwork image from the API and set it as the front face of the card
const fetchPokemonImage = async (pokemonId, frontFace) => {
  const response = await fetch(`${pokeApiBaseUrl}/pokemon/${pokemonId}`);
  const data = await response.json();
  const pokemonImageUrl = data.sprites.other['official-artwork'].front_default;
  frontFace.src = pokemonImageUrl; 
};

// Get the total number of pokemon in the API and set it as the maxPokemonId
const fetchMaxPokemonId = async () => {
  const response = await fetch(`${pokeApiBaseUrl}/pokemon-species?limit=1`);
  const data = await response.json();
  const maxSpeciesId = data.count;
  const pokemonResponse = await fetch(`${pokeApiBaseUrl}/pokemon/${maxSpeciesId}`);
  const pokemonData = await pokemonResponse.json();
  maxPokemonId = pokemonData.id;
};

// Get a random pokemon ID from one to the maxPokemonId
const getRandomPokemonId = () => {
  return Math.floor(Math.random() * maxPokemonId) + 1; 
};

// Add event listeners to the cards and input elements
const addEventListeners = () => {
  cards.forEach(card => {
    card.addEventListener('click', handleCardClick);
  });

  document.getElementById('start-btn').addEventListener('click', handleStartButtonClick);
  document.getElementById('reset-btn').addEventListener('click', handleResetButtonClick);
  document.querySelectorAll('input[name="difficulty"]').forEach(input => {
    input.addEventListener('change', handleDifficultyChange);
  });
  document.querySelectorAll('input[name="theme"]').forEach(input => {
    input.addEventListener('change', handleThemeChange);
  });
};

// Handle card click event
const handleCardClick = () => {
  // Return early if the game is lost or the timer is not running
  if (timerId === undefined || gameLost) {
    return;
  }

  // If the timer is not running, start it
  if (timerId === undefined) {
    timerId = setInterval(updateTimer, 1000);
  }

  // If the clicked card is already matched, return early
  const clickedCard = event.currentTarget;
  if (clickedCard.classList.contains('matched')) {
    return;
  }

  // If the clicked card is the same as the first or second card, return early
  if (clickedCard === firstCard || clickedCard === secondCard) {
    return;
  }

  // If the first or second card is already selected, return early
  if (firstCard && secondCard) {
    return;
  }

  // Flip the card
  clickedCard.classList.add('flip');
  clicks++;

  // Update the number of clicks
  document.getElementById('clicks').textContent = `Clicks: ${clicks}`;

  // Store the first and second card
  if (!firstCard) {
    firstCard = clickedCard;
  } else if (!secondCard) {
    secondCard = clickedCard;

    if (isMatch()) {
      pairsMatched++;
      pairsLeft--;
      document.getElementById('pairs-left').textContent = `Pairs Left: ${pairsLeft}`;
      document.getElementById('pairs-matched').textContent = `Pairs Matched: ${pairsMatched}`;

      // Disable matched cards
      firstCard.removeEventListener('click', handleCardClick);
      secondCard.removeEventListener('click', handleCardClick);

      // Check if the game is won
      if (pairsMatched === totalPairs) {
        clearInterval(timerId);
        timerId = undefined;
        displayWinningMessage();
      }

      resetSelectedCards();
    } else {
      // Flip the cards back over after a short delay
      setTimeout(() => {
        firstCard.classList.remove('flip');
        secondCard.classList.remove('flip');
        resetSelectedCards(); 
      }, 1000);
    }
  } else {
    // Ignore card clicks when two cards are already selected
    return;
  }
};

// Check if two cards are a match based on their Pokémon ID
const isMatch = () => {
  // Retrieve the Pokémon ID from the data attribute
  const firstCardPokemonId = parseInt(firstCard.dataset.pokemonId); 
  const secondCardPokemonId = parseInt(secondCard.dataset.pokemonId);
  const match = firstCardPokemonId === secondCardPokemonId;

  if (match) {
    firstCard.classList.add('flip');
    secondCard.classList.add('flip');
  }

  return match;
};

// Reset the first and second card
const resetSelectedCards = () => {
  firstCard = null;
  secondCard = null;
};

// Update the timer to decrement from the total time
const updateTimer = () => {
  time--;
  const minutes = Math.floor(time / 60);
  const seconds = time % 60;
  document.getElementById('timer').textContent = `Time: ${formatTime(minutes)}:${formatTime(seconds)}`;

  // If time runs out, display the losing message
  if (time === 0) {
    clearInterval(timerId);
    timerId = undefined;
    displayLosingMessage();
  }
};

// Format the time to display as MM:SS
const formatTime = time => {
  return time < 10 ? `0${time}` : time;
};

// Display the winning message and apply the win class
const displayWinningMessage = () => {
  const message = document.getElementById('message');
  message.textContent = 'Congratulations! You won the game!';
  message.classList.remove('loss');
  message.classList.add('win');
};

// Display the losing message and apply the loss class
const displayLosingMessage = () => {
  gameLost = true;

  const message = document.getElementById('message');
  message.textContent = 'Time is up! You lost the game.';
  message.classList.remove('win');
  message.classList.add('loss');

  // Disable interaction with the cards
  cards.forEach(card => {
    card.removeEventListener('click', handleCardClick);
  });
};

// Handle the start button click event
const handleStartButtonClick = () => {
  // Disable the start button after clicking
  document.getElementById('start-btn').disabled = true; 

  // Reset the game
  resetGame();

  // Set the number of pairs and time based on the difficulty
  if (difficulty === 'easy') {
    totalPairs = 4;
    time = easyTimeLimit;
  } else if (difficulty === 'medium') {
    totalPairs = 6;
    time = mediumTimeLimit;
  } else if (difficulty === 'hard') {
    totalPairs = 10;
    time = hardTimeLimit;
  }

  document.getElementById('game-grid').style.display = 'flex'; 

  createCards();
  addEventListeners();

  timerId = setInterval(updateTimer, 1000);
};

// Reset the game on the reset button click event
const handleResetButtonClick = () => {
  resetGame();
};

// Reset the game by clearing the timer, resetting the time, and resetting the number of clicks
const resetGame = () => {
  clearInterval(timerId);
  timerId = undefined;
  time = 0;
  clicks = 0;
  pairsLeft = totalPairs;
  pairsMatched = 0;
  gameLost = false;
  
  // Reset the DOM elements
  document.getElementById('game-grid').style.display = 'none'; 
  document.getElementById('clicks').textContent = `Clicks: ${clicks}`;
  document.getElementById('pairs-left').textContent = `Pairs Left: ${pairsLeft}`;
  document.getElementById('pairs-matched').textContent = `Pairs Matched: ${pairsMatched}`;
  document.getElementById('timer').textContent = `Time: 00:00`;
  document.getElementById('message').textContent = '';
  document.querySelectorAll('.card').forEach(card => {
    card.classList.remove('flip');
  });

  resetSelectedCards();
};

// Change the difficulty based on the button selected
const handleDifficultyChange = event => {
  difficulty = event.target.value;

  if (difficulty === 'easy') {
    totalPairs = 4;
  } else if (difficulty === 'medium') {
    totalPairs = 6;
  } else if (difficulty === 'hard') {
    totalPairs = 10;
  }

  // Enable the start button after selecting difficulty
  document.getElementById('start-btn').disabled = false; 

  resetGame();
};

// Change the theme based on the button selected
const handleThemeChange = event => {
  theme = event.target.value;
  document.body.className = theme;
};

// Set up the web page
document.addEventListener('DOMContentLoaded', setup);
