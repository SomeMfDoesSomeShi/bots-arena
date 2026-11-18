
"use strict";

/* ============================================================
   NEONLAB — APP.JS
   Visual node editor + graph interpreter + game engines
   ============================================================ */

const $ = id => document.getElementById(id);

const STORAGE_KEY = "neonlab_bots";
const BOT_FORMAT = "NEONLAB_BOT";
const BOT_VERSION = 2;

const GAME_INFO = {
  chess: {
    name: "Chess",
    inputs: [
      ["legalMoves", "Legal Moves", "list"],
      ["currentTurn", "Current Turn", "number"],
      ["isCheck", "Is Check", "boolean"],
      ["whitePieces", "White Pieces", "number"],
      ["blackPieces", "Black Pieces", "number"],
      ["moveCount", "Move Count", "number"],
      ["board", "Board", "list"]
    ],
    outputs: [
      ["move", "Choose Move", "text"]
    ]
  },

  connect4: {
    name: "Puissance 4",
    inputs: [
      ["availableColumns", "Available Columns", "list"],
      ["currentPlayer", "Current Player", "number"],
      ["board", "Board", "list"],
      ["centerColumn", "Center Column", "number"],
      ["winningMoves", "Winning Moves", "list"],
      ["opponentThreats", "Opponent Threats", "list"]
    ],
    outputs: [
      ["column", "Choose Column", "number"]
    ]
  },

  pingpong: {
    name: "3D Ping Pong",
    inputs: [
      ["ballX", "Ball Position X", "number"],
      ["ballY", "Ball Position Y", "number"],
      ["ballZ", "Ball Position Z", "number"],
      ["ballVelocityX", "Ball Velocity X", "number"],
      ["ballVelocityY", "Ball Velocity Y", "number"],
      ["ballVelocityZ", "Ball Velocity Z", "number"],
      ["paddleX", "Paddle Position X", "number"],
      ["paddleY", "Paddle Position Y", "number"],
      ["ballApproaching", "Ball Approaching", "boolean"]
    ],
    outputs: [
      ["targetX", "Paddle Target X", "number"],
      ["targetY", "Paddle Target Y", "number"],
      ["serve", "Serve", "boolean"]
    ]
  },

  racing: {
    name: "Racing AI",
    inputs: [
      ["speed", "Speed", "number"],
      ["front", "Front Distance", "number"],
      ["frontLeft", "Front Left Distance", "number"],
      ["frontRight", "Front Right Distance", "number"],
      ["left", "Left Distance", "number"],
      ["right", "Right Distance", "number"],
      ["rear", "Rear Distance", "number"],
      ["opponentDistance", "Opponent Distance", "number"],
      ["heading", "Heading", "number"],
      ["curve", "Curve Direction", "number"]
    ],
    outputs: [
      ["throttle", "Throttle", "number"],
      ["brake", "Brake", "number"],
      ["steering", "Steering", "number"]
    ]
  },

  snake: {
    name: "Snake",
    inputs: [
      ["headX", "Head X", "number"],
      ["headY", "Head Y", "number"],
      ["foodX", "Food X", "number"],
      ["foodY", "Food Y", "number"],
      ["distanceFood", "Distance To Food", "number"],
      ["wallFront", "Wall Front", "number"],
      ["wallLeft", "Wall Left", "number"],
      ["wallRight", "Wall Right", "number"],
      ["body", "Body Positions", "list"],
      ["availableDirections", "Available Directions", "list"]
    ],
    outputs: [
      ["direction", "Choose Direction", "text"]
    ]
  }
};

/* ============================================================
   NODE DEFINITIONS
   ============================================================ */

const NODE_TYPES = {
  event: {
    label: "START / EVENT",
    category: "EVENTS",
    color: "#8b68ff",
    description: "Déclenche l'exécution du bot.",
    ports: [
      {id:"next", label:"Then", direction:"out", type:"exec"}
    ]
  },

  gameInputs: {
    label: "GAME INPUTS",
    category: "GAME",
    color: "#278eae",
    description: "Contient tous les capteurs et informations du jeu."
  },

  gameOutputs: {
    label: "GAME OUTPUTS",
    category: "GAME",
    color: "#39b98d",
    description: "Contient toutes les commandes disponibles pour le jeu."
  },

  number: {
    label: "NUMBER",
    category: "VALUES",
    color: "#4d9ce0",
    description: "Une valeur numérique.",
    ports: [
      {id:"value",label:"Value",direction:"out",type:"number"}
    ]
  },

  boolean: {
    label: "BOOLEAN",
    category: "VALUES",
    color: "#4d9ce0",
    description: "Une valeur vraie ou fausse.",
    ports: [
      {id:"value",label:"Value",direction:"out",type:"boolean"}
    ]
  },

  text: {
    label: "TEXT",
    category: "VALUES",
    color: "#4d9ce0",
    description: "Une valeur textuelle.",
    ports: [
      {id:"value",label:"Value",direction:"out",type:"text"}
    ]
  },

  math: {
    label: "MATH",
    category: "MATH",
    color: "#d29c49",
    description: "Effectue un calcul.",
    ports: [
      {id:"a",label:"A",direction:"in",type:"number"},
      {id:"b",label:"B",direction:"in",type:"number"},
      {id:"result",label:"Result",direction:"out",type:"number"}
    ]
  },

  compare: {
    label: "COMPARE",
    category: "LOGIC",
    color: "#d29c49",
    description: "Compare deux valeurs.",
    ports: [
      {id:"a",label:"A",direction:"in",type:"any"},
      {id:"b",label:"B",direction:"in",type:"any"},
      {id:"result",label:"Result",direction:"out",type:"boolean"}
    ]
  },

  logic: {
    label: "AND / OR",
    category: "LOGIC",
    color: "#d29c49",
    description: "Combine deux conditions.",
    ports: [
      {id:"a",label:"A",direction:"in",type:"boolean"},
      {id:"b",label:"B",direction:"in",type:"boolean"},
      {id:"result",label:"Result",direction:"out",type:"boolean"}
    ]
  },

  not: {
    label: "NOT",
    category: "LOGIC",
    color: "#d29c49",
    description: "Inverse une condition.",
    ports: [
      {id:"a",label:"Input",direction:"in",type:"boolean"},
      {id:"result",label:"Result",direction:"out",type:"boolean"}
    ]
  },

  condition: {
    label: "IF / ELSE",
    category: "FLOW",
    color: "#d29c49",
    description: "Choisit une branche selon une condition.",
    ports: [
      {id:"execIn",label:"Execute",direction:"in",type:"exec"},
      {id:"condition",label:"Condition",direction:"in",type:"boolean"},
      {id:"true",label:"True",direction:"out",type:"exec"},
      {id:"false",label:"False",direction:"out",type:"exec"}
    ]
  },

  setVariable: {
    label: "SET VARIABLE",
    category: "VARIABLES",
    color: "#b47be9",
    description: "Enregistre une valeur dans une variable.",
    ports: [
      {id:"execIn",label:"Execute",direction:"in",type:"exec"},
      {id:"value",label:"Value",direction:"in",type:"any"},
      {id:"next",label:"Then",direction:"out",type:"exec"}
    ]
  },

  getVariable: {
    label: "GET VARIABLE",
    category: "VARIABLES",
    color: "#b47be9",
    description: "Récupère la valeur d'une variable.",
    ports: [
      {id:"value",label:"Value",direction:"out",type:"any"}
    ]
  },

  random: {
    label: "RANDOM",
    category: "MATH",
    color: "#d29c49",
    description: "Génère un nombre aléatoire.",
    ports: [
      {id:"min",label:"Min",direction:"in",type:"number"},
      {id:"max",label:"Max",direction:"in",type:"number"},
      {id:"result",label:"Result",direction:"out",type:"number"}
    ]
  },

  listLength: {
    label: "LIST LENGTH",
    category: "LISTS",
    color: "#d29c49",
    description: "Retourne le nombre d'éléments d'une liste.",
    ports: [
      {id:"list",label:"List",direction:"in",type:"list"},
      {id:"length",label:"Length",direction:"out",type:"number"}
    ]
  },

  listGet: {
    label: "LIST GET",
    category: "LISTS",
    color: "#d29c49",
    description: "Récupère un élément d'une liste.",
    ports: [
      {id:"list",label:"List",direction:"in",type:"list"},
      {id:"index",label:"Index",direction:"in",type:"number"},
      {id:"value",label:"Value",direction:"out",type:"any"}
    ]
  },

  repeat: {
    label: "REPEAT",
    category: "FLOW",
    color: "#d29c49",
    description: "Répète une séquence un nombre défini de fois.",
    ports: [
      {id:"execIn",label:"Execute",direction:"in",type:"exec"},
      {id:"count",label:"Count",direction:"in",type:"number"},
      {id:"body",label:"Loop",direction:"out",type:"exec"},
      {id:"next",label:"Then",direction:"out",type:"exec"}
    ]
  }
};

/* ============================================================
   APPLICATION STATE
   ============================================================ */

let currentGame = "chess";
let selectedGame = "chess";
let nodes = [];
let connections = [];
let selectedNode = null;
let pendingPort = null;
let dragging = null;
let savedBots = loadSavedBots();
let gameRuntime = null;
let gameAnimation = null;

