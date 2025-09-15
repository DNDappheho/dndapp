// Main campaign state
let campaign = {
  storyLog: "",
  players: []
};

// Add player
document.getElementById("addPlayerBtn").addEventListener("click", () => {
  const name = prompt("Enter player name:");
  const race = prompt("Enter player race:");
  const charClass = prompt("Enter player class:");
  campaign.players.push({
    name,
    race,
    class: charClass,
    inventory: [],
    gold: 0
  });
  updatePlayerList();
});

function updatePlayerList() {
  const list = document.getElementById("playerList");
  const select = document.getElementById("currentPlayer");
  list.innerHTML = "";
  select.innerHTML = "";
  campaign.players.forEach((p, index) => {
    const div = document.createElement("div");
    div.textContent = `${p.name} (${p.race} ${p.class}) - Gold: ${p.gold} - Items: ${p.inventory.join(", ")}`;
    list.appendChild(div);

    const option = document.createElement("option");
    option.value = index;
    option.textContent = p.name;
    select.appendChild(option);
  });
}

// Start story
document.getElementById("startStoryBtn").addEventListener("click", () => {
  const scenario = document.getElementById("startingScenario").value;
  campaign.storyLog = scenario;
  updateStoryLog();
});

// Next turn
document.getElementById("nextTurnBtn").addEventListener("click", async () => {
  const playerIndex = document.getElementById("currentPlayer").value;
  const player = campaign.players[playerIndex];
  const action = document.getElementById("playerAction").value;
  const prompt = buildPrompt(player, action, campaign.storyLog, campaign.players);

  // Call Netlify function
  const res = await fetch("/.netlify/functions/generate-story", {
    method: "POST",
    body: JSON.stringify({ prompt }),
    headers: { "Content-Type": "application/json" }
  });
  const data = await res.json();
  campaign.storyLog += "\n\n" + data.text;
  updateStoryLog();
  document.getElementById("playerAction").value = "";
  updatePlayerList();
});

function updateStoryLog() {
  document.getElementById("storyLog").textContent = campaign.storyLog;
}

function buildPrompt(player, action, storyLog, allPlayers) {
  const otherPlayers = allPlayers
    .filter(p => p.name !== player.name)
    .map(p => `${p.name} (${p.race} ${p.class}) with items: ${p.inventory.join(", ")} and gold: ${p.gold}`)
    .join("\n");

  return `
You are a D&D Dungeon Master. Continue the story below. Be creative and detailed.
Players:
${allPlayers.map(p => `${p.name} (${p.race} ${p.class}), Inventory: ${p.inventory.join(", ")}, Gold: ${p.gold}`).join("\n")}

Current story so far:
${storyLog}

It is ${player.name}'s turn. They choose to:
${action}

Other players are:
${otherPlayers}

Instructions to you:
- Update the story based on this action.
- If the player gains/loses items or gold, explicitly mention it and update their inventory or gold.
- Only reference items/gold that players actually have.
- Keep the story in narrative style.
`;
}
