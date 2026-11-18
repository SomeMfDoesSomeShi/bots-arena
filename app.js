
"use strict";

/* =========================================================
   BOTS ARENA 2.0
   Visual graph editor + game engines
   ========================================================= */

const $ = id => document.getElementById(id);
const STORAGE_KEY = "bots_arena_user_bots_v2";

const GAMES = {
  chess: {
    name: "Chess", icon: "♟", category: "STRATEGY",
    description: "Échecs classiques contre un bot programmable.",
    inputs: [
      ["legalMoveCount", "Legal move count", "number"],
      ["legalMoves", "Legal moves", "list"],
      ["currentTurn", "Current turn", "text"],
      ["isCheck", "Is check", "boolean"],
      ["isCheckmate", "Is checkmate", "boolean"],
      ["board", "Board", "list"],
      ["myKingX", "My king X", "number"],
      ["myKingY", "My king Y", "number"]
    ],
    outputs: [["moveIndex", "Move index", "number"]]
  },
  connect4: {
    name: "Puissance 4", icon: "🟡", category: "STRATEGY",
    description: "Aligne quatre jetons avant ton adversaire.",
    inputs: [
      ["availableColumns", "Available columns", "list"],
      ["board", "Board", "list"],
      ["currentPlayer", "Current player", "number"],
      ["winningColumns", "Winning columns", "list"],
      ["opponentThreats", "Opponent threats", "number"]
    ],
    outputs: [["column", "Choose column", "number"]]
  },
  pingpong: {
    name: "3D Ping Pong", icon: "🏓", category: "3D PHYSICS",
    description: "Contrôle une raquette dans un environnement 3D.",
    inputs: [
      ["ballX", "Ball X", "number"],
      ["ballY", "Ball Y", "number"],
      ["ballZ", "Ball Z", "number"],
      ["ballVelocityX", "Ball velocity X", "number"],
      ["ballVelocityY", "Ball velocity Y", "number"],
      ["ballVelocityZ", "Ball velocity Z", "number"],
      ["paddleX", "Paddle X", "number"],
      ["paddleY", "Paddle Y", "number"],
      ["ballApproaching", "Ball approaching", "boolean"]
    ],
    outputs: [
      ["paddleTargetX", "Paddle target X", "number"],
      ["paddleTargetY", "Paddle target Y", "number"]
    ]
  },
  racing: {
    name: "Racing AI", icon: "🏎️", category: "SIMULATION",
    description: "Pilote sur un circuit généré aléatoirement.",
    inputs: [
      ["speed", "Speed", "number"],
      ["frontDistance", "Front distance", "number"],
      ["frontLeftDistance", "Front-left distance", "number"],
      ["frontRightDistance", "Front-right distance", "number"],
      ["leftDistance", "Left distance", "number"],
      ["rightDistance", "Right distance", "number"],
      ["rearDistance", "Rear distance", "number"],
      ["heading", "Heading", "number"],
      ["trackDirection", "Track direction", "number"],
      ["opponentDistance", "Opponent distance", "number"]
    ],
    outputs: [
      ["throttle", "Throttle", "number"],
      ["brake", "Brake", "number"],
      ["steering", "Steering", "number"]
    ]
  },
  snake: {
    name: "Snake", icon: "🐍", category: "ARCADE",
    description: "Dirige le serpent et récupère la nourriture.",
    inputs: [
      ["headX", "Head X", "number"],
      ["headY", "Head Y", "number"],
      ["foodX", "Food X", "number"],
      ["foodY", "Food Y", "number"],
      ["direction", "Current direction", "number"],
      ["body", "Body positions", "list"],
      ["availableDirections", "Available directions", "list"]
    ],
    outputs: [["direction", "Choose direction", "number"]]
  }
};

const NODE_DEFS = {
  event: {
    label: "START / EVENT", category: "EVENTS", color: "#e5e7eb",
    description: "Déclenche le programme à chaque décision.",
    outputs: [["next", "Next", "exec"]]
  },
  inputs: {
    label: "GAME INPUTS", category: "GAME", color: "#369bc0",
    description: "Toutes les données disponibles du jeu.",
    dynamic: "gameInputs"
  },
  outputs: {
    label: "GAME OUTPUTS", category: "GAME", color: "#36b98d",
    description: "Les commandes envoyées au jeu.",
    dynamic: "gameOutputs"
  },
  number: {
    label: "NUMBER", category: "VALUES", color: "#438fe0",
    description: "Une valeur numérique.",
    outputs: [["value", "Value", "number"]]
  },
  boolean: {
    label: "BOOLEAN", category: "VALUES", color: "#438fe0",
    description: "Une valeur vraie ou fausse.",
    outputs: [["value", "Value", "boolean"]]
  },
  text: {
    label: "TEXT", category: "VALUES", color: "#438fe0",
    description: "Une chaîne de caractères.",
    outputs: [["value", "Value", "text"]]
  },
  math: {
    label: "MATH", category: "MATH", color: "#bd8b42",
    description: "Effectue une opération mathématique.",
    inputs: [["a", "A", "number"], ["b", "B", "number"]],
    outputs: [["value", "Result", "number"]]
  },
  compare: {
    label: "COMPARISON", category: "LOGIC", color: "#d19a47",
    description: "Compare deux valeurs.",
    inputs: [["a", "A", "number"], ["b", "B", "number"]],
    outputs: [["result", "Result", "boolean"]]
  },
  logic: {
    label: "LOGIC", category: "LOGIC", color: "#d19a47",
    description: "Effectue une opération logique.",
    inputs: [["a", "A", "boolean"], ["b", "B", "boolean"]],
    outputs: [["result", "Result", "boolean"]]
  },
  if: {
    label: "IF / ELSE", category: "LOGIC", color: "#d19a47",
    description: "Choisit une valeur selon une condition.",
    inputs: [
      ["condition", "Condition", "boolean"],
      ["yes", "If true", "any"],
      ["no", "If false", "any"]
    ],
    outputs: [["result", "Result", "any"]]
  },
  random: {
    label: "RANDOM", category: "MATH", color: "#bd8b42",
    description: "Génère un nombre aléatoire.",
    inputs: [["min", "Minimum", "number"], ["max", "Maximum", "number"]],
    outputs: [["value", "Value", "number"]]
  },
  clamp: {
    label: "CLAMP", category: "MATH", color: "#bd8b42",
    description: "Limite une valeur entre deux bornes.",
    inputs: [
      ["value", "Value", "number"],
      ["min", "Minimum", "number"],
      ["max", "Maximum", "number"]
    ],
    outputs: [["result", "Result", "number"]]
  },
  variable: {
    label: "VARIABLE", category: "VARIABLES", color: "#a77be7",
    description: "Stocke une valeur ou récupère sa valeur.",
    inputs: [["value", "Value", "any"]],
    outputs: [["result", "Stored value", "any"]]
  },
  listLength: {
    label: "LIST LENGTH", category: "LISTS", color: "#3ab88c",
    description: "Retourne le nombre d'éléments d'une liste.",
    inputs: [["list", "List", "list"]],
    outputs: [["length", "Length", "number"]]
  },
  listGet: {
    label: "LIST GET", category: "LISTS", color: "#3ab88c",
    description: "Récupère un élément à un index donné.",
    inputs: [["list", "List", "list"], ["index", "Index", "number"]],
    outputs: [["value", "Value", "any"]]
  }
};

let currentPage = "games";
let currentGame = "chess";
let selectedNodeId = null;
let pendingPort = null;
let graph = { nodes: [], connections: [] };
let userBots = loadUserBots();
let defaultBots = {};
let gameCleanup = null;
let activeBotId = null;
let dragState = null;
let currentGameSession = null;

/* =========================================================
   STORAGE / NAVIGATION
   ========================================================= */

function loadUserBots() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function saveUserBotsStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(userBots));
}