function uid() {
  return "n_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function loadSavedBots() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function persistBots() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(savedBots));
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

/* ============================================================
   INJECTED EDITOR STYLES
   ============================================================ */

(function injectEditorStyles() {
  const style = document.createElement("style");
  style.textContent = `
    .visual-node {
      min-width:190px;
      width:210px;
      overflow:visible;
      user-select:none;
    }

    .visual-node .node-header {
      min-height:32px;
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:8px;
      cursor:grab;
    }

    .visual-node .node-header:active {
      cursor:grabbing;
    }

    .node-body {
      display:flex;
      flex-direction:column;
      gap:5px;
      padding:9px 7px;
    }

    .node-port-row {
      display:flex;
      align-items:center;
      justify-content:space-between;
      min-height:23px;
      gap:8px;
      font-size:10px;
      color:#c5cee1;
    }

    .node-port-row.input {
      justify-content:flex-start;
    }

    .node-port-row.output {
      justify-content:flex-end;
    }

    .node-port {
      width:13px;
      height:13px;
      min-width:13px;
      border:2px solid #dce6f7;
      border-radius:50%;
      background:#101725;
      padding:0;
      cursor:crosshair;
      position:relative;
      z-index:5;
    }

    .node-port[data-type="number"] { border-color:#4d9ce0; }
    .node-port[data-type="boolean"] { border-color:#e2ad50; }
    .node-port[data-type="text"] { border-color:#bd83ed; }
    .node-port[data-type="list"] { border-color:#43c7a0; }
    .node-port[data-type="exec"] {
      border-radius:3px;
      transform:rotate(45deg);
      border-color:#f4f4f4;
    }

    .node-port.pending {
      background:#35e6db;
      box-shadow:0 0 12px #35e6db;
    }

    .node-port.connected {
      background:currentColor;
    }

    .node-setting {
      width:100%;
      margin:5px 0;
      font-size:10px;
    }

    .node-inline-label {
      font-size:9px;
      color:#8996af;
      margin-top:4px;
    }

    .wire {
      fill:none;
      stroke-width:3;
      pointer-events:stroke;
      cursor:pointer;
      opacity:.85;
    }

    .wire.data { stroke:#35e6db; }
    .wire.exec { stroke:#f1f3fa; stroke-dasharray:7 5; }
    .wire:hover { stroke:#ffffff; stroke-width:5; }
    .wire.pending { stroke:#35e6db; stroke-width:2; stroke-dasharray:4 5; }

    #connections {
      overflow:visible;
      z-index:1;
    }

    .visual-node { z-index:2; }

    .connection-hint {
      color:#35e6db;
    }

    .node-property-field {
      display:block;
      width:100%;
      margin:8px 0;
      font-size:11px;
    }

    .game-board {
      display:grid;
      grid-template-columns:repeat(7, minmax(32px,52px));
      gap:6px;
      justify-content:center;
      background:#1748a0;
      padding:12px;
      width:max-content;
      max-width:100%;
      margin:20px auto;
      border-radius:12px;
    }

    .connect-cell {
      width:100%;
      aspect-ratio:1;
      border:0;
      border-radius:50%;
      background:#091d48;
    }

    .connect-cell.p1 { background:#ffd83d; }
    .connect-cell.p2 { background:#ef5365; }

    .game-controls {
      display:flex;
      flex-wrap:wrap;
      justify-content:center;
      align-items:center;
      gap:10px;
      margin:15px;
    }

    .game-status {
      color:#35e6db;
      text-align:center;
      min-height:24px;
    }

    .game-canvas {
      display:block;
      max-width:100%;
      margin:auto;
      border-radius:10px;
      background:#071018;
    }

    .test-result {
      margin-top:15px;
      padding:12px;
      border:1px solid var(--border);
      border-radius:8px;
      color:var(--muted);
      font-size:12px;
    }

    .tiny-button {
      padding:5px 8px;
      border:1px solid var(--border);
      background:#171d2b;
      color:#ccd5e8;
      border-radius:5px;
      font-size:9px;
      cursor:pointer;
    }

    .node-library .library-node {
      text-align:left;
    }
  `;
  document.head.appendChild(style);
})();

/* ============================================================
   NAVIGATION
   ============================================================ */

function showPage(page) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));

  const target = $(page + "-page");
  if (target) target.classList.add("active");

  document.querySelectorAll(".nav-button").forEach(button => {
    button.classList.toggle("active", button.dataset.page === page);
  });

  const titles = {
    games:"Game Library",
    bots:"My Bots",
    editor:"Visual Bot Editor",
    arena:"Bot Arena"
  };

  if ($("page-title")) {
    $("page-title").textContent = titles[page] || "Game Session";
  }

  if (page === "bots") renderBots();
  if (page === "editor") refreshEditor();
}

document.querySelectorAll(".nav-button").forEach(button => {
  button.addEventListener("click", () => showPage(button.dataset.page));
});

function openEditorForGame() {
  $("editor-game").value = selectedGame;
  currentGame = selectedGame;
  showPage("editor");
}

function newBot() {
  nodes = [];
  connections = [];
  selectedNode = null;
  currentGame = $("editor-game").value || "chess";
  $("bot-name").value = "New Bot";
  showPage("editor");
}

/* ============================================================
   NODE PORT DEFINITIONS
   ============================================================ */

function getPorts(node) {
  const game = GAME_INFO[currentGame];

  if (node.type === "gameInputs") {
    return game.inputs.map(([id,label,type]) => ({
      id,
      label,
      type,
      direction:"out"
    }));
  }

  if (node.type === "gameOutputs") {
    return [
      {id:"execIn",label:"Execute",type:"exec",direction:"in"},
      ...game.outputs.map(([id,label,type]) => ({
        id,label,type,direction:"in"
      }))
    ];
  }

  if (node.type === "getVariable") {
    return [{
      id:"value",
      label:node.config.name || "Value",
      type:"any",
      direction:"out"
    }];
  }

  return NODE_TYPES[node.type]?.ports || [];
}

function getPort(nodeId, portId) {
  const node = nodes.find(n => n.id === nodeId);
  if (!node) return null;
  return getPorts(node).find(p => p.id === portId) || null;
}

function compatibleTypes(a, b) {
  if (a === "any" || b === "any") return true;
  return a === b;
}

/* ============================================================
   EDITOR INITIALISATION
   ============================================================ */

function refreshEditor() {
  currentGame = $("editor-game").value;
  $("workspace-game").textContent = GAME_INFO[currentGame].name.toUpperCase();

  renderNodeLibrary();
  renderNodes();
  updateConnectionHint();
}

$("editor-game").addEventListener("change", () => {
  currentGame = $("editor-game").value;
  nodes = [];
  connections = [];
  selectedNode = null;
  pendingPort = null;
  refreshEditor();
});

function renderNodeLibrary() {
  const root = $("node-library-content");
  root.innerHTML = "";

  const groups = {};

  Object.entries(NODE_TYPES).forEach(([key, def]) => {
    if (!groups[def.category]) groups[def.category] = [];
    groups[def.category].push([key,def]);
  });

  Object.entries(groups).forEach(([category, entries]) => {
    const heading = document.createElement("div");
    heading.className = "node-category";
    heading.textContent = category;
    root.appendChild(heading);

    entries.forEach(([key,def]) => {
      const button = document.createElement("button");
      button.className = "library-node";
      button.textContent = "+ " + def.label;
      button.onclick = () => addNode(key);
      root.appendChild(button);
    });
  });

  const gameHeading = document.createElement("div");
  gameHeading.className = "node-category";
  gameHeading.textContent = "GAME BLOCKS";
  root.appendChild(gameHeading);

  ["gameInputs","gameOutputs"].forEach(type => {
    const button = document.createElement("button");
    button.className = "library-node";
    button.textContent = "+ " + NODE_TYPES[type].label;
    button.onclick = () => addNode(type);
    root.appendChild(button);
  });
}

function addNode(type) {
  if (!NODE_TYPES[type]) return;

  if (type === "gameInputs" && nodes.some(n => n.type === type)) {
    selectNode(nodes.find(n => n.type === type).id);
    return;
  }

  if (type === "gameOutputs" && nodes.some(n => n.type === type)) {
    selectNode(nodes.find(n => n.type === type).id);
    return;
  }

  const node = {
    id:uid(),
    type,
    x:45 + Math.random() * 100,
    y:45 + Math.random() * 100,
    config:{
      value:type === "number" ? 0 : "",
      operation:">",
      logic:"AND",
      name:"myVariable",
      boolean:false
    }
  };

  nodes.push(node);
  selectedNode = node.id;
  renderNodes();
}

/* ============================================================
   CONNECTIONS
   ============================================================ */

function handlePortClick(nodeId, portId) {
  const port = getPort(nodeId, portId);
  if (!port) return;

  if (!pendingPort) {
    if (port.direction !== "out") {
      updateConnectionHint("Commence par une prise de sortie.");
      return;
    }

    pendingPort = {nodeId,portId};
    renderNodes();
    updateConnectionHint("Maintenant, clique sur une prise d'entrée compatible.");
    return;
  }

  const source = getPort(pendingPort.nodeId,pendingPort.portId);

  if (port.direction !== "in") {
    pendingPort = null;
    renderNodes();
    updateConnectionHint("La deuxième prise doit être une entrée.");
    return;
  }

  if (pendingPort.nodeId === nodeId) {
    pendingPort = null;
    renderNodes();
    updateConnectionHint("Impossible de relier un bloc à lui-même.");
    return;
  }

  if (!source || !compatibleTypes(source.type,port.type)) {
    pendingPort = null;
    renderNodes();
    updateConnectionHint("Types incompatibles.");
    return;
  }

  // Une entrée ne reçoit qu'une connexion.
  connections = connections.filter(c =>
    !(c.to.node === nodeId && c.to.port === portId)
  );

  connections.push({
    id:uid(),
    from:{node:pendingPort.nodeId,port:pendingPort.portId},
    to:{node:nodeId,port:portId}
  });

  pendingPort = null;
  renderNodes();
  updateConnectionHint("Connexion créée !");
}

