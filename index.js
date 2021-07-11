    const express = require('express');
    const Sequelize = require('sequelize');
    const fs = require("fs");

    let DB_INFO = "postgres://tmp:TokiwaKanoWayo@postgres:5432/tmp";
    // docker-compose書き換え後、docker-compose down --rmiしないと反映されない!!!

    let pg_option = {};
    if (process.env.DATABASE_URL) {
        DB_INFO = process.env.DATABASE_URL;
        pg_option = { ssl: { rejectUnauthorized: false } };
    }

    const sequelize = new Sequelize(DB_INFO, {
        dialect: 'postgres',
        dialectOptions: pg_option
    });

    const PORT = 8080;
    const app = express();

    app.use(express.json())
    app.use(express.urlencoded({ extended: true }));
    app.set("view engine", "ejs");
    app.use("/public", express.static(__dirname + "/public"));

    const Tmps = sequelize.define('tmp', {
        id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        tmp: Sequelize.FLOAT
    }, {
        // timestamps: false,      // disable the default timestamps
        freezeTableName: true // stick to the table name we define
    });

    sequelize.sync({ force: false, alter: true })
        .then(setupRoute)
        .catch((mes) => {
            console.log("db connection error");
        });

    function setupRoute() {
        console.log("db connection succeeded");
        app.get('/', (req, res) => {
            res.render('top.ejs');
        });
        // app.get('/add', (req, res) => {
        //     res.render('add.ejs');
        // });
        // app.post('/add', (req, res) => {
        //     let newMessage = new Messages({
        //         message: req.body.text,
        //         date: req.body.date
        //     });
        //     newMessage.save()
        //         .then((mes) => {
        //             res.render('add.ejs');
        //         })
        //         .catch((mes) => {
        //             res.send("error");
        //         });
        // });
        app.post('/tmp', (req, res) => {
            fs.appendFile("log.txt", req.body.tmp + ',', (err) => {
                if (err) throw err;
                console.log('正常に書き込みが完了しました');
            });
            res.send("ok");

            let newTmp = new Tmps({
                tmp: req.body.tmp
            });

            newTmp.save()
        });

        app.get('/view', (req, res) => {
            Messages.findAll()
                .then((result) => {
                    let allMessages = result.map((e) => {
                        return e;
                    });
                    res.render('view.ejs', { messages: allMessages });
                });
        });


    }
    app.listen(process.env.PORT || PORT);