function showPage(page) {
  if (gameCleanup) {
    gameCleanup();
    gameCleanup = null;
  }

  currentPage = page;
  document.querySelectorAll(".page").forEach(el => el.classList.remove("active"));
  const target = $(page + "-page");
  if (target) target.classList.add("active");

  document.querySelectorAll(".nav").forEach(el => {
    el.classList.toggle("active", el.dataset.page === page);
  });

  const titles = {
    games: "Game library",
    editor: "Bot editor",
    bots: "My bots",
    arena: "Bot arena"
  };
  $("page-title").textContent = titles[page] || "Game session";

  if (page === "bots") renderBotList();
  if (page === "editor") renderEditor();
}

document.querySelectorAll(".nav").forEach(button => {
  button.addEventListener("click", () => showPage(button.dataset.page));
});

function renderGameLibrary() {
  $("game-grid").innerHTML = "";
  Object.entries(GAMES).forEach(([id, game]) => {
    const card = document.createElement("article");
    card.className = "game-card";
    card.innerHTML = `
      <div class="game-art ${id}">${game.icon}</div>
      <div class="game-info">
        <span class="tag">${game.category}</span>
        <h3>${game.name}</h3>
        <p>${game.description}</p>
        <button>OPEN GAME →</button>
      </div>`;
    card.addEventListener("click", () => openGame(id));
    $("game-grid").appendChild(card);
  });
}

function openGame(game) {
  currentGame = game;
  $("game-title").textContent = GAMES[game].name.toUpperCase();
  $("game-page").classList.add("active");
  document.querySelectorAll(".page:not(#game-page)").forEach(p => p.classList.remove("active"));
  document.querySelectorAll(".nav").forEach(n => n.classList.remove("active"));
  buildGameOptions(game);
  startGame(game);
}

function buildGameOptions(game) {
  const options = $("game-options");
  options.innerHTML = "";

  const label = document.createElement("label");
  label.textContent = "BOT : ";
  const select = document.createElement("select");
  select.id = "active-bot-select";

  const builtIn = document.createElement("option");
  builtIn.value = "default";
  builtIn.textContent = "Built-in bot";
  select.appendChild(builtIn);

  userBots.filter(b => b.game === game).forEach(bot => {
    const option = document.createElement("option");
    option.value = bot.id;
    option.textContent = bot.name;
    select.appendChild(option);
  });

  if (activeBotId && userBots.some(b => b.id === activeBotId && b.game === game)) {
    select.value = activeBotId;
  }

  select.addEventListener("change", () => {
    activeBotId = select.value === "default" ? null : select.value;
    if (currentGameSession?.restart) currentGameSession.restart();
  });

  label.appendChild(select);
  options.appendChild(label);

  const help = document.createElement("span");
  help.className = "muted";
  help.textContent = game === "snake"
    ? "Snake : joue manuellement ou active le bot."
    : "Tu joues contre le bot.";
  options.appendChild(help);
}

function getActiveBot(game) {
  const selected = $("active-bot-select")?.value;
  if (selected && selected !== "default") {
    const bot = userBots.find(b => b.id === selected && b.game === game);
    if (bot) return bot;
  }
  return defaultBots[game] || null;
}

function runActiveBot(game, context) {
  const bot = getActiveBot(game);
  if (!bot?.graph) return {};
  try {
    return executeGraph(bot.graph, context, game);
  } catch (error) {
    console.warn("Bot execution error:", error);
    return {};
  }
}

/* =========================================================
   NODE GRAPH EDITOR
   ========================================================= */

function makeNode(type, x = 300, y = 200, config = {}) {
  return {
    id: crypto.randomUUID(),
    type,
    x,
    y,
    config: structuredClone(config)
  };
}

function createNewBot() {
  currentGame = $("editor-game").value || "chess";
  $("bot-name").value = "My Bot";
  graph = {
    nodes: [
      makeNode("event", 100, 100),
      makeNode("inputs", 390, 100),
      makeNode("outputs", 850, 100)
    ],
    connections: []
  };
  graph.connections.push({
    from: graph.nodes[0].id,
    fromPort: "next",
    to: graph.nodes[2].id,
    toPort: "exec"
  });
  selectedNodeId = null;
  pendingPort = null;
  renderEditor();
}

function createNewBot() {
  showPage("editor");
  $("editor-game").value = currentGame;
  $("bot-name").value = "My Bot";
  graph = {
    nodes: [
      makeNode("event", 100, 100),
      makeNode("inputs", 390, 100),
      makeNode("outputs", 850, 100)
    ],
    connections: []
  };
  graph.connections.push({
    from: graph.nodes[0].id, fromPort: "next",
    to: graph.nodes[2].id, toPort: "exec"
  });
  selectedNodeId = null;
  renderEditor();
}

function loadGraphFromBot(bot) {
  currentGame = bot.game;
  $("editor-game").value = bot.game;
  $("bot-name").value = bot.name;
  graph = structuredClone(bot.graph);
  selectedNodeId = null;
  pendingPort = null;
  showPage("editor");
  renderEditor();
}

function getNodePorts(node) {
  const def = NODE_DEFS[node.type];
  if (!def) return { inputs: [], outputs: [] };

  if (node.type === "inputs") {
    return {
      inputs: [],
      outputs: GAMES[currentGame].inputs
    };
  }

  if (node.type === "outputs") {
    return {
      inputs: [["exec", "Execute", "exec"], ...GAMES[currentGame].outputs],
      outputs: []
    };
  }

  return {
    inputs: def.inputs || [],
    outputs: def.outputs || []
  };
}

function renderEditor() {
  currentGame = $("editor-game").value || currentGame;
  $("workspace-game").textContent = GAMES[currentGame].name.toUpperCase();
  renderNodeLibrary();
  renderGraph();
}

function renderNodeLibrary() {
  const root = $("node-library");
  root.innerHTML = "";

  const categories = [...new Set(Object.values(NODE_DEFS).map(n => n.category))];
  categories.forEach(category => {
    const heading = document.createElement("div");
    heading.className = "node-category";
    heading.textContent = category;
    root.appendChild(heading);

    Object.entries(NODE_DEFS).filter(([, def]) => def.category === category).forEach(([type, def]) => {
      const button = document.createElement("button");
      button.className = "library-node";
      button.textContent = "+ " + def.label;
      button.addEventListener("click", () => addGraphNode(type));
      root.appendChild(button);
    });
  });
}

function addGraphNode(type) {
  const count = graph.nodes.length;
  const node = makeNode(type, 260 + (count % 4) * 225, 100 + Math.floor(count / 4) * 190);
  graph.nodes.push(node);
  selectedNodeId = node.id;
  renderGraph();
}

function portElement(nodeId, portId, direction, type) {
  const button = document.createElement("button");
  button.className = `port ${type} ${direction}`;
  button.title = `${direction === "output" ? "Output" : "Input"}: ${portId} (${type})`;
  button.dataset.node = nodeId;
  button.dataset.port = portId;
  button.dataset.direction = direction;
  button.dataset.type = type;
  button.addEventListener("click", handlePortClick);
  return button;
}

function addPortRow(container, node, port, direction) {
  const [id, label, type] = port;
  const row = document.createElement("div");
  row.className = "node-port-row";

  const text = document.createElement("span");
  text.className = "port-label";
  text.textContent = label;

  const socket = portElement(node.id, id, direction, type);

  if (direction === "input") {
    row.append(socket, text);
  } else {
    row.append(text, socket);
  }
  container.appendChild(row);
}