function removeConnection(id) {
  connections = connections.filter(c => c.id !== id);
  renderConnections();
}

function updateConnectionHint(message) {
  const hint = $("connection-hint");
  if (!hint) return;

  hint.textContent = message || (
    pendingPort
      ? "Choisis une prise d'entrée compatible"
      : "Clique sur une sortie puis une entrée"
  );
}

function getConnectionForInput(nodeId, portId) {
  return connections.find(c =>
    c.to.node === nodeId && c.to.port === portId
  );
}

function getConnectionsFrom(nodeId, portId) {
  return connections.filter(c =>
    c.from.node === nodeId && c.from.port === portId
  );
}

function portElement(nodeId, portId) {
  return document.querySelector(
    `.node-port[data-node="${nodeId}"][data-port="${portId}"]`
  );
}

function renderConnections() {
  const svg = $("connections");
  const canvas = $("node-canvas");
  if (!svg || !canvas) return;

  const width = Math.max(canvas.scrollWidth,canvas.clientWidth);
  const height = Math.max(canvas.scrollHeight,canvas.clientHeight);

  svg.setAttribute("width",width);
  svg.setAttribute("height",height);
  svg.setAttribute("viewBox",`0 0 ${width} ${height}`);
  svg.innerHTML = "";

  connections.forEach(connection => {
    const from = portElement(connection.from.node,connection.from.port);
    const to = portElement(connection.to.node,connection.to.port);
    if (!from || !to) return;

    const a = from.getBoundingClientRect();
    const b = to.getBoundingClientRect();
    const c = canvas.getBoundingClientRect();

    const x1 = a.left + a.width/2 - c.left + canvas.scrollLeft;
    const y1 = a.top + a.height/2 - c.top + canvas.scrollTop;
    const x2 = b.left + b.width/2 - c.left + canvas.scrollLeft;
    const y2 = b.top + b.height/2 - c.top + canvas.scrollTop;

    const curve = Math.max(45,Math.abs(x2-x1)*.5);

    const path = document.createElementNS("http://www.w3.org/2000/svg","path");
    path.setAttribute("d",`M ${x1} ${y1} C ${x1+curve} ${y1}, ${x2-curve} ${y2}, ${x2} ${y2}`);
    path.setAttribute("class",getPort(connection.from.node,connection.from.port)?.type === "exec" ? "wire exec" : "wire data");
    path.dataset.id = connection.id;

    path.addEventListener("click",() => removeConnection(connection.id));
    svg.appendChild(path);
  });
}

/* ============================================================
   NODE RENDERING
   ============================================================ */

function createPort(node,port) {
  const row = document.createElement("div");
  row.className = "node-port-row " + port.direction;

  const socket = document.createElement("button");
  socket.className = "node-port";
  socket.dataset.node = node.id;
  socket.dataset.port = port.id;
  socket.dataset.type = port.type;
  socket.title = `${port.label} (${port.type})`;

  const linked = port.direction === "in"
    ? !!getConnectionForInput(node.id,port.id)
    : getConnectionsFrom(node.id,port.id).length > 0;

  if (linked) socket.classList.add("connected");

  if (
    pendingPort &&
    pendingPort.nodeId === node.id &&
    pendingPort.portId === port.id
  ) {
    socket.classList.add("pending");
  }

  socket.addEventListener("click",e => {
    e.stopPropagation();
    handlePortClick(node.id,port.id);
  });

  const label = document.createElement("span");
  label.textContent = port.label;

  if (port.direction === "in") {
    row.append(socket,label);
  } else {
    row.append(label,socket);
  }

  return row;
}

function makeNodeSetting(node) {
  const wrap = document.createElement("div");

  if (node.type === "number") {
    const input = document.createElement("input");
    input.className = "node-setting";
    input.type = "number";
    input.value = node.config.value ?? 0;
    input.addEventListener("input",() => {
      node.config.value = Number(input.value);
    });
    wrap.append(input);
  }

  if (node.type === "boolean") {
    const select = document.createElement("select");
    select.className = "node-setting";

    [["true","TRUE"],["false","FALSE"]].forEach(([value,label]) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = label;
      select.append(option);
    });

    select.value = String(!!node.config.boolean);
    select.onchange = () => node.config.boolean = select.value === "true";
    wrap.append(select);
  }

  if (node.type === "text") {
    const input = document.createElement("input");
    input.className = "node-setting";
    input.value = node.config.value || "";
    input.placeholder = "Enter text";
    input.oninput = () => node.config.value = input.value;
    wrap.append(input);
  }

  if (node.type === "math") {
    const select = document.createElement("select");
    select.className = "node-setting";

    ["+","-","×","÷","%","MIN","MAX","POWER"].forEach(op => {
      const option = document.createElement("option");
      option.value = op;
      option.textContent = op;
      select.append(option);
    });

    select.value = node.config.operation || "+";
    select.onchange = () => node.config.operation = select.value;
    wrap.append(select);
  }

  if (node.type === "compare") {
    const select = document.createElement("select");
    select.className = "node-setting";

    [">","<",">=","<=","==","!="].forEach(op => {
      const option = document.createElement("option");
      option.value = op;
      option.textContent = op;
      select.append(option);
    });

    select.value = node.config.operation || ">";
    select.onchange = () => node.config.operation = select.value;
    wrap.append(select);
  }

  if (node.type === "logic") {
    const select = document.createElement("select");
    select.className = "node-setting";

    ["AND","OR","XOR"].forEach(op => {
      const option = document.createElement("option");
      option.value = op;
      option.textContent = op;
      select.append(option);
    });

    select.value = node.config.logic || "AND";
    select.onchange = () => node.config.logic = select.value;
    wrap.append(select);
  }

  if (node.type === "setVariable" || node.type === "getVariable") {
    const input = document.createElement("input");
    input.className = "node-setting";
    input.value = node.config.name || "myVariable";
    input.placeholder = "Variable name";
    input.oninput = () => {
      node.config.name = input.value;
      renderProperties();
    };
    wrap.append(input);
  }

  if (node.type === "repeat") {
    const input = document.createElement("input");
    input.className = "node-setting";
    input.type = "number";
    input.min = 0;
    input.max = 100;
    input.value = node.config.count ?? 3;
    input.oninput = () => node.config.count = Math.max(0,Math.min(100,Number(input.value)));
    wrap.append(input);
  }

  return wrap;
}

function renderNodes() {
  const canvas = $("node-canvas");
  if (!canvas) return;

  canvas.querySelectorAll(".visual-node").forEach(el => el.remove());

  const empty = $("empty-message");
  if (empty) empty.style.display = nodes.length ? "none" : "grid";

  nodes.forEach(node => {
    const definition = NODE_TYPES[node.type];
    if (!definition) return;

    const element = document.createElement("div");
    element.className = "visual-node" + (selectedNode === node.id ? " selected" : "");
    element.dataset.id = node.id;
    element.style.left = node.x + "px";
    element.style.top = node.y + "px";

    const header = document.createElement("div");
    header.className = "node-header";
    header.style.background = definition.color;
    header.style.color = "#071018";
    header.textContent = definition.label;

    const body = document.createElement("div");
    body.className = "node-body";

    const description = document.createElement("div");
    description.style.fontSize = "9px";
    description.style.color = "#94a1b8";
    description.textContent = definition.description;
    body.append(description);

    const ports = getPorts(node);
    const inputs = ports.filter(p => p.direction === "in");
    const outputs = ports.filter(p => p.direction === "out");

    const maxRows = Math.max(inputs.length,outputs.length);

    for (let i=0;i<maxRows;i++) {
      const row = document.createElement("div");
      row.style.display = "grid";
      row.style.gridTemplateColumns = "1fr 1fr";
      row.style.gap = "8px";

      const left = document.createElement("div");
      const right = document.createElement("div");

      if (inputs[i]) left.append(createPort(node,inputs[i]));
      if (outputs[i]) right.append(createPort(node,outputs[i]));

      row.append(left,right);
      body.append(row);
    }

    body.append(makeNodeSetting(node));

    element.append(header,body);

    header.addEventListener("pointerdown",e => {
      if (e.button !== 0) return;
      if (e.target.closest("button")) return;

      selectedNode = node.id;

      dragging = {
        id:node.id,
        startX:e.clientX,
        startY:e.clientY,
        originalX:node.x,
        originalY:node.y
      };

      header.setPointerCapture(e.pointerId);
      renderProperties();
    });

    header.addEventListener("pointermove",e => {
      if (!dragging || dragging.id !== node.id) return;

      node.x = Math.max(0,dragging.originalX + e.clientX - dragging.startX);
      node.y = Math.max(0,dragging.originalY + e.clientY - dragging.startY);

      element.style.left = node.x + "px";
      element.style.top = node.y + "px";
      renderConnections();
    });

    header.addEventListener("pointerup",() => dragging = null);
    header.addEventListener("pointercancel",() => dragging = null);

    element.addEventListener("click",e => {
      if (e.target.closest(".node-port") || e.target.matches("input,select")) return;
      selectNode(node.id);
    });

    element.addEventListener("contextmenu",e => {
      e.preventDefault();
      deleteNode(node.id);
    });

    canvas.appendChild(element);
  });

  renderProperties();
  requestAnimationFrame(renderConnections);
}

