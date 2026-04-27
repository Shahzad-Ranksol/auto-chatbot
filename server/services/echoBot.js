'use strict';

const STOP_WORDS = new Set([
  'a','an','the','is','are','was','were','be','been','being','have','has','had',
  'do','does','did','will','would','could','should','may','might','shall',
  'i','my','me','we','us','our','you','your','it','its','they','them','their',
  'what','which','who','whom','this','that','these','those','where','when','how',
  'and','but','or','if','not','no','yes','for','with','from','to','of','in','on',
  'at','by','up','so','as','into','than','then','also','just','very','too',
  'tell','me','please','help','need','want','get','give','show','find','know',
  'about','can','let','like','hi','hello','hey','thanks','thank','okay','ok'
]);

// Synonym expansion: when a keyword is found, also match these related terms in the KB
const EXPAND = {
  // Location
  located:   ['address','location','office','store','shop','place','find'],
  location:  ['address','located','office','store','shop','place'],
  address:   ['location','located','office','store','shop','place'],
  place:     ['address','location','located','office','store'],
  office:    ['address','location','located','store','shop','place'],
  // Contact
  contact:   ['phone','email','number','reach','call','address'],
  reach:     ['phone','email','number','contact','call'],
  phone:     ['call','telephone','mobile','number','contact'],
  call:      ['phone','telephone','number','contact'],
  telephone: ['phone','call','mobile','number'],
  mobile:    ['phone','call','telephone','number'],
  number:    ['phone','telephone','mobile','contact'],
  email:     ['mail','gmail','contact','inbox'],
  mail:      ['email','gmail','contact','inbox'],
  // Hours
  hours:     ['open','close','timing','schedule','available','days','time','weekend'],
  open:      ['hours','close','timing','schedule','days','available'],
  close:     ['hours','open','timing','schedule','days'],
  timing:    ['hours','open','close','schedule','days','time'],
  schedule:  ['hours','open','close','timing','days'],
  available: ['hours','open','close','timing','schedule'],
  weekend:   ['hours','open','saturday','sunday','days'],
  // Pricing
  price:     ['cost','fee','charge','rate','pricing','pay','paid','much','affordable','cheap'],
  cost:      ['price','fee','charge','rate','pay','paid','much'],
  fee:       ['price','cost','charge','rate','pay'],
  charge:    ['price','cost','fee','rate'],
  pricing:   ['price','cost','fee','charge','rate'],
  rate:      ['price','cost','fee','charge','pricing'],
  cheap:     ['price','cost','affordable','discount','rate'],
  affordable:['price','cost','cheap','discount'],
  expensive: ['price','cost','premium','rate'],
  discount:  ['price','cost','offer','sale','deal','promo'],
  offer:     ['discount','sale','deal','promo','price'],
  sale:      ['discount','offer','deal','promo','price'],
  // Delivery / Shipping
  delivery:  ['shipping','ship','deliver','dispatch','send','arrive','transit'],
  shipping:  ['delivery','ship','deliver','dispatch','send','arrive'],
  deliver:   ['delivery','shipping','ship','dispatch','send'],
  ship:      ['delivery','shipping','deliver','dispatch','send'],
  // Returns / Refunds
  return:    ['refund','exchange','cancel','policy','back'],
  refund:    ['return','exchange','cancel','policy','money'],
  exchange:  ['return','refund','swap','replace'],
  cancel:    ['cancellation','return','refund','policy'],
  // Services / Products
  service:   ['offer','provide','product','sell','available','feature','support'],
  services:  ['offer','provide','product','sell','available','feature'],
  product:   ['service','offer','provide','sell','item','stock'],
  sell:      ['product','service','offer','item','stock'],
  // Payment
  pay:       ['payment','price','cost','fee','method','card','cash','invoice'],
  payment:   ['pay','price','cost','fee','method','card','cash'],
  card:      ['payment','pay','visa','credit','debit'],
  cash:      ['payment','pay','card','invoice'],
  // Support
  problem:   ['issue','trouble','error','fix','support','broken'],
  issue:     ['problem','trouble','error','fix','support','broken'],
  broken:    ['problem','issue','fix','repair','support'],
  // Account / Auth
  account:   ['login','register','signup','profile','user','password'],
  login:     ['account','signin','password','email'],
  signup:    ['account','register','login','email'],
  password:  ['account','login','reset','change'],
  // Web
  website:   ['site','web','url','page','online','link'],
  site:      ['website','web','url','page','online'],
  // Misc
  warranty:  ['guarantee','return','repair','replace','policy'],
  guarantee: ['warranty','return','policy'],
  support:   ['help','assist','service','contact','problem','issue'],
};

const GREETINGS = /^(hi+|hello|hey|good\s*(morning|afternoon|evening)|howdy|greetings|sup|yo)\b/i;
const THANKS    = /^(thanks?|thank you|thx|ty|much appreciated|appreciate)/i;
const GOODBYE   = /^(bye|goodbye|see you|take care|ciao|later|farewell)/i;

function smartEcho(message, knowledgeBase, businessName) {
  const msg   = message.trim();
  const lower = msg.toLowerCase();

  if (GREETINGS.test(lower)) return `Hello! 👋 Welcome to **${businessName}**. How can I help you today?`;
  if (THANKS.test(lower))    return `You're welcome! 😊 Is there anything else I can help you with?`;
  if (GOODBYE.test(lower))   return `Goodbye! 👋 Thanks for chatting with us. Have a great day!`;

  if (!knowledgeBase || !knowledgeBase.trim()) {
    return `Thank you for your message! For immediate assistance, please contact our support team — we're always happy to help. 😊`;
  }

  // Extract meaningful keywords from the question
  const keywords = lower
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w));

  if (!keywords.length) {
    return `I'm here to help with any questions about **${businessName}**. Could you share a bit more detail so I can assist you better?`;
  }

  // Split KB into sentences
  const chunks = knowledgeBase
    .split(/\n+/)
    .flatMap(line => line.split(/(?<=[.!?])\s+/))
    .map(s => s.replace(/---/g, '').trim())
    .filter(s => s.length > 8);

  // Score each chunk — direct keyword match scores higher than synonym match
  const scored = chunks.map(chunk => {
    const cl = chunk.toLowerCase();
    let score = 0;

    keywords.forEach(kw => {
      if (cl.includes(kw)) {
        score += new RegExp(`\\b${kw}\\b`).test(cl) ? 3 : 1;
      }
      // Synonym expansion
      const syns = EXPAND[kw] || [];
      syns.forEach(syn => {
        if (new RegExp(`\\b${syn}\\b`).test(cl)) score += 1;
      });
    });

    return { chunk, score };
  });

  const best = scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  if (!best.length) {
    return `Thank you for reaching out to **${businessName}**! I'm sorry, I don't have specific information about that right now.\n\nFor further assistance, please **contact our support team** — we'll be happy to help you. 😊`;
  }

  let answer = best.map(b => b.chunk).join(' ').trim();
  if (!/[.!?]$/.test(answer)) answer += '.';
  answer = answer.charAt(0).toUpperCase() + answer.slice(1);

  return `${answer}\n\nIs there anything else I can help you with?`;
}

module.exports = { smartEcho };