function renderGraph() {
  const canvas = $("node-canvas");
  canvas.querySelectorAll(".visual-node").forEach(el => el.remove());

  $("empty-workspace").style.display = graph.nodes.length ? "none" : "block";
  $("node-count").textContent = `${graph.nodes.length} BLOCKS`;

  graph.nodes.forEach(node => {
    const def = NODE_DEFS[node.type];
    if (!def) return;

    const ports = getNodePorts(node);
    const el = document.createElement("div");
    el.className = "visual-node" + (node.id === selectedNodeId ? " selected" : "");
    el.style.left = node.x + "px";
    el.style.top = node.y + "px";
    el.dataset.id = node.id;

    const head = document.createElement("div");
    head.className = "node-head";
    head.style.background = def.color;

    const title = document.createElement("span");
    title.textContent = def.label;

    const remove = document.createElement("button");
    remove.className = "node-remove";
    remove.textContent = "×";
    remove.title = "Delete block";
    remove.addEventListener("click", e => {
      e.stopPropagation();
      deleteNode(node.id);
    });

    head.append(title, remove);
    head.addEventListener("mousedown", e => startNodeDrag(e, node.id));

    const body = document.createElement("div");
    body.className = "node-body";

    const description = document.createElement("p");
    description.className = "node-description";
    description.textContent = def.description;
    body.appendChild(description);

    if (node.type === "number" || node.type === "text" || node.type === "boolean") {
      const input = document.createElement("input");
      input.className = "node-config";
      input.value = node.config.value ?? (node.type === "number" ? "0" : node.type === "boolean" ? "true" : "");
      input.type = "text";
      input.addEventListener("input", () => {
        node.config.value = node.type === "number" ? Number(input.value) : input.value;
      });
      body.appendChild(input);
    }

    if (node.type === "math") {
      const select = document.createElement("select");
      select.className = "node-config";
      [["add", "+"], ["sub", "−"], ["mul", "×"], ["div", "÷"], ["mod", "%"], ["min", "MIN"], ["max", "MAX"], ["pow", "POWER"]].forEach(([value, label]) => {
        const opt = document.createElement("option");
        opt.value = value;
        opt.textContent = label;
        select.appendChild(opt);
      });
      select.value = node.config.operation || "add";
      select.onchange = () => node.config.operation = select.value;
      body.appendChild(select);
    }

    if (node.type === "compare") {
      const select = document.createElement("select");
      select.className = "node-config";
      [">", "<", "==", "!=", ">=", "<="].forEach(op => {
        const opt = document.createElement("option");
        opt.value = op;
        opt.textContent = op;
        select.appendChild(opt);
      });
      select.value = node.config.operation || ">";
      select.onchange = () => node.config.operation = select.value;
      body.appendChild(select);
    }

    if (node.type === "logic") {
      const select = document.createElement("select");
      select.className = "node-config";
      [["and", "AND"], ["or", "OR"], ["not", "NOT"], ["xor", "XOR"]].forEach(([value, label]) => {
        const opt = document.createElement("option");
        opt.value = value;
        opt.textContent = label;
        select.appendChild(opt);
      });
      select.value = node.config.operation || "and";
      select.onchange = () => node.config.operation = select.value;
      body.appendChild(select);
    }

    if (node.type === "variable") {
      const input = document.createElement("input");
      input.className = "node-config";
      input.placeholder = "Variable name";
      input.value = node.config.name || "myVariable";
      input.oninput = () => node.config.name = input.value;
      body.appendChild(input);
    }

    if (node.type === "inputs") {
      GAMES[currentGame].inputs.forEach(port => addPortRow(body, node, port, "output"));
    } else {
      ports.inputs.forEach(port => addPortRow(body, node, port, "input"));
      ports.outputs.forEach(port => addPortRow(body, node, port, "output"));
    }

    el.append(head, body);
    el.addEventListener("click", () => {
      selectedNodeId = node.id;
      renderGraph();
    });
    canvas.appendChild(el);
  });

  renderWires();
  renderProperties();
}

function compatibleTypes(a, b) {
  return a === b || a === "any" || b === "any";
}

function handlePortClick(event) {
  event.stopPropagation();
  const port = event.currentTarget;
  const info = {
    node: port.dataset.node,
    port: port.dataset.port,
    direction: port.dataset.direction,
    type: port.dataset.type
  };

  if (!pendingPort) {
    if (info.direction !== "output") {
      $("connection-status").textContent = "Commence par cliquer sur un port de sortie.";
      return;
    }
    pendingPort = info;
    port.classList.add("pending");
    $("connection-status").textContent = "Choisis maintenant un port d'entrée.";
    return;
  }

  if (info.direction !== "input") {
    pendingPort = null;
    renderGraph();
    $("connection-status").textContent = "Connexion annulée.";
    return;
  }

  if (pendingPort.node === info.node) {
    pendingPort = null;
    renderGraph();
    return;
  }

  if (!compatibleTypes(pendingPort.type, info.type)) {
    $("connection-status").textContent = "Types incompatibles : " + pendingPort.type + " → " + info.type;
    return;
  }

  graph.connections = graph.connections.filter(c =>
    !(c.to === info.node && c.toPort === info.port)
  );

  graph.connections.push({
    from: pendingPort.node,
    fromPort: pendingPort.port,
    to: info.node,
    toPort: info.port
  });

  pendingPort = null;
  $("connection-status").textContent = "Connexion créée.";
  renderGraph();
}

function renderWires() {
  const svg = $("wires");
  svg.innerHTML = "";

  graph.connections.forEach((connection, index) => {
    const from = document.querySelector(
      `.port[data-node="${connection.from}"][data-port="${connection.fromPort}"][data-direction="output"]`
    );
    const to = document.querySelector(
      `.port[data-node="${connection.to}"][data-port="${connection.toPort}"][data-direction="input"]`
    );

    if (!from || !to) return;

    const a = from.getBoundingClientRect();
    const b = to.getBoundingClientRect();
    const canvasRect = $("node-canvas").getBoundingClientRect();

    const x1 = a.left + a.width / 2 - canvasRect.left + $("canvas-wrap").scrollLeft;
    const y1 = a.top + a.height / 2 - canvasRect.top + $("canvas-wrap").scrollTop;
    const x2 = b.left + b.width / 2 - canvasRect.left + $("canvas-wrap").scrollLeft;
    const y2 = b.top + b.height / 2 - canvasRect.top + $("canvas-wrap").scrollTop;
    const curve = Math.max(45, Math.abs(x2 - x1) * .5);
    const d = `M ${x1} ${y1} C ${x1 + curve} ${y1}, ${x2 - curve} ${y2}, ${x2} ${y2}`;

    const sourcePort = from.dataset.type;
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", d);
    path.setAttribute("class", `wire ${sourcePort}`);
    svg.appendChild(path);

    const hit = document.createElementNS("http://www.w3.org/2000/svg", "path");
    hit.setAttribute("d", d);
    hit.setAttribute("class", "wire-hit");
    hit.addEventListener("click", () => {
      graph.connections.splice(index, 1);
      renderGraph();
      $("connection-status").textContent = "Connexion supprimée.";
    });
    svg.appendChild(hit);
  });
}

function startNodeDrag(event, id) {
  if (event.target.closest("button")) return;
  const node = graph.nodes.find(n => n.id === id);
  if (!node) return;

  selectedNodeId = id;
  dragState = {
    id,
    x: event.clientX,
    y: event.clientY,
    originalX: node.x,
    originalY: node.y
  };

  event.preventDefault();
  renderProperties();
}

window.addEventListener("mousemove", event => {
  if (!dragState) return;
  const node = graph.nodes.find(n => n.id === dragState.id);
  if (!node) return;

  node.x = Math.max(0, dragState.originalX + event.clientX - dragState.x);
  node.y = Math.max(0, dragState.originalY + event.clientY - dragState.y);

  const element = document.querySelector(`.visual-node[data-id="${node.id}"]`);
  if (element) {
    element.style.left = node.x + "px";
    element.style.top = node.y + "px";
  }
  renderWires();
});

window.addEventListener("mouseup", () => dragState = null);

function deleteNode(id) {
  graph.nodes = graph.nodes.filter(n => n.id !== id);
  graph.connections = graph.connections.filter(c => c.from !== id && c.to !== id);
  if (selectedNodeId === id) selectedNodeId = null;
  renderGraph();
}

