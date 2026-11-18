
const $ = id => document.getElementById(id);

const GAME_INFO = {
  chess: {
    name: "Chess",
    inputs: ["Board", "Legal Moves", "Current Turn", "Piece At Position", "Is Check", "Opponent Threats"],
    outputs: ["Choose Move"],
  },
  connect4: {
    name: "Puissance 4",
    inputs: ["Board", "Available Columns", "Current Player", "Column Height", "Winning Threats"],
    outputs: ["Choose Column"],
  },
  pingpong: {
    name: "3D Ping Pong",
    inputs: ["Ball Position X", "Ball Position Y", "Ball Position Z", "Ball Velocity", "Paddle Position", "Ball Approaching"],
    outputs: ["Paddle Target X", "Paddle Target Y", "Serve"],
  },
  racing: {
    name: "Racing AI",
    inputs: ["Speed", "Front Distance", "Front Left Distance", "Front Right Distance", "Left Distance", "Right Distance", "Rear Distance", "Opponent Distance", "Heading"],
    outputs: ["Throttle", "Brake", "Steering"],
  },
  snake: {
    name: "Snake",
    inputs: ["Snake Position", "Snake Direction", "Food Position", "Body Positions", "Wall Distances", "Available Directions"],
    outputs: ["Choose Direction"],
  }
};

const NODE_TYPES = {
  event: {
    label: "START / EVENT",
    category: "EVENTS",
    color: "#8b68ff",
    description: "Déclenche l'exécution du bot."
  },
  input: {
    label: "GAME INPUT",
    category: "GAME INPUTS",
    color: "#278eae",
    description: "Récupère une information du jeu."
  },
  variable: {
    label: "VARIABLE",
    category: "VARIABLES",
    color: "#b47be9",
    description: "Stocke une valeur."
  },
  number: {
    label: "NUMBER",
    category: "VALUES",
    color: "#4d9ce0",
    description: "Une valeur numérique."
  },
  boolean: {
    label: "BOOLEAN",
    category: "VALUES",
    color: "#4d9ce0",
    description: "Une valeur vraie ou fausse."
  },
  compare: {
    label: "COMPARISON",
    category: "LOGIC",
    color: "#d29c49",
    description: "Compare deux valeurs."
  },
  math: {
    label: "MATH",
    category: "LOGIC",
    color: "#d29c49",
    description: "Effectue une opération mathématique."
  },
  condition: {
    label: "IF / ELSE",
    category: "LOGIC",
    color: "#d29c49",
    description: "Exécute une branche selon une condition."
  },
  random: {
    label: "RANDOM",
    category: "LOGIC",
    color: "#d29c49",
    description: "Génère une valeur aléatoire."
  },
  output: {
    label: "GAME OUTPUT",
    category: "GAME OUTPUTS",
    color: "#39b98d",
    description: "Envoie une décision au jeu."
  }
};

let currentGame = "chess";
let selectedGame = "chess";
let nodes = [];
let selectedNode = null;
let savedBots = JSON.parse(localStorage.getItem("neonlab_bots") || "[]");
let dragging = null;

function showPage(page) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  $(page + "-page").classList.add("active");

  document.querySelectorAll(".nav-button").forEach(b => {
    b.classList.toggle("active", b.dataset.page === page);
  });

  const titles = {
    games: "Game Library",
    bots: "My Bots",
    editor: "Visual Bot Editor",
    arena: "Bot Arena"
  };

  $("page-title").textContent = titles[page] || "Game Session";

  if (page === "bots") renderBots();
  if (page === "editor") refreshEditor();
}

function selectGame(game) {
  selectedGame = game;
  currentGame = game;
  $("selected-game-title").textContent = GAME_INFO[game].name.toUpperCase();
  $("game-page").classList.add("active");
  document.querySelectorAll(".page:not(#game-page)").forEach(p => p.classList.remove("active"));
  document.querySelectorAll(".nav-button").forEach(b => b.classList.remove("active"));

  if (game === "connect4") renderConnect4();
  else if (game === "snake") renderSnake();
  else if (game === "chess") renderChess();
  else if (game === "pingpong") renderPingPong();
  else if (game === "racing") renderRacing();
}

$("editor-game").addEventListener("change", e => {
  currentGame = e.target.value;
  nodes = [];
  selectedNode = null;
  refreshEditor();
});

