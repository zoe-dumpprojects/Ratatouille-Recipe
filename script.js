document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const ingredientsInput = document.getElementById('ingredients');
    const dietaryRestrictionsSelect = document.getElementById('dietary_restrictions');
    const cookingTimeSelect = document.getElementById('cooking_time');
    const generateRecipeBtn = document.getElementById('generate-recipe');
    const clearRecipeBtn = document.getElementById('clear-recipe');
    const recipeContainer = document.getElementById('recipe-container');
    const backgroundMusic = document.getElementById('backgroundMusic');
    
    // API Configuration
    const API_KEY = 'app-leipnjaB3KVYZnipINbHK6UY'; // Provided API key
    const API_ENDPOINT = 'http://43.133.4.161/v1/chat-messages';
    
    // Add music control button
    function addMusicControlButton() {
        const musicButton = document.createElement('button');
        musicButton.id = 'music-control';
        musicButton.className = 'btn-secondary';
        musicButton.style.position = 'fixed';
        musicButton.style.top = '20px';
        musicButton.style.right = '20px';
        musicButton.style.zIndex = '1000';
        musicButton.style.padding = '10px';
        musicButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
        `;
        musicButton.title = 'Toggle Music';
        
        document.body.appendChild(musicButton);
        
        musicButton.addEventListener('click', toggleMusic);
        return musicButton;
    }
    
    // Toggle music play/pause
    function toggleMusic() {
        const musicButton = document.getElementById('music-control');
        
        if (backgroundMusic.paused) {
            backgroundMusic.volume = 0.1; // Set volume to 10% for very soft lofi music
            backgroundMusic.play().catch(error => {
                console.log('Auto-play was prevented:', error);
            });
            
            // Change icon to pause
            musicButton.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="6" y="4" width="4" height="16"></rect>
                    <rect x="14" y="4" width="4" height="16"></rect>
                </svg>
            `;
        } else {
            backgroundMusic.pause();
            
            // Change icon to play
            musicButton.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
            `;
        }
    }
    
    // Try to play music on user interaction
    function setupMusicAutoplay() {
        // Create a function that will try to play music on first user interaction
        function attemptPlayOnInteraction() {
            backgroundMusic.volume = 0.1; // Lower volume to 10% for very soft lofi music
            backgroundMusic.play().catch(error => {
                console.log('Auto-play was prevented:', error);
            });
            
            // Remove the event listeners after first attempt
            document.removeEventListener('click', attemptPlayOnInteraction);
            document.removeEventListener('keydown', attemptPlayOnInteraction);
        }
        
        // Add event listeners to attempt play on user interaction
        document.addEventListener('click', attemptPlayOnInteraction);
        document.addEventListener('keydown', attemptPlayOnInteraction);
    }
    
    // Initialize music controls
    addMusicControlButton();
    setupMusicAutoplay();
    
    // Event Listeners
    generateRecipeBtn.addEventListener('click', generateRecipe);
    clearRecipeBtn.addEventListener('click', clearRecipe);
    
    // Function to generate recipe
    async function generateRecipe() {
        // Get form data
        const ingredients = ingredientsInput.value.trim();
        const dietaryRestrictions = dietaryRestrictionsSelect.value;
        const cookingTime = cookingTimeSelect.value;
        
        // Validate form
        if (!ingredients) {
            showError('Please enter at least one ingredient');
            return;
        }
        
        // Show loading state
        showLoading();
        
        try {
            // Prepare request data
            const requestData = {
                inputs: {
                    ingredients: ingredients,
                    dietary_restrictions: dietaryRestrictions,
                    cooking_time: cookingTime
                },
                query: `Generate a recipe using these ingredients: ${ingredients}${dietaryRestrictions ? ` with dietary restriction: ${dietaryRestrictions}` : ''}${cookingTime !== '120+' ? ` and maximum cooking time: ${cookingTime} minutes` : ''}`,
                response_mode: 'streaming',
                conversation_id: '',
                user: 'abc-123',
                files: []
            };
            
            // Send API request
            const response = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });
            
            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }
            
            // Handle streaming response
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullAnswer = '';
            
            while (true) {
                const { done, value } = await reader.read();
                
                if (done) {
                    break;
                }
                
                // Decode the chunk
                const chunk = decoder.decode(value, { stream: true });
                
                // Process chunk - assuming format like "data: {event:...}\n\n"
                const lines = chunk.split('\n');
                
                for (const line of lines) {
                    if (line.startsWith('data:')) {
                        try {
                            // Remove 'data: ' prefix and parse JSON
                            const dataStr = line.substring(5).trim();
                            if (dataStr) {
                                const parsedData = JSON.parse(dataStr);
                                
                                // Check if this chunk contains the answer
                                if (parsedData.answer) {
                                    fullAnswer += parsedData.answer;
                                } else if (parsedData.event === 'text' && parsedData.text) {
                                    fullAnswer += parsedData.text;
                                }
                            }
                        } catch (e) {
                            console.error('Error parsing chunk:', e);
                        }
                    }
                }
            }
            
            // Create recipe data object
            const recipeData = {
                answer: fullAnswer
            };
            
            // Display recipe
            displayRecipe(recipeData);
            
        } catch (error) {
            console.error('Error generating recipe:', error);
            showError(`Failed to generate recipe: ${error.message}`);
        }
    }
    
    // Function to display recipe
    function displayRecipe(data) {
        // Clear container
        recipeContainer.innerHTML = '';
        
        // Extract recipe data
        // Note: The actual structure of data.answer might vary depending on the API's response format
        let recipeData = null;
        
        try {
            // Try to parse if answer is JSON
            recipeData = JSON.parse(data.answer);
        } catch (e) {
            // If not JSON, create a simplified recipe object
            recipeData = {
                dish_name: 'Generated Recipe',
                description: data.answer || 'A delicious recipe created just for you.',
                estimated_calories: 'Not specified',
                estimated_time: 'Not specified',
                ingredients_needed: [ingredientsInput.value.trim()],
                instructions: [data.answer || 'Follow your culinary instincts!']
            };
        }
        
        // Create recipe card
        const recipeCard = document.createElement('div');
        recipeCard.className = 'recipe-card';
        
        // Recipe header
        const recipeHeader = document.createElement('div');
        recipeHeader.className = 'recipe-header';
        
        const recipeTitle = document.createElement('h2');
        recipeTitle.className = 'recipe-title';
        recipeTitle.textContent = recipeData.dish_name || 'Delicious Recipe';
        
        const recipeDescription = document.createElement('p');
        recipeDescription.className = 'recipe-description';
        recipeDescription.textContent = recipeData.description || 'A tasty dish made with your selected ingredients.';
        
        const recipeMeta = document.createElement('div');
        recipeMeta.className = 'recipe-meta';
        
        // Calories meta
        const caloriesMeta = document.createElement('div');
        caloriesMeta.className = 'meta-item';
        caloriesMeta.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16Z"></path>
                <path d="M12 6v6l4 2"></path>
            </svg>
            <span>Calories: ${recipeData.estimated_calories || 'N/A'}</span>
        `;
        
        // Time meta
        const timeMeta = document.createElement('div');
        timeMeta.className = 'meta-item';
        timeMeta.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span>Time: ${recipeData.estimated_time || 'N/A'}</span>
        `;
        
        recipeMeta.appendChild(caloriesMeta);
        recipeMeta.appendChild(timeMeta);
        
        recipeHeader.appendChild(recipeTitle);
        recipeHeader.appendChild(recipeDescription);
        recipeHeader.appendChild(recipeMeta);
        
        // Ingredients section
        const ingredientsSection = document.createElement('div');
        ingredientsSection.className = 'recipe-section';
        
        const ingredientsHeading = document.createElement('h3');
        ingredientsHeading.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
            Ingredients Needed
        `;
        
        const ingredientsList = document.createElement('ul');
        ingredientsList.className = 'ingredients-list';
        
        // Add ingredients to list
        const ingredientsToDisplay = recipeData.ingredients_needed || [ingredientsInput.value.trim()];
        
        if (Array.isArray(ingredientsToDisplay)) {
            ingredientsToDisplay.forEach(ingredient => {
                const li = document.createElement('li');
                
                // Try to handle different formats intelligently
                if (typeof ingredient === 'string') {
                    // Case 1: Ingredient is a string - check if it looks like JSON
                    try {
                        // Try to parse if it's a JSON string
                        const parsedObj = JSON.parse(ingredient);
                        // If parsing succeeds, format it nicely
                        if (parsedObj.item && parsedObj.quantity) {
                            // Format: Item - Quantity
                            li.innerHTML = `<span class="ingredient-name">${parsedObj.item}</span><span class="ingredient-quantity">${parsedObj.quantity}</span>`;
                        } else if (parsedObj.name && parsedObj.amount) {
                            // Alternative format
                            li.innerHTML = `<span class="ingredient-name">${parsedObj.name}</span><span class="ingredient-quantity">${parsedObj.amount}</span>`;
                        } else {
                            // Just show the string if we can't parse/format it
                            li.textContent = ingredient;
                        }
                    } catch (e) {
                        // If not JSON, just show the string
                        li.textContent = ingredient;
                    }
                } else if (typeof ingredient === 'object' && ingredient !== null) {
                    // Case 2: Ingredient is already an object
                    if (ingredient.item && ingredient.quantity) {
                        li.innerHTML = `<span class="ingredient-name">${ingredient.item}</span><span class="ingredient-quantity">${ingredient.quantity}</span>`;
                    } else if (ingredient.name && ingredient.amount) {
                        li.innerHTML = `<span class="ingredient-name">${ingredient.name}</span><span class="ingredient-quantity">${ingredient.amount}</span>`;
                    } else if (ingredient.text) {
                        li.textContent = ingredient.text;
                    } else if (ingredient.name) {
                        li.textContent = ingredient.name;
                    } else if (ingredient.ingredient) {
                        li.textContent = ingredient.ingredient;
                    } else {
                        // As a last resort, convert to formatted JSON string
                        try {
                            const jsonStr = JSON.stringify(ingredient);
                            const parsedObj = JSON.parse(jsonStr);
                            if (parsedObj.item && parsedObj.quantity) {
                                li.innerHTML = `<span class="ingredient-name">${parsedObj.item}</span><span class="ingredient-quantity">${parsedObj.quantity}</span>`;
                            } else {
                                li.textContent = JSON.stringify(ingredient);
                            }
                        } catch (e) {
                            li.textContent = String(ingredient);
                        }
                    }
                } else {
                    // For any other type, just convert to string
                    li.textContent = String(ingredient);
                }
                
                ingredientsList.appendChild(li);
            });
        } else if (typeof ingredientsToDisplay === 'string') {
            // If it's a single string, check if it's JSON
            try {
                const parsedArray = JSON.parse(ingredientsToDisplay);
                if (Array.isArray(parsedArray)) {
                    // If it's a string containing an array of ingredients
                    parsedArray.forEach(ingredient => {
                        const li = document.createElement('li');
                        if (typeof ingredient === 'object' && ingredient.item && ingredient.quantity) {
                            li.innerHTML = `<span class="ingredient-name">${ingredient.item}</span><span class="ingredient-quantity">${ingredient.quantity}</span>`;
                        } else {
                            li.textContent = String(ingredient);
                        }
                        ingredientsList.appendChild(li);
                    });
                } else {
                    // Single ingredient string
                    const li = document.createElement('li');
                    li.textContent = ingredientsToDisplay;
                    ingredientsList.appendChild(li);
                }
            } catch (e) {
                // Not JSON, just show as is
                const li = document.createElement('li');
                li.textContent = ingredientsToDisplay;
                ingredientsList.appendChild(li);
            }
        } else if (typeof ingredientsToDisplay === 'object' && ingredientsToDisplay !== null) {
            // Single object
            const li = document.createElement('li');
            if (ingredientsToDisplay.item && ingredientsToDisplay.quantity) {
                li.innerHTML = `<span class="ingredient-name">${ingredientsToDisplay.item}</span><span class="ingredient-quantity">${ingredientsToDisplay.quantity}</span>`;
            } else {
                li.textContent = JSON.stringify(ingredientsToDisplay);
            }
            ingredientsList.appendChild(li);
        } else {
            // Fallback for any other case
            const li = document.createElement('li');
            li.textContent = String(ingredientsToDisplay);
            ingredientsList.appendChild(li);
        }
        
        ingredientsSection.appendChild(ingredientsHeading);
        ingredientsSection.appendChild(ingredientsList);
        
        // Instructions section
        const instructionsSection = document.createElement('div');
        instructionsSection.className = 'recipe-section';
        
        const instructionsHeading = document.createElement('h3');
        instructionsHeading.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            Instructions
        `;
        
        const instructionsList = document.createElement('ol');
        instructionsList.className = 'instructions-list';
        
        // Add instructions to list
        const instructionsToDisplay = recipeData.instructions || [recipeData.description || 'No instructions provided.'];
        
        if (Array.isArray(instructionsToDisplay)) {
            instructionsToDisplay.forEach(instruction => {
                const li = document.createElement('li');
                // Check if instruction is an object and handle accordingly
                if (typeof instruction === 'object' && instruction !== null) {
                    if (instruction.text) {
                        li.textContent = instruction.text;
                    } else if (instruction.step) {
                        li.textContent = instruction.step;
                    } else if (instruction.instruction) {
                        li.textContent = instruction.instruction;
                    } else {
                        li.textContent = JSON.stringify(instruction);
                    }
                } else {
                    li.textContent = instruction;
                }
                instructionsList.appendChild(li);
            });
        } else if (typeof instructionsToDisplay === 'object' && instructionsToDisplay !== null) {
            // If it's a single object, handle it similarly
            const li = document.createElement('li');
            if (instructionsToDisplay.text) {
                li.textContent = instructionsToDisplay.text;
            } else if (instructionsToDisplay.step) {
                li.textContent = instructionsToDisplay.step;
            } else if (instructionsToDisplay.instruction) {
                li.textContent = instructionsToDisplay.instruction;
            } else {
                li.textContent = JSON.stringify(instructionsToDisplay);
            }
            instructionsList.appendChild(li);
        } else {
            const li = document.createElement('li');
            li.textContent = instructionsToDisplay;
            instructionsList.appendChild(li);
        }
        
        instructionsSection.appendChild(instructionsHeading);
        instructionsSection.appendChild(instructionsList);
        
        // Add recipe review section
        const reviewSection = document.createElement('div');
        reviewSection.className = 'recipe-section';
        
        const reviewHeading = document.createElement('h3');
        reviewHeading.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
            Ratatouille's Review of This Recipe
        `;
        
        const reviewContent = document.createElement('div');
        reviewContent.className = 'review-content';
        
        const reviewText = document.createElement('p');
        reviewText.textContent = "This recipe looks delicious! As a food-passionate rat, I can tell the balance of ingredients creates a harmonious flavor profile. Perfect for your next meal preparation.";
        
        // Rating out of 10
        const ratingContainer = document.createElement('div');
        ratingContainer.className = 'rating-container';
        
        const ratingText = document.createElement('span');
        ratingText.textContent = 'Rating: ';
        
        const ratingStars = document.createElement('span');
        ratingStars.className = 'rating-stars';
        ratingStars.innerHTML = '★★★★★★★★★☆ 9/10';
        
        ratingContainer.appendChild(ratingText);
        ratingContainer.appendChild(ratingStars);
        
        // Encouragement line
        const encouragementLine = document.createElement('p');
        encouragementLine.className = 'encouragement';
        encouragementLine.textContent = "Even Remy from Ratatouille would be proud to serve this!";
        
        reviewContent.appendChild(reviewText);
        reviewContent.appendChild(ratingContainer);
        reviewContent.appendChild(encouragementLine);
        
        reviewSection.appendChild(reviewHeading);
        reviewSection.appendChild(reviewContent);
        
        // Assemble recipe card
        recipeCard.appendChild(recipeHeader);
        recipeCard.appendChild(ingredientsSection);
        recipeCard.appendChild(instructionsSection);
        recipeCard.appendChild(reviewSection);
        
        // Add to container
        recipeContainer.appendChild(recipeCard);
    }
    
    // Function to show loading state
    function showLoading() {
        recipeContainer.innerHTML = `
            <div class="loading">
                <div class="loading-spinner"></div>
                <p>Generating your recipe...</p>
            </div>
        `;
        
        // Disable generate button
        generateRecipeBtn.disabled = true;
        generateRecipeBtn.textContent = 'Generating...';
    }
    
    // Function to show error message
    function showError(message) {
        recipeContainer.innerHTML = `
            <div class="error-message">
                <h3>Error</h3>
                <p>${message}</p>
            </div>
        `;
        
        // Re-enable generate button
        generateRecipeBtn.disabled = false;
        generateRecipeBtn.textContent = 'Generate Recipe';
    }
    
    // Function to clear recipe
    function clearRecipe() {
        // Clear form inputs
        ingredientsInput.value = '';
        dietaryRestrictionsSelect.value = '';
        cookingTimeSelect.value = '15';
        
        // Clear recipe container
        recipeContainer.innerHTML = `
            <div class="recipe-placeholder">
                <div class="placeholder-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 19.5a2.5 2.5 0 0 0 2.5 2.5h14a2.5 2.5 0 0 0 2.5-2.5V6Z"></path><path d="M8.5 13.5a2.5 2.5 0 0 0 2.5 2.5h5a2.5 2.5 0 0 0 2.5-2.5V5a1 1 0 0 0-1-1h-11a1 1 0 0 0-1 1Z"></path></svg>
                </div>
                <h3>Your Recipe Will Appear Here</h3>
                <p>Fill in your ingredients and preferences, then click "Generate Recipe" to get started.</p>
            </div>
        `;
        
        // Ensure generate button is enabled
        generateRecipeBtn.disabled = false;
        generateRecipeBtn.textContent = 'Generate Recipe';
    }
});