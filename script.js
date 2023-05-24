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
let easyTimeLimit = 60;      
let mediumTimeLimit = 45;    
let hardTimeLimit = 30;    
let difficulty = 'easy';
let theme = 'light';

const setup = async () => {
  await fetchMaxPokemonId();
  createCards();
  addEventListeners();
};

const createCards = () => {
  const gameGrid = document.getElementById('game-grid');
  gameGrid.innerHTML = '';

  const uniquePokemons = getRandomUniquePokemons(totalPairs);
  const randomizedCards = [];

  uniquePokemons.forEach(pokemonId => {
    const card = createCard(pokemonId);
    randomizedCards.push(card);
  });

  randomizedCards.sort(() => Math.random() - 0.5); // Randomize the order of cards

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
  
const getRandomUniquePokemons = (count) => {
  const uniquePokemons = new Set();
  while (uniquePokemons.size < count) {
    uniquePokemons.add(getRandomPokemonId());
  }
  return Array.from(uniquePokemons);
};

const fetchPokemonImage = async (pokemonId, frontFace) => {
  const response = await fetch(`${pokeApiBaseUrl}/pokemon/${pokemonId}`);
  const data = await response.json();
  const pokemonImageUrl = data.sprites.other['official-artwork'].front_default;
  frontFace.src = pokemonImageUrl; 
};

const fetchMaxPokemonId = async () => {
  const response = await fetch(`${pokeApiBaseUrl}/pokemon-species?limit=1`);
  const data = await response.json();
  const maxSpeciesId = data.count;
  const pokemonResponse = await fetch(`${pokeApiBaseUrl}/pokemon/${maxSpeciesId}`);
  const pokemonData = await pokemonResponse.json();
  maxPokemonId = pokemonData.id;
};

const getRandomPokemonId = () => {
  return Math.floor(Math.random() * maxPokemonId) + 1; 
};

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

const handleCardClick = () => {
  if (timerId === undefined || gameLost) {
    return;
  }

  if (timerId === undefined) {
    timerId = setInterval(updateTimer, 1000);
  }

  const clickedCard = event.currentTarget;
  if (clickedCard.classList.contains('matched')) {
    return;
  }

  if (clickedCard === firstCard || clickedCard === secondCard) {
    return;
  }

  if (firstCard && secondCard) {
    return;
  }

  clickedCard.classList.add('flip');
  clicks++;

  document.getElementById('clicks').textContent = `Clicks: ${clicks}`;

  if (!firstCard) {
    firstCard = clickedCard;
  } else if (!secondCard) {
    secondCard = clickedCard;

    if (isMatch()) {
      pairsMatched++;
      pairsLeft--;
      document.getElementById('pairs-left').textContent = `Pairs Left: ${pairsLeft}`;
      document.getElementById('pairs-matched').textContent = `Pairs Matched: ${pairsMatched}`;
      firstCard.removeEventListener('click', handleCardClick);
      secondCard.removeEventListener('click', handleCardClick);

      if (pairsMatched === totalPairs) {
        clearInterval(timerId);
        timerId = undefined;
        displayWinningMessage();
      }

      resetSelectedCards();
    } else {
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

const resetSelectedCards = () => {
  firstCard = null;
  secondCard = null;
};

const updateTimer = () => {
  time--;
  const minutes = Math.floor(time / 60);
  const seconds = time % 60;
  document.getElementById('timer').textContent = `Time: ${formatTime(minutes)}:${formatTime(seconds)}`;

  if (time === 0) {
    clearInterval(timerId);
    timerId = undefined;
    displayLosingMessage();
  }
};

const formatTime = time => {
  return time < 10 ? `0${time}` : time;
};

const displayWinningMessage = () => {
  const message = document.getElementById('message');
  message.textContent = 'Congratulations! You won the game!';
  message.classList.remove('loss');
  message.classList.add('win');
};

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

const handleStartButtonClick = () => {
  // Disable the start button after clicking
  document.getElementById('start-btn').disabled = true; 

  resetGame();

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

const handleResetButtonClick = () => {
  resetGame();
};

const resetGame = () => {
  clearInterval(timerId);
  timerId = undefined;
  time = 0;
  clicks = 0;
  pairsLeft = totalPairs;
  pairsMatched = 0;
  gameLost = false;
  
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

const handleThemeChange = event => {
  theme = event.target.value;
  document.body.className = theme;
};

document.addEventListener('DOMContentLoaded', setup);
