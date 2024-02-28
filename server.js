const express = require('express')
const app = express()
const session = require('express-session')

// Ndryshim nga GitHub
console.log("Hello From GitHub")

const {
    faqjaKryesore,
    loginFaqja,
    regjistrimFaqja,
    produktiDetajet,
    regjistroPerdorues,
    kycePerdoruesin,
    logout,
    profiliFaqja,
    ndryshoProfilin,
    blejProduktin,
    blerja
} = require('./logjika/logjika.js')


app.use(express.json({type: "*/*"}))

app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs')
app.set('views', 'faqet')

app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: false
}))


app.get('/', function(req, res) {
    faqjaKryesore(req, res)
})

app.get('/login', function(req, res) {
    loginFaqja(req, res)
})

app.post('/login', function(req, res) {
    kycePerdoruesin(req, res)
})

app.get('/logout', function(req, res) {
    logout(req, res)
})


app.get('/register', function(req, res) {
    regjistrimFaqja(req, res)
})

app.post('/register', function(req, res) {
    regjistroPerdorues(req, res)
})

app.get('/produkti/:id', function(req, res) {
    produktiDetajet(req, res)
})

app.get('/profili', function(req, res) {
    profiliFaqja(req, res)
})

app.post('/ndrysho_profilin', function(req, res) {
    ndryshoProfilin(req, res)
})

app.post('/blej_produktin', function(req, res) {
    blejProduktin(req, res)
})

app.get('/blerja/:id', function(req, res) {
    blerja(req, res)
})

app.listen(3000, function() {
    console.log("Serveri startoj ne portin 3000")
})
