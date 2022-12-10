// const serviceAccount = require('./key.json');
// const { initializeApp, applicationDefault, cert } = require('firebase-admin/app');
// const { getFirestore, Timestamp, FieldValue } = require('firebase-admin/firestore');
// const firebase = require('firebase-admin')
const { initializeApp, applicationDefault, cert } = require('firebase-admin/app');
const TelegramBot = require('node-telegram-bot-api');
const schedule = require('node-schedule');
const serviceAccount = require("./serviceAccountKey.json");
const express = require('express')
const {getStorage}  = require('firebase/storage')
const { getFirestore, Timestamp, FieldValue } = require('firebase-admin/firestore');
var cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config()

require('firebase/storage')

initializeApp({
  credential: cert(serviceAccount)
});

// Get a non-default Storage bucket



const token = '5803508113:AAG_RlMyWRGQ9bK37IRwtecz7GAwdcPrkY0';
const bot = new TelegramBot(token, {polling: true});
const db = getFirestore();
const app = express()

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
let count = 0
// let docRef = db.collection('test').doc(`hey${count}`);

schedule.scheduleJob('42 * * * * *', ()=>{
  console.log(`The answer to life, the universe, and everything!  ${count}`);
  try {
    bot.sendMessage(1537240286, 'Received your message');
  } catch (error) {
    console.log(error)
  }
  count++
});


const callDate = () => {
  var date = new Date().toLocaleDateString().split('/')
  var arr = [date[2], date[0], date[1]].join('.')
  return arr
}
app.get('/',(req,res)=>{
  res.json({success:true})
})
app.get('/upload', (req,res)=>{
  const storage = getStorage()
  res.json('hey')
  console.log('hey')
})

app.post('/order-details', async(req, res) => {
  const {checkId, orderData} = req.body
  try {
    await db.collection(`${callDate()}`).doc(`check_${checkId}`).set(orderData);
    res.json({success: true, checkId})
  } catch(err) {
    res.json({success:false, message: err})
  }
})

app.post('/set-check',async(req,res)=>{
  const {data, checkNumber} = req.body
  try {
    var obj = Object.values(data)
    for (let index = 0; index < obj.length - 1; index++) {
      delete obj[index].status;
      delete obj[index].type;
    }
    await db.collection(`${callDate()}`).doc(`check_${checkNumber}`).set({...obj});
    await db.collection(`dailyOrders/${callDate()}/check_${checkNumber}`).add({...obj});
    res.json({success: true})
  } catch(err) {
    res.json({success:false, message: err})
  }
})

//handle telegram
app.post('/prod-not-enough', (req,res)=>{
  const {name, prodLeft} = req.body
  var message = `У вас осталось мало (${prodLeft}) ${name}`
  if(req.body.returned){
    message = `У вас было мало: ${name}, а теперь ${prodLeft}`
  }
  bot.sendMessage(1537240286, message);
})

app.get('/send',(req,res)=>{
  bot.sendMessage(1537240286, 'Received your message');
  res.send('send')
})
bot.on('message', (msg) => {
  const chatId = msg.chat.id;

  // send a message to the chat acknowledging receipt of their message
  console.log('chatId',chatId)
});

//income
app.post('/create-income', async(req,res)=>{
  try {
    var obj = {...req.body, date: callDate()}
    await db.collection('incomes').add(obj);
    res.json({success:true})
  } catch (error) {
    res.json({success:false})
  }
})
app.get('/incomes', async(req,res)=>{
  console.log('getting incomes')
  try {
    const snapshot = await db.collection('incomes').get();
    const incomesData = snapshot.docs.map(doc=>({...doc.data(),id:doc.id}))
    res.json({success:true, data: incomesData })
  } catch (error) {
   res.json({success:false, message: error})
  }
})

// //outcomes
app.post('/create-outcome', async(req,res)=>{
  try {
    var obj = {...req.body, date: callDate()}
    await db.collection('outcomes').add(obj);
    res.json({success:true})
  } catch (error) {
    res.json({success:false})
  }
})
app.get('/outcomes', async(req,res)=>{
  console.log('getting outcomes')
  try {
    const snapshot = await db.collection('outcomes').get();
    const outcomesData = snapshot.docs.map(doc=>({...doc.data(),id:doc.id}))
    res.json({success:true, data: outcomesData })
  } catch (error) {
   res.json({success:false, message: error})
  }
})



app.listen(process.env.PORT ||5000, ()=> console.log('server started on 5000'))
