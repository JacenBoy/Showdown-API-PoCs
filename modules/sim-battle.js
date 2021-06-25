// A battle between two random AI
// Good test for parsing battle output
const {BattleStream, getPlayerStreams, Teams} = require("pokemon-showdown");
const {RandomPlayerAI} = require("../node_modules/pokemon-showdown/.sim-dist/tools/random-player-ai");

module.exports = (streamMode = "battle-stream") => {
  // Hard-code streamMode because battle-stream is broken for now
  streamMode = "player-stream";

  const battleStream = new BattleStream();
  const battle = {
    spec: {
      formatid: "gen8customgame"
    },
    // BattleStream types:
    // p1,p2,etc. - The streams that the player sees
    // omniscient - A stream that can see all output from both sides
    // spectator - An outside observer's point of view
    streams: getPlayerStreams(battleStream)
  };

  const p1 = {
    spec: {
      name: "Serena",
      team: Teams.pack([{
        "name": "Hanastoa",
        "species": "Audino",
        "gender": "F",
        "item": "Audinite",
        "ability": "Regenerator",
        "evs": {"hp": 252, "atk": 252, "def": 252, "spa": 252, "spd": 252, "spe": 252},
        "nature": "Docile",
        "ivs": {"hp": 31, "atk": 31, "def": 31, "spa": 31, "spd": 31, "spe": 31},
        "moves": ["After You", "Attract", "Baby-Doll Eyes", "Disarming Voice", "Double Slap", "Double-Edge", "Entrainment", "Growl", "Heal Pulse", "Helping Hand", "Hyper Voice", "Last Resort", "Misty Terrain", "Play Nice", "Pound", "Refresh", "Secret Power", "Simple Beam", "Take Down", "Surf"]
      }])
    },
    ai: new RandomPlayerAI(battle.streams.p1),
    active: {}
  };

  const p2 = {
    spec: {
      name: "Dawn",
      team: Teams.pack([{
        "name": "Hakeli",
        "species": "Parasect",
        "gender": "F",
        "item": "Choice Specs",
        "ability": "Effect Spore",
        "evs": {"hp": 252, "atk": 252, "def": 252, "spa": 252, "spd": 252, "spe": 252},
        "nature": "Docile",
        "ivs": {"hp": 31, "atk": 31, "def": 31, "spa": 31, "spd": 31, "spe": 31},
        "moves": [ "Absorb", "Aromatherapy", "Cross Poison", "Fury Cutter", "Giga Drain", "Growth", "Leech Life", "Poison Powder", "Rage Powder", "Scratch", "Slash", "Spore", "Stun Spore", "X-Scissor", "Aerial Ace", "Agility", "Brick Break", "Bullet Seed", "Curse", "Endure", "Energy Ball", "Facade", "Fell Stinger", "Hidden Power", "Hone Claws", "Knock Off", "Leech Seed", "Light Screen", "Natural Gift", "Protect", "Pursuit", "Reflect", "Refresh", "Rest", "Return", "Seed Bomb", "Sludge Bomb", "Solar Beam", "Substitute", "Sunny Day", "Swords Dance", "Synthesis", "Toxic"]
      }])
    },
    ai: new RandomPlayerAI(battle.streams.p2),
    active: {}
  };

    // Let the AI go nuts
    p1.ai.start();
    p2.ai.start();

  // Set up the loop for our output parser
  // We'll do that using an anonymlus self-executing funciton because those are really cool
  // Also because it's an easy way to do what we need, but mostly because they're cool
  (async () => {
    // There are two ways we can keep track of what's going on with the data
    // 1) Monitor the BattleStream object directly; this data comes in a predictable command->data format
    // 2) Monitor the "omniscient" player stream; this gives us less unnecesary data to parse through
    // See "notes.md" for advantages and disadvantages of both

    // This is the loop for listening to the BattleStream directly
    // This is actually broken for now
    if (streamMode == "battle-stream") {
      for await (const chunk of battleStream) {
        console.log(chunk);
        const data = chunk.split("\n"); // BattleStream data is newline delimited
      }
    }

    // This is the loop for listening to the "omniscient" stream
    if (streamMode == "player-stream") {
      for await (let chunk of battle.streams.omniscient) {
        chunk = chunk.split("\n"); // Split the chunk on newlines so we can handle each step of the turn separately
        for (let d of chunk) {
          let data = d.split("|"); // Split each step into the parameters
          data = data.slice(1); // The first element in the array will always be empty
          switch (data[0]) {
            // Major actions (https://github.com/smogon/pokemon-showdown/blob/master/sim/SIM-PROTOCOL.md#major-actions)
            case "start": {
              console.log(`-- Battle between ${p1.spec.name} and ${p2.spec.name} --`);
              break;
            }
            case "turn": {
              console.log(`-- Turn ${data[1]} --`);
              break;
            }
            case "switch": {
              const mon = data[1].split(" ",2); // Pokemon names might have spaces, so only split the string once
              const player = mon[0].substring(0,2) == "p1" ? p1 : p2; // In practice, need to be able to handle p3 and p4 as well
              player.active.name = mon[1];
              player.active.hp = data[3].split("/")[0];
              console.log(`${player.spec.name} sent out ${mon[1]}!`);
              break;
            }
            case "move": {
              const mon = data[1].split(" ",2); // Pokemon names might have spaces, so only split the string once
              console.log(`${mon[1]} used ${data[2]}!`);
              break;
            }
            case "faint": {
              const mon = data[1].split(" ",2); // Pokemon names might have spaces, so only split the string once
              console.log(`${mon[1]} fainted!`);
              break;
            }
            case "win": {
              console.log(`${data[1]} wins!`);
              break;
            }
            // Minor actions (https://github.com/smogon/pokemon-showdown/blob/master/sim/SIM-PROTOCOL.md#minor-actions)
            case "-damage": {
              const mon = data[1].split(" ",2); // Pokemon names might have spaces, so only split the string once
              const player = mon[0].substring(0,2) == "p1" ? p1 : p2; // In practice, need to be able to handle p3 and p4 as well
              const damage = player.active.hp - data[2].split("/")[0].split(" ")[0];
              player.active.hp = player.active.hp - damage;
              console.log(`${mon[1]} took ${damage} HP in damage`);
              break;
            }
            case "-fail": {
              console.log("But it failed!");
              break;
            }
            default:
              // Nothing to do
          }
        }
      }
    }
  })();

  // Write the initial battle setup
  battle.streams.omniscient.write(`>start ${JSON.stringify(battle.spec)}`);
  battle.streams.omniscient.write(`>player p1 ${JSON.stringify(p1.spec)}`);
  battle.streams.omniscient.write(`>player p2 ${JSON.stringify(p2.spec)}`);
};