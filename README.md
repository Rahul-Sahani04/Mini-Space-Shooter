# 🚀 Stellar Conflict - Space Shooter Game

[![HTML5](https://img.shields.io/badge/html5-%23E34F26.svg?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/css3-%231572B6.svg?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

A fast-paced, retro-styled space shooter game built with vanilla JavaScript and modern web technologies. Battle through waves of enemies, collect power-ups, and achieve the highest score in this exciting arcade experience.



https://github.com/user-attachments/assets/ff61159e-dfe2-4fed-a5a3-4ebb70311995



## 🎮 Features

- **Smooth Gameplay**: Responsive controls and fluid animations
- **Multiple Enemy Types**: Face different enemy ships with unique behaviors
- **Power-up System**: Health, shields, and ammo power-ups
- **Dynamic Combat**: Engaging shooting mechanics with energy management
- **Particle Effects**: Stunning explosion animations and visual effects
- **Mobile Support**: Touch controls for mobile devices
- **Sound Effects**: Immersive audio experience with background music
- **Score System**: Track your progress and compete for high scores

## 🕹️ How to Play

### Controls
- **Arrow Keys**: Move your ship
- **Spacebar**: Fire weapons
- **Mobile**: Touch controls appear automatically on mobile devices

### Gameplay Tips
1. **Energy Management**:
   - Each shot consumes 10 energy points
   - Energy regenerates slowly over time
   - Destroy enemies to instantly gain 20 energy points
   - Look for ammo power-ups to restore 100 energy points

2. **Power-up System**:
   - Health (Green): Restores 30 HP
   - Shield (Blue): Adds 50 HP, can exceed 100 HP
   - Ammo (Yellow): Instantly restores 100 energy points
   - Enemies have a 30% chance to drop power-ups when destroyed

3. **Combat Strategy**:
   - Use dash (Shift key) to dodge enemy projectiles
   - Maintain offensive pressure to keep energy high through kills
   - Collect power-ups strategically based on your current needs
   - Try to achieve the highest score by destroying enemy ships

## 🛠️ Technical Details

### Technologies Used
- **HTML5 Canvas**: For rendering game graphics
- **JavaScript**: Game logic and animations
- **CSS3**: Styling and animations
- **TailwindCSS**: UI components and responsive design
- **Local Storage**: Saving high scores

### Asset Details
- Pixel art sprites for ships and effects
- Multiple animation frames for smooth movement
- Custom sound effects and background music
- Responsive UI elements

### Code Structure
```
├── index.html          # Main HTML file
├── styles.css         # Custom styles
├── game.js           # Game logic
└── assets/          # Game assets
    ├── PixelSpaceRage/  # Sprite assets
    └── audio/        # Sound effects
```

## 🚀 Getting Started

1. Clone the repository:
```bash
git clone https://github.com/Rahul-Sahani04/Mini-Space-Shooter.git
```

2. Open `index.html` in a modern web browser

3. Start playing!

## 🎨 Customization

### Adding New Enemies
The game supports easy addition of new enemy types by:
1. Adding sprite assets to the assets folder
2. Creating new enemy class instances with custom behavior
3. Adjusting spawn rates and patterns

### Modifying Gameplay
You can customize various aspects:
- Enemy spawn rates and patterns
- Player ship capabilities (speed, health, energy)
- Weapon systems (damage, energy cost)
- Power-up effects and drop rates
- Dash mechanics (speed, cooldown)
- Difficulty progression and scoring

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. Fork the repository
2. Create a new branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🙋‍♂️ Support

For support, email support@stellarconflict.com or open an issue in the GitHub repository.

## 🌟 Credits

- Game assets from [PixelSpaceRage](https://example.com)
- Sound effects from Space Music Pack
- Special thanks to all contributors!

## 🎯 Future Improvements
Some potential enhancements that could be added:

1. **Gameplay Mechanics**:
   - Different weapon types with unique energy costs and effects
   - Boss battles with special attack patterns
   - Shield system separate from health
   - Combo system for chain-killing enemies
   - Score multipliers for skillful play

2. **Visual and Audio**:
   - More varied enemy death animations
   - Particle effects for power-up collection
   - Screen shake for impactful moments
   - Additional background music tracks
   - Dynamic difficulty indicators

3. **Technical Improvements**:
   - High score leaderboard system
   - Save game progress
   - More mobile-friendly controls
   - Performance optimizations for projectile rendering
   - Additional enemy movement patterns

4. **Polish**:
   - Tutorial system for new players
   - Achievement system
   - More varied backgrounds
   - Power-up collection animations
   - Hit feedback effects