function selectNode(id) {
  selectedNode = id;
  renderNodes();
}

function deleteNode(id) {
  nodes = nodes.filter(n => n.id !== id);
  connections = connections.filter(c =>
    c.from.node !== id && c.to.node !== id
  );

  if (selectedNode === id) selectedNode = null;
  if (pendingPort?.nodeId === id) pendingPort = null;

  renderNodes();
}

function renderProperties() {
  const root = $("properties-content");
  if (!root) return;

  root.innerHTML = "";

  const node = nodes.find(n => n.id === selectedNode);

  if (!node) {
    root.textContent = "Sélectionne un bloc pour voir ses propriétés.";
    return;
  }

  const title = document.createElement("b");
  title.textContent = NODE_TYPES[node.type].label;

  const description = document.createElement("p");
  description.textContent = NODE_TYPES[node.type].description;

  const details = document.createElement("p");
  details.textContent = `ID : ${node.id}`;

  const deleteButton = document.createElement("button");
  deleteButton.className = "secondary-button";
  deleteButton.textContent = "DELETE NODE";
  deleteButton.onclick = () => deleteNode(node.id);

  root.append(title,description,details,deleteButton);
}

/* ============================================================
   GRAPH INTERPRETER
   ============================================================ */

function getGameOutputDefaults(game) {
  const result = {};
  GAME_INFO[game].outputs.forEach(([id,,type]) => {
    if (type === "boolean") result[id] = false;
    else if (type === "number") result[id] = 0;
    else result[id] = "";
  });
  return result;
}

function executeBot(gameState, botData = null) {
  const graph = botData || {
    game:currentGame,
    nodes,
    connections
  };

  const localNodes = graph.nodes || [];
  const localConnections = graph.connections || [];

  const variables = {};
  const outputs = getGameOutputDefaults(graph.game || currentGame);
  const visited = new Set();
  let operations = 0;

  function findNode(id) {
    return localNodes.find(n => n.id === id);
  }

  function inputConnection(nodeId,portId) {
    return localConnections.find(c =>
      c.to.node === nodeId && c.to.port === portId
    );
  }

  function outgoing(nodeId,portId) {
    return localConnections.filter(c =>
      c.from.node === nodeId && c.from.port === portId
    );
  }

  function evaluate(nodeId,portId,depth=0) {
    if (depth > 80) return 0;

    const node = findNode(nodeId);
    if (!node) return 0;

    const key = `${nodeId}:${portId}`;
    if (visited.has(key)) return 0;

    visited.add(key);

    const get = input => {
      const link = inputConnection(node.id,input);
      if (!link) return 0;
      return evaluate(link.from.node,link.from.port,depth+1);
    };

    let value = 0;

    switch(node.type) {
      case "gameInputs":
        value = gameState?.[portId] ?? 0;
        break;

      case "number":
        value = Number(node.config.value) || 0;
        break;

      case "boolean":
        value = !!node.config.boolean;
        break;

      case "text":
        value = String(node.config.value || "");
        break;

      case "math": {
        const a = Number(get("a")) || 0;
        const b = Number(get("b")) || 0;
        switch(node.config.operation) {
          case "-": value = a-b; break;
          case "×": value = a*b; break;
          case "÷": value = b === 0 ? 0 : a/b; break;
          case "%": value = b === 0 ? 0 : a%b; break;
          case "MIN": value = Math.min(a,b); break;
          case "MAX": value = Math.max(a,b); break;
          case "POWER": value = Math.pow(a,b); break;
          default: value = a+b;
        }
        break;
      }

      case "compare": {
        const a = get("a");
        const b = get("b");
        switch(node.config.operation) {
          case "<": value = a < b; break;
          case ">=": value = a >= b; break;
          case "<=": value = a <= b; break;
          case "==": value = a == b; break;
          case "!=": value = a != b; break;
          default: value = a > b;
        }
        break;
      }

      case "logic": {
        const a = !!get("a");
        const b = !!get("b");
        switch(node.config.logic) {
          case "OR": value = a || b; break;
          case "XOR": value = a !== b; break;
          default: value = a && b;
        }
        break;
      }

      case "not":
        value = !get("a");
        break;

      case "random": {
        const min = Number(get("min")) || 0;
        const max = Number(get("max")) || 1;
        value = min + Math.random()*(max-min);
        break;
      }

      case "getVariable":
        value = variables[node.config.name] ?? 0;
        break;

      case "listLength": {
        const list = get("list");
        value = Array.isArray(list) ? list.length : 0;
        break;
      }

      case "listGet": {
        const list = get("list");
        const index = Math.floor(Number(get("index")) || 0);
        value = Array.isArray(list) ? (list[index] ?? 0) : 0;
        break;
      }

      default:
        value = 0;
    }

    visited.delete(key);
    return value;
  }

  function getInput(node,port) {
    const link = inputConnection(node.id,port);
    if (!link) return 0;
    return evaluate(link.from.node,link.from.port);
  }

  function follow(nodeId,portId,depth=0) {
    if (depth > 100 || operations++ > 500) return;

    const links = outgoing(nodeId,portId);

    for (const link of links) {
      const node = findNode(link.to.node);
      if (!node) continue;

      if (node.type === "condition") {
        const condition = !!getInput(node,"condition");
        follow(node.id,condition ? "true" : "false",depth+1);
      }

      else if (node.type === "setVariable") {
        variables[node.config.name || "myVariable"] = getInput(node,"value");
        follow(node.id,"next",depth+1);
      }

      else if (node.type === "repeat") {
        const count = Math.max(0,Math.min(100,Math.floor(Number(getInput(node,"count")) || node.config.count || 0)));

        for (let i=0;i<count;i++) {
          follow(node.id,"body",depth+1);
        }

        follow(node.id,"next",depth+1);
      }

      else if (node.type === "gameOutputs") {
        GAME_INFO[graph.game || currentGame].outputs.forEach(([id]) => {
          outputs[id] = getInput(node,id);
        });
      }

      else {
        const nextPorts = getPorts(node).filter(p =>
          p.direction === "out" && p.type === "exec"
        );

        nextPorts.forEach(p => follow(node.id,p.id,depth+1));
      }
    }
  }

  const start = localNodes.find(n => n.type === "event");

  if (start) follow(start.id,"next");

  return {
    outputs,
    variables,
    operations,
    success:!!start
  };
}

/* ============================================================
   TEST BOT
   ============================================================ */

function makeTestState(game) {
  if (game === "racing") {
    return {
      speed:45,front:12,frontLeft:8,frontRight:5,
      left:4,right:6,rear:10,opponentDistance:20,
      heading:0,curve:0.5
    };
  }

  if (game === "pingpong") {
    return {
      ballX:1,ballY:1,ballZ:0,
      ballVelocityX:-0.5,ballVelocityY:0.1,ballVelocityZ:0,
      paddleX:0,paddleY:0,ballApproaching:true
    };
  }

  if (game === "snake") {
    return {
      headX:10,headY:10,foodX:15,foodY:10,
      distanceFood:5,wallFront:8,wallLeft:10,wallRight:10,
      body:[],availableDirections:["up","down","left","right"]
    };
  }

  if (game === "connect4") {
    return {
      availableColumns:[0,1,2,3,4,5,6],
      currentPlayer:1,
      board:Array.from({length:6},()=>Array(7).fill(0)),
      centerColumn:3,
      winningMoves:[],
      opponentThreats:[]
    };
  }

  return {
    legalMoves:["e2e4","d2d4","g1f3"],
    currentTurn:1,
    isCheck:false,
    whitePieces:16,
    blackPieces:16,
    moveCount:0,
    board:[]
  };
}

function testBot() {
  const result = executeBot(makeTestState(currentGame));

  const root = $("test-result");
  if (!root) return;

  if (!result.success) {
    root.textContent = "Ajoute un bloc START / EVENT pour exécuter ton bot.";
    return;
  }

  root.innerHTML = "";

  const title = document.createElement("b");
  title.textContent = "BOT EXECUTION SUCCESS";

  const pre = document.createElement("pre");
  pre.style.whiteSpace = "pre-wrap";
  pre.style.color = "#35e6db";
  pre.textContent = JSON.stringify(result.outputs,null,2);

  const info = document.createElement("p");
  info.textContent = `${result.operations} opérations exécutées.`;

  root.append(title,pre,info);
}

/* ============================================================
   SAVE / EXPORT / IMPORT
   ============================================================ */

function currentBotData() {
  return {
    format:BOT_FORMAT,
    version:BOT_VERSION,
    name:$("bot-name").value.trim() || "Unnamed Bot",
    game:currentGame,
    nodes:deepClone(nodes),
    connections:deepClone(connections),
    updated:new Date().toISOString()
  };
}

function saveBot() {
  const bot = currentBotData();

  savedBots = savedBots.filter(b =>
    !(b.name === bot.name && b.game === bot.game)
  );

  savedBots.push(bot);
  persistBots();

  if ($("test-result")) {
    $("test-result").textContent = `Bot "${bot.name}" sauvegardé.`;
  }
}

