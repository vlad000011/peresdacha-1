// Client-side chat-bot logic (no server). Commands per spec.
const messagesEl = document.getElementById('messages');
const inputEl = document.getElementById('input');
const sendBtn = document.getElementById('send');
const typingEl = document.getElementById('typing');

let state = { stage: 'awaiting_start', name: null, numbers: [], lastOperator: null };

// helper to append message. sender: 'user' or 'bot'
function appendMessage(text, sender='bot'){
  const msg = document.createElement('div');
  msg.className = 'msg ' + (sender==='user'? 'user':'bot');
  const avatar = document.createElement('img');
  avatar.className = 'avatar-small';
  avatar.src = 'bot_avatar.png';
  avatar.alt = sender;
  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  bubble.textContent = text;
  msg.appendChild(avatar);
  msg.appendChild(bubble);
  // insert at top because container is column-reverse
  messagesEl.prepend(msg);
  // keep scroll at bottom (since reversed, scrollTop=0 shows bottom)
  messagesEl.scrollTop = 0;
}

// typing simulation
function showTyping(show){
  typingEl.style.display = show ? 'flex' : 'none';
}

// Send button enable/disable
function updateSendState(){
  const has = inputEl.value.trim().length > 0;
  if(has){
    sendBtn.disabled = false;
    sendBtn.classList.add('enabled');
  } else {
    sendBtn.disabled = true;
    sendBtn.classList.remove('enabled');
  }
}

inputEl.addEventListener('input', e=>{
  // prevent growing height
  inputEl.style.height = '44px';
  updateSendState();
});

sendBtn.addEventListener('click', onSend);
inputEl.addEventListener('keydown', e=>{
  if(e.key === 'Enter' && !e.shiftKey){
    e.preventDefault();
    if(!sendBtn.disabled) onSend();
  }
});

function onSend(){
  const text = inputEl.value.trim();
  if(!text) return;
  appendMessage(text, 'user');
  inputEl.value = '';
  updateSendState();
  handleUserInput(text);
}

// logic per commands
function handleUserInput(text){
  // commands detection
  if(text.startsWith('/')){
    handleCommand(text);
    return;
  }
  // if not a command, ask user to input /start per spec
  appendBot("Введите команду /start, для начала общения");
}

function handleCommand(cmdText){
  const cmd = cmdText.trim();
  if(cmd === '/start'){
    state = { stage: 'asked_name', name: null, numbers: [], lastOperator: null };
    appendBot("Привет, меня зовут Чат-бот, а как зовут тебя?");
    return;
  }
  if(cmd.startsWith('/name:')){
    if(state.stage === 'asked_name' || state.stage==='awaiting_start'){
      const name = cmd.slice(6).trim();
      if(!name){
        appendBot("Пожалуйста укажите имя в формате: /name: Вася");
        return;
      }
      state.name = name;
      state.stage = 'awaiting_numbers';
      appendBot(`Привет ${name}, приятно познакомится. Я умею считать, введи числа которые надо посчитать`);
      return;
    } else {
      appendBot("Введите команду /start, для начала общения");
      return;
    }
  }
  if(cmd.startsWith('/number:')){
    if(state.stage !== 'awaiting_numbers' && state.stage !== 'awaiting_operator'){
      appendBot("Введите команду /start, для начала общения");
      return;
    }
    const rest = cmd.slice(8).trim();
    if(!rest){
      appendBot("Укажите числа после /number: например /number: 7, 9");
      return;
    }
    // parse numbers split by comma
    const parts = rest.split(',').map(s=>s.trim()).filter(Boolean);
    const nums = [];
    for(const p of parts){
      const n = Number(p);
      if(Number.isNaN(n)){
        appendBot(`Неправильное число: "${p}". Введите числа через запятую.`);
        return;
      }
      nums.push(n);
    }
    state.numbers = nums;
    state.stage = 'awaiting_operator';
    appendBot("Выберите действие: -, +, *, / (введите символ операции)");
    return;
  }
  if(['-','+','*','/'].includes(cmd)){
    if(state.stage !== 'awaiting_operator'){
      appendBot("Сначала введите числа командой /number: ...");
      return;
    }
    const op = cmd;
    const nums = state.numbers;
    if(!nums || nums.length===0){
      appendBot("Числа не заданы. Введите их командой /number: 7, 9");
      return;
    }
    const result = compute(nums, op);
    appendBot(`Результат: ${result}`);
    state.stage = 'awaiting_numbers';
    return;
  }
  if(cmd === '/stop'){
    state = { stage:'stopped' };
    appendBot("Всего доброго, если хочешь поговорить пиши /start");
    return;
  }
  // unknown command
  appendBot("Я не понимаю, введите другую команду!");
}

function compute(nums, op){
  if(op === '+') return nums.reduce((a,b)=>a+b,0);
  if(op === '-') return nums.reduce((a,b)=>a-b);
  if(op === '*') return nums.reduce((a,b)=>a*b,1);
  if(op === '/'){
    // handle division by zero
    let acc = nums[0];
    for(let i=1;i<nums.length;i++){
      if(nums[i] === 0) return 'Ошибка: деление на 0';
      acc = acc / nums[i];
    }
    return acc;
  }
  return 'Ошибка операции';
}

// append bot with typing animation and small delay
function appendBot(text){
  showTyping(true);
  // simulate typing time proportional to text length, capped
  const delay = Math.min(1200 + text.length*20, 2200);
  setTimeout(()=>{
    showTyping(false);
    appendMessage(text, 'bot');
  }, delay);
}

// initial welcome message (if any) - per spec require /start, so we show nothing
// but we can hint controls
appendBot("Чтобы начать, введите команду /start");