function refreshEditor() {
  currentGame = $("editor-game").value;
  $("workspace-game").textContent = GAME_INFO[currentGame].name.toUpperCase();
  renderNodeLibrary();
  renderNodes();
}

function renderNodeLibrary() {
  const root = $("node-library-content");
  root.innerHTML = "";

  const categories = [...new Set(Object.values(NODE_TYPES).map(n => n.category))];

  categories.forEach(category => {
    const title = document.createElement("div");
    title.className = "node-category";
    title.textContent = category;
    root.appendChild(title);

    Object.entries(NODE_TYPES).filter(([key, node]) => node.category === category).forEach(([key, node]) => {
      const button = document.createElement("button");
      button.className = "library-node";
      button.textContent = "+ " + node.label;
      button.onclick = () => addNode(key);
      root.appendChild(button);
    });
  });

  const inputs = document.createElement("div");
  inputs.className = "node-category";
  inputs.textContent = "AVAILABLE INPUTS";
  root.appendChild(inputs);

  GAME_INFO[currentGame].inputs.forEach(input => {
    const button = document.createElement("button");
    button.className = "library-node";
    button.textContent = "+ " + input;
    button.onclick = () => addNode("input", input);
    root.appendChild(button);
  });

  const outputs = document.createElement("div");
  outputs.className = "node-category";
  outputs.textContent = "AVAILABLE OUTPUTS";
  root.appendChild(outputs);

  GAME_INFO[currentGame].outputs.forEach(output => {
    const button = document.createElement("button");
    button.className = "library-node";
    button.textContent = "+ " + output;
    button.onclick = () => addNode("output", output);
    root.appendChild(button);
  });
}

function addNode(type, specific = "") {
  const definition = NODE_TYPES[type];
  const node = {
    id: crypto.randomUUID(),
    type,
    label: specific || definition.label,
    x: 50 + Math.random() * 120,
    y: 50 + Math.random() * 120,
    value: type === "number" ? 0 : "",
    operation: ">"
  };

  nodes.push(node);
  selectedNode = node.id;
  renderNodes();
}

function renderNodes() {
  const canvas = $("node-canvas");
  canvas.querySelectorAll(".visual-node").forEach(n => n.remove());

  $("empty-message").style.display = nodes.length ? "none" : "grid";

  nodes.forEach(node => {
    const definition = NODE_TYPES[node.type];
    const element = document.createElement("div");
    element.className = "visual-node" + (selectedNode === node.id ? " selected" : "");
    element.style.left = node.x + "px";
    element.style.top = node.y + "px";
    element.dataset.id = node.id;

    const header = document.createElement("div");
    header.className = "node-header";
    header.style.background = definition.color;
    header.style.color = "#071018";
    header.textContent = node.label;

    const body = document.createElement("div");
    body.className = "node-body";
    body.textContent = definition.description;

    if (node.type === "number" || node.type === "variable") {
      const input = document.createElement("input");
      input.value = node.value;
      input.placeholder = "Value";
      input.addEventListener("input", e => {
        node.value = e.target.value;
      });
      body.appendChild(input);
    }

    if (node.type === "compare") {
      const select = document.createElement("select");
      [">", "<", "==", "!=", ">=", "<="].forEach(op => {
        const option = document.createElement("option");
        option.value = op;
        option.textContent = op;
        select.appendChild(option);
      });
      select.value = node.operation;
      select.onchange = e => node.operation = e.target.value;
      body.appendChild(select);
    }

    element.append(header, body);
    element.addEventListener("mousedown", e => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "SELECT") return;
      selectedNode = node.id;
      dragging = {
        id: node.id,
        startX: e.clientX,
        startY: e.clientY,
        originalX: node.x,
        originalY: node.y
      };
      renderProperties();
      renderNodes();
    });

    element.addEventListener("click", () => {
      selectedNode = node.id;
      renderProperties();
      renderNodes();
    });

    canvas.appendChild(element);
  });

  renderProperties();
}

window.addEventListener("mousemove", e => {
  if (!dragging) return;
  const node = nodes.find(n => n.id === dragging.id);
  if (!node) return;

  node.x = Math.max(0, dragging.originalX + e.clientX - dragging.startX);
  node.y = Math.max(0, dragging.originalY + e.clientY - dragging.startY);

  const element = document.querySelector(`[data-id="${node.id}"]`);
  if (element) {
    element.style.left = node.x + "px";
    element.style.top = node.y + "px";
  }
});

