require('dotenv').config();
const ejs = require('ejs');
const path = require('path');
const express = require('express');
const app = express();
app.set("views", path.join(__dirname, '/views'));
console.log(path.join(__dirname, '/views'));
app.set("view engine", "ejs");
require('./config/db');
const multer = require('multer');
const File = require('./modal/files');
console.log(File);
const host=process.env.APP_BASE_URL || "https://file-share-project.herokuapp.com/"  ;
const { v4: uuid4 } = require('uuid');
const { ServerResponse } = require('http');
console.log(uuid4());
const port = process.env.PORT || 4000;
console.log(path.join(__dirname, "./public"));
var pathStatic = path.join(__dirname, "./public");
app.use(express.static(pathStatic));
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now())
    }
});
let upload = multer({ storage: storage, limit: { fileSize: 100000 * 100 } }).single("myfile");
//root route
app.get("/", (req, res) => {
    res.render('index');
});

app.get("/download/:uuid", async (req, res) => {
    try {
        console.log(`param id:-${req.params.uuid}`);
        const file = await File.findOne({ uuid: req.params.uuid });
        console.log(`file data ${file}`);
        if (!file) {
            return res.status(201).send({ error: "something wen wron" });
        } else {
            console.log(`file uuid ${file.uuid}`);
            res.render("download", {
                uuid: file.uuid,
                filename: file.filename,
                fileSize: file.size,
                path: file.path,
                download: `${host}/ready/${file.uuid}`
            })
        }
    }
    catch (error) {
        return res.status(201).send({ error: "something wen wron" });
    }
});
//for uploadin restfulapi
app.post("/upload", (req, res) => {
    console.log("uploaded part work");
    //store file
    upload(req, res, async (e) => {
        try {
            console.log(req.file);

            console.log("try part");
            if (!req.file) {
                console.log(req.file);
                return res.status(500).send({ error: "all fields are required" });
            }
            if (e) {
                return res.status(500).send({ error: "error" });
            }
            else {
                console.log("storing in database");
                //storing in database
                const file = new File({
                    filename: req.file.filename,
                    uuid: uuid4(),
                    path: req.file.path,
                    size: req.file.size
                });
                const response = await file.save();
                console.log(response.uuid);
                console.log("before response");
                const url = `${host} / download / ${response.uuid}`;
                console.log(`${host} / download / ${response.uuid}`);
                return res.json({ file: `${host}/download/${response.uuid}` });
            }

        } catch (error) {
            return res.status(500).send({ error: "catch error" });
        }
    });

});
app.get("/download", (req, res) => {
    res.send("done bro");
});
app.get("/ready/:uuid", async (req, res) => {
    try {
        console.log("try part work");
        console.log(req.params.uuid);
        const uuid = req.params.uuid;
        console.log(uuid);
        const f = await File.find({ uuid: uuid });
        if (!f) {
            res.render('download', { error: "Link has been expired" });
        }
        else {
            const filePath = `${__dirname}/${f[0].path}`;
            console.log(` else part work ${filePath}`);
            res.download(filePath);
        }
    } catch (error) {
        res.send({ error });
    }
});
app.listen(port, () => {
    console.log(`listen to the port number ${port}`);
});
