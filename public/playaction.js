var playboard = null
var game = new Chess()
var $status = $('#status')
var $fen = $('#fen')
var $pgn = $('#pgn')
var $result = $('#result')

var loser={}
loser['White']='0-1'
loser['Black']='1-0'

var playerMoved = new Event('moveUpdate');
var noMoves = true;
var socket = io();
var gameInProgress = false;

var currRoom;

var player="-";

function onDragStart (source, piece, position, orientation) {
  // do not pick up pieces if the game is over
  if (game.game_over()) return false

  //if (timeout())

  // only pick up pieces for the side to move
  if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
      (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
    return false
  }
}

function onClickStart(square, piece, selectedPiece) {
  if (game.game_over() || player === '-') return false

  if (selectedPiece === null && piece) {
    if ((player === 'w' && piece.search(/^b/) !== -1) ||
      (player === 'b' && piece.search(/^w/) !== -1)) {
    return false
    }
  }
  
}

function onDrop (source, target) {
  // see if the move is legal
  if (game.turn() != player) return 'snapback'
  var move = game.move({
    from: source,
    to: target,
    promotion: 'q' // NOTE: always promote to a queen for example simplicity
  })


  // illegal move
  if (move === null) return 'snapback'
  else {
    noMoves=false;
    clockChange();
    socket.emit('move', move);
  }

  updateStatus()
}

// update the board position after the piece snap
// for castling, en passant, pawn promotion
function onSnapEnd () {
  playboard.position(game.fen())
}

function updateStatus () {
  var status = ''

  var moveColor = 'White'
  if (game.turn() === 'b') {
    moveColor = 'Black'
  }

  // checkmate?
  if (game.in_checkmate()) {
    status = 'Game over.'
    $result.html(loser[moveColor])
    clearInterval(interval);
    timer_1.stop();
    timer_2.stop();
    if (player == 'w') socket.emit('game_over', {result: loser[moveColor], pgn: game.pgn(), fen: game.fen()});
    socket.emit('leave', currRoom);
    gameInProgress = false;
  }

  else if (FLAGGED) {
    status = 'Game over.'
    let flaggedPlayer = (player=='w') ? 'White': 'Black';
    $result.html(loser[flaggedPlayer])
    if (player == 'w') socket.emit('game_over', {result: loser[flaggedPlayer], pgn: game.pgn(), fen: game.fen()});
    socket.emit('leave', currRoom);
    FLAGGED = false;
    gameInProgress = false;
  }

  else if (OPPONENT_FLAGGED) {
    status = 'Game over.'
    let flaggedPlayer = (player=='w') ? 'Black': 'White';
    $result.html(loser[flaggedPlayer])
    if (player == 'w') socket.emit('game_over', {result: loser[flaggedPlayer], pgn: game.pgn(), fen: game.fen()});
    socket.emit('leave', currRoom);
    OPPONENT_FLAGGED = false;
    gameInProgress = false;
  }

  // draw?
  else if (game.in_draw()) {
    status = 'Game over, draw.'
    $result.html('1/2-1/2')
    clearInterval(interval);
    timer_1.stop();
    timer_2.stop();
    if (player == 'w') socket.emit('game_over', {result: '1/2-1/2', pgn: game.pgn(), fen: game.fen()});
    socket.emit('leave', currRoom);
    gameInProgress = false;
  }

  // game still on
  else {
    status = moveColor + ' to move'

    // check?
    if (game.in_check()) {
      status += ', ' + moveColor + ' is in check'
    }
  }

  $status.html(status)
  $fen.html(game.fen())
  $pgn.html(game.pgn())
}

var config = {
  draggable: true,
  position: 'start',
  onDragStart: onDragStart,
  onClickStart: onClickStart,
  onDrop: onDrop,
  onSnapEnd: onSnapEnd
}
playboard = Chessboard('playboard', config)

updateStatus()



socket.on('move', function(msg) {
  clockChange();
  game.move(msg);
  playboard.position(game.fen());
  if (noMoves) {
    noMoves=false;
    player="b";
  }
  updateStatus();
});

function startGame() {
  if (!gameInProgress) {
    let timeRequest = getTimeControl();
    socket.emit('play', timeRequest);
    document.getElementById('play-button').innerHTML = 'Waiting for another player';
  }
}

socket.on('start', function(colors) {
  timeControl = colors.timeControl;
  increment = colors.increment;
  reset(clock_one, timer_1);
  reset(clock_two, timer_2);
  interval = setInterval(() => {
   update(timer_1, clock_one)
   update(timer_2, clock_two)
  }, 100)
  player = colors.white==socket.id ? 'w':'b';
  if (player == 'w') {
    timer_2.start();
  }
  else {
    timer_1.start();
  }
  game = new Chess();
  playboard = null;
  playboard = Chessboard('playboard', config);
  playboard.orientation((player == 'w') ? 'white' : 'black');
  updateStatus();
  currRoom = colors.room;

  $result.html('');
  document.getElementById('play-button').innerHTML = 'PLAY';
  gameInProgress = true;
});
