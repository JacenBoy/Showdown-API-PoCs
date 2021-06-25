const args = process.argv.slice(2);
switch (args[0].toLowerCase()) {
  case "test-battle":
    require("./modules/sim-battle.js")(args[1]);
    break;
  default:
    console.log("Unrecognized command");
}