function renderProperties() {
  const root = $("properties");
  root.innerHTML = "";
  const node = graph.nodes.find(n => n.id === selectedNodeId);

  if (!node) {
    root.innerHTML = '<p class="muted">Sélectionne un bloc pour voir ses propriétés.</p>';
    return;
  }

  const def = NODE_DEFS[node.type];
  const title = document.createElement("strong");
  title.textContent = def.label;
  root.appendChild(title);

  const description = document.createElement("p");
  description.textContent = def.description;
  root.appendChild(description);

  const label = document.createElement("label");
  label.className = "property-label";
  label.textContent = "BLOCK ID";
  const id = document.createElement("input");
  id.className = "property-input";
  id.disabled = true;
  id.value = node.id.slice(0, 8);
  root.append(label, id);

  if (node.type === "number" || node.type === "text" || node.type === "boolean") {
    const valueLabel = document.createElement("label");
    valueLabel.className = "property-label";
    valueLabel.textContent = "VALUE";
    const value = document.createElement("input");
    value.className = "property-input";
    value.value = node.config.value ?? "";
    value.onchange = () => {
      node.config.value = node.type === "number" ? Number(value.value) : value.value;
      renderGraph();
    };
    root.append(valueLabel, value);
  }

  const remove = document.createElement("button");
  remove.className = "secondary";
  remove.style.marginTop = "15px";
  remove.textContent = "DELETE BLOCK";
  remove.onclick = () => deleteNode(node.id);
  root.appendChild(remove);
}

/* =========================================================
   GRAPH INTERPRETER
   ========================================================= */

function executeGraph(sourceGraph, context, game) {
  const nodes = sourceGraph.nodes || [];
  const links = sourceGraph.connections || [];
  const cache = new Map();
  const variables = {};

  function findNode(id) {
    return nodes.find(n => n.id === id);
  }

  function inputValue(node, port, fallback = 0) {
    const link = links.find(c => c.to === node.id && c.toPort === port);
    if (!link) return fallback;
    return evaluate(link.from, link.fromPort);
  }

  function evaluate(id, port = "value", depth = 0) {
    if (depth > 60) return 0;
    const key = id + ":" + port;
    if (cache.has(key)) return cache.get(key);

    const node = findNode(id);
    if (!node) return 0;

    const val = (p, fallback = 0) => {
      const link = links.find(c => c.to === node.id && c.toPort === p);
      return link ? evaluate(link.from, link.fromPort, depth + 1) : fallback;
    };

    let result = 0;

    switch (node.type) {
      case "number":
        result = Number(node.config.value ?? 0);
        break;
      case "boolean":
        result = String(node.config.value ?? "true") === "true";
        break;
      case "text":
        result = String(node.config.value ?? "");
        break;
      case "inputs":
        result = context[port] ?? 0;
        break;
      case "math": {
        const a = Number(val("a", 0));
        const b = Number(val("b", 0));
        const op = node.config.operation || "add";
        const operations = {
          add: () => a + b,
          sub: () => a - b,
          mul: () => a * b,
          div: () => b === 0 ? 0 : a / b,
          mod: () => b === 0 ? 0 : a % b,
          min: () => Math.min(a, b),
          max: () => Math.max(a, b),
          pow: () => Math.pow(a, b)
        };
        result = operations[op]?.() ?? 0;
        break;
      }
      case "compare": {
        const a = Number(val("a", 0));
        const b = Number(val("b", 0));
        const op = node.config.operation || ">";
        result = ({
          ">": a > b, "<": a < b, "==": a === b,
          "!=": a !== b, ">=": a >= b, "<=": a <= b
        })[op] ?? false;
        break;
      }
      case "logic": {
        const a = Boolean(val("a", false));
        const b = Boolean(val("b", false));
        const op = node.config.operation || "and";
        result = op === "and" ? a && b :
          op === "or" ? a || b :
          op === "not" ? !a :
          op === "xor" ? a !== b : false;
        break;
      }
      case "if":
        result = val("condition", false) ? val("yes", 0) : val("no", 0);
        break;
      case "random": {
        const min = Number(val("min", 0));
        const max = Number(val("max", 1));
        result = min + Math.random() * (max - min);
        break;
      }
      case "clamp":
        result = Math.max(Number(val("min", 0)),
          Math.min(Number(val("max", 1)), Number(val("value", 0))));
        break;
      case "variable": {
        const name = node.config.name || "myVariable";
        const link = links.find(c => c.to === node.id && c.toPort === "value");
        if (link) variables[name] = evaluate(link.from, link.fromPort, depth + 1);
        result = variables[name] ?? 0;
        break;
      }
      case "listLength": {
        const list = val("list", []);
        result = Array.isArray(list) ? list.length : 0;
        break;
      }
      case "listGet": {
        const list = val("list", []);
        const index = Math.floor(Number(val("index", 0)));
        result = Array.isArray(list) ? (list[index] ?? 0) : 0;
        break;
      }
      default:
        result = 0;
    }

    cache.set(key, result);
    return result;
  }

  const result = {};
  const outputNode = nodes.find(n => n.type === "outputs");
  if (!outputNode) return result;

  GAMES[game].outputs.forEach(([key]) => {
    result[key] = inputValue(outputNode, key, defaultOutput(game, key, context));
  });

  return result;
}

function defaultOutput(game, key, context) {
  if (game === "chess" && key === "moveIndex") return Math.floor(Math.random() * Math.max(1, context.legalMoveCount || 1));
  if (game === "connect4" && key === "column") {
    const available = context.availableColumns || [0,1,2,3,4,5,6];
    return available[Math.floor(Math.random() * available.length)] ?? 3;
  }
  if (game === "pingpong") return key === "paddleTargetX" ? context.ballX || 0 : context.ballY || 0;
  if (game === "racing") return key === "throttle" ? 0.6 : 0;
  if (game === "snake") return context.direction ?? 1;
  return 0;
}

/* =========================================================
   BOT SAVING / IMPORT / EXPORT
   ========================================================= */

function saveBot() {
  const name = $("bot-name").value.trim() || "Unnamed Bot";
  const bot = {
    id: crypto.randomUUID(),
    format: "BOTS_ARENA_BOT",
    version: 2,
    name,
    game: currentGame,
    graph: structuredClone(graph),
    updated: new Date().toISOString()
  };

  userBots = userBots.filter(b => !(b.name === name && b.game === currentGame));
  userBots.push(bot);
  saveUserBotsStorage();
  renderBotList();
  alert("Bot sauvegardé !");
}

function exportBot() {
  const data = {
    format: "BOTS_ARENA_BOT",
    version: 2,
    name: $("bot-name").value.trim() || "My Bot",
    game: currentGame,
    graph
  };
  downloadJSON(data, "bots-arena-" + currentGame + ".json");
}

function downloadJSON(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {type: "application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

$("save-bot").addEventListener("click", saveBot);
$("export-bot").addEventListener("click", exportBot);
$("new-bot").addEventListener("click", createNewBot);
$("import-bot").addEventListener("click", () => $("import-file").click());

$("import-file").addEventListener("change", async event => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    if (data.format !== "BOTS_ARENA_BOT" || data.version !== 2) throw new Error("Format incompatible.");
    if (!GAMES[data.game] || !Array.isArray(data.graph?.nodes) || !Array.isArray(data.graph?.connections)) {
      throw new Error("Fichier de bot invalide.");
    }
    currentGame = data.game;
    $("editor-game").value = currentGame;
    $("bot-name").value = data.name || "Imported Bot";
    graph = data.graph;
    renderEditor();
    alert("Bot importé !");
  } catch (error) {
    alert("Import impossible : " + error.message);
  }
  event.target.value = "";
});

$("editor-game").addEventListener("change", () => {
  currentGame = $("editor-game").value;
  graph = {nodes: [], connections: []};
  selectedNodeId = null;
  pendingPort = null;
  renderEditor();
});

$("clear-graph").addEventListener("click", () => {
  if (!confirm("Supprimer tous les blocs ?")) return;
  graph = {nodes: [], connections: []};
  selectedNodeId = null;
  renderEditor();
});

$("zoom-reset").addEventListener("click", () => {
  $("canvas-wrap").scrollTo({left: 0, top: 0, behavior: "smooth"});
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape" && pendingPort) {
    pendingPort = null;
    renderGraph();
    $("connection-status").textContent = "Connexion annulée.";
  }
});

/* =========================================================
   BOT LIBRARY
   ========================================================= */

