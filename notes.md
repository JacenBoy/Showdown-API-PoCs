# Notes
Observations about the Showdown API and recommendations on its usage.

## Output streams
The Showdown sim API outputs data using a `ReadWriteStream`. The stream object can be monitored for new data from the sim in order to keep track of what is happening.

The `ReadWriteStream` data needs to be parsed somehow. The Showdown module includes a `getPlayerStreams()` function that does some of this parsing itself.

Neither of these options are particularly developer-friendly, and there are advantages and disadvantages to each.

### ReadWriteStream
- Newline delimited, although some of the fields may contain pipe-delimited data
- All battle data included in a single stream
- Specifies data that should only be sent to one player

### Player streams
- Pipe delimited data; the same format used for Showdown's client/server communication
- Data split across multiple data streams
- One stream for each player, plus a spectator stream and an omniscient stream
- Stream may sometimes contain multiple events separated by a newline

Mixing and matching these streams seems to cause some issues, so it's recommended to pick one output type.

## Issues to consider
- FFAs: The Showdown system has a cap of 4 players, making it unsuitable to large-scale FFAs
- State saving: Need to determine a solution for saving the current battle state in the event that the bot reboots/crashes, or a battle needs to be put on hold
- Large-scale battles: Unsure if the battle system supports team sizes greater than 6, in the event that someone wants to attempt a large scale exhibition battle (i.e. 100v100)
- Public Box: The sim is designed for full battles with defined teams; need to determine if teams can be built on the fly
