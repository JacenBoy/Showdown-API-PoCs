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
      team: Teams.pack(Teams.generate(battle.spec.formatid))
    },
    ai: new RandomPlayerAI(battle.streams.p1)
  };

  const p2 = {
    spec: {
      name: "Dawn",
      team: Teams.pack(Teams.generate(battle.spec.formatid))
    },
    ai: new RandomPlayerAI(battle.streams.p2)
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
      for await (const chunk of battle.streams.omniscient) {
        console.log(chunk);
      }
    }
  })();

  // Write the initial battle setup
  battle.streams.omniscient.write(`>start ${JSON.stringify(battle.spec)}`);
  battle.streams.omniscient.write(`>player p1 ${JSON.stringify(p1.spec)}`);
  battle.streams.omniscient.write(`>player p2 ${JSON.stringify(p2.spec)}`);
};