window.addEventListener("mouseup", () => dragging = null);

function renderProperties() {
  const root = $("properties-content");
  root.innerHTML = "";

  const node = nodes.find(n => n.id === selectedNode);

  if (!node) {
    root.textContent = "Sélectionne un bloc pour modifier ses paramètres.";
    return;
  }

  const title = document.createElement("b");
  title.textContent = node.label;

  const description = document.createElement("p");
  description.textContent = NODE_TYPES[node.type].description;

  const remove = document.createElement("button");
  remove.className = "secondary-button";
  remove.textContent = "DELETE NODE";
  remove.onclick = () => {
    nodes = nodes.filter(n => n.id !== node.id);
    selectedNode = null;
    renderNodes();
  };

  root.append(title, description, remove);
}

function saveBot() {
  const name = $("bot-name").value.trim() || "Unnamed Bot";
  const bot = {
    id: crypto.randomUUID(),
    name,
    game: currentGame,
    nodes: structuredClone(nodes),
    updated: new Date().toISOString()
  };

  savedBots = savedBots.filter(b => b.name !== name || b.game !== currentGame);
  savedBots.push(bot);
  localStorage.setItem("neonlab_bots", JSON.stringify(savedBots));
  alert("Bot saved!");
}

function exportBot() {
  const data = {
    format: "NEONLAB_BOT",
    version: 1,
    game: currentGame,
    name: $("bot-name").value,
    nodes
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], {type: "application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "neonlab-bot.json";
  a.click();
  URL.revokeObjectURL(url);
}

function renderBots() {
  const root = $("bot-list");
  root.innerHTML = "";

  if (!savedBots.length) {
    root.textContent = "Aucun bot sauvegardé pour le moment.";
    return;
  }

  savedBots.forEach(bot => {
    const card = document.createElement("div");
    card.className = "bot-item";

    const title = document.createElement("b");
    title.textContent = bot.name;

    const description = document.createElement("p");
    description.textContent = `${GAME_INFO[bot.game]?.name || bot.game} · ${bot.nodes.length} nodes`;

    const edit = document.createElement("button");
    edit.className = "secondary-button";
    edit.textContent = "EDIT";
    edit.onclick = () => {
      $("editor-game").value = bot.game;
      $("bot-name").value = bot.name;
      currentGame = bot.game;
      nodes = structuredClone(bot.nodes);
      showPage("editor");
    };

    card.append(title, description, edit);
    root.appendChild(card);
  });
}

// Import sécurisé des bots JSON
const importButton = document.createElement("input");
importButton.type = "file";
importButton.accept = ".json,application/json";
importButton.hidden = true;
document.body.appendChild(importButton);

const importLabel = document.createElement("button");
importLabel.className = "secondary-button";
importLabel.textContent = "IMPORT BOT";
importLabel.onclick = () => importButton.click();
$("editor-game").parentElement.appendChild(importLabel);
importLabel.after(importButton);

importButton.addEventListener("change", async () => {
  const file = importButton.files[0];
  if (!file) return;

  try {
    const data = JSON.parse(await file.text());
    if (data.format !== "NEONLAB_BOT" || data.version !== 1) throw new Error("Format incompatible");
    if (!GAME_INFO[data.game] || !Array.isArray(data.nodes)) throw new Error("Bot invalide");

    currentGame = data.game;
    $("editor-game").value = data.game;
    $("bot-name").value = data.name || "Imported Bot";
    nodes = data.nodes;
    refreshEditor();
    alert("Bot imported!");
  } catch (error) {
    alert("Import impossible : " + error.message);
  }

  importButton.value = "";
});

// =====================================================
// GAMES
// =====================================================

function renderChess() {
  $("game-container").innerHTML = `
    <div class="arena-panel">
      <h3>CHESS</h3>
      <p>Le moteur d'échecs sera ajouté dans la prochaine partie.</p>
    </div>`;
}

function renderConnect4() {
  let board = Array.from({length: 6}, () => Array(7).fill(0));

  $("game-container").innerHTML = `
    <div style="text-align:center">
      <h3>PUISSANCE 4</h3>
      <p id="connect-status">À toi de jouer — jaune</p>
      <div id="connect-board" style="display:grid;grid-template-columns:repeat(7,48px);gap:6px;justify-content:center;background:#1748a0;padding:12px;border-radius:12px;width:max-content;margin:20px auto"></div>
      <button class="secondary-button" id="connect-reset">RESET</button>
    </div>`;

  const root = $("connect-board");
  let turn = 1;
  let finished = false;

  function draw() {
    root.innerHTML = "";
    board.forEach((row, r) => row.forEach((value, c) => {
      const cell = document.createElement("button");
      cell.style.cssText = `width:48px;height:48px;border-radius:50%;border:0;background:${value === 1 ? "#ffd83d" : value === 2 ? "#ef5365" : "#091d48"};`;
      cell.onclick = () => play(c);
      root.appendChild(cell);
    }));
  }

  function play(column) {
    if (finished) return;
    for (let r = 5; r >= 0; r--) {
      if (!board[r][column]) {
        board[r][column] = turn;
        break;
      }
      if (r === 0) return;
    }

    draw();

    if (checkWin(turn)) {
      $("connect-status").textContent = turn === 1 ? "Jaune gagne !" : "Rouge gagne !";
      finished = true;
      return;
    }

    if (board.every(row => row.every(Boolean))) {
      $("connect-status").textContent = "Match nul !";
      finished = true;
      return;
    }

    turn = turn === 1 ? 2 : 1;
    $("connect-status").textContent = turn === 1 ? "À toi de jouer — jaune" : "Rouge joue";
    if (turn === 2) setTimeout(() => {
      const available = board[0].map((v, i) => v ? -1 : i).filter(i => i >= 0);
      if (available.length) play(available[Math.floor(Math.random() * available.length)]);
    }, 350);
  }

  function checkWin(player) {
    const directions = [[0,1],[1,0],[1,1],[1,-1]];
    for (let r = 0; r < 6; r++) for (let c = 0; c < 7; c++) {
      for (const [dr, dc] of directions) {
        let count = 0;
        for (let k = 0; k < 4; k++) {
          const rr = r + dr*k, cc = c + dc*k;
          if (rr >= 0 && rr < 6 && cc >= 0 && cc < 7 && board[rr][cc] === player) count++;
        }
        if (count === 4) return true;
      }
    }
    return false;
  }

  $("connect-reset").onclick = () => {
    board = Array.from({length: 6}, () => Array(7).fill(0));
    turn = 1;
    finished = false;
    $("connect-status").textContent = "À toi de jouer — jaune";
    draw();
  };

  draw();
}

function renderSnake() {
  $("game-container").innerHTML = `
    <div style="text-align:center">
      <h3>SNAKE</h3>
      <p>Utilise les flèches du clavier.</p>
      <canvas id="snake-canvas" width="400" height="400" style="max-width:100%;background:#07130f;border:1px solid #35e6db;border-radius:8px"></canvas>
      <p id="snake-score">Score : 0</p>
      <button class="primary-button" id="snake-start">START / RESTART</button>
    </div>`;

  const canvas = $("snake-canvas");
  const ctx = canvas.getContext("2d");
  const size = 20;
  let snake, food, direction, score, timer, running;

  function start() {
    clearInterval(timer);
    snake = [{x:10,y:10},{x:9,y:10},{x:8,y:10}];
    food = {x:15,y:10};
    direction = {x:1,y:0};
    score = 0;
    running = true;
    $("snake-score").textContent = "Score : 0";
    draw();
    timer = setInterval(step, 110);
  }

  function draw() {
    ctx.fillStyle = "#07130f";
    ctx.fillRect(0,0,400,400);
    ctx.fillStyle = "#35e6db";
    snake.forEach(p => ctx.fillRect(p.x*size+2,p.y*size+2,16,16));
    ctx.fillStyle = "#ff526d";
    ctx.fillRect(food.x*size+2,food.y*size+2,16,16);
  }

  function step() {
    if (!running) return;
    const head = {x:snake[0].x+direction.x,y:snake[0].y+direction.y};
    if (head.x<0 || head.x>=20 || head.y<0 || head.y>=20 || snake.some(p=>p.x===head.x&&p.y===head.y)) {
      running = false;
      clearInterval(timer);
      $("snake-score").textContent = `Game Over — Score : ${score}`;
      return;
    }

    snake.unshift(head);
    if (head.x===food.x && head.y===food.y) {
      score++;
      $("snake-score").textContent = `Score : ${score}`;
      food = {x:Math.floor(Math.random()*20),y:Math.floor(Math.random()*20)};
    } else snake.pop();

    draw();
  }

  document.onkeydown = e => {
    const dirs = {
      ArrowUp:{x:0,y:-1},
      ArrowDown:{x:0,y:1},
      ArrowLeft:{x:-1,y:0},
      ArrowRight:{x:1,y:0}
    };
    const next = dirs[e.key];
    if (next && next.x !== -direction.x && next.y !== -direction.y) {
      direction = next;
      e.preventDefault();
    }
  };

  $("snake-start").onclick = start;
  start();
}

function renderPingPong() {
  $("game-container").innerHTML = `
    <div style="text-align:center">
      <h3>3D PING PONG</h3>
      <p>Prototype 3D à venir : table, balle, raquettes et physique.</p>
      <div id="three-ping" style="height:350px;background:#071018;border-radius:10px"></div>
    </div>`;

  if (!window.THREE) return;
  const host = $("three-ping");
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x071018);
  const camera = new THREE.PerspectiveCamera(55, host.clientWidth/350, .1, 100);
  camera.position.set(0,5,9);
  camera.lookAt(0,0,0);

  const renderer = new THREE.WebGLRenderer({antialias:true});
  renderer.setSize(host.clientWidth,350);
  host.appendChild(renderer.domElement);

  scene.add(new THREE.HemisphereLight(0xffffff,0x334455,2));

  const table = new THREE.Mesh(
    new THREE.BoxGeometry(5,.2,2.8),
    new THREE.MeshStandardMaterial({color:0x176b9a})
  );
  scene.add(table);

  const net = new THREE.Mesh(
    new THREE.BoxGeometry(5,.35,.06),
    new THREE.MeshStandardMaterial({color:0xffffff})
  );
  net.position.y=.25;
  scene.add(net);

  const ball = new THREE.Mesh(
    new THREE.SphereGeometry(.13,20,20),
    new THREE.MeshStandardMaterial({color:0xffe14a})
  );
  ball.position.set(0,1,0);
  scene.add(ball);

  let t = 0;
  function animate() {
    if (!host.isConnected) {
      renderer.dispose();
      return;
    }
    requestAnimationFrame(animate);
    t += .025;
    ball.position.set(Math.sin(t)*1.7, .8+Math.abs(Math.sin(t*2))*.8, Math.cos(t)*.8);
    renderer.render(scene,camera);
  }
  animate();
}

