# Recipe Generator Frontend

A modern, user-friendly web application that interacts with the Dify recipe generator API to create delicious recipes based on your available ingredients and dietary preferences.

## Features

- **Interactive Form**: Input your available ingredients, dietary restrictions, and maximum cooking time
- **Beautiful Recipe Display**: View generated recipes with formatted ingredients lists and step-by-step instructions
- **Responsive Design**: Works seamlessly on both desktop and mobile devices
- **Visual Feedback**: Loading indicators and error handling for a smooth user experience
- **Clean UI**: Modern design with attractive typography and layout

## Getting Started

### Prerequisites
- A modern web browser
- The API key is already included in the application

### Usage
1. Open `index.html` in your web browser
2. Enter the ingredients you have available in the "Available Ingredients" textarea
3. Select any dietary restrictions from the dropdown menu
4. Choose your maximum desired cooking time
5. Click the "Generate Recipe" button
6. View your custom-generated recipe with ingredients, instructions, and nutritional information
7. Use the "Clear Recipe" button to start over with new inputs

## API Integration

This frontend is designed to interact with the following API endpoint:

```
POST http://43.133.4.161/v1/chat-messages
```

### API Configuration
- **API Key**: `app-leipnjaB3KVYZnipINbHK6UY` (already included)
- **Request Format**: JSON
- **Response Handling**: Parses and displays recipe information including dish name, description, calories, cooking time, ingredients list, and instructions

## File Structure

- `index.html`: Main HTML structure of the application
- `style.css`: Comprehensive styling with modern design elements
- `script.js`: JavaScript functionality for form handling, API requests, and recipe display
- `README.md`: This documentation file

## Design Features

- **Typography**: Uses Playfair Display for headings and Inter for body text
- **Color Scheme**: Primary purple (#6b5ce7) with accent yellow (#f9a826)
- **Visual Elements**: SVG icons for enhanced user experience
- **Animations**: Subtle fade-in effects and loading spinner
- **Accessibility**: Proper semantic HTML and ARIA attributes

## Troubleshooting

- If the recipe generation fails, check your internet connection
- Ensure you've entered at least one ingredient before submitting
- For best results, provide specific and common ingredients
- If you encounter consistent errors, refresh the page and try again

## License

This project is for demonstration purposes only.