function downloadJSON(data,filename) {
  const blob = new Blob(
    [JSON.stringify(data,null,2)],
    {type:"application/json"}
  );

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => URL.revokeObjectURL(url),1000);
}

function exportBot() {
  downloadJSON(currentBotData(),"neonlab-bot.json");
}

function validateBot(data) {
  if (!data || data.format !== BOT_FORMAT) {
    throw new Error("Ce fichier n'est pas un bot NeonLab.");
  }

  if (!GAME_INFO[data.game]) {
    throw new Error("Jeu inconnu.");
  }

  if (!Array.isArray(data.nodes) || !Array.isArray(data.connections)) {
    throw new Error("Structure du bot invalide.");
  }

  const validTypes = new Set(Object.keys(NODE_TYPES));

  for (const node of data.nodes) {
    if (!node.id || !validTypes.has(node.type)) {
      throw new Error("Un bloc du fichier est invalide.");
    }
  }

  const ids = new Set(data.nodes.map(n => n.id));

  for (const connection of data.connections) {
    if (!ids.has(connection.from?.node) || !ids.has(connection.to?.node)) {
      throw new Error("Une connexion pointe vers un bloc inexistant.");
    }
  }

  return true;
}

async function readBotFile(file) {
  const data = JSON.parse(await file.text());
  validateBot(data);

  currentGame = data.game;
  $("editor-game").value = data.game;
  $("bot-name").value = data.name || "Imported Bot";

  nodes = deepClone(data.nodes);
  connections = deepClone(data.connections);
  selectedNode = null;
  pendingPort = null;

  refreshEditor();
  showPage("editor");
}

function importBot() {
  const input = $("bot-file-input");
  if (!input) return;
  input.click();
}

if ($("import-button")) {
  $("import-button").addEventListener("click",importBot);
}

if ($("export-button")) {
  $("export-button").addEventListener("click",exportBot);
}

if ($("save-button")) {
  $("save-button").addEventListener("click",saveBot);
}

if ($("test-button")) {
  $("test-button").addEventListener("click",testBot);
}

if ($("bot-file-input")) {
  $("bot-file-input").addEventListener("change",async e => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await readBotFile(file);
    } catch(error) {
      alert("Import impossible : " + error.message);
    }

    e.target.value = "";
  });
}

/* ============================================================
   BOT LIBRARY
   ============================================================ */

function renderBots() {
  const root = $("bot-list");
  if (!root) return;

  root.innerHTML = "";

  if (!savedBots.length) {
    root.textContent = "Aucun bot sauvegardé.";
    return;
  }

  savedBots.forEach(bot => {
    const card = document.createElement("div");
    card.className = "bot-item";

    const title = document.createElement("b");
    title.textContent = bot.name;

    const description = document.createElement("p");
    description.textContent =
      `${GAME_INFO[bot.game]?.name || bot.game} · ${bot.nodes?.length || 0} blocs`;

    const edit = document.createElement("button");
    edit.className = "secondary-button";
    edit.textContent = "EDIT";
    edit.onclick = () => {
      currentGame = bot.game;
      $("editor-game").value = bot.game;
      $("bot-name").value = bot.name;
      nodes = deepClone(bot.nodes || []);
      connections = deepClone(bot.connections || []);
      showPage("editor");
    };

    const exportButton = document.createElement("button");
    exportButton.className = "secondary-button";
    exportButton.textContent = "EXPORT";
    exportButton.onclick = () => downloadJSON(bot,"neonlab-bot.json");

    const remove = document.createElement("button");
    remove.className = "secondary-button";
    remove.textContent = "DELETE";
    remove.onclick = () => {
      savedBots = savedBots.filter(b => b.id !== bot.id);
      persistBots();
      renderBots();
    };

    card.append(title,description,edit,exportButton,remove);
    root.appendChild(card);
  });
}

/* ============================================================
   DEFAULT BOTS
   ============================================================ */

function makeDefaultBot(game,name,strategy) {
  const event = {
    id:uid(),type:"event",x:40,y:100,
    config:{}
  };

  const inputs = {
    id:uid(),type:"gameInputs",x:300,y:50,
    config:{}
  };

  const outputs = {
    id:uid(),type:"gameOutputs",x:650,y:100,
    config:{}
  };

  const extra = [];
  const wires = [];

  if (game === "connect4") {
    const random = {
      id:uid(),type:"random",x:480,y:320,
      config:{}
    };

    const min = {
      id:uid(),type:"number",x:270,y:320,
      config:{value:0}
    };

    const max = {
      id:uid(),type:"number",x:270,y:410,
      config:{value:6}
    };

    extra.push(random,min,max);

    wires.push(
      {id:uid(),from:{node:event.id,port:"next"},to:{node:outputs.id,port:"execIn"}},
      {id:uid(),from:{node:min.id,port:"value"},to:{node:random.id,port:"min"}},
      {id:uid(),from:{node:max.id,port:"value"},to:{node:random.id,port:"max"}},
      {id:uid(),from:{node:random.id,port:"result"},to:{node:outputs.id,port:"column"}}
    );
  }

  else if (game === "racing") {
    const throttle = {
      id:uid(),type:"number",x:350,y:300,
      config:{value:0.8}
    };

    const brake = {
      id:uid(),type:"number",x:350,y:400,
      config:{value:0}
    };

    const steering = {
      id:uid(),type:"number",x:350,y:500,
      config:{value:0}
    };

    extra.push(throttle,brake,steering);

    wires.push(
      {id:uid(),from:{node:event.id,port:"next"},to:{node:outputs.id,port:"execIn"}},
      {id:uid(),from:{node:throttle.id,port:"value"},to:{node:outputs.id,port:"throttle"}},
      {id:uid(),from:{node:brake.id,port:"value"},to:{node:outputs.id,port:"brake"}},
      {id:uid(),from:{node:steering.id,port:"value"},to:{node:outputs.id,port:"steering"}}
    );
  }

  else if (game === "snake") {
    const direction = {
      id:uid(),type:"text",x:350,y:300,
      config:{value:"right"}
    };

    extra.push(direction);

    wires.push(
      {id:uid(),from:{node:event.id,port:"next"},to:{node:outputs.id,port:"execIn"}},
      {id:uid(),from:{node:direction.id,port:"value"},to:{node:outputs.id,port:"direction"}}
    );
  }

  else if (game === "pingpong") {
    const zeroX = {
      id:uid(),type:"number",x:350,y:300,
      config:{value:0}
    };

    const zeroY = {
      id:uid(),type:"number",x:350,y:400,
      config:{value:0}
    };

    extra.push(zeroX,zeroY);

    wires.push(
      {id:uid(),from:{node:event.id,port:"next"},to:{node:outputs.id,port:"execIn"}},
      {id:uid(),from:{node:zeroX.id,port:"value"},to:{node:outputs.id,port:"targetX"}},
      {id:uid(),from:{node:zeroY.id,port:"value"},to:{node:outputs.id,port:"targetY"}}
    );
  }

  return {
    format:BOT_FORMAT,
    version:BOT_VERSION,
    name,
    game,
    strategy,
    nodes:[event,inputs,outputs,...extra],
    connections:wires
  };
}

function downloadDefaults() {
  const pack = {
    format:"NEONLAB_DEFAULT_BOTS",
    version:1,
    bots:[
      makeDefaultBot("connect4","Random Column","random"),
      makeDefaultBot("racing","Sunday Driver","steady"),
      makeDefaultBot("snake","Straight Snake","simple"),
      makeDefaultBot("pingpong","Center Keeper","center")
    ]
  };

  downloadJSON(pack,"default-bots.json");
}

/* ============================================================
   GAME PAGE
   ============================================================ */

function selectGame(game) {
  if (!GAME_INFO[game]) return;

  stopGame();
  selectedGame = game;
  currentGame = game;

  $("selected-game-title").textContent =
    GAME_INFO[game].name.toUpperCase();

  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  $("game-page").classList.add("active");

  if (game === "connect4") renderConnect4();
  if (game === "snake") renderSnake();
  if (game === "chess") renderChess();
  if (game === "pingpong") renderPingPong();
  if (game === "racing") renderRacing();
}

function stopGame() {
  if (gameRuntime?.timer) clearInterval(gameRuntime.timer);
  if (gameAnimation) cancelAnimationFrame(gameAnimation);
  gameRuntime = null;
  gameAnimation = null;
}

/* ============================================================
   BUILT-IN BOT FALLBACKS
   ============================================================ */

function findSavedBot(game) {
  return savedBots.find(b => b.game === game);
}

function chooseBotMove(game,state) {
  const bot = findSavedBot(game);

  if (bot) {
    const result = executeBot(state,bot);
    if (result.success) return result.outputs;
  }

  if (game === "connect4") {
    const legal = state.availableColumns || [];
    if (!legal.length) return {column:3};

    // Win immediately if possible.
    for (const column of legal) {
      if (wouldWin(state.board,column,2)) return {column};
    }

    // Block an immediate opponent win.
    for (const column of legal) {
      if (wouldWin(state.board,column,1)) return {column};
    }

    const preferred = [3,2,4,1,5,0,6].filter(c => legal.includes(c));
    return {column:preferred[0] ?? legal[0]};
  }

  if (game === "snake") {
    const options = state.availableDirections || ["right","down","left","up"];
    const target = options.sort((a,b) => {
      const distance = direction => {
        const dx = direction === "left" ? -1 : direction === "right" ? 1 : 0;
        const dy = direction === "up" ? -1 : direction === "down" ? 1 : 0;
        return Math.abs(state.foodX-(state.headX+dx)) +
          Math.abs(state.foodY-(state.headY+dy));
      };
      return distance(a)-distance(b);
    });

    return {direction:target[0] || "right"};
  }

  if (game === "racing") {
    return {
      throttle:state.front < 5 ? .25 : .8,
      brake:state.front < 3 ? .7 : 0,
      steering:Math.max(-1,Math.min(1,state.curve || 0))
    };
  }

  if (game === "pingpong") {
    return {
      targetX:state.ballX,
      targetY:state.ballY,
      serve:false
    };
  }

  return {};
}

