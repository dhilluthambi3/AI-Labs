document.addEventListener('DOMContentLoaded', () => {
    initializeGrid();
    document.getElementById('startButton').addEventListener('click', startPathfinding);
    document.getElementById('resetButton').addEventListener('click', resetGrid);
    document.getElementById('pauseResumeButton').addEventListener('click', togglePauseResume);
});

let startNode = null, endNode = null;
const gridSize = 10; // 10x10 grid
const grid = [];
let currentMode = 'start'; // Modes: 'start', 'end', 'obstacle'
let isPaused = false, currentAnimationStep = 0;


function initializeGrid() {
    const gridElement = document.getElementById('grid');
    let cellId = 0;
    for (let y = 0; y < gridSize; y++) {
        const row = [];
        for (let x = 0; x < gridSize; x++) {
            let cell = document.createElement('div');
            cell.className = 'grid-square';
            cell.dataset.x = x;
            cell.dataset.y = y;
            cell.textContent = cellId++;
            cell.addEventListener('click', () => handleCellClick(cell, x, y));
            cell.addEventListener('contextmenu', (event) => handleRightClick(cell, x, y, event));
            gridElement.appendChild(cell);
            row.push(new Node(x, y));
        }
        grid.push(row);
    }
}

function handleCellClick(cell, x, y) {
    if (currentMode === 'start' && !startNode) {
        setStartNode(cell, x, y);
    } else if (currentMode === 'end' && !endNode) {
        setEndNode(cell, x, y);
    } else if (currentMode === 'obstacle') {
        toggleObstacleNode(cell, x, y);
    }
}

function setStartNode(cell, x, y) {
    startNode = grid[y][x];
    cell.classList.add('start');
    if (!endNode) {
        currentMode = 'end';
    }
}

function setEndNode(cell, x, y) {
    endNode = grid[y][x];
    cell.classList.add('end');
    currentMode = 'obstacle';
}

function toggleObstacleNode(cell, x, y) {
    grid[y][x].isWall = !grid[y][x].isWall;
    cell.classList.toggle('wall');
}

function handleRightClick(cell, x, y, event) {
    event.preventDefault(); // Prevent the default right-click menu

    if (cell.classList.contains('start')) {
        startNode = null;
        cell.className = 'grid-square';
        currentMode = 'start';
    } else if (cell.classList.contains('end')) {
        endNode = null;
        cell.className = 'grid-square';
        currentMode = startNode ? 'end' : 'start'; // Switch to 'end' mode if start node exists
    } else if (cell.classList.contains('wall')) {
        grid[y][x].isWall = false;
        cell.className = 'grid-square';
        // If both start and end nodes are set, remain in 'obstacle' mode
        if (!startNode || !endNode) {
            currentMode = startNode ? 'end' : 'start';
        }
    }
}

function startPathfinding() {
    if (!startNode || !endNode) {
        alert("Please select a start and end node.");
        return;
    }
    document.getElementById('startButton').disabled = true; // Disable the start button
    aStar(startNode, endNode, heuristic);
}

function resetGrid() {
    startNode = null;
    endNode = null;
    currentMode = 'start'; // Reset the current mode to 'start'

    grid.forEach(row => row.forEach(node => {
        node.reset();
    }));

    // Clear all styles and classes from each cell
    document.querySelectorAll('.grid-square').forEach(cell => {
        cell.className = 'grid-square';
        cell.style.backgroundColor = ''; // Reset background color
    });

    // Additionally, if you are using anime.js, you might need to remove the targets from its animations
    anime.remove('.grid-square');

    document.getElementById('heuristicDetails').innerHTML = '';
    document.getElementById('startButton').disabled = false; // Re-enable the start button
}

function togglePauseResume() {
    isPaused = !isPaused;
    let pauseResumeButton = document.getElementById('pauseResumeButton');
    pauseResumeButton.textContent = isPaused ? 'Resume' : 'Pause';
    if (!isPaused) {
        reconstructPath(grid[endNode.y][endNode.x]);
    }
}


