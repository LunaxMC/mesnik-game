// Мясник — мультиплеерный сервер (Node.js, чистый WebSocket, без npm-зависимостей)
// Запуск: node server.js  (порт по умолчанию 8080)
// Раздаёт саму игру (статика) и синхронизирует игроков + общего мясника.

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 8080;
const GAME_HTML = path.join(__dirname, 'mesnik-horror.html');

// --- Карта (должна совпадать с картой в игре) ---
const MAP = [
  "###############################################",
  "#.......................#.....................#",
  "#.#####.#####.#########.#.###################.#",
  "#.#.....#...#.#.......#.#.#.......#.......#...#",
  "#.#.#####D###.###.#####D###.#####.#####D###.#.#",
  "#.#P#.....#...#.#.....#.#.....#.#.....#.....#.#",
  "#D#########.#####.#######.#.###.###.#####.###.##",
  "#.........#.......#.....#.#.#.#.#.#...#.......##",
  "#########.#####D###.#.###D#.#.#D#.#.#####.#####",
  "#.......#.#..####.#.#.#.#.#...#.#.#.....#.....##",
  "#.#####.#.#.#.....#.###D#.#####D#.#.#####.#####",
  "#.#...#.#.#.#.#####.#...#.#...#.#.#.#.#.#.....##",
  "#.#D#.#.#.#D#.....#.#####.###D#.#####.#.###.##.#",
  "#.#.#.#.#....#.###D##.#.....#.....#.#.#.....#.#",
  "#.#.#.#.#.#######.#.####D###.###D##.#.#####.###",
  "#.#.#.#.#.........#.#.....#.#.....#.#.......#.#",
  "#.#.#.#.#########.#.#.#####.#.#####D#######.#.#",
  "#.#.#.#.#.......#.#.#.#...#.#.#.....#.......#.#",
  "#.#.#D#.#.#####.#.#.#D#.#D#.#.#.#####D#####.#.#",
  "#.#.#.#.#.#...#.###.#.#.#.#.#.#.....#.....#.#.#",
  "#.#.#.#.#.#.#.#.....#.#.#.#.#.#####.###.#####.#",
  "#.#.#.#.#.#D##########D##.#.#.....#.#.#.....#.#",
  "#.#.#.#.#.#.....#.....#.#.###.###.#.#.#.#####.#",
  "#.#.#.#.#.#####.###D###.#...#...#.#.#.#.#.....#",
  "#.#.#.#.#.....#.#...#.#.#.###D#.#.#.#D#.#######",
  "#.#C#.#.#####.#.#####.#.#.#.....#.#.#.#.....#.#",
  "#.#.#.#.#...#.#.....#...#D#####.#.#.#.#####.#.#",
  "#.#.#.#.#.#.#.#####.#####.#...#.#.#.#.#.....#.#",
  "#.#.#.#.#.#.#.#.....#.....#.#.#.#.#.#.#.###.#.#",
  "#.#.#.#.#.#.#.#.#####.#####.#D#.#.#.#.#.#.#.#.#",
  "#.#.#.#.#.#.#.#.#.....#.....#.#.#.#.#.#.#B#.#.#",
  "#.#.#.#.#.#.#.#.#.#####.#####D#.#.#.#.#.#.#.#.#",
  "#.#.#.#.#.#.#.#.#.....#.....#.#.#.#.#.#.#.#.#.#",
  "#.#.#.#.#.#.#.#D#####.###D###.#C#.#.#.#.#.#.#.#",
  "#.#.#.#.#.#.#.#...#...#.....#.#.#.#.#.#.#.#.#.#",
  "#.#.#.#.#.#.#.#####D#####.###D#.#.#.#.#.#.#.#.#",
  "#.#.#.#.#.#.#.......#.....#...#.#.#.#.#.#.#.#.#",
  "#.#.#.#.#.#.#########.#####D###.#.#.#.#.#.#.#.#",
  "#.#.#.#.#.#.#.........#.....#...##.#.#.#.#.#.#",
  "#.#.#.#.#.#.#.#########.###.#######.#.#.#.#.#.#",
  "#.#.#.#.#.#.#.#...#...#...#.......#.#.#.#.#.#.#",
  "#.#.#.#.#.#.#.#D#######D#########D#.#.#.#.#.#.#",
  "#.#.#.#.#.#.#.#.......#.........#.#.#.#.#.#.#.#",
  "#.#.#.#.#.#.###.###D###.#########.#.#.#.#.#.#.#",
  "#.#.#.#.#.#...#.#.#.#.#.#.........#.#.#.#.#.#.#",
  "#.#.#.#.#.#####.#.#.#.#.#.#########D#.#.#.#.#.#",
  "#.#.#.#.#.......#.#.#.#.#.........#.#.#.#.#.#.#",
  "#.#.#.#.#########.#.#.#.###########.#.#.#.#.#.#",
  "#.#.#.#.......#...#.#.#.#..........#.#.#.#.#.#.#",
  "#.#.#.#####.###.###D###.#.######.##.#.#.#.#.#.#",
  "#.#.#.#...#.#.........#.#........#.#.#.#.#.#.#.#",
  "#.#.#.#.#.#.#.###D######.#########.#.#.#.#.#.#.#",
  "#.#.#.#.#.#.#.......#.....#........#.#.#.#.#.#.#",
  "#.#.#.#.#.#.#######.#####D##########.#.#.#.#.#.#",
  "#.#.#.#.#.#.#.....#.#................##.#.#.#.#",
  "#.#.#.#.#.#.#.#####.#.########.##.#####.#.#.#.#",
  "#.#.#.#.#.#.#.#.....#.#......#.#.#.......#.#.#.#",
  "#.###########.#.#####D########.#.###D#####.#.#.#",
  "#..............#.......#......#.#......#...#...##",
  "###########.#####.#####.######D###########.####",
  "#.......................#.....................#",
  "###############################################",
];