/* ============================================================
   CONNECT FOUR
   ============================================================ */

function createConnectBoard() {
  return Array.from({length:6},()=>Array(7).fill(0));
}

function connectWin(board,player) {
  const directions = [[0,1],[1,0],[1,1],[1,-1]];

  for (let r=0;r<6;r++) {
    for (let c=0;c<7;c++) {
      for (const [dr,dc] of directions) {
        let count = 0;

        for (let k=0;k<4;k++) {
          const rr=r+dr*k, cc=c+dc*k;
          if (
            rr>=0 && rr<6 &&
            cc>=0 && cc<7 &&
            board[rr][cc]===player
          ) count++;
        }

        if (count===4) return true;
      }
    }
  }

  return false;
}

function dropConnect(board,column,player) {
  for (let r=5;r>=0;r--) {
    if (!board[r][column]) {
      board[r][column]=player;
      return true;
    }
  }
  return false;
}

function wouldWin(board,column,player) {
  const copy = deepClone(board);
  return dropConnect(copy,column,player) && connectWin(copy,player);
}

function renderConnect4() {
  const root = $("game-container");

  root.innerHTML = `
    <div style="text-align:center">
      <h3>PUISSANCE 4</h3>
      <p class="game-status" id="connect-status">À toi de jouer — jaune</p>
      <div id="connect-board" class="game-board"></div>
      <div class="game-controls">
        <button class="primary-button" id="connect-reset">RESTART</button>
        <button class="secondary-button" id="connect-bot">PLAY AGAINST BOT</button>
      </div>
    </div>`;

  gameRuntime = {
    board:createConnectBoard(),
    turn:1,
    finished:false,
    botEnabled:true,
    timer:null
  };

  const runtime = gameRuntime;

  function draw() {
    const board = $("connect-board");
    board.innerHTML = "";

    runtime.board.forEach((row,r) => row.forEach((value,c) => {
      const cell = document.createElement("button");
      cell.className = "connect-cell" + (value===1 ? " p1" : value===2 ? " p2" : "");
      cell.title = `Column ${c+1}`;
      cell.onclick = () => play(c);
      board.appendChild(cell);
    }));
  }

  function stateFor(player) {
    const available = runtime.board[0]
      .map((v,i)=>v===0?i:-1)
      .filter(i=>i>=0);

    return {
      board:deepClone(runtime.board),
      availableColumns:available,
      currentPlayer:player,
      centerColumn:3,
      winningMoves:available.filter(c=>wouldWin(runtime.board,c,player)),
      opponentThreats:available.filter(c=>wouldWin(runtime.board,c,player===1?2:1))
    };
  }

  function finish(message) {
    runtime.finished = true;
    $("connect-status").textContent = message;
  }

  function play(column) {
    if (runtime.finished || runtime.turn!==1) return;
    if (!dropConnect(runtime.board,column,1)) return;

    draw();

    if (connectWin(runtime.board,1)) {
      finish("Tu as gagné !");
      return;
    }

    if (runtime.board[0].every(Boolean)) {
      finish("Match nul !");
      return;
    }

    runtime.turn=2;
    $("connect-status").textContent="Le bot réfléchit…";

    setTimeout(() => {
      if (runtime.finished) return;

      const state=stateFor(2);
      const decision=runtime.botEnabled
        ? chooseBotMove("connect4",state)
        : {column:Math.floor(Math.random()*7)};

      const selected=Number(decision.column);
      const legal=state.availableColumns;
      const columnToPlay=legal.includes(selected)
        ? selected
        : legal[Math.floor(Math.random()*legal.length)];

      if (columnToPlay===undefined) {
        finish("Match nul !");
        return;
      }

      dropConnect(runtime.board,columnToPlay,2);
      draw();

      if (connectWin(runtime.board,2)) {
        finish("Le bot a gagné.");
        return;
      }

      if (runtime.board[0].every(Boolean)) {
        finish("Match nul !");
        return;
      }

      runtime.turn=1;
      $("connect-status").textContent="À toi de jouer — jaune";
    },350);
  }

  $("connect-reset").onclick=renderConnect4;
  $("connect-bot").onclick=()=>{
    runtime.botEnabled=!runtime.botEnabled;
    $("connect-bot").textContent=runtime.botEnabled ? "PLAY AGAINST BOT" : "RANDOM BOT";
  };

  draw();
}

/* ============================================================
   SNAKE
   ============================================================ */

function renderSnake() {
  const root=$("game-container");

  root.innerHTML=`
    <div style="text-align:center">
      <h3>SNAKE</h3>
      <p class="game-status" id="snake-score">Score : 0</p>
      <canvas id="snake-canvas" class="game-canvas" width="440" height="440"></canvas>
      <div class="game-controls">
        <button class="primary-button" id="snake-start">START / RESTART</button>
        <button class="secondary-button" id="snake-mode">PLAY WITH BOT</button>
      </div>
      <p style="color:var(--muted);font-size:11px">Flèches du clavier pour jouer manuellement.</p>
    </div>`;

  const canvas=$("snake-canvas");
  const ctx=canvas.getContext("2d");
  const cell=20;

  gameRuntime={
    snake:[{x:10,y:10},{x:9,y:10},{x:8,y:10}],
    food:{x:15,y:10},
    direction:"right",
    score:0,
    bot:false,
    running:false,
    timer:null
  };

  const runtime=gameRuntime;

  function spawnFood() {
    let food;
    do {
      food={
        x:Math.floor(Math.random()*22),
        y:Math.floor(Math.random()*22)
      };
    } while(runtime.snake.some(p=>p.x===food.x&&p.y===food.y));

    runtime.food=food;
  }

  function draw() {
    ctx.fillStyle="#07130f";
    ctx.fillRect(0,0,440,440);

    ctx.strokeStyle="#12271f";
    for(let i=0;i<=22;i++) {
      ctx.beginPath();
      ctx.moveTo(i*cell,0);
      ctx.lineTo(i*cell,440);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0,i*cell);
      ctx.lineTo(440,i*cell);
      ctx.stroke();
    }

    ctx.fillStyle="#ff526d";
    ctx.fillRect(runtime.food.x*cell+3,runtime.food.y*cell+3,14,14);

    runtime.snake.forEach((p,i)=>{
      ctx.fillStyle=i===0?"#b4fff7":"#35e6db";
      ctx.fillRect(p.x*cell+2,p.y*cell+2,16,16);
    });
  }

  function state() {
    const head=runtime.snake[0];

    const directions=["up","down","left","right"];
    const available=directions.filter(d=>{
      const p=nextPosition(head,d);
      return p.x>=0&&p.x<22&&p.y>=0&&p.y<22&&
        !runtime.snake.slice(0,-1).some(s=>s.x===p.x&&s.y===p.y);
    });

    return {
      headX:head.x,
      headY:head.y,
      foodX:runtime.food.x,
      foodY:runtime.food.y,
      distanceFood:Math.abs(head.x-runtime.food.x)+Math.abs(head.y-runtime.food.y),
      wallFront:runtime.direction==="right"?21-head.x:
        runtime.direction==="left"?head.x:
        runtime.direction==="down"?21-head.y:head.y,
      wallLeft:head.x,
      wallRight:21-head.x,
      body:deepClone(runtime.snake),
      availableDirections:available
    };
  }

  function nextPosition(head,direction) {
    const delta={
      up:{x:0,y:-1},
      down:{x:0,y:1},
      left:{x:-1,y:0},
      right:{x:1,y:0}
    };

    return {
      x:head.x+delta[direction].x,
      y:head.y+delta[direction].y
    };
  }

  function step() {
    if(!runtime.running) return;

    if(runtime.bot) {
      const result=chooseBotMove("snake",state());
      const next=result.direction;

      if(next && (
        (runtime.direction==="up"&&next!=="down") ||
        (runtime.direction==="down"&&next!=="up") ||
        (runtime.direction==="left"&&next!=="right") ||
        (runtime.direction==="right"&&next!=="left")
      )) {
        runtime.direction=next;
      }
    }

    const head=nextPosition(runtime.snake[0],runtime.direction);
    const eating=head.x===runtime.food.x&&head.y===runtime.food.y;

    const collisionBody=eating ? runtime.snake : runtime.snake.slice(0,-1);

    if(
      head.x<0||head.x>=22||
      head.y<0||head.y>=22||
      collisionBody.some(p=>p.x===head.x&&p.y===head.y)
    ) {
      runtime.running=false;
      clearInterval(runtime.timer);
      $("snake-score").textContent=`Game Over — Score : ${runtime.score}`;
      return;
    }

    runtime.snake.unshift(head);

    if(eating) {
      runtime.score++;
      spawnFood();
    } else {
      runtime.snake.pop();
    }

    $("snake-score").textContent=`Score : ${runtime.score}`;
    draw();
  }

  function start() {
    clearInterval(runtime.timer);
    runtime.snake=[{x:10,y:10},{x:9,y:10},{x:8,y:10}];
    runtime.direction="right";
    runtime.score=0;
    runtime.running=true;
    spawnFood();
    $("snake-score").textContent="Score : 0";
    draw();
    runtime.timer=setInterval(step,115);
  }

  document.onkeydown=e=>{
    if(!runtime.running||runtime.bot) return;

    const keys={
      ArrowUp:"up",
      ArrowDown:"down",
      ArrowLeft:"left",
      ArrowRight:"right"
    };

    const next=keys[e.key];
    if(!next) return;

    const opposite={
      up:"down",down:"up",left:"right",right:"left"
    };

    if(next!==opposite[runtime.direction]) {
      runtime.direction=next;
      e.preventDefault();
    }
  };

  $("snake-start").onclick=start;
  $("snake-mode").onclick=()=>{
    runtime.bot=!runtime.bot;
    $("snake-mode").textContent=runtime.bot?"PLAY MANUALLY":"PLAY WITH BOT";
    start();
  };

  start();
}

/* ============================================================
   CHESS
   ============================================================ */

function renderChess() {
  const root=$("game-container");

  root.innerHTML=`
    <div style="text-align:center">
      <h3>CHESS</h3>
      <p class="game-status" id="chess-status">Chargement du jeu…</p>
      <div id="chess-board" style="display:grid;grid-template-columns:repeat(8,minmax(30px,55px));width:max-content;max-width:100%;margin:20px auto;border:4px solid #26344a"></div>
      <div class="game-controls">
        <button class="primary-button" id="chess-reset">NEW GAME</button>
        <button class="secondary-button" id="chess-bot">PLAY AGAINST BOT</button>
      </div>
    </div>`;

  if(typeof window.Chess!=="function") {
    $("chess-status").textContent="Le moteur d'échecs n'est pas chargé.";
    return;
  }

  const chess=new Chess();
  gameRuntime={chess,bot:true};

  const unicode={
    wp:"♙",wr:"♖",wn:"♘",wb:"♗",wq:"♕",wk:"♔",
    bp:"♟",br:"♜",bn:"♞",bb:"♝",bq:"♛",bk:"♚"
  };

  function draw() {
    const board=$("chess-board");
    board.innerHTML="";

    const position=chess.board();

    position.forEach((row,r)=>row.forEach((piece,c)=>{
      const square=document.createElement("button");
      square.style.cssText=`
        width:100%;aspect-ratio:1;border:0;
        background:${(r+c)%2===0?"#e2d5bb":"#78916d"};
        font-size:clamp(20px,4vw,37px);
        color:${piece?.color==="w"?"#fff":"#101018"};
        text-shadow:0 1px 3px #333;
      `;

      square.textContent=piece?unicode[piece.color+piece.type]:"";
      square.onclick=()=>playSquare(r,c);
      board.append(square);
    }));

    $("chess-status").textContent=chess.isGameOver()
      ? "Partie terminée."
      : chess.turn()==="w"?"À toi de jouer — blanc":"Le bot joue — noir";
  }

  let selected=null;

  function playSquare(r,c) {
    if(chess.turn()!=="w"||chess.isGameOver()) return;

    const files="abcdefgh";
    const square=files[c]+(8-r);

    if(!selected) {
      selected=square;
      return;
    }

    const move=chess.move({from:selected,to:square,promotion:"q"});
    selected=null;

    if(move) {
      draw();
      if(!chess.isGameOver()) setTimeout(botMove,350);
    }
  }

  function botMove() {
    if(chess.isGameOver()) return;

    const legal=chess.moves({verbose:true});
    if(!legal.length) return;

    const state={
      legalMoves:legal.map(m=>m.from+m.to),
      currentTurn:chess.turn()==="w"?1:2,
      isCheck:chess.isCheck(),
      whitePieces:chess.board().flat().filter(p=>p?.color==="w").length,
      blackPieces:chess.board().flat().filter(p=>p?.color==="b").length,
      moveCount:chess.history().length,
      board:chess.board()
    };

    const decision=chooseBotMove("chess",state);
    const selectedMove=legal.find(m=>
      m.from+m.to===decision.move
    );

    const move=selectedMove || legal[Math.floor(Math.random()*legal.length)];
    chess.move({from:move.from,to:move.to,promotion:"q"});
    draw();
  }

  $("chess-reset").onclick=()=>{
    chess.reset();
    selected=null;
    draw();
  };

  $("chess-bot").onclick=()=>{
    gameRuntime.bot=!gameRuntime.bot;
    $("chess-bot").textContent=gameRuntime.bot?"PLAY AGAINST BOT":"BOT DISABLED";
  };

  draw();
}

/* ============================================================
   THREE.JS HELPERS
   ============================================================ */

function createThreeScene(host) {
  if(!window.THREE) {
    host.textContent="Three.js n'est pas chargé.";
    return null;
  }

  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(
    55,
    host.clientWidth/Math.max(1,host.clientHeight),
    .1,
    200
  );

  const renderer=new THREE.WebGLRenderer({antialias:true});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
  renderer.setSize(host.clientWidth,host.clientHeight);
  host.appendChild(renderer.domElement);

  scene.add(new THREE.HemisphereLight(0xffffff,0x334455,2));

  const light=new THREE.DirectionalLight(0xffffff,1.5);
  light.position.set(4,10,5);
  scene.add(light);

  return {scene,camera,renderer,host};
}

/* ============================================================
   3D PING PONG
   ============================================================ */

function renderPingPong() {
  const root=$("game-container");

  root.innerHTML=`
    <div style="text-align:center">
      <h3>3D PING PONG</h3>
      <p class="game-status" id="pong-status">Déplace ta raquette avec les flèches.</p>
      <div id="pong-scene" style="height:420px;max-width:850px;margin:auto"></div>
      <div class="game-controls">
        <button class="primary-button" id="pong-start">RESTART</button>
        <button class="secondary-button" id="pong-bot">BOT OPPONENT</button>
      </div>
    </div>`;

  const host=$("pong-scene");
  const three=createThreeScene(host);
  if(!three) return;

  const {scene,camera,renderer}=three;
  camera.position.set(0,7,10);
  camera.lookAt(0,0,0);

  const table=new THREE.Mesh(
    new THREE.BoxGeometry(5,.2,8),
    new THREE.MeshStandardMaterial({color:0x176b9a})
  );
  scene.add(table);

  const net=new THREE.Mesh(
    new THREE.BoxGeometry(5,.35,.08),
    new THREE.MeshStandardMaterial({color:0xffffff})
  );
  net.position.set(0,.25,0);
  scene.add(net);

  const ball=new THREE.Mesh(
    new THREE.SphereGeometry(.15,24,24),
    new THREE.MeshStandardMaterial({color:0xffe14a})
  );
  ball.position.set(0,.5,2);
  scene.add(ball);

  function makePaddle(color) {
    const paddle=new THREE.Mesh(
      new THREE.BoxGeometry(1,.18,.65),
      new THREE.MeshStandardMaterial({color})
    );
    scene.add(paddle);
    return paddle;
  }

  const player=makePaddle(0x35e6db);
  const opponent=makePaddle(0xff536f);

  player.position.set(0,.3,3.2);
  opponent.position.set(0,.3,-3.2);

  gameRuntime={
    ball,player,opponent,
    vx:.045,vy:.025,vz:-.06,
    score:0,
    bot:true,
    running:true
  };

  const runtime=gameRuntime;

  function resetBall() {
    ball.position.set((Math.random()-.5)*2,.5,0);
    runtime.vx=(Math.random()-.5)*.08;
    runtime.vz=Math.random()>.5?.065:-.065;
  }

  function update() {
    if(!runtime.running) return;

    ball.position.x+=runtime.vx;
    ball.position.y+=runtime.vy;
    ball.position.z+=runtime.vz;

    if(ball.position.x>2.35||ball.position.x< -2.35) {
      runtime.vx*=-1;
    }

    if(ball.position.y<.2||ball.position.y>2) {
      runtime.vy*=-1;
    }

    const state={
      ballX:ball.position.x,
      ballY:ball.position.y,
      ballZ:ball.position.z,
      ballVelocityX:runtime.vx,
      ballVelocityY:runtime.vy,
      ballVelocityZ:runtime.vz,
      paddleX:player.position.x,
      paddleY:player.position.z,
      ballApproaching:runtime.vz>0
    };

    const decision=runtime.bot
      ? chooseBotMove("pingpong",state)
      : {};

    const target=Number(decision.targetX);
    if(runtime.bot) {
      opponent.position.x+=(Math.max(-2,Math.min(2,ball.position.x))-opponent.position.x)*.06;
    }

    player.position.x=Math.max(-2,Math.min(2,player.position.x));

    if(
      ball.position.z>2.8 &&
      ball.position.z<3.7 &&
      Math.abs(ball.position.x-player.position.x)<.75
    ) {
      runtime.vz=-Math.abs(runtime.vz);
      runtime.vx+=(ball.position.x-player.position.x)*.025;
    }

    if(
      ball.position.z< -2.8 &&
      ball.position.z> -3.7 &&
      Math.abs(ball.position.x-opponent.position.x)<.75
    ) {
      runtime.vz=Math.abs(runtime.vz);
      runtime.vx+=(ball.position.x-opponent.position.x)*.025;
    }

    if(Math.abs(ball.position.z)>4.5) {
      runtime.score++;
      $("pong-status").textContent=`Point ! Score : ${runtime.score}`;
      resetBall();
    }

    renderer.render(scene,camera);
    gameAnimation=requestAnimationFrame(update);
  }

  function restart() {
    runtime.score=0;
    resetBall();
  }

  document.onkeydown=e=>{
    if(e.key==="ArrowLeft") player.position.x-=.25;
    if(e.key==="ArrowRight") player.position.x+=.25;
    if(e.key==="ArrowUp") player.position.z-=.2;
    if(e.key==="ArrowDown") player.position.z+=.2;
  };

  $("pong-start").onclick=restart;
  $("pong-bot").onclick=()=>{
    runtime.bot=!runtime.bot;
    $("pong-bot").textContent=runtime.bot?"BOT OPPONENT":"MANUAL OPPONENT";
  };

  update();
}

