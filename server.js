// const serviceAccount = require('./key.json');
// const { initializeApp, applicationDefault, cert } = require('firebase-admin/app');
// const { getFirestore, Timestamp, FieldValue } = require('firebase-admin/firestore');
// const firebase = require('firebase-admin')
const { initializeApp, applicationDefault, cert } = require('firebase-admin/app');
const TelegramBot = require('node-telegram-bot-api');
// const schedule = require('node-schedule');
// const fs = require('fs')
const serviceAccount = require("./serviceAccountKey.json");
const express = require('express')
// const {getStorage}  = require('firebase/storage')
const { getFirestore, Timestamp, FieldValue } = require('firebase-admin/firestore');
var cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config()
const firebase = require('firebase-admin')
require('firebase/storage')
// const xl = require('excel4node');
// const wb = new xl.Workbook();
// const ws = wb.addWorksheet('Worksheet Name');

initializeApp({
  credential: cert(serviceAccount)
});

var aspose = aspose || {};

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

// schedule.scheduleJob('42 * * * * *', ()=>{
//   console.log(`The answer to life, the universe, and everything!  ${count}`);
//   try {
//     bot.sendMessage(931564452, 'Received your message');
//   } catch (error) {
//     console.log(error)
//   }
//   count++
// });


const increment = async(income, outcome) => {
  try {
    await db.collection('total_sales').doc(`sales`).update({
      income: firebase.firestore.FieldValue.increment(income),
      outcome: firebase.firestore.FieldValue.increment(outcome)
    });
    // res.send('success')
  } catch (error) {
    console.log('error')
  }
}
const callDate = () => {
  var date = new Date().toLocaleDateString().split('/')
  var arr = [date[2], date[0], date[1]].join('.')
  return arr
}
app.get('/',(req,res)=>{
  res.json({success:true})
})
app.get('/upload', (req,res)=>{
  res.json('hey')
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

app.get('/get-check', async(req,res)=>{
  try {
    const snapshot = await db.collection(`dailyOrders`).doc('check_147').get()
    // let dailyData = snapshot.docs.map(doc=>({...doc.data(), id: doc.id}))
    // var arrOfObj = []
    // for (let index = 0; index < dailyData.length; index++) {
    //   arrOfObj.push(dailyData[index])
    // }
    res.json({success:true, data: snapshot.data()})
  } catch (error) {
    res.json({success:false,message:error})
  }
})

app.get('/test', async(req, res)=>{
  // const {tableType} = req.body
  // const headingColumnNames = [
  //   "приход",
  //   "количество_людей",
  //   "заказы",
  //   "место"
  // ]
  // console.log(tableType,'tableType')
  const snapshot = await db.collection(`dailyOverall_${callDate()}`).get()
  let dailyData = snapshot.docs.map(doc=>({...doc.data(), id:doc.id}))
  if(dailyData){
    var totalsIncome = 0
    var totalsOrders = 0
    var totalsPeople = 0
    for (let index = 0; index < dailyData.length; index++) {
      var message = `Место: ${dailyData[index].id} | Колиество людей: ${dailyData[index].количество_людей} | Приход: ${dailyData[index].приход} | Заказы: ${dailyData[index].заказы}\n`
      totalsPeople += dailyData[index].количество_людей;
      totalsOrders += dailyData[index].заказы
      totalsIncome += dailyData[index].приход
      bot.sendMessage(931564452, message);
    }
    var message2 = `${callDate()} итого- Колиество людей: ${totalsPeople} | Приход: ${totalsIncome} | Заказы: ${totalsOrders}`
    setTimeout(() => {
      bot.sendMessage(931564452, message2);
    }, 1000);
    res.json({success:true, data: dailyData})
  }else{
    res.json({success:false, message:'It is empty'})
  }
})

app.get('/get-dailies', async(req,res)=>{
  try {
    const snapshot = await db.collection(`dailyOverall`).doc(callDate()).get();
    let dailyData = snapshot.docs.map(doc=>({...doc.data(), id:doc.id}))
    res.json({success:true, data: dailyData })
  } catch (error) {
    console.log(error)
   res.json({success:false, message: error})
  }
})

app.post('/set-check',async(req,res)=>{
  const {data, totalPrice, tableType, checkNumber} = req.body
  console.log('called me')
  try {
    var obj = Object.values(data)
    for (let index = 0; index < obj.length - 1; index++) {
      delete obj[index][1].status;
      delete obj[index][1].type;
      if(index == obj.length - 2){
        obj[index + 1][1]['checkNumber'] = checkNumber
        obj[index + 1][1]['totalPrice'] = totalPrice
      }
    }
    // await db.collection(`${getDate()}`).doc(`check_${checkNumber}`).set({...obj});
    await db.collection(`dailyOrders`).doc(`check_${checkNumber}`).set({...obj});
    //here create income and increase totalIncome and add today's totalIncome
    var incomeObj = {
      amount: totalPrice,
      incomeType:'От стола',
      date: callDate(),
      incomeDescription: ''
    }
    await db.collection('incomes').add(incomeObj);
    var numberOfPeople = data[data.length - 1][1]['numberOfPeople']
    try {
      await db.collection(`dailyOverall_${callDate()}`).doc(tableType).update(
        {
          приход: firebase.firestore.FieldValue.increment(Number(totalPrice)),
          заказы: firebase.firestore.FieldValue.increment(1),
          количество_людей: firebase.firestore.FieldValue.increment(numberOfPeople)
        }
      );
    } catch (error) {
      await db.collection(`dailyOverall_${callDate()}`).doc(tableType).set(
        {
          приход: firebase.firestore.FieldValue.increment(Number(totalPrice)),
          заказы: firebase.firestore.FieldValue.increment(1),
          количество_людей: firebase.firestore.FieldValue.increment(numberOfPeople)
        }
      );
    }
    increment(Number(totalPrice),0)
    res.json({success: true})
  }
  catch(err) {
    console.log(err)
    res.json({success:false, message: err})
  }
})

app.post('/find-check', async(req,res)=>{
  const {checkNumber} = req.body
  const snapshot = await db.collection(`dailyOrders`).doc(`check_${checkNumber}`).get()
  if(snapshot){
    res.json({success:true, data: snapshot.data()})
  }else{
    res.json({success:false})
  }
})

//handle telegram
app.post('/prod-not-enough', (req,res)=>{
  const {name, prodLeft} = req.body
  var message = `У вас осталось мало (${prodLeft}) ${name}`
  if(req.body.returned){
    message = `У вас было мало: ${name}, а теперь ${prodLeft}`
  }
  // console.log(message)
  bot.sendMessage(931564452, message);
})

// app.get('/send',(req,res)=>{
//   bot.sendMessage(931564452, 'Received your message');
//   res.send('send')
// })
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
    increment(obj.amount, 0)
  } catch (error) {
    res.json({success: false})
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

app.get('/total-sales', async(req,res)=> {
  try {
    const snapshot = await db.collection('total-sales').doc('sales').get();
    // const incomesData = snapshot.docs.map(doc=>({...doc.data(),id:doc.id}))
    res.json({success:true, data: snapshot.data() })
  } catch (error) {
   res.json({success:false, message: error})
  }
})

// //outcomes
app.post('/create-outcome', async(req,res)=>{
  try {
    var obj = {...req.body, date: callDate()}
    await db.collection('outcomes').add(obj);
    increment(0, obj.amount)
    res.json({success: true})
  } catch (error) {
    res.json({success:false})
  }
})
app.get('/outcomes', async(req,res)=>{
  try {
    const snapshot = await db.collection('outcomes').get();
    const outcomesData = snapshot.docs.map(doc=>({...doc.data(),id:doc.id}))
    res.json({success:true, data: outcomesData })
  } catch (error) {
   res.json({success:false, message: error})
  }
})

app.get('/todays_overall', (req,res) => {
  res.json({succ: true})
})

app.listen(process.env.PORT || 5000, ()=> console.log('server started on 5000'))