function isBlocked(tx, ty){
  if(tx<0||ty<0||tx>=MAP[0].length||ty>=MAP.length) return true;
  const c = MAP[ty][tx];
  return c==='#' || c==='D'; // стена или закрытая дверь блокируют; открытая 'O' и пол '.', шкаф 'C' тоже блок (но для простоты).
}

function findSpawn(ch){
  for(let y=1;y<MAP.length-1;y++) for(let x=1;x<MAP[0].length-1;x++) if(MAP[y][x]===ch) return {x:x+0.5,y:y+0.5};
  return {x:3,y:3};
}

// --- Состояние комнаты ---
let players = {};            // id -> {x,y,dirX,dirY,planeX,planeY,god,closet}
let butcher = { ...findSpawn('B'), dir: 0 };
let nextId = 1;
let gameState = 'playing';   // playing | dead  (общий проигрыш)
let timeLeft = 60;

// ИИ мясника (общий) — простой: гонится за ближайшим игроком
function updateButcher(dt){
  if(gameState!=='playing') return;
  // ближайший живой игрок
  let best=null, bd=1e9;
  for(const id in players){
    const p=players[id];
    if(p.dead || p.closet) continue;
    const d=Math.hypot(p.x-butcher.x, p.y-butcher.y);
    if(d<bd){bd=d; best=p;}
  }
  if(!best){ // блуждает
    butcher.dir += (Math.random()-0.5)*2;
    // границы комнаты
  } else {
    butcher.dir = Math.atan2(best.y-butcher.y, best.x-butcher.x);
  }
  const speed = 0.8;
  let nx = butcher.x + Math.cos(butcher.dir)*speed*dt;
  let ny = butcher.y + Math.sin(butcher.dir)*speed*dt;
  if(!isBlocked(Math.floor(nx), Math.floor(ny))){ butcher.x=nx; butcher.y=ny; }
  else if(!isBlocked(Math.floor(nx), Math.floor(butcher.y))) butcher.x=nx;
  else if(!isBlocked(Math.floor(butcher.x), Math.floor(ny))) butcher.y=ny;

  // поймать ближайшего впритык
  if(best && bd<0.6){ best.dead=true; emitGameOver(); }
}

function emitGameOver(){
  if(gameState!=='playing') return;
  gameState='dead';
  broadcast({ type:'gameover' });
}

function broadcast(msg){
  const s = JSON.stringify(msg);
  for(const ws of Object.values(wss)){
    if(ws.readyState===1) sendFrame(ws, s);
  }
}

function sendFrame(socket, text){
  if(!socket || socket.destroyed) return;
  const payload = Buffer.from(text, 'utf8');
  const len = payload.length;
  const head = [0x81]; // text, fin
  if(len<126) head.push(len);
  else if(len<65536){ head.push(126, (len>>8)&255, len&255); }
  else { head.push(127); for(let i=7;i>=0;i--) head.push(Number((BigInt(len)>>BigInt(8*i))&BigInt(255))); }
  const frame = Buffer.concat([Buffer.from(head), payload]);
  try{ socket.write(frame); }catch(e){}
}