/* ============================================================
   RACING — GENERATED TRACK
   ============================================================ */

function renderRacing() {
  const root=$("game-container");

  root.innerHTML=`
    <div style="text-align:center">
      <h3>RACING AI</h3>
      <p class="game-status" id="race-status">Circuit généré aléatoirement.</p>
      <div id="race-scene" style="height:440px;max-width:900px;margin:auto"></div>
      <div class="game-controls">
        <button class="primary-button" id="race-restart">NEW RANDOM TRACK</button>
        <button class="secondary-button" id="race-bot">BOT DRIVER</button>
      </div>
      <p style="color:var(--muted);font-size:11px">Flèches directionnelles pour conduire manuellement.</p>
    </div>`;

  const host=$("race-scene");
  const three=createThreeScene(host);
  if(!three) return;

  const {scene,camera,renderer}=three;
  camera.position.set(0,15,18);
  camera.lookAt(0,0,0);

  const ground=new THREE.Mesh(
    new THREE.PlaneGeometry(100,100),
    new THREE.MeshStandardMaterial({color:0x28603e})
  );
  ground.rotation.x=-Math.PI/2;
  ground.position.y=-.1;
  scene.add(ground);

  const trackGroup=new THREE.Group();
  scene.add(trackGroup);

  const carGeometry=new THREE.BoxGeometry(1,.5,1.8);

  const player=new THREE.Mesh(
    carGeometry,
    new THREE.MeshStandardMaterial({color:0x35e6db})
  );

  const rival=new THREE.Mesh(
    carGeometry,
    new THREE.MeshStandardMaterial({color:0xff536f})
  );

  scene.add(player,rival);

  gameRuntime={
    track:[],
    player,
    rival,
    speed:0,
    angle:0,
    progress:0,
    bot:true,
    running:true
  };

  const runtime=gameRuntime;

  function generateTrack() {
    trackGroup.clear();
    runtime.track=[];

    const points=Array.from({length:12},(_,i)=>{
      const angle=i/12*Math.PI*2;
      const radiusX=13+Math.random()*4;
      const radiusZ=10+Math.random()*4;

      return new THREE.Vector3(
        Math.cos(angle)*radiusX,
        0,
        Math.sin(angle)*radiusZ
      );
    });

    runtime.track=points;

    const curve=new THREE.CatmullRomCurve3(points,true,"catmullrom",.4);
    const geometry=new THREE.TubeGeometry(curve,220,3,8,true);
    const road=new THREE.Mesh(
      geometry,
      new THREE.MeshStandardMaterial({color:0x343b46})
    );

    trackGroup.add(road);

    const centerLine=new THREE.Mesh(
      new THREE.TubeGeometry(curve,220,.035,6,true),
      new THREE.MeshStandardMaterial({color:0xe2e4e9})
    );

    centerLine.position.y=.05;
    trackGroup.add(centerLine);

    const start=curve.getPointAt(0);
    player.position.set(start.x,.4,start.z);
    rival.position.set(start.x+2,.4,start.z);
    runtime.progress=0;
    runtime.speed=0;
    runtime.angle=0;

    return curve;
  }

  let curve=generateTrack();

  function nearestTrackPoint(position) {
    let best=0;
    let distance=Infinity;

    runtime.track.forEach((point,i)=>{
      const d=point.distanceTo(position);
      if(d<distance) {
        distance=d;
        best=i;
      }
    });

    return {index:best,distance};
  }

  function sensorDistance(position,direction,max=12) {
    const origin=new THREE.Vector3(position.x,.5,position.z);
    const ray=new THREE.Raycaster(origin,direction.clone().normalize(),0,max);
    const hits=ray.intersectObject(trackGroup,true);
    return hits.length ? hits[0].distance : max;
  }

  function update() {
    if(!runtime.running) return;

    const forward=new THREE.Vector3(
      Math.sin(runtime.angle),0,
      Math.cos(runtime.angle)
    );

    const right=new THREE.Vector3(forward.z,0,-forward.x);

    const front=sensorDistance(player.position,forward);
    const frontLeft=sensorDistance(player.position,forward.clone().add(right.clone().multiplyScalar(-.6)));
    const frontRight=sensorDistance(player.position,forward.clone().add(right.clone().multiplyScalar(.6)));
    const left=sensorDistance(player.position,right.clone().multiplyScalar(-1));
    const rightDistance=sensorDistance(player.position,right);

    const state={
      speed:runtime.speed*100,
      front,
      frontLeft,
      frontRight,
      left,
      right:rightDistance,
      rear:10,
      opponentDistance:player.position.distanceTo(rival.position),
      heading:runtime.angle,
      curve:0
    };

    const nearest=nearestTrackPoint(player.position);
    const next=runtime.track[(nearest.index+1)%runtime.track.length];
    const desiredAngle=Math.atan2(
      next.x-player.position.x,
      next.z-player.position.z
    );

    let difference=desiredAngle-runtime.angle;
    while(difference>Math.PI) difference-=Math.PI*2;
    while(difference< -Math.PI) difference+=Math.PI*2;

    state.curve=Math.max(-1,Math.min(1,difference));

    const decision=runtime.bot
      ? chooseBotMove("racing",state)
      : {throttle:runtime.speed>.6?0.5:1,brake:0,steering:state.curve};

    const throttle=Math.max(0,Math.min(1,Number(decision.throttle)||0));
    const brake=Math.max(0,Math.min(1,Number(decision.brake)||0));
    const steering=Math.max(-1,Math.min(1,Number(decision.steering)||0));

    runtime.speed+=throttle*.003;
    runtime.speed-=brake*.006;
    runtime.speed*=.994;
    runtime.speed=Math.max(0,Math.min(.22,runtime.speed));

    runtime.angle+=steering*.025*(.3+runtime.speed*4);

    player.position.x+=Math.sin(runtime.angle)*runtime.speed*10;
    player.position.z+=Math.cos(runtime.angle)*runtime.speed*10;
    player.rotation.y=runtime.angle;

    // Rival follows the generated center line.
    const rivalIndex=(nearest.index+Math.floor(runtime.progress/100)+3)%runtime.track.length;
    const rivalTarget=runtime.track[rivalIndex];
    rival.position.lerp(new THREE.Vector3(rivalTarget.x,.4,rivalTarget.z),.025);
    rival.lookAt(runtime.track[(rivalIndex+1)%runtime.track.length]);

    runtime.progress+=runtime.speed;

    camera.position.x+=(player.position.x-camera.position.x)*.04;
    camera.position.z+=(player.position.z+15-camera.position.z)*.04;
    camera.lookAt(player.position);

    $("race-status").textContent=
      `Speed: ${Math.round(runtime.speed*400)} km/h · Front sensor: ${front.toFixed(1)} m`;

    renderer.render(scene,camera);
    gameAnimation=requestAnimationFrame(update);
  }

  function restart() {
    curve=generateTrack();
    $("race-status").textContent="Nouveau circuit généré.";
  }

  document.onkeydown=e=>{
    if(runtime.bot) return;

    if(e.key==="ArrowLeft") runtime.angle+=.05;
    if(e.key==="ArrowRight") runtime.angle-=.05;
    if(e.key==="ArrowUp") runtime.speed=Math.min(.22,runtime.speed+.01);
    if(e.key==="ArrowDown") runtime.speed=Math.max(0,runtime.speed-.02);
  };

  $("race-restart").onclick=restart;
  $("race-bot").onclick=()=>{
    runtime.bot=!runtime.bot;
    $("race-bot").textContent=runtime.bot?"BOT DRIVER":"MANUAL DRIVER";
  };

  update();
}

/* ============================================================
   EDITOR CONNECTION CLEAR BUTTON
   ============================================================ */

if($("clear-connections")) {
  $("clear-connections").addEventListener("click",()=>{
    connections=[];
    pendingPort=null;
    renderNodes();
    updateConnectionHint("Toutes les connexions ont été supprimées.");
  });
}

/* ============================================================
   INITIALISATION
   ============================================================ */

function initialise() {
  currentGame=$("editor-game")?.value || "chess";

  renderNodeLibrary();
  renderNodes();
  showPage("games");

  // Aide visuelle pour l'éditeur.
  if($("connection-hint")) {
    $("connection-hint").textContent=
      "Clique sur une sortie puis sur une entrée compatible.";
  }
}

initialise();
