// Include anime.js in your HTML

// Use anime.js to animate nodes
anime({
    targets: '.path',
    backgroundColor: '#FFEB3B', // Yellow for the path
    duration: 500,
    delay: anime.stagger(100) // Stagger the animation for each path node
});