// Простая WebSocket-реализация (Frame-разбор, только текстовые сообщения)
function handleWS(socket){
  socket.on('data', (buf)=>{
    // парсим текстовые кадры (без поддержки фрагментации/больших фреймов — достаточно)
    let i=0;
    while(i+2<=buf.length){
      const b0=buf[i], b1=buf[i+1];
      const opcode = b0 & 0x0f;
      if(opcode===0x8){ socket.end(); return; }
      const len7 = b1 & 0x7f;
      let len, off;
      if(len7<126){ len=len7; off=2; }
      else if(len7===126){ len=buf.readUInt16BE(i+2); off=4; }
      else { len=int64(buf, i+2); off=10; }
      const masked = b1 & 0x80;
      let mask=null, dataOff=off;
      if(masked){ mask=buf.slice(i+off, i+off+4); dataOff=off+4; }
      if(buf.length < i+dataOff+len) break; // не полный фрейм
      let payload = buf.slice(i+dataOff, i+dataOff+len);
      if(masked){ const out=Buffer.alloc(len); for(let j=0;j<len;j++) out[j]=payload[j]^mask[j%4]; payload=out; }
      const text = payload.toString('utf8');
      try{ onMessage(socket, JSON.parse(text)); }catch(e){}
      i += dataOff+len;
    }
  });
  socket.on('close', ()=>{ onDisconnect(socket); });
  socket.on('error', ()=>{});
}

function int64(buf, p){ return Number(buf.readBigUInt64BE(p)); }

function onConnect(socket){
  // handshake уже прошёл
  const id = String(nextId++);
  const spawn = findSpawn('P');
  players[id] = { x:spawn.x, y:spawn.y, dirX:1, dirY:0, planeX:0, planeY:0.66, god:false, closet:false, dead:false };
  socket.playerId=id;
  sendFrame(socket, JSON.stringify({ type:'init', id, players:stripPlayers(), butcher }));
}

function stripPlayers(){
  const out={};
  for(const k in players){ const p=players[k]; out[k]={x:p.x,y:p.y,dirX:p.dirX,dirY:p.dirY,planeX:p.planeX,planeY:p.planeY,god:p.god,closet:p.closet,dead:p.dead}; }
  return out;
}

function onMessage(socket, msg){
  const id=socket.playerId;
  const p=players[id];
  if(!p) return;
  switch(msg.type){
    case 'move':
      p.x=msg.x; p.y=msg.y; p.dirX=msg.dirX; p.dirY=msg.dirY; p.planeX=msg.planeX; p.planeY=msg.planeY; p.closet=!!msg.closet; p.god=!!msg.god;
      break;
    case 'god':
      p.god=true; p.closet=false; break;
    case 'door':
      // открыть/закрыть дверь рядом (для всех)
      const tx=Math.floor(p.x), ty=Math.floor(p.y);
      const dirs=[[1,0],[-1,0],[0,1],[0,-1],[0,0]];
      for(const [dx,dy] of dirs){
        const nx=tx+dx, ny=ty+dy;
        if(nx>=0&&ny>=0&&nx<MAP[0].length&&ny<MAP.length && (MAP[ny][nx]==='D'||MAP[ny][nx]==='O')){
          const nv = MAP[ny][nx]==='D' ? 'O' : 'D';
          MAP[ny][nx]=nv;
          broadcast({type:'door', tx:nx, ty:ny, open: nv==='O'});
          break;
        }
      }
      break;
  }
  // переотправка состояний (упрощённо: каждый ход шлём всем)
  broadcast({ type:'sync', players:stripPlayers(), butcher });
}

function onDisconnect(socket){
  if(socket.playerId) delete players[socket.playerId];
  broadcast({ type:'sync', players:stripPlayers(), butcher });
}

// --- HTTP-сервер: статика (игра) + WebSocket upgrade ---
const httpServer = http.createServer((req,res)=>{
  let file = GAME_HTML, ctype='text/html; charset=utf-8';
  if(req.url==='/multiplayer.html'){ file = path.join(__dirname,'multiplayer.html'); }
  if(req.url==='/' || req.url==='/mesnik-horror.html' || req.url==='/multiplayer.html'){
    fs.readFile(file, (err,data)=>{
      if(err){ res.writeHead(500); res.end('game file missing'); return; }
      res.writeHead(200, {'Content-Type':ctype});
      res.end(data);
    });
    return;
  }
  if(req.url==='/health'){ res.writeHead(200); res.end('ok'); return; }
  res.writeHead(404); res.end('not found');
});

const wss = {};
httpServer.on('upgrade',(req,socket)=>{
  const key = req.headers['sec-websocket-key'];
  const accept = crypto.createHash('sha1').update(key+'258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
  socket.write(
    'HTTP/1.1 101 Switching Protocols\r\n'+
    'Upgrade: websocket\r\n'+
    'Connection: Upgrade\r\n'+
    'Sec-WebSocket-Accept: '+accept+'\r\n'+
    '\r\n'
  );
  wss[socket.remotePort+'_'+Math.random()]=socket;
  socket.$remove=()=>{ for(const k in wss){ if(wss[k]===socket) delete wss[k]; } };
  // сохраняем ссылку для удаления
  const orig = socket;
  socket.on('close', ()=> orig.$remove && orig.$remove());
  onConnect(socket);
  handleWS(socket);
});

// тик мясника ~30 раз/сек
setInterval(()=>{ updateButcher(1/30); }, 33);

httpServer.listen(PORT, ()=>{
  console.log('Server running on http://localhost:'+PORT);
});