function renderBotList() {
  const root = $("bot-list");
  root.innerHTML = "";

  if (!userBots.length) {
    root.innerHTML = '<p class="muted">Aucun bot sauvegardé. Crée ton premier bot dans l’éditeur.</p>';
    return;
  }

  userBots.forEach(bot => {
    const card = document.createElement("article");
    card.className = "bot-item";

    const title = document.createElement("h3");
    title.textContent = bot.name;
    const info = document.createElement("p");
    info.textContent = `${GAMES[bot.game]?.name || bot.game} · ${bot.graph.nodes.length} blocks`;

    const edit = document.createElement("button");
    edit.className = "secondary";
    edit.textContent = "EDIT";
    edit.onclick = () => loadGraphFromBot(bot);

    const exportButton = document.createElement("button");
    exportButton.className = "secondary";
    exportButton.textContent = "EXPORT";
    exportButton.onclick = () => downloadJSON(bot, bot.name.replace(/[^a-z0-9]/gi, "_") + ".json");

    const remove = document.createElement("button");
    remove.className = "secondary";
    remove.textContent = "DELETE";
    remove.onclick = () => {
      if (!confirm("Supprimer ce bot ?")) return;
      userBots = userBots.filter(b => b.id !== bot.id);
      saveUserBotsStorage();
      renderBotList();
    };

    card.append(title, info, edit, exportButton, remove);
    root.appendChild(card);
  });
}

/* =========================================================
   CHESS
   ========================================================= */

function renderChess() {
  if (typeof Chess === "undefined") {
    $("game-container").textContent = "Le moteur d'échecs n'a pas pu être chargé. Vérifie ta connexion internet.";
    return;
  }

  const chess = new Chess();
  let selected = null;
  let legalTargets = [];
  let thinking = false;

  $("game-container").innerHTML = `
    <div class="game-center">
      <h2>♟ CHESS</h2>
      <div id="chess-status" class="game-status">À toi de jouer avec les blancs.</div>
      <div id="chess-board" class="game-board chess-board"></div>
      <div class="game-buttons">
        <button class="secondary" id="chess-reset">NEW GAME</button>
        <button class="secondary" id="chess-undo">UNDO</button>
      </div>
      <p class="game-instructions">Clique sur une pièce blanche puis sur une case de destination.</p>
    </div>`;

  const glyphs = {
    w: {k:"♔",q:"♕",r:"♖",b:"♗",n:"♘",p:"♙"},
    b: {k:"♚",q:"♛",r:"♜",b:"♝",n:"♞",p:"♟"}
  };

  function draw() {
    const root = $("chess-board");
    root.innerHTML = "";
    const board = chess.board();

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const square = String.fromCharCode(97 + col) + (8 - row);
        const cell = document.createElement("button");
        cell.className = "chess-cell " + ((row + col) % 2 ? "dark" : "light");
        if (selected === square) cell.classList.add("selected");
        if (legalTargets.includes(square)) cell.classList.add("legal");

        const piece = board[row][col];
        if (piece) cell.textContent = glyphs[piece.color][piece.type];
        cell.onclick = () => clickSquare(square);
        root.appendChild(cell);
      }
    }

    let status = chess.turn() === "w" ? "À toi de jouer." : "Le bot réfléchit...";
    if (chess.in_checkmate()) status = "Échec et mat !";
    else if (chess.in_draw()) status = "Match nul.";
    else if (chess.in_check()) status += " Échec !";
    $("chess-status").textContent = status;
  }

  function clickSquare(square) {
    if (thinking || chess.turn() !== "w" || chess.game_over()) return;

    if (selected && legalTargets.includes(square)) {
      chess.move({from: selected, to: square, promotion: "q"});
      selected = null;
      legalTargets = [];
      draw();
      if (!chess.game_over()) setTimeout(botMove, 250);
      return;
    }

    const piece = chess.get(square);
    if (piece && piece.color === "w") {
      selected = square;
      legalTargets = chess.moves({square, verbose: true}).map(m => m.to);
    } else {
      selected = null;
      legalTargets = [];
    }
    draw();
  }

  function botMove() {
    if (chess.game_over()) return;
    thinking = true;
    const moves = chess.moves({verbose: true});
    const context = {
      legalMoveCount: moves.length,
      legalMoves: moves.map(m => m.from + m.to + (m.promotion || "")),
      currentTurn: chess.turn(),
      isCheck: chess.in_check(),
      isCheckmate: chess.in_checkmate(),
      board: chess.board().flat().map(p => p ? p.color + p.type : ""),
      myKingX: 0,
      myKingY: 0
    };

    const output = runActiveBot("chess", context);
    let index = Math.floor(Number(output.moveIndex));
    if (!Number.isFinite(index) || index < 0 || index >= moves.length) index = Math.floor(Math.random() * moves.length);

    // Le bot intégré privilégie les captures et les promotions.
    if (!$("active-bot-select") || $("active-bot-select").value === "default") {
      const captures = moves.map((m, i) => ({m, i})).filter(x => x.m.captured);
      if (captures.length && Math.random() < .7) index = captures[Math.floor(Math.random() * captures.length)].i;
    }

    const move = moves[index];
    if (move) chess.move({from: move.from, to: move.to, promotion: "q"});
    thinking = false;
    draw();
  }

  function reset() {
    chess.reset();
    selected = null;
    legalTargets = [];
    thinking = false;
    draw();
  }

  $("chess-reset").onclick = reset;
  $("chess-undo").onclick = () => {
    chess.undo();
    chess.undo();
    selected = null;
    legalTargets = [];
    draw();
  };

  draw();
  return () => {};
}

/* =========================================================
   CONNECT FOUR
   ========================================================= */

function renderConnect4() {
  let board, turn, finished, busy;

  $("game-container").innerHTML = `
    <div class="game-center">
      <h2>🟡 PUISSANCE 4</h2>
      <div id="connect-status" class="game-status">Tu joues en jaune.</div>
      <div id="connect-board" class="game-board connect-board"></div>
      <div class="game-buttons">
        <button class="secondary" id="connect-reset">NEW GAME</button>
      </div>
      <p class="game-instructions">Clique sur une colonne pour y déposer un jeton.</p>
    </div>`;

  function reset() {
    board = Array.from({length: 6}, () => Array(7).fill(0));
    turn = 1;
    finished = false;
    busy = false;
    draw();
  }

  function draw() {
    const root = $("connect-board");
    root.innerHTML = "";
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 7; c++) {
        const cell = document.createElement("button");
        cell.className = "connect-cell " + (board[r][c] === 1 ? "p1" : board[r][c] === 2 ? "p2" : "");
        cell.title = "Column " + (c + 1);
        cell.onclick = () => play(c);
        root.appendChild(cell);
      }
    }
  }

  function drop(column, player) {
    for (let row = 5; row >= 0; row--) {
      if (!board[row][column]) {
        board[row][column] = player;
        return true;
      }
    }
    return false;
  }

  function winner(player) {
    const dirs = [[0,1],[1,0],[1,1],[1,-1]];
    for (let r = 0; r < 6; r++) for (let c = 0; c < 7; c++) {
      for (const [dr,dc] of dirs) {
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

  function available() {
    return board[0].map((v,i) => v === 0 ? i : -1).filter(i => i >= 0);
  }

  function contextForBot() {
    const legal = available();
    let threats = 0;
    legal.forEach(c => {
      const copy = board.map(row => row.slice());
      for (let r = 5; r >= 0; r--) if (!copy[r][c]) { copy[r][c] = 1; break; }
      const old = board;
      board = copy;
      if (winner(1)) threats++;
      board = old;
    });
    return {
      availableColumns: legal,
      board: board.flat(),
      currentPlayer: 2,
      winningColumns: legal.filter(c => {
        const copy = board.map(row => row.slice());
        for (let r = 5; r >= 0; r--) if (!copy[r][c]) { copy[r][c] = 2; break; }
        const old = board;
        board = copy;
        const win = winner(2);
        board = old;
        return win;
      }),
      opponentThreats: threats
    };
  }

  function botTurn() {
    if (finished) return;
    busy = true;
    const context = contextForBot();
    let output = runActiveBot("connect4", context);
    let column = Math.round(Number(output.column));

    if ($("active-bot-select")?.value === "default") {
      const wins = context.winningColumns;
      const blocks = context.availableColumns.filter(c => {
        const copy = board.map(row => row.slice());
        for (let r = 5; r >= 0; r--) if (!copy[r][c]) { copy[r][c] = 1; break; }
        const old = board; board = copy;
        const win = winner(1);
        board = old;
        return win;
      });
      if (wins.length) column = wins[0];
      else if (blocks.length) column = blocks[0];
      else column = context.availableColumns.includes(3) ? 3 :
        context.availableColumns[Math.floor(Math.random() * context.availableColumns.length)];
    }

    if (!context.availableColumns.includes(column)) {
      const legal = context.availableColumns;
      column = legal[Math.floor(Math.random() * legal.length)];
    }

    if (column !== undefined) drop(column, 2);
    draw();
    if (winner(2)) end("Le bot gagne !");
    else if (!available().length) end("Match nul !");
    else {
      turn = 1;
      $("connect-status").textContent = "À toi de jouer — jaune.";
      busy = false;
    }
  }

  function end(message) {
    finished = true;
    busy = false;
    $("connect-status").textContent = message;
  }

  function play(column) {
    if (finished || busy || turn !== 1) return;
    if (!drop(column, 1)) return;
    draw();

    if (winner(1)) return end("Tu as gagné !");
    if (!available().length) return end("Match nul !");

    turn = 2;
    $("connect-status").textContent = "Le bot joue...";
    busy = true;
    setTimeout(botTurn, 300);
  }

  $("connect-reset").onclick = reset;
  reset();
}

/* =========================================================
   SNAKE
   ========================================================= */

function renderSnake() {
  $("game-container").innerHTML = `
    <div class="game-center">
      <h2>🐍 SNAKE</h2>
      <div id="snake-status" class="game-status">Score : 0</div>
      <canvas id="snake-canvas" width="480" height="480"></canvas>
      <div class="game-buttons">
        <button class="primary" id="snake-start">START / RESTART</button>
        <button class="secondary" id="snake-mode">MODE : PLAYER</button>
      </div>
      <p class="game-instructions">Flèches du clavier pour jouer. Le mode BOT laisse ton IA contrôler le serpent.</p>
    </div>`;

  const canvas = $("snake-canvas");
  const ctx = canvas.getContext("2d");
  const cell = 24;
  const size = 20;
  let snake, food, direction, score, timer, running, botMode = false;

  function reset() {
    clearInterval(timer);
    snake = [{x:9,y:10},{x:8,y:10},{x:7,y:10}];
    direction = 1;
    food = {x:15,y:10};
    score = 0;
    running = true;
    draw();
    $("snake-status").textContent = "Score : 0";
    timer = setInterval(step, 125);
  }

  function draw() {
    ctx.fillStyle = "#07130f";
    ctx.fillRect(0,0,480,480);
    ctx.strokeStyle = "#142a21";
    for (let i=0;i<=20;i++) {
      ctx.beginPath();ctx.moveTo(i*cell,0);ctx.lineTo(i*cell,480);ctx.stroke();
      ctx.beginPath();ctx.moveTo(0,i*cell);ctx.lineTo(480,i*cell);ctx.stroke();
    }
    ctx.fillStyle = "#ff5575";
    ctx.fillRect(food.x*cell+3,food.y*cell+3,18,18);
    snake.forEach((p,i) => {
      ctx.fillStyle = i===0 ? "#a1ffe5" : "#35cba2";
      ctx.fillRect(p.x*cell+2,p.y*cell+2,20,20);
    });
  }

  function safeDirections() {
    return [0,1,2,3].filter(d => {
      if ((d+2)%4 === direction) return false;
      const vectors = [{x:0,y:-1},{x:1,y:0},{x:0,y:1},{x:-1,y:0}];
      const v = vectors[d];
      const p = {x:snake[0].x+v.x,y:snake[0].y+v.y};
      return p.x>=0 && p.x<size && p.y>=0 && p.y<size &&
        !snake.slice(0,-1).some(s=>s.x===p.x&&s.y===p.y);
    });
  }

  function chooseBotDirection() {
    const available = safeDirections();
    const context = {
      headX: snake[0].x, headY: snake[0].y,
      foodX: food.x, foodY: food.y,
      direction, body: snake.map(p=>[p.x,p.y]),
      availableDirections: available
    };
    const output = runActiveBot("snake", context);
    let choice = Math.round(Number(output.direction));

    if ($("active-bot-select")?.value === "default") {
      const toward = [];
      if (food.x > snake[0].x) toward.push(1);
      if (food.x < snake[0].x) toward.push(3);
      if (food.y > snake[0].y) toward.push(2);
      if (food.y < snake[0].y) toward.push(0);
      choice = toward.find(d=>available.includes(d)) ?? available[0];
    }
    if (!available.includes(choice)) choice = available[0];
    if (choice !== undefined) direction = choice;
  }

  function step() {
    if (!running) return;
    if (botMode) chooseBotDirection();

    const vectors = [{x:0,y:-1},{x:1,y:0},{x:0,y:1},{x:-1,y:0}];
    const v = vectors[direction];
    const head = {x:snake[0].x+v.x,y:snake[0].y+v.y};

    if (head.x<0 || head.x>=size || head.y<0 || head.y>=size ||
        snake.slice(0,-1).some(p=>p.x===head.x&&p.y===head.y)) {
      running = false;
      clearInterval(timer);
      $("snake-status").textContent = "Game over — score : " + score;
      return;
    }

    snake.unshift(head);
    if (head.x===food.x && head.y===food.y) {
      score++;
      do {
        food = {x:Math.floor(Math.random()*size),y:Math.floor(Math.random()*size)};
      } while (snake.some(p=>p.x===food.x&&p.y===food.y));
      $("snake-status").textContent = "Score : " + score;
    } else snake.pop();

    draw();
  }

  document.onkeydown = event => {
    if (currentPage !== "game" || currentGame !== "snake" || botMode) return;
    const map = {ArrowUp:0,ArrowRight:1,ArrowDown:2,ArrowLeft:3};
    if (map[event.key] === undefined) return;
    if ((map[event.key]+2)%4 === direction) return;
    direction = map[event.key];
    event.preventDefault();
  };

  $("snake-start").onclick = reset;
  $("snake-mode").onclick = () => {
    botMode = !botMode;
    $("snake-mode").textContent = "MODE : " + (botMode ? "BOT" : "PLAYER");
    reset();
  };
  reset();

  return () => {
    clearInterval(timer);
    document.onkeydown = null;
  };
}

/* =========================================================
   3D PING PONG
   ========================================================= */

function renderPingPong() {
  if (!window.THREE) {
    $("game-container").textContent = "Three.js n'a pas pu être chargé. Vérifie ta connexion.";
    return;
  }

  $("game-container").innerHTML = `
    <div class="game-center">
      <h2>🏓 3D PING PONG</h2>
      <div id="pong-status" class="game-status">Toi : 0 — Bot : 0</div>
      <div id="pong-host"></div>
      <p class="game-instructions">Déplace ta raquette avec les flèches ou ZQSD. Le bot contrôle l'autre côté.</p>
      <div class="game-buttons"><button class="secondary" id="pong-reset">RESET MATCH</button></div>
    </div>`;

  const host = $("pong-host");
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x07121b);

  const camera = new THREE.PerspectiveCamera(48, host.clientWidth / host.clientHeight, .1, 100);
  camera.position.set(0, 8, 15);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({antialias:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(host.clientWidth, host.clientHeight);
  host.appendChild(renderer.domElement);

  scene.add(new THREE.HemisphereLight(0xffffff,0x263b56,2));
  const light = new THREE.DirectionalLight(0xffffff,1.5);
  light.position.set(3,10,5);
  scene.add(light);

  const table = new THREE.Mesh(
    new THREE.BoxGeometry(9,.3,13),
    new THREE.MeshStandardMaterial({color:0x176a91,roughness:.65})
  );
  scene.add(table);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(30,30),
    new THREE.MeshStandardMaterial({color:0x101b29})
  );
  floor.rotation.x=-Math.PI/2;
  floor.position.y=-.3;
  scene.add(floor);

  const net = new THREE.Mesh(
    new THREE.BoxGeometry(9,.55,.12),
    new THREE.MeshStandardMaterial({color:0xe9f2ff})
  );
  net.position.y=.42;
  scene.add(net);

  function makePaddle(color,z) {
    const paddle = new THREE.Mesh(
      new THREE.BoxGeometry(1.7,.3,.65),
      new THREE.MeshStandardMaterial({color,roughness:.35})
    );
    paddle.position.set(0,.6,z);
    scene.add(paddle);
    return paddle;
  }

  const human = makePaddle(0x42e5dc,5.4);
  const bot = makePaddle(0xff6682,-5.4);

  const ball = new THREE.Mesh(
    new THREE.SphereGeometry(.24,24,24),
    new THREE.MeshStandardMaterial({color:0xffdf65})
  );
  ball.position.set(0,1,0);
  scene.add(ball);

  let bx=0, by=1, bz=0, vx=.09, vy=.035, vz=.16;
  let humanScore=0, botScore=0, lastTime=0, raf=0;
  let keys={};

  function serve(direction=1) {
    bx=0;by=1;bz=0;
    vx=(Math.random()-.5)*.12;
    vy=.04;
    vz=.17*direction;
  }

  function reset() {
    humanScore=0;botScore=0;
    human.position.x=0;human.position.z=5.4;
    bot.position.x=0;bot.position.z=-5.4;
    serve(1);
    updateScore();
  }

  function updateScore() {
    $("pong-status").textContent=`Toi : ${humanScore} — Bot : ${botScore}`;
  }

  function onKeyDown(e) {
    keys[e.key.toLowerCase()]=true;
  }
  function onKeyUp(e) {
    keys[e.key.toLowerCase()]=false;
  }
  window.addEventListener("keydown",onKeyDown);
  window.addEventListener("keyup",onKeyUp);

  function animate(time) {
    raf=requestAnimationFrame(animate);
    const dt=Math.min((time-lastTime)/16.67 || 1,2);
    lastTime=time;

    if (keys.arrowleft || keys.q || keys.a) human.position.x-=.16*dt;
    if (keys.arrowright || keys.d) human.position.x+=.16*dt;
    if (keys.arrowup || keys.z || keys.w) human.position.z-=.16*dt;
    if (keys.arrowdown || keys.s) human.position.z+=.16*dt;

    human.position.x=THREE.MathUtils.clamp(human.position.x,-3.5,3.5);
    human.position.z=THREE.MathUtils.clamp(human.position.z,3.7,6.1);

    const context={
      ballX:bx,ballY:by,ballZ:bz,
      ballVelocityX:vx,ballVelocityY:vy,ballVelocityZ:vz,
      paddleX:bot.position.x,paddleY:bot.position.z,
      ballApproaching:vz<0
    };
    const output=runActiveBot("pingpong",context);
    let tx=Number(output.paddleTargetX);
    let ty=Number(output.paddleTargetY);

    if ($("active-bot-select")?.value==="default") {
      const timeToPaddle=Math.max(0,(-5.05-bz)/(vz||-.01));
      tx=bx+vx*timeToPaddle;
      ty=-5.4;
    }

    if (!Number.isFinite(tx)) tx=0;
    bot.position.x=THREE.MathUtils.clamp(bot.position.x+(THREE.MathUtils.clamp(tx,-3.5,3.5)-bot.position.x)*.09*dt,-3.5,3.5);
    bot.position.z=THREE.MathUtils.clamp(bot.position.z+(THREE.MathUtils.clamp(ty,-6.1,-3.7)-bot.position.z)*.09*dt,-6.1,-3.7);

    bx+=vx*dt;
    by+=vy*dt;
    bz+=vz*dt;

    if (bx>4.2 || bx< -4.2) vx*=-1;
    if (by>3.4) vy*=-1;
    if (by<.4) vy=Math.abs(vy);

    if (vz>0 && bz>4.95 && Math.abs(bx-human.position.x)<1.15 && Math.abs(by-human.position.y)<1.2) {
      vz=-Math.abs(vz);
      vx+=(bx-human.position.x)*.035;
      vy+=(by-.7)*.025;
    }

    if (vz<0 && bz< -4.95 && Math.abs(bx-bot.position.x)<1.15 && Math.abs(by-bot.position.y)<1.2) {
      vz=Math.abs(vz);
      vx+=(bx-bot.position.x)*.035;
      vy+=(by-.7)*.025;
    }

    if (bz>7) { botScore++; updateScore(); serve(-1); }
    if (bz< -7) { humanScore++; updateScore(); serve(1); }

    ball.position.set(bx,by,bz);
    renderer.render(scene,camera);
  }

  const resizeObserver=new ResizeObserver(()=>{
    if(!host.clientWidth)return;
    camera.aspect=host.clientWidth/host.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(host.clientWidth,host.clientHeight);
  });
  resizeObserver.observe(host);

  $("pong-reset").onclick=reset;
  reset();
  animate(0);

  return ()=>{
    cancelAnimationFrame(raf);
    resizeObserver.disconnect();
    window.removeEventListener("keydown",onKeyDown);
    window.removeEventListener("keyup",onKeyUp);
    renderer.dispose();
  };
}

/* =========================================================
   TOP-DOWN RACING
   ========================================================= */

function renderRacing() {
  $("game-container").innerHTML = `
    <div class="game-center">
      <h2>🏎️ RACING AI</h2>
      <div id="race-status" class="game-status">Course généré aléatoirement.</div>
      <canvas id="race-canvas" width="900" height="620"></canvas>
      <div class="game-buttons">
        <button class="secondary" id="race-new">NEW RANDOM TRACK</button>
      </div>
      <p class="game-instructions">Conduis avec ZQSD ou les flèches. Le bot pilote la voiture rose. Premier à trois tours.</p>
    </div>`;

  const canvas=$("race-canvas"),ctx=canvas.getContext("2d");
  const W=canvas.width,H=canvas.height;
  let track=[],inner=[],outer=[],cars=[],keys={},raf=0,last=0;
  const trackWidth=100;

  function generateTrack() {
    track=[];
    const count=13;
    for(let i=0;i<count;i++){
      const a=i/count*Math.PI*2;
      const rx=280+(Math.random()-.5)*75;
      const ry=190+(Math.random()-.5)*55;
      track.push({
        x:W/2+Math.cos(a)*rx,
        y:H/2+Math.sin(a)*ry
      });
    }
    buildEdges();
  }

  function buildEdges() {
    inner=[];outer=[];
    track.forEach((p,i)=>{
      const prev=track[(i-1+track.length)%track.length];
      const next=track[(i+1)%track.length];
      const dx=next.x-prev.x,dy=next.y-prev.y;
      const len=Math.hypot(dx,dy)||1;
      const nx=-dy/len,ny=dx/len;
      inner.push({x:p.x+nx*trackWidth/2,y:p.y+ny*trackWidth/2});
      outer.push({x:p.x-nx*trackWidth/2,y:p.y-ny*trackWidth/2});
    });
  }

  function pointSegmentDistance(p,a,b){
    const dx=b.x-a.x,dy=b.y-a.y;
    const t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy)));
    return Math.hypot(p.x-(a.x+t*dx),p.y-(a.y+t*dy));
  }

  function nearestTrackDistance(p){
    let min=Infinity;
    for(let i=0;i<track.length;i++){
      min=Math.min(min,pointSegmentDistance(p,track[i],track[(i+1)%track.length]));
    }
    return min;
  }

  function onRoad(p){return nearestTrackDistance(p)<trackWidth/2-7;}

  function newCar(x,y,angle,color,human=false){
    return {x,y,angle,speed:0,color,human,lap:0,lastAngle:Math.atan2(y-H/2,x-W/2),progress:0};
  }

  function resetCars(){
    const start=track[0],next=track[1];
    const angle=Math.atan2(next.y-start.y,next.x-start.x);
    cars=[
      newCar(start.x,start.y+20,angle,"#42e5dc",true),
      newCar(start.x,start.y-20,angle,"#ff6682",false)
    ];
  }

  function drawTrack(){
    ctx.fillStyle="#173322";ctx.fillRect(0,0,W,H);
    ctx.beginPath();
    track.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));
    ctx.closePath();
    ctx.strokeStyle="#3d4651";ctx.lineWidth=trackWidth;ctx.lineJoin="round";ctx.stroke();
    ctx.strokeStyle="#e5e7eb";ctx.lineWidth=3;ctx.setLineDash([18,15]);ctx.stroke();
    ctx.setLineDash([]);

    ctx.beginPath();
    inner.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));
    ctx.closePath();ctx.strokeStyle="#a6b2b8";ctx.lineWidth=3;ctx.stroke();

    ctx.beginPath();
    outer.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));
    ctx.closePath();ctx.strokeStyle="#a6b2b8";ctx.lineWidth=3;ctx.stroke();

    const s=track[0];
    ctx.save();ctx.translate(s.x,s.y);ctx.rotate(Math.atan2(track[1].y-s.y,track[1].x-s.x));
    ctx.fillStyle="#fff";ctx.fillRect(-4,-trackWidth/2,8,trackWidth);
    ctx.restore();
  }

  function castRay(car,angle,max=180){
    for(let d=0;d<=max;d+=5){
      const p={x:car.x+Math.cos(angle)*d,y:car.y+Math.sin(angle)*d};
      if(!onRoad(p))return d;
    }
    return max;
  }

  function sensorContext(car,opponent){
    const a=car.angle;
    const ray=(offset)=>castRay(car,a+offset);
    const dx=opponent.x-car.x,dy=opponent.y-car.y;
    return {
      speed:car.speed,
      frontDistance:ray(0),
      frontLeftDistance:ray(-Math.PI/4),
      frontRightDistance:ray(Math.PI/4),
      leftDistance:ray(-Math.PI/2),
      rightDistance:ray(Math.PI/2),
      rearDistance:ray(Math.PI),
      heading:car.angle,
      trackDirection:Math.atan2(track[1].y-track[0].y,track[1].x-track[0].x),
      opponentDistance:Math.hypot(dx,dy)
    };
  }

  function updateCar(car,dt,control){
    const steering=Math.max(-1,Math.min(1,Number(control.steering)||0));
    const throttle=Math.max(0,Math.min(1,Number(control.throttle)||0));
    const brake=Math.max(0,Math.min(1,Number(control.brake)||0));

    car.angle+=steering*(.035+car.speed*.006)*dt;
    car.speed+=throttle*.12*dt;
    car.speed-=brake*.18*dt;
    car.speed*=Math.pow(.985,dt);
    car.speed=Math.max(0,Math.min(7,car.speed));

    const old={x:car.x,y:car.y};
    car.x+=Math.cos(car.angle)*car.speed*dt;
    car.y+=Math.sin(car.angle)*car.speed*dt;

    if(!onRoad(car)){
      car.speed*=.65;
      car.x=old.x;
      car.y=old.y;
    }

    const angle=Math.atan2(car.y-H/2,car.x-W/2);
    let diff=angle-car.lastAngle;
    while(diff>Math.PI)diff-=Math.PI*2;
    while(diff< -Math.PI)diff+=Math.PI*2;
    if(diff>1.5)car.lap++;
    car.lastAngle=angle;
  }

  function drawCar(car){
    ctx.save();ctx.translate(car.x,car.y);ctx.rotate(car.angle);
    ctx.fillStyle=car.color;
    ctx.beginPath();ctx.roundRect(-17,-10,34,20,5);ctx.fill();
    ctx.fillStyle="#17202b";ctx.fillRect(1,-7,9,14);
    ctx.fillStyle="#e8f1ff";ctx.fillRect(11,-6,5,12);
    ctx.restore();
  }

  function loop(time){
    raf=requestAnimationFrame(loop);
    const dt=Math.min((time-last)/16.67||1,2);
    last=time;
    drawTrack();

    const player=cars[0],bot=cars[1];
    const playerControl={
      throttle:keys.arrowup||keys.z||keys.w?1:0,
      brake:keys.arrowdown||keys.s?1:0,
      steering:(keys.arrowright||keys.d?1:0)-(keys.arrowleft||keys.q||keys.a?1:0)
    };

    const context=sensorContext(bot,player);
    const output=runActiveBot("racing",context);
    let botControl={
      throttle:Number(output.throttle),
      brake:Number(output.brake),
      steering:Number(output.steering)
    };

    if($("active-bot-select")?.value==="default"){
      const front=context.frontDistance;
      const left=context.frontLeftDistance;
      const right=context.frontRightDistance;
      botControl={
        throttle:front<55?.25:.9,
        brake:front<35?.7:0,
        steering:left<45?.65:right<45?-.65:0
      };
    }

    updateCar(player,dt,playerControl);
    updateCar(bot,dt,botControl);
    drawCar(player);drawCar(bot);

    $("race-status").textContent=`TOI ${player.lap}/3 TOURS  ·  BOT ${bot.lap}/3 TOURS  ·  VITESSE ${Math.round(player.speed*20)}`;

    if(player.lap>=3||bot.lap>=3){
      cancelAnimationFrame(raf);
      $("race-status").textContent=player.lap>=3?"Tu as gagné la course !":"Le bot a gagné la course !";
    }
  }

  function newRace(){
    cancelAnimationFrame(raf);
    generateTrack();
    resetCars();
    last=0;
    raf=requestAnimationFrame(loop);
  }

  function onDown(e){keys[e.key.toLowerCase()]=true;}
  function onUp(e){keys[e.key.toLowerCase()]=false;}
  window.addEventListener("keydown",onDown);
  window.addEventListener("keyup",onUp);
  $("race-new").onclick=newRace;
  newRace();

  return ()=>{
    cancelAnimationFrame(raf);
    window.removeEventListener("keydown",onDown);
    window.removeEventListener("keyup",onUp);
  };
}

