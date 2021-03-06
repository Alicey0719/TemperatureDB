    const express = require('express');
    const Sequelize = require('sequelize');
    const fs = require("fs");
    const { Z_HUFFMAN_ONLY } = require('zlib');
    const { runInNewContext } = require('vm');

    let DB_INFO = "postgres://temp:TokiwaKanoWayo@postgres:5432/temp";
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

    const Temps = sequelize.define('temp', {
        id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        name: Sequelize.STRING,
        temp: Sequelize.FLOAT,
        hum: Sequelize.FLOAT
    }, {
        freezeTableName: true
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

        app.post('/temp', (req, res) => {
            fs.appendFile("log.txt", req.body.temp + ',', (err) => {
                if (err) throw err;
                console.log('正常に書き込みが完了しました');
            });
            res.send("ok");

            let newTemp = new Temps({
                name: req.body.name,
                temp: req.body.temp,
                hum: req.body.hum
            });

            newTemp.save()
        });

        app.get('/view', (req, res) => {
            Temps.findAll()
                .then((result) => {
                    let allTemps = result.map((e) => {
                        return e;
                    });
                    res.render('view.ejs', { temps: allTemps });
                });
        });


    }
    app.listen(process.env.PORT || PORT);