class Node {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.isWall = false;
        this.parent = null;
        this.g = 0;
        this.h = 0;
        this.f = 0;
    }

    reset() {
        this.isWall = false;
        this.parent = null;
        this.g = 0;
        this.h = 0;
        this.f = 0;
    }
}

function aStar(start, goal, heuristic) {
    let openSet = [start];
    let closedSet = [];
    let heuristicDetailsElement = document.getElementById('heuristicDetails');
    heuristicDetailsElement.innerHTML = ''; // Clear previous details

    while (openSet.length > 0) {
        let current = openSet.reduce((a, b) => a.f < b.f ? a : b);

        if (current === goal) {
            updateHeuristicExplanation(current, openSet, closedSet, goal);
            reconstructPath(goal);
            return;
        }

        openSet = openSet.filter(node => node !== current);
        closedSet.push(current);

        getNeighbors(current).forEach(neighbor => {
            if (closedSet.includes(neighbor) || neighbor.isWall) {
                return;
            }

            let tentativeG = current.g + 1;

            if (!openSet.includes(neighbor)) {
                openSet.push(neighbor);
            } else if (tentativeG >= neighbor.g) {
                return;
            }

            neighbor.parent = current;
            neighbor.g = tentativeG;
            neighbor.h = heuristic(neighbor, goal);
            neighbor.f = neighbor.g + neighbor.h;
        });

        updateHeuristicExplanation(current, openSet, closedSet, goal);
    }

    alert("No path found");
}

function updateHeuristicExplanation(current, openSet, closedSet, goal) {
    let heuristicDetailsElement = document.getElementById('heuristicDetails');
    let nodeNumber = current.y * gridSize + current.x;
    let newNodeInfo = document.createElement('div');
    
    newNodeInfo.innerHTML = `
        <strong>Node ${nodeNumber} Details:</strong>
        <ul>
            <li>g (Cost from start): ${current.g}</li>
            <li>h (Heuristic estimate to goal): ${current.h}</li>
            <li>f (Total cost): ${current.f}</li>
        </ul>
        <strong>Open Set:</strong> [${openSet.map(n => n.y * gridSize + n.x).join(', ')}]<br>
        <strong>Closed Set:</strong> [${closedSet.map(n => n.y * gridSize + n.x).join(', ')}]<br>
        <hr>`;

    heuristicDetailsElement.appendChild(newNodeInfo);
}



function getNeighbors(node) {
    const neighbors = [];
    const {x, y} = node;

    // Add neighbor nodes (up, right, down, left)
    if (x > 0) neighbors.push(grid[y][x - 1]);
    if (y > 0) neighbors.push(grid[y - 1][x]);
    if (x < gridSize - 1) neighbors.push(grid[y][x + 1]);
    if (y < gridSize - 1) neighbors.push(grid[y + 1][x]);

    return neighbors;
}

function heuristic(node, goal) {
    // Manhattan distance
    return Math.abs(node.x - goal.x) + Math.abs(node.y - goal.y);
}

function reconstructPath(goal) {
    let currentNode = goal;
    let pathNodes = [];
    while (currentNode !== startNode) {
        pathNodes.push(currentNode);
        currentNode = currentNode.parent;
    }
    pathNodes.push(startNode); // Include the start node
    pathNodes.reverse();

    const animationDelay = 500; // 500 milliseconds for each step
    pathNodes.forEach((node, index) => {
        setTimeout(() => {
            let cell = document.querySelector(`[data-x="${node.x}"][data-y="${node.y}"]`);
            cell.classList.add('path');
            updateHeuristicExplanation(node, [], [], goal); // Update with empty open/closed sets for path
        }, index * animationDelay);
    });

    setTimeout(() => {
        animatePath(pathNodes.map(node => document.querySelector(`[data-x="${node.x}"][data-y="${node.y}"]`)));
    }, pathNodes.length * animationDelay);
}

function animatePath(pathNodes) {
    // Assuming you have an animation function like anime.js
    anime({
        targets: pathNodes,
        backgroundColor: '#FFEB3B', // Yellow for the path
        duration: 500,
        delay: anime.stagger(100) // Stagger the animation for each path node
    });
}