/* =========================================================
   GAME ROUTER
   ========================================================= */

function startGame(game) {
  if(gameCleanup){gameCleanup();gameCleanup=null;}
  currentGame=game;
  currentGameSession={restart:()=>startGame(game)};

  const cleanup = {
    chess:renderChess,
    connect4:renderConnect4,
    pingpong:renderPingPong,
    racing:renderRacing,
    snake:renderSnake
  }[game]();

  if(typeof cleanup==="function")gameCleanup=cleanup;
  $("edit-current-bot").onclick=()=>{
    const bot=getActiveBot(game);
    if(bot?.graph)loadGraphFromBot(bot);
    else {
      showPage("editor");
      $("editor-game").value=game;
      currentGame=game;
      createNewBot();
    }
  };
}

/* =========================================================
   LOAD DEFAULT BOTS
   ========================================================= */

async function loadDefaultBots(){
  try{
    const response=await fetch("./default-bots.json");
    if(!response.ok)throw new Error("default-bots.json unavailable");
    const data=await response.json();
    if(data.format==="BOTS_ARENA_DEFAULTS"&&data.bots){
      defaultBots=data.bots;
    }
  }catch(error){
    console.warn("Default bots could not be loaded:",error);
    defaultBots={};
  }
}

function setupEditor(){
  const select=$("editor-game");
  select.innerHTML="";
  Object.entries(GAMES).forEach(([id,game])=>{
    const option=document.createElement("option");
    option.value=id;
    option.textContent=game.name;
    select.appendChild(option);
  });
  select.value="chess";
  currentGame="chess";
  graph={nodes:[],connections:[]};
  renderEditor();
}

async function init(){
  renderGameLibrary();
  setupEditor();
  await loadDefaultBots();
  showPage("games");
}

init();