function renderRacing() {
  $("game-container").innerHTML = `
    <div style="text-align:center">
      <h3>RACING AI</h3>
      <p>Prototype de circuit généré aléatoirement à venir.</p>
      <div id="three-racing" style="height:350px;background:#071018;border-radius:10px"></div>
    </div>`;

  if (!window.THREE) return;
  const host = $("three-racing");
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x182b26);

  const camera = new THREE.PerspectiveCamera(60,host.clientWidth/350,.1,100);
  camera.position.set(0,12,15);
  camera.lookAt(0,0,0);

  const renderer = new THREE.WebGLRenderer({antialias:true});
  renderer.setSize(host.clientWidth,350);
  host.appendChild(renderer.domElement);

  scene.add(new THREE.HemisphereLight(0xffffff,0x334433,2));

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(60,60),
    new THREE.MeshStandardMaterial({color:0x28603e})
  );
  ground.rotation.x=-Math.PI/2;
  scene.add(ground);

  const track = new THREE.Mesh(
    new THREE.RingGeometry(7,13,64),
    new THREE.MeshStandardMaterial({color:0x333a45,side:THREE.DoubleSide})
  );
  track.rotation.x=-Math.PI/2;
  track.position.y=.05;
  scene.add(track);

  function makeCar(color,x,z) {
    const car = new THREE.Mesh(
      new THREE.BoxGeometry(1.1,.5,2),
      new THREE.MeshStandardMaterial({color})
    );
    car.position.set(x,.4,z);
    scene.add(car);
  }

  makeCar(0x35e6db,0,-9);
  makeCar(0xff536f,3,-9);

  const animate=()=>{
    if(!host.isConnected){renderer.dispose();return;}
    requestAnimationFrame(animate);
    renderer.render(scene,camera);
  };
  animate();
}

// Initialisation
renderNodeLibrary();
renderNodes();
showPage("games");
