const mysql2 = require('mysql2')


console.log("Ndyshim per git")

const connection = mysql2.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',
    database: 'shop_92'
})

const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
    host: 'localhost',
    port: 1025,
    ignoreTLS: true, 
})


connection.connect(function(err) {
    if(err) {
        console.log("Error databaza:", err.message)
    }
})

function faqjaKryesore(req, res) {
    if(req.session.views) {
        let shikimet = req.session.views++
        // console.log("Total shikime: ", shikimet)
    } else {        
        req.session.views = 1
        req.session.save((err) => {
            if (err) {
              console.error(err);
            }
        })
    }

    let kerkimi = req.query.kerkimi
    let query = ""

    if (kerkimi) {
        query = `SELECT * FROM produktet WHERE emri LIKE "%${kerkimi}%"`
    } else {
        query = 'SELECT * FROM produktet'
    }

    connection.query(query, function(err, results) {
        res.render('faqja_kryesore', {
            produktet: results,
            perdoruesi: req.session.perdoruesi
        })
    })
}

function loginFaqja(req, res) {
    if(req.session?.perdoruesi) {
        res.redirect('/')
    } else {
        res.render('login')
    }
}

function regjistrimFaqja(req, res) {
    if(req.session?.perdoruesi) {
        res.redirect('/')
    } else {
        res.render('regjistrimi')
    }
}

function produktiDetajet(req, res) {

    let produkti_id = req.params.id

    let query = `SELECT 
                        P.id,
                        P.emri,
                        P.pershkrimi,
                        P.cmimi,
                        P.foto,
                        P.stoku,
                        K.emri AS kategoria
                    FROM produktet P 
                    INNER JOIN kategorite K ON K.id = P.kategoria_id
                    WHERE P.id = ${produkti_id};`

    connection.query(query, function(err, results) {

        if (results[0]) {
            res.render('produkti', {
                produkti: results[0],
                perdoruesi: req.session.perdoruesi
            })
        } else {
            res.render('404')
        }
    })
}

function regjistroPerdorues(req, res) {
    let data = req.body

    let emri = data.emri
    let email = data.email
    let password = data.password

    let query_email = `SELECT 
                            id 
                        FROM 
                        perdoruesit 
                        WHERE email = "${email}"`

    connection.query(query_email, function(err1, results1) {
        if(results1.length > 0) {
            return res.send({
                is_error: true,
                mesazhi: "Ky email ekziston"
            })
        }

        let query = `INSERT INTO perdoruesit (emri, email, password) 
                        VALUES("${emri}", "${email}", "${password}")`

        connection.query(query, function(err2, results2) {
            return res.send({
                is_error: false,
                mesazhi: "Perdoruesi u krijua me sukses"
            })
        })
    })
}


function kycePerdoruesin(req, res) {
    let data = req.body

    let query = `SELECT * FROM perdoruesit WHERE email = "${data.email}" AND password = "${data.password}"`

    connection.query(query, function(err, results) {
        if(results.length > 0) {
            // req.session.id = results[0].id
            // req.session.emri = results[0].emri
            // req.session.email = results[0].email
            req.session.perdoruesi = {
                id: results[0].id,
                emri: results[0].emri,
                email: results[0].email
            }

            req.session.save((err) => {
                if (err) {
                  console.error(err);
                }
            })

            res.send({
                error: false,
                mesazhi: "Login sukses"
            }) 
        } else {
            res.send({
                error: true,
                mesazhi: "Emaili ose fjalekalimi jane gabim"
            }) 
        }
    })

}

function logout(req, res) {
    req.session.perdoruesi = null
 
    req.session.save((err) => {
        if (err) {
          console.error(err);
        }
        console.log("Logout success")
    })

    res.redirect('/')
}

function profiliFaqja(req, res) {

    if(req.session?.perdoruesi) {
        res.render('profili', {
            perdoruesi: req.session.perdoruesi
        })
    } else {
        res.redirect('/')
    }
}


function ndryshoProfilin(req, res) {
    let perdoruesi_id = req.session.perdoruesi.id

    let emri_new = req.body.emri
    let email_new = req.body.email
    let password_aktual = req.body.password_aktual
    let password_new = req.body.password_new

    let query_update = ''

    if (password_aktual) {
        query_update = `UPDATE perdoruesit 
                        SET
                            emri = '${emri_new}',
                            email = '${email_new}',
                            password = '${password_new}'
                        WHERE id = ${perdoruesi_id} AND password = '${password_aktual}'`
    } else {
        query_update = `UPDATE perdoruesit 
                        SET
                            emri = '${emri_new}',
                            email = '${email_new}'
                        WHERE id = ${perdoruesi_id}`
    }

    connection.query(query_update, function(err, results) {        
        if(results.affectedRows == 1) {

            req.session.perdoruesi.emri = emri_new
            req.session.perdoruesi.email = email_new

            req.session.save((err) => {
                if (err) {
                    console.error(err)
                }
            })

            res.send({
                error: false,
                mesazhi: "Te dhenat u ndryshuan me sukses"
            })
        } else {
            res.send({
                error: true,
                mesazhi: "Fjalekalimi aktual eshte gabim"
            })
        }

    })
}

