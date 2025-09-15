// ----------------------
// Main Campaign State
// ----------------------
let campaign = {
  storyLog: "",
  players: []
};

// ----------------------
// Add Player
// ----------------------
document.getElementById("addPlayerBtn").addEventListener("click", () => {
  const name = prompt("Enter player name:");
  if (!name) return;
  const race = prompt("Enter player race:");
  const charClass = prompt("Enter player class:");
  campaign.players.push({
    name,
    race,
    class: charClass || "",
    inventory: [],
    gold: 0
  });
  updatePlayerList();
});

// ----------------------
// Update Player List UI
// ----------------------
function updatePlayerList() {
  const list = document.getElementById("playerList");
  const select = document.getElementById("currentPlayer");
  list.innerHTML = "";
  select.innerHTML = "";
  campaign.players.forEach((p, index) => {
    const div = document.createElement("div");
    div.textContent = `${p.name} (${p.race} ${p.class}) - Gold: ${p.gold} - Items: ${p.inventory.join(", ") || "None"}`;
    list.appendChild(div);

    const option = document.createElement("option");
    option.value = index;
    option.textContent = p.name;
    select.appendChild(option);
  });
}

// ----------------------
// Start Story
// ----------------------
document.getElementById("startStoryBtn").addEventListener("click", () => {
  const scenario = document.getElementById("startingScenario").value.trim();
  if (!scenario) return alert("Please enter a starting scenario.");
  campaign.storyLog = scenario;
  updateStoryLog();
});

// ----------------------
// Next Turn (AI Call)
// ----------------------
document.getElementById("nextTurnBtn").addEventListener("click", async () => {
  const playerIndex = document.getElementById("currentPlayer").value;
  const player = campaign.players[playerIndex];
  const action = document.getElementById("playerAction").value.trim();
  if (!action) return alert("Please enter an action.");

  const prompt = buildPrompt(player, action, campaign.storyLog, campaign.players);

  try {
    const res = await fetch("/.netlify/functions/generate-story", {
      method: "POST",
      body: JSON.stringify({ prompt }),
      headers: { "Content-Type": "application/json" }
    });

    const data = await res.json();
    const aiText = data.text || "AI did not return any text.";

    // Append AI response to story
    campaign.storyLog += "\n\n" + aiText;

    // Auto-update inventories and gold
    parseInventoryAndGold(aiText, campaign.players);

    // Update UI
    updateStoryLog();
    document.getElementById("playerAction").value = "";
    updatePlayerList();

  } catch (err) {
    console.error("Error calling AI:", err);
    alert("Error generating story. Check console.");
  }
});

// ----------------------
// Update Story Log UI
// ----------------------
function updateStoryLog() {
  document.getElementById("storyLog").textContent = campaign.storyLog;
}

// ----------------------
// Build Prompt for AI
// ----------------------
function buildPrompt(player, action, storyLog, allPlayers) {
  const otherPlayers = allPlayers
    .filter(p => p.name !== player.name)
    .map(p => `${p.name} (${p.race} ${p.class}) with items: ${p.inventory.join(", ") || "None"} and gold: ${p.gold}`)
    .join("\n");

  return `
You are a D&D Dungeon Master. Continue the story below. Be creative and detailed.
Players:
${allPlayers.map(p => `${p.name} (${p.race} ${p.class}), Inventory: ${p.inventory.join(", ") || "None"}, Gold: ${p.gold}`).join("\n")}

Current story so far:
${storyLog}

It is ${player.name}'s turn. They choose to:
${action}

Other players are:
${otherPlayers}

Instructions to you:
- Continue the story in a narrative style.
- Update the story based on this action.
- If the player gains or loses items or gold, explicitly mention it and update their inventory and gold.
- Only reference items/gold that players actually have.
`;
}

// ----------------------
// Parse Inventory and Gold Changes
// ----------------------
function parseInventoryAndGold(text, players) {
  players.forEach(player => {
    // Gold changes
    const goldRegex = new RegExp(`${player.name} (gains|loses) (\\d+) gold`, "gi");
    let match;
    while ((match = goldRegex.exec(text)) !== null) {
      const amount = parseInt(match[2]);
      if (match[1].toLowerCase() === "gains") {
        player.gold += amount;
      } else {
        player.gold = Math.max(0, player.gold - amount);
      }
    }

    // Gain items
    const gainItemRegex = new RegExp(`${player.name} (finds|receives) a ([\\w\\s]+)`, "gi");
    while ((match = gainItemRegex.exec(text)) !== null) {
      const item = match[2].trim();
      if (!player.inventory.includes(item)) {
        player.inventory.push(item);
      }
    }

    // Lose items
    const loseItemRegex = new RegExp(`${player.name} (loses|drops) a ([\\w\\s]+)`, "gi");
    while ((match = loseItemRegex.exec(text)) !== null) {
      const item = match[2].trim();
      const index = player.inventory.indexOf(item);
      if (index !== -1) player.inventory.splice(index, 1);
    }
  });
}