function blejProduktin(req, res) {

    if(!req.session.perdoruesi) {
        res.send({
            error: true,
            mesazhi: "Per te bere blejrje, duhet te kyceni ne llogari"
        })
    } else {
        let blerja = req.body

        let perdoruesi_id = req.session.perdoruesi.id
        let produkti_id = blerja.produkti_id
        let sasia = blerja.sasia

        let produkti_fature = {}

        let query_produkti = `SELECT * FROM produktet WHERE id = ${produkti_id}`

        connection.query(query_produkti, function(err, results) {
            let cmimi = results[0].cmimi
            let cmimi_total = cmimi * sasia

            produkti_fature = {
                id: results[0].id,
                emri: results[0].emri,
                cmimi: results[0].cmimi,
                foto: results[0].foto,
                sasia: sasia,
                cmimi_total: cmimi_total,
                blerja_id: null,
                data_e_blerjes: null,
                bleresi: req.session.perdoruesi.emri,
                email: req.session.perdoruesi.email
            }



            let query_blerja = `INSERT INTO blerjet (perdoruesi_id, produkti_id, sasia, cmimi_total) 
                                VALUES (${perdoruesi_id}, ${produkti_id}, ${sasia}, ${cmimi_total})`

            connection.query(query_blerja, function(err2, results2) {
                let blerja_id = results2.insertId

                let query_stoku = `UPDATE produktet SET stoku = stoku - ${sasia} WHERE id = ${produkti_fature.id}`

                produkti_fature.blerja_id = blerja_id
                produkti_fature.data_e_blerjes = new Date().toString().replace(/T/, ':').replace(/\.\w*/, '')

                connection.query(query_stoku, function(err3, results3) {
                    let fatura_html = krijoFaturen(produkti_fature)

                    const mail_options = {
                        from: 'durimjcoders@gmail.com',
                        to: req.session.perdoruesi.email,
                        subject: 'Fatura per blerjen e produtktit ne Shop #' + blerja_id,
                        html: fatura_html
                    }

                    transporter.sendMail(mail_options, function(error, info) {
                        if(!err) {
                            console.log("Emaila u dergua me sukses")
                        }
                    })

                    res.send({
                        error: false,
                        mesazhi: "Blerja u krye me sukses",
                        blerja_id: blerja_id
                    })
                })

            })
        })
    }
}

function blerja(req, res) {

    if(!req.session.perdoruesi) {
        res.redirect('/')
    } else {

        let blerja_id = req.params.id

        let query = `SELECT 
                        B.id, 
                        B.sasia, 
                        B.cmimi_total,
                        B.data_e_blerjes,
                        P.emri,
                        P.foto,
                        P.cmimi
                    FROM blerjet B 
                    INNER JOIN produktet P ON P.id = B.produkti_id 
                    WHERE B.id = ${blerja_id}`

        connection.query(query, function(err, results) {
            res.render('blerja', {
                perdoruesi: req.session.perdoruesi,
                blerja: results[0]
            })
        })
    }

    
}


function krijoFaturen(produkti_fature) {
    return `
    <div class="fatura">
        <div class="fatura-header">
            <img src="https://gjirafa50.com/Gjirafa50/Content/images/logo-2.svg" width="100" alt="">
            <h4><strong>Numri i Fatures: # ${produkti_fature.blerja_id}</strong></h4>
            <h4>Data: ${produkti_fature.data_e_blerjes}</h4>
        </div>

        <hr>

        <div class="fatura-body">
            <table>
                <thead>
                    <th>Foto</th>
                    <th>Produkti</th>
                    <th>Sasia</th>
                    <th>Cmimi</th>
                    <th>Totali</th>
                </thead>
                <tbody>
                    <tr>
                        <td>
                            <img src="${produkti_fature.foto}" width="40" height="40" alt="">
                        </td>
                        <td>${produkti_fature.emri}</td>
                        <td>${produkti_fature.sasia}</td>
                        <td>${produkti_fature.cmimi} $</td>
                        <td>${produkti_fature.cmimi_total} $</td>
                    </tr>
                    
                </tbody>
            </table>

            <hr>

            <h4>Bleresi: ${produkti_fature.bleresi}</h4>
            <h4>Email: ${produkti_fature.email}</h4>
            <h4>Numri: +383 49 123 456</h4>

            <hr>

            <div class="totali">Totali: ${produkti_fature.cmimi_total} $</div>
        </div>
    </div>


    <style>
        h4 {
            margin-top: 10px;
            margin-bottom: 5px;
        }

        .fatura {
            background-color: white;
            width: 60%;
            margin: 0 auto;
            margin-top: 50px;
            padding: 2%;
        }

        table {
            width: 100%;
        }

        th {
            text-align: left;
        }

        .totali {
            width: 30%;
            background-color: orange;
            padding: 10px 20px;
            font-size: 23px;
            color: white;
            text-align: center;
            /* float: right; */
        }
    </style>
    
    `
}

module.exports